import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { RadioButton } from 'react-native-paper';  
import validateToken from '../../components/validateToken';


const FundScreen = ({ route, navigation }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);
  const { cardId, balance, currency, fourthfour } = route.params;
  const [selectedWallet, setSelectedWallet] = useState('');
  const [wallets, setWallets] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(null);
  const [getAmountMoneyFormat, setGetAmountMoneyFormat] = useState('');
  const [selectedCard, setSelectedCard] = useState('thiscard');
  const [friendPhone, setFriendPhone] = useState('');
  const [last4Digits, setLast4Digits] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAmountValid, setIsAmountValid] = useState(true);

  const fetchWallets = useCallback(async () => {
    try {
      const { token, token_expiration, user_id } = await validateToken();
      const requestPayload = { user_id };
      const requestHeaders = { token, token_expiration };
  
      const response = await axios.post(
        'https://imorapidtransfer.com/api/v1/fund/virtual/card/wallets',
        requestPayload,
        { headers: requestHeaders }
      );
  
     
      console.log('Response:', response);
  
      if (response.data?.wallets?.length) {
        setWallets(response.data.wallets);
      } else {
        Alert.alert('Error', 'No wallets available for funding.');
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      Alert.alert(
        'Error',
        'Failed to fetch wallets. Please check your connection and try again.'
      );
    }
  }, []);
  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  useEffect(() => {
    if (selectedWallet) {
      const wallet = wallets.find(w => w.wallet_id === selectedWallet);
      setWalletBalance(wallet ? parseFloat(wallet.balance) : 0);
      setAmount('');
      setExchangeRate(null);
    }
  }, [selectedWallet, wallets]);

  useEffect(() => {
    navigation.setOptions({ title: 'Fund Card' });  

    if (!selectedWallet || !amount) return;

    const fetchExchangeRate = async (retries = 3) => {
      try {
        const { token, token_expiration, user_id } = await validateToken();
    
        const cardCurrency = 'USD';
        const toWallet = cardCurrency === 'USD' ? '24' : '22';
        const wallet = wallets.find(w => w.wallet_id === selectedWallet);
        const fromWalletCode = wallet?.currency_code;
    
        const response = await axios.post(
          'https://imorapidtransfer.com/api/v1/vcards/exchange/get-currencies-exchange-rate',
          {
            wallet_id: selectedWallet,
            amount,
            fromWalletCode,
            fromWallet: wallet?.currency_id,
            toWallet,
            user_id,
          },
          {
            headers: { token, token_expiration },
          }
        );
    
        const originalData = response.data?.original;
        console.log("Exchange Rate API Response:", response.data);
    
        if (originalData?.exchange_value && originalData?.getAmountMoneyFormat) {
          setExchangeRate(originalData.exchange_value);
          setGetAmountMoneyFormat(originalData.getAmountMoneyFormat);
        } else {
          throw new Error("Invalid response data");
        }
      } catch (error) {
        if (retries > 0) {
          console.warn(`Retrying... (${3 - retries + 1})`);
          fetchExchangeRate(retries - 1);
        } else {
          console.error('Error fetching exchange rate:', error);
          Alert.alert('Error', 'Failed to fetch exchange rate. Please try again.');
        }
      }
    };
    

    fetchExchangeRate();
  }, [selectedWallet, amount]);

  useEffect(() => {
    if (parseFloat(amount) > walletBalance) {
      setIsAmountValid(false);
    } else {
      setIsAmountValid(true);
    }
  }, [amount, walletBalance]);

  // const handleSubmit = async () => {
  //   if (!selectedWallet || !amount || (selectedCard === 'friendcard' && (!friendPhone || !last4Digits))) {
  //     Alert.alert('Error', 'Please fill in all fields.');
  //     return;
  //   }
  
  //   if (parseFloat(amount) > walletBalance) {
  //     Alert.alert('Error', 'Amount cannot exceed the selected wallet balance.');
  //     return;
  //   }
    
  //   navigation.navigate('pinVerify', {
  //     onSuccess: async () => {
  //       setIsLoading(true);
  //       try {
  //         const { token, token_expiration, user_id } = await validateToken();
  //         const selectedWalletData = wallets.find(w => w.wallet_id === selectedWallet);
  //         const walletCode = selectedWalletData?.currency_code;
  //         const toWallet = currency === 'USD' ? '24' : '22';
  
  //         const response = await axios.post(
  //           'https://imorapidtransfer.com/api/v1/vcards/card/create/oncard/withdraw/freeze/fund',
  //           {
  //             wallet_id: selectedWallet,
  //             amount,
  //             type: 'FUNDING',
  //             fromWalletCode: walletCode,
  //             fromWallet: selectedWalletData?.currency_id,
  //             toWallet,
  //             encryptedCardId: cardId,
  //             currency,
  //             user_id,
  //             friendPhone: selectedCard === 'friendcard' ? friendPhone : undefined,
  //             fourLastDigit: selectedCard === 'friendcard' ? last4Digits : undefined,
  //             exchange_value: exchangeRate,
  //           },
  //           {
  //             headers: { token, token_expiration },
  //           }
  //         );
  
  //         if (response.data.success) {
  //           Alert.alert('Success', 'Funds added successfully.');
  //           navigation.goBack();
  //         } else {
  //           Alert.alert('Error', response.data.error || 'Failed to fund the card.');
  //         }
  //       } catch (error) {
  //         Alert.alert('Error', 'Failed to fund the card. Please try again later.');
  //       } finally {
  //         setIsLoading(false);
  //       }
  //     },
  //     onFailed: () => {
  //       Alert.alert('Error', 'PIN verification failed. Submission canceled.');
  //     },
  //   });
  // };
  const handleSubmit = async () => {
    if (!selectedWallet || !amount || (selectedCard === 'friendcard' && (!friendPhone || !last4Digits))) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
  
    if (parseFloat(amount) > walletBalance) {
      Alert.alert('Error', 'Amount cannot exceed the selected wallet balance.');
      return;
    }
  
    navigation.navigate('PinVerify', {
      onSuccess: async () => {
        setIsLoading(true);
        try {
          const { token, token_expiration, user_id } = await validateToken();
          const selectedWalletData = wallets.find(w => w.wallet_id === selectedWallet);
          const walletCode = selectedWalletData?.currency_code;
          const toWallet = currency === 'USD' ? '24' : '22';
  
          const response = await axios.post(
            'https://imorapidtransfer.com/api/v1/vcards/card/create/oncard/withdraw/freeze/fund',
            {
              wallet_id: selectedWallet,
              amount,
              type: 'FUNDING',
              fromWalletCode: walletCode,
              fromWallet: selectedWalletData?.currency_id,
              toWallet,
              encryptedCardId: cardId,
              currency,
              user_id,
              friendPhone: selectedCard === 'friendcard' ? friendPhone : undefined,
              fourLastDigit: selectedCard === 'friendcard' ? last4Digits : undefined,
              exchange_value: exchangeRate,
            },
            {
              headers: { token, token_expiration },
            }
          );
  
          if (response.data.success) {
            Alert.alert('Success', 'Funds added successfully.');
            navigation.goBack();
          } else {
            Alert.alert('Error', error.response?.data?.message || response.data.error || 'Failed to fund the card.');
          }
        } catch (error) {
          console.error('Error funding card:', error);
          Alert.alert('Error', error.response?.data?.message ||'Failed to fund the card. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      },
      onFailed: () => {
        Alert.alert('Error', 'PIN verification failed. Submission canceled.');
      },
    });
  };
  

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWallets();
    setRefreshing(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
     
      <Text style={styles.label}>Balance: {balance} USD</Text>

      <View style={styles.radioGroup}>
        <RadioButton.Group
          onValueChange={(value) => setSelectedCard(value)}
          value={selectedCard}
        >
          <View style={styles.radioOption}>
            <RadioButton value="thiscard" />
            <Text style={styles.radioText}>This Card</Text>
          </View>
          <View style={styles.radioOption}>
            <RadioButton value="friendcard" />
            <Text style={styles.radioText}>Friend Card</Text>
          </View>
        </RadioButton.Group>
      </View>

      {selectedCard === 'friendcard' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Friend Phone Number"
            value={friendPhone}
            onChangeText={setFriendPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Card Last 4 Digits"
            value={last4Digits}
            onChangeText={setLast4Digits}
            keyboardType="number-pad"
          />
        </>
      )}

      <View style={styles.pickerContainer}>
        {wallets.length > 0 ? (
          <Picker
          selectedValue={selectedWallet}
          onValueChange={(itemValue) => setSelectedWallet(itemValue)}
          style={styles.picker}
        >
         {wallets.map((wallet) => (
            <Picker.Item
              key={wallet.wallet_id}
              label={`${wallet.currency_name || 'Unnamed Wallet'} + ${wallet.balance || 0} ${wallet.currency_code || ''}`}
              value={wallet.wallet_id}
            />
          ))}
        </Picker>
        
        ) : (
          <Text>No wallets available</Text>
        )}
      </View>

      <TextInput
        style={[styles.input, !isAmountValid && styles.inputError]}
        placeholder="Amount"
        value={amount}
        onChangeText={(value) => {
          const num = parseFloat(value) || 0;
          setAmount(value);
          setIsAmountValid(num <= walletBalance);
        }}
        keyboardType="number-pad"
      />
      {!isAmountValid && (
        <Text style={styles.errorText}>Amount exceeds wallet balance.</Text>
      )}

      {exchangeRate ? (
        <Text style={styles.exchangeRate}>Funding Value: {exchangeRate}</Text>
      ) : (
        <ActivityIndicator size="small" color="#000" />
      )}
 

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={isLoading || !isAmountValid}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

 
const styles = StyleSheet.create({
  container: {
    flex: 1,  
    padding: 16,
    backgroundColor: '#E3E3E3',  
  },
  amountFormat: {
    marginTop: 10,
    fontSize: 16,
    color: 'green',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#006400',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    
  },
  radioText: {
    marginLeft: 8,
    fontSize: 16,
     

  },
  input: {
    borderWidth: 1,
    borderColor: '#006400',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    height: 50,  
    borderWidth: 1,
    borderColor: '#006400',
    borderRadius: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  picker: {
    height: 50,  
    fontSize: 16,
    textAlign: 'center',  
    textAlignVertical: 'center', 
    color: '#000', 
    backgroundColor: '#fff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  exchangeRate: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#006400',
  },
  submitButton: {
    backgroundColor: '#006400',
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
    paddingVertical: 12,
    alignSelf: 'center',
    marginTop: 16,
    width: '45%',
  },
});


export default FundScreen;