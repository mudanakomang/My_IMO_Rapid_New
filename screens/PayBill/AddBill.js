import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import validateToken from '../../components/validateToken';

const AddBill = ({ navigation }) => {
  const [wallets, setWallets] = useState([]);
  const [countries, setCountries] = useState([]);
  const [billCategories, setBillCategories] = useState([]);
  const [bills, setBills] = useState([]);
  const [billItems, setBillItems] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedBillCategory, setSelectedBillCategory] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedBillItem, setSelectedBillItem] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isAmountEditable, setIsAmountEditable] = useState(true)
  const [isExchangeRateLoading, setIsExchangeRateLoading] = useState(false);
  const [exchange_rate, setExchangeRate] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isSubmitButtonDisabled, setIsSubmitButtonDisabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Pay Bills',
    });
  
  const fetchInitialData = async () => {
    const tokenInfo = await validateToken();
    setTokenData(tokenInfo);
  
    if (tokenInfo) {
      try {
        const walletResponse = await axios.get('https://imorapidtransfer.com/api/v1/get-user-wallet/biller/country/card/wallets', {
          headers: {
            token: tokenInfo.token,
            token_expiration: tokenInfo.token_expiration,
          },
          params: { user_id: tokenInfo.user_id },
        });
        setWallets(walletResponse.data.data);
        setWalletBalance(walletResponse.data.data[0]?.balance || 0);   
  
        const countriesResponse = await axios.get('https://imorapidtransfer.com/api/v1/biller-get/country/biller-countries', {
          headers: {
            token: tokenInfo.token,
            token_expiration: tokenInfo.token_expiration,
          },
          params: { user_id: tokenInfo.user_id },
        });
        setCountries(countriesResponse.data.countries); 
      } catch (error) {
        console.error('Error fetching initial data', error);
      }
    }
  };

  fetchInitialData();
}, []);

const onRefresh = async () => {
  setRefreshing(false);
  await fetchInitialData();
  setRefreshing(false);
};

const handleCountryChange = async (countryValue) => {
  setSelectedCountry(countryValue);
  setSelectedBillCategory(null);
  setSelectedBill(null);
  setSelectedBillItem(null);
  try {
    const response = await axios.get(`https://imorapidtransfer.com/api/v1/bill-categories?country_id=${countryValue}`, {
      headers: {
        token: tokenData.token,
        token_expiration: tokenData.token_expiration,
      },
      params: { user_id: tokenData.user_id },
    });
  
    console.log('Bill Categories Response:', response.data);
    setBillCategories(response.data.categories);
  } catch (error) {
    console.error('Error fetching bill categories:', error);
  }
};

