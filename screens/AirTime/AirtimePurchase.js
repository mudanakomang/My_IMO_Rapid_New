import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import validateToken from '../../components/validateToken';
import { useNavigation } from '@react-navigation/native';

const AirtimePurchase = () => {
  const [wallets, setWallets] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [recipient, setRecipient] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [exchangeRate, setExchangeRate] = useState(null);
  const [dialCode, setDialCode] = useState('');
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAmountValid, setIsAmountValid] = useState(true);  
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedData = JSON.parse(userData);
          const { token, token_expiration } = await validateToken();
          await fetchWallets(parsedData.user_id, token, token_expiration);
          await fetchCurrencies(token, token_expiration, parsedData.user_id);
        }
      } catch (error) {
        console.error(error);
       Alert.alert('Error', error.response?.data?.message || 'Error', 'Failed to fetch initial data.');
      }
    };
    fetchData();
  }, []);
  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);
  useEffect(() => {
    if (selectedWallet && selectedCurrency && amount) {
      fetchExchangeRate();
    }
  }, [selectedWallet, selectedCurrency, amount]);

  const fetchWallets = async (userId, token, token_expiration) => {
    try {
      const response = await axios.get(
        `https://imorapidtransfer.com/api/v1/user/${userId}/wallets`,
        {
          headers: {
            token,
            token_expiration,
            'Content-Type': 'application/json',
          },
        }
      );
      setWallets(response.data.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch wallets.');
    }
  };

  const fetchCurrencies = async (token, token_expiration, userId) => {
    try {
      const response = await axios.post(
        'https://imorapidtransfer.com/api/v1/airtime/index-return',
        { user_id: userId },
        {
          headers: {
            token,
            token_expiration,
            'Content-Type': 'application/json',
          },
        }
      );
      setCurrencies(response.data.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch currencies.');
    }
  };

  const fetchExchangeRate = async () => {
    try {
      const { token, token_expiration } = await validateToken();
      const userData = JSON.parse(await AsyncStorage.getItem('userData'));
      const response = await axios.post(
        'https://imorapidtransfer.com/api/v1/airtime/exchange-rate',
        {
          wallet_id: selectedWallet.id,
          airtime_currency_code: selectedCurrency.currency_code,
          amount,
          user_id: userData.user_id,
        },
        {
          headers: {
            token,
            token_expiration,
            'Content-Type': 'application/json',
          },
        }
      );
      const { exchange_rate, debited_amount, } = response.data;
      setExchangeRate({
        rate: exchange_rate,
        debitedAmount: debited_amount,
        rateDetails: `${selectedWallet.currency.code}:1 = ${selectedCurrency.currency_code}:${debited_amount}`,
      });
    } catch (error) {
      console.error(error);
      setExchangeRate(null);
      Alert.alert('Error', error.response?.data?.message ||'Failed to fetch exchange rate.');
    }
  };

  const handleSubmit = () => {
    if (!amount || !phone || !selectedWallet || !selectedCurrency || !recipient || !exchangeRate) {
      Alert.alert('Error', error.response?.data?.message || 'Please fill in all fields.');
      return;
    }
  
    navigation.navigate('PinVerify', {
      onSuccess: handleAirtimePurchase,
      onFailed: handleFailedAirtimePurchase
    });
  };
  
  const handleAirtimePurchase = async () => {
    setLoading(true);
    try {
      const { token, token_expiration } = await validateToken();
      const userData = JSON.parse(await AsyncStorage.getItem('userData'));
      
      await axios.post(
        'https://imorapidtransfer.com/api/v1/purchase/airtime',
        {
          amount,
          formattedPhone: `${dialCode}${phone}`,
          recipient,
          wallet_id: selectedWallet.id,
          airtime_currency_code: selectedCurrency.currency_code,
          user_id: userData.user_id,
          exchange_rate: exchangeRate.rate,
          debited_amount: exchangeRate.debitedAmount,
          phone,
        },
        {
          headers: {
            token,
            token_expiration,
            'Content-Type': 'application/json',
          },
        }
      );
      Alert.alert('Success', 'Airtime purchased successfully');
      navigation.replace('FinalScreen');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to purchase airtime.');
      navigation.replace('FinalScreen');
    } finally {
      setLoading(false);
    }
  };
  const handleFailedAirtimePurchase = () => {
    Alert.alert('Error', error.response?.data?.message || 'PIN verification failed. Please try again.');
    navigation.replace('FinalScreen');
  };
  

  useEffect(() => {
    if (selectedCurrency) {
      setDialCode(selectedCurrency.dial_code); 
    }
  }, [selectedCurrency]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Airtime',
    });
  }, [navigation]);

  
  const handleAmountChange = (text) => {
    setAmount(text);
    if (parseFloat(text) > parseFloat(selectedWallet.balance)) {
      setIsAmountValid(false);
    } else {
      setIsAmountValid(true);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text>Select Wallet:</Text>
      <TouchableOpacity onPress={() => setWalletModalVisible(true)}>
        <TextInput
          style={styles.input}
          value={selectedWallet ? `${selectedWallet.currency.name} - ${selectedWallet.balance}` : ''}
          editable={false}
          placeholder="Select Wallet"
        />
      </TouchableOpacity>

      <Modal visible={walletModalVisible} transparent>
        <View style={styles.modalContainer}>
          <FlatList
            data={wallets}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setSelectedWallet(item);
                  setWalletModalVisible(false);
                }}
              >
                <Text style={styles.modalText}>{`${item.currency.name} - ${item.balance}`}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Text>Select Airtime Currency:</Text>
      <TouchableOpacity onPress={() => setCurrencyModalVisible(true)}>
        <TextInput
          style={styles.input}
          value={selectedCurrency ? `${selectedCurrency.currency_name} (${selectedCurrency.currency_code})` : ''}
          editable={false}
          placeholder="Airtime Currency"
        />
      </TouchableOpacity>

      <Modal visible={currencyModalVisible} transparent>
        <View style={styles.modalContainer}>
          <FlatList
            data={currencies}
            keyExtractor={(item) => item.currency_code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setSelectedCurrency(item);
                  setCurrencyModalVisible(false);
                }}
              >
                <Text style={styles.modalText}>{`${item.currency_name} (${item.currency_code})`}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Text>Amount:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={amount}
        onChangeText={handleAmountChange} 
      />

      {!isAmountValid && (
        <Text style={styles.errorText}>Amount exceeds available balance!</Text>
      )}

      {exchangeRate && (
        <View style={styles.conversionContainer}>
          <Text style={styles.conversionText}>
            Airtime Amount: {exchangeRate.rate} {selectedCurrency ? selectedCurrency.currency_code : ''}
          </Text>
          <Text style={styles.conversionText}>
            Debit Amount: {amount}  {selectedWallet ? selectedWallet.currency.code : ''}
          </Text>
          <Text style={styles.conversionText}>{exchangeRate.rateDetails}</Text>
        </View>
      )}

      <Text>Phone Number:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={phone}
        onChangeText={setPhone}
        placeholder={`Enter number (no ${dialCode})`}
      />

      <Text>Recipient Name:</Text>
      <TextInput
        style={styles.input}
        value={recipient}
        onChangeText={setRecipient}
        placeholder="Enter Recipient name"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#006400" style={styles.loadingIndicator} />
      ) : (
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={!isAmountValid || !exchangeRate}  
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#E3E3E3',

  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 12,
    marginVertical: 8,
    backgroundColor: '#fff',
  },
  modalContainer: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 10,
    alignSelf: 'center',
    marginTop: '20%',
  },
  modalOption: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  modalText: {
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
  conversionContainer: {
    backgroundColor: '#e0f7fa',
    padding: 10,
    marginVertical: 16,
    borderRadius: 5,
    // marginTop: 10,
  },
  conversionText: {
    fontSize: 16,
    color: '#006064',
  },
  loadingIndicator: {
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#006400',
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 16,
    width: '50%',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
 // fff
export default AirtimePurchase;
 