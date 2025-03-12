import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import tokenValidation from "../../components/validateToken";

const MtcnCreate = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    merchant_location: '',
    id_type: '',
    id_number: '',
    amount: '',
    phone_number: '',
    debit_wallet: '',
    note: '',
  });
  const [currencies, setCurrencies] = useState([]);  
  const [identityTypes, setIdentityTypes] = useState([]); 
  const [wallets, setWallets] = useState([]);  
  const [fees, setFees] = useState('0.00');
  const [fetchingData, setFetchingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWalletBalance, setSelectedWalletBalance] = useState(0);
  const [selectedWalletCurrency, setSelectedWalletCurrency] = useState(''); 
  
  const navigation = useNavigation();

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
  }, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Token Transfer',  
    });
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setFetchingData(true);
      await Promise.all([fetchCurrencies(), fetchWallets(), fetchIdentityTypes()]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setFetchingData(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const { token, token_expiration } = await tokenValidation();
      const response = await axios.get('https://imorapidtransfer.com/api/v1/token/transaction/merchant_location', {
        headers: { token, token_expiration },
      });
      setCurrencies(response.data.merchants || []);   
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const fetchIdentityTypes = async () => {
    try {
      const { token, token_expiration } = await tokenValidation();
      const response = await axios.get('https://imorapidtransfer.com/api/v1/token/identity/types', {
        headers: { token, token_expiration },
      });
      setIdentityTypes(response.data.identityTypes || []);  
    } catch (error) {
      console.error('Error fetching identity types:', error);
    }
  };

  const fetchWallets = async () => {
    try {
      const { token, token_expiration, user_id } = await tokenValidation();
      const response = await axios.get('https://imorapidtransfer.com/api/v1/token/transaction/wallets', {
        headers: { token, token_expiration },
        params: { user_id },
      });

      const walletsWithCurrency = response.data.data.map(wallet => ({
        id: wallet.id,
        balance: wallet.balance,
        currencyName: wallet.currency ? wallet.currency.name : 'Unknown Currency',
      }));
  
      setWallets(walletsWithCurrency); 
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  };

  const handleWalletChange = (walletId) => {
    const selectedWallet = wallets.find(wallet => wallet.id === walletId);
    if (selectedWallet) {
      setFormData({ ...formData, debit_wallet: walletId, amount: '' });  
      setSelectedWalletBalance(selectedWallet.balance);  
    }
  };

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    if (
        !formData.first_name || !formData.last_name || !formData.merchant_location || 
        !formData.id_type || !formData.id_number || !formData.amount || !formData.phone_number || !formData.debit_wallet
    ) {
        Alert.alert('Error', error.response?.data?.message || 'All fields are required.');
        setLoading(false);
        return;
    }

    if (parseFloat(formData.amount) > selectedWalletBalance) {
        Alert.alert('Error', error.response?.data?.message || 'Amount cannot exceed wallet balance.');
        setLoading(false);
        return;
    }

    try {
        navigation.navigate('ConfirmMtcn', {
            formData,
            fees,
            selectedWalletCurrency,
        });
    } catch (error) {
        console.error('Error during submission:', error);
        Alert.alert('Error', error.response?.data?.message || 'Failed to proceed.');
    } finally {
        setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      <Text style={styles.label}>First Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter First Name"
        value={formData.first_name}
        onChangeText={(value) => handleInputChange('first_name', value)}
      />

      <Text style={styles.label}>Last Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Last Name"
        value={formData.last_name}
        onChangeText={(value) => handleInputChange('last_name', value)}
      />
        <Text style={styles.label}>Phone Number </Text>
      <TextInput
        style={styles.input}
        placeholder="Recipient Number"
        value={formData.phone_number}
        keyboardType="numeric"
        onChangeText={(value) => handleInputChange('phone_number', value)}
      />
      <Text style={styles.label}>Location</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.merchant_location}
          onValueChange={(value) => handleInputChange('merchant_location', value)}
          style={styles.picker}
        >
          <Picker.Item label="Select Location" value="" />
          {currencies.map((currency, index) => (
            <Picker.Item key={index} label={`${currency.country}`} value={currency.country} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Select ID Type</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.id_type}
          onValueChange={(value) => handleInputChange('id_type', value)}
          style={styles.picker}
        >
          <Picker.Item label="Select ID Type" value="" />
          {identityTypes.map((type, index) => (
            <Picker.Item key={index} label={type} value={type} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>ID Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter ID Number"
        value={formData.id_number}
        onChangeText={(value) => handleInputChange('id_number', value)}
      />
      <Text style={styles.label}>Debit Wallet</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.debit_wallet}
          onValueChange={(value) => handleWalletChange(value)}
          style={styles.picker}
        >
          <Picker.Item label="Select Debit Wallet" value="" />
          {wallets.map((wallet, index) => (
            <Picker.Item
              key={index}
              label={`${wallet.currencyName}  +${wallet.balance}`}
              value={wallet.id}
            />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Amount"
        value={formData.amount}
        keyboardType="numeric"
        onChangeText={(value) => {
          if (parseFloat(value) <= selectedWalletBalance) {
            handleInputChange('amount', value);
          } else {
            Alert.alert('Invalid Amount', `Amount cannot be greater than ${selectedWalletBalance}`);
          }
        }}
      />

      

      <Text style={styles.label}>Note</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Note"
        value={formData.note}
        multiline
        onChangeText={(value) => handleInputChange('note', value)}
        maxLength={50}  
      />

<TouchableOpacity
          style={[styles.button, { backgroundColor: loading ? '#ccc' : '#006400' }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Proceed</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Overlay Loader */}
      {fetchingData && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#E3E3E3',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    height: 50,
  },
  picker: {
    height: 50,
    width: '100%',
    textAlign: 'center',
    marginBottom: 10, 
    paddingHorizontal: 10, 
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    height: 40,
    width: '100%',   
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#006400',
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 16,
    width: '50%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MtcnCreate;