const handleBillCategoryChange = async (categoryValue) => {
  setSelectedBillCategory(categoryValue);
  setSelectedBill(null);
  setSelectedBillItem(null);
    
  try {
    const response = await axios.get(
      `https://imorapidtransfer.com/api/v1/bills/${selectedCountry}/${categoryValue}`,
      {
        headers: {
          token: tokenData.token,
          token_expiration: tokenData.token_expiration,
          user_id: tokenData.user_id,
        },
      }
    );

    console.log('Bills Response:', response.data);
    setBills(response.data.bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
  }
};
  
    
const handleBillChange = async (billId) => {
  setSelectedBillItem(billId);
  setAccountName('');
  setAmount('');
  setIsAmountEditable(true);

  if (!billId) return;

  try {
    const response = await axios.get(
      `https://imorapidtransfer.com/api/v1/bill-items`,
      {
        headers: {
          token: tokenData.token,
          token_expiration: tokenData.token_expiration,
        },
        params: {
          user_id: tokenData.user_id,
          country_id: selectedCountry,
          category: selectedBillCategory,
          biller_id: billId,
        },
      }
    );

    console.log('Bill Categories Response:', response.data);
    const billItem = response.data.bill_items.find((item) => item.id === billId);
    setBillItems(response.data.bill_items);

    if (billItem) {
      if (billItem.amount) {
        setAmount(billItem.amount);
        setIsAmountEditable(false);
      } else {
        setAmount('');
        setIsAmountEditable(true);
      }
    }
  } catch (error) {
    console.error('Error fetching bill items:', error);
  }
};
 
 
const fetchExchangeRate = async () => {
  if (selectedWallet && selectedCountry && amount) {
    setIsExchangeRateLoading(true);
    setErrorMessage(null); // Clear previous error message
    try {
      const response = await axios.get('https://imorapidtransfer.com/api/v1/biller/get-exchange-rate', {
        headers: {
          token: tokenData.token,
          token_expiration: tokenData.token_expiration,
        },
        params: {
          user_id: tokenData.user_id,
          wallet_id: selectedWallet,
          country_id: selectedCountry,
          amount: amount,
        },
      });

      console.log('Exchange Rate Response:', response.data);

      if (!response.data.status || (response.data.message && response.data.message.includes('Insufficient wallet balance'))) {
        setErrorMessage('Insufficient balance.');  
        setIsSubmitButtonDisabled(true);
      } else {
        setExchangeRate(response.data.exchange_rate);
        setErrorMessage(null);  
        setIsSubmitButtonDisabled(false);
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      setErrorMessage('Failed to fetch exchange rate. Please try again later.');  
      setIsSubmitButtonDisabled(true);
    } finally {
      setIsExchangeRateLoading(false);
    }
  }
};
useEffect(() => {
  if (selectedWallet && selectedCountry && amount) {
    fetchExchangeRate();
  }
}, [selectedWallet, selectedCountry, amount]);


    const handleBillValidate = async (billItem) => {
    if (accountNumber && billItem) {
      if (billItem.validate === "1") {
        setAccountName(null);
        try {
          const response = await axios.post(
            'https://imorapidtransfer.com/api/v1/account/validate-bill',
            {
              account: accountNumber,
              bill_item: {
                id: billItem.id,
                validate: billItem.validate,
                provider: billItem.provider,
              },
            },
            {
              headers: {
                token: tokenData.token,
                token_expiration: tokenData.token_expiration,
              },
            }
          );
          setAccountName(response.data.account_name);
        } catch (error) {
          console.error('Error validating bill:', error);
        }
      }
    }
  };
  
  
  // const handleSubmit = async () => {
  //   setIsLoading(true);
  //   try {
  //     const paymentData = {
  //       wallet_id: selectedWallet,
  //       country_id: selectedCountry,
  //       bill_category_id: selectedBillCategory,
  //       bill_id: selectedBill,
  //       bill_item_id: selectedBillItem,
  //       account_number: accountNumber,
  //       amount: amount,
  //       exchange_rate: exchange_rate,  
  //     };
  
  //     const response = await axios.post('https://imorapidtransfer.com/api/v1/pay-submit/pay-bill', paymentData, {
  //       headers: {
  //         token: tokenData.token,
  //         token_expiration: tokenData.token_expiration,
  //       },
  //       params: { user_id: tokenData.user_id },
  //     });
  
  //     console.log('Payment Response:', response.data);
  
  //     if (response.data.status) {
  //       Alert.alert('Success', 'Payment submitted successfully');
  //     } else {
  //       Alert.alert('Error', response.data.message || 'Failed to submit payment');
  //     }
  //   } catch (error) {
  //     console.error('Error submitting payment:', error);
  //     Alert.alert('Error', error.response?.data?.message || 'An error occurred while processing your payment.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
 
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
    
      const result = await new Promise((resolve) => {
        navigation.navigate('PinVerify', {
          onSuccess: () => resolve('onSuccess'),
          onFailed: () => resolve('onFailed'),
        });
      });
    
      if (result === 'onFailed') {
        Alert.alert('Error', error.response?.data?.message || 'PIN validation failed. Please try again.');
        setIsLoading(false);
        return;
      }
   
      const paymentData = {
        wallet_id: selectedWallet,
        country_id: selectedCountry,
        bill_category_id: selectedBillCategory,
        bill_id: selectedBill,
        bill_item_id: selectedBillItem,
        account_number: accountNumber,
        amount: amount,
        exchange_rate: exchange_rate,
      };
  
      const response = await axios.post('https://imorapidtransfer.com/api/v1/pay-submit/pay-bill', paymentData, {
        headers: {
          token: tokenData.token,
          token_expiration: tokenData.token_expiration,
        },
        params: { user_id: tokenData.user_id },
      });
  
      console.log('Payment Response:', response.data);
  
      if (response.data.status) {
        navigation.navigate('FinalScreen', {
          message: 'Bill Payments Successfully Created',
        });
      } else {
        Alert.alert('Error', response.data.message || 'Failed to submit payment');
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      Alert.alert('Error', error.response?.data?.message || 'An error occurred while processing your payment.');
    } finally {
      setIsLoading(false);
    }
  };
  
  

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Pay from Wallet</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedWallet} onValueChange={setSelectedWallet}>
            {wallets.map(wallet => (
              <Picker.Item
                key={wallet.id}
                label={`${wallet.currency.name} + ${wallet.balance}`}
                value={wallet.id}
              />
            ))}
          </Picker>
        </View>
      </View>
  
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Bill Country</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedCountry} onValueChange={handleCountryChange}>
            {countries.map((country) => (
              <Picker.Item key={country.value} label={country.label} value={country.value} />
            ))}
          </Picker>
        </View>
      </View>
  
      {selectedCountry && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bill Category</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={selectedBillCategory} onValueChange={handleBillCategoryChange}>
              {billCategories.map((category) => (
                <Picker.Item key={category.category} label={category.category_name} value={category.category} />
              ))}
            </Picker>
          </View>
        </View>
      )}
  
      {selectedBillCategory && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Choose Bill</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedBill}
              onValueChange={handleBillChange}
              style={{ height: 50, width: '100%' }}
            >
              <Picker.Item label="Select a Biller" value="" />
              {bills.map((bill) => (
                <Picker.Item key={bill.biller_id} label={bill.biller} value={bill.biller_id} />
              ))}
            </Picker>
          </View>
        </View>
      )}


      {selectedBillCategory && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Choose Bill Item</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedBillItem}
              onValueChange={(value) => {
                setSelectedBillItem(value);
                if (value) {
                  const selectedItem = billItems.find((item) => item.id === value);
                  if (selectedItem) {
                    if (selectedItem.amount) {
                      setAmount(selectedItem.amount);
                      setIsAmountEditable(false);
                    } else {
                      setAmount('');
                      setIsAmountEditable(true);
                    }
                  }
                }
              }}
            >
              <Picker.Item label="Select a Bill Item" value="" />
              {billItems.map((item) => (
                <Picker.Item key={item.id} label={item.product} value={item.id} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Bill Account Number</Text>
        <TextInput
          style={styles.textInput}
          value={accountNumber}
          onChangeText={(text) => {
            setAccountNumber(text);
            if (text && selectedBillItem) {
              const selectedItem = billItems.find((item) => item.id === selectedBillItem);
              if (selectedItem && selectedItem.validate === "1") {
                handleBillValidate(selectedItem);
              }
            }
          }}
        />
      </View>

      {accountName && (
        <Text style={styles.accountName}>Bill Account Name: {accountName}</Text>
      )}

      <View style={styles.inputContainer}>
                <Text style={styles.label}>Bill Amount</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  editable={isAmountEditable}
                />
              </View>
              {exchange_rate && (
          <View style={styles.exchangeRateContainer}>
            <Text style={styles.exchangeRateText}>
            To Debit - {exchange_rate}
            </Text>
          </View>
        )}
         {errorMessage && (
          <View style={styles.exchangeRateContainer}> 
            <Text style={{ color: 'red', marginVertical: 10, textAlign: 'center' }}>
              {errorMessage}
            </Text>
           </View> 
          )}
      {isExchangeRateLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
       <TouchableOpacity
        style={[styles.submitButton, isSubmitButtonDisabled && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={isSubmitButtonDisabled}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Continue</Text>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
};
 
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { marginTop: 10 },
  inputContainer: { marginTop: 20 },
  label: { marginBottom: 5 },
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', borderRadius: 5 },
  textInput: { height: 40, backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, paddingHorizontal: 10, borderRadius: 5 },
  submitButton: { backgroundColor: '#006400',
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 16,
    width: '50%',},
  submitButtonText: { color: '#fff', textAlign: 'center', fontSize: 16 },
  accountName: { marginTop: 10, fontSize: 14, fontStyle: 'italic' },
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000', 
    marginBottom: 10,
    backgroundColor: '#e0ffe0',
    padding: 10,
    borderRadius: 8,
  },
  exchangeRateContainer: {
    backgroundColor: '#e0ffe0',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  exchangeRateText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
});

export default AddBill;
