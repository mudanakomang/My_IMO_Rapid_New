import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import validateToken from '../../components/validateToken';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'https://imorapidtransfer.com/api/v1/';

const PayoutScreen = () => {
  const [wallets, setWallets] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);  
  const [selectedCurrency, setSelectedCurrency] = useState(null);  
  const [amount, setAmount] = useState('');
  const [totalFees, setTotalFees] = useState('0.00');  
  const [remainAmount, setRemainAmount] = useState(0); 
  const [isWalletModalVisible, setWalletModalVisible] = useState(false);
  const [isCurrencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidAmount, setIsValidAmount] = useState(true);
  const [userId, setUserId] = useState('');
  const [token, setToken] = useState('');
  const [tokenExpiration, setTokenExpiration] = useState('');
  const [isNextButtonEnabled, setIsNextButtonEnabled] = useState(false);  
  const [withdrawalData, setWithdrawalData] = useState({
    totalFees: 0,
    remainAmount: 0,
    feesFixed: 0,
    pFees: 0,
    paymentMethodId: null,
  });   
  const navigation = useNavigation();
  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);

   useEffect(() => {
       navigation.setOptions({ // just added
         title: 'Payout',
       });
     }, [navigation]);
   
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { user_id, token_expiration, token } = await validateToken();
    
        if (user_id && token && token_expiration) {
          setUserId(user_id);
          setToken(token);
          setTokenExpiration(token_expiration);
    
          setIsLoading(true);  
          const [walletResponse, currencyResponse] = await Promise.all([
            axios.get(`${API_URL}wallets/payout`, {
              headers: {
                'Content-Type': 'application/json',
                token: token,
                token_expiration: token_expiration,
              },
              params: {
                user_id: user_id,
              },
            }),
            axios.get(`${API_URL}payout/currencies`, {
              headers: {
                'Content-Type': 'application/json',
                token: token,
                token_expiration: token_expiration,
              },
              params: {
                user_id: user_id,
              },
            }),
          ]);
    
          setWallets(walletResponse.data.data);
          setCurrencies(currencyResponse.data.currencies);
        } else {
          Alert.alert('Error', error.response?.data?.message || 'Token or User ID is invalid or expired. Please log in again.');
        }
      } catch (error) {
        console.error('Error validating token:', error);
        Alert.alert('Error', error.response?.data?.message || 'Failed to validate the token.');
      } finally {
        setIsLoading(false);  
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    const fetchPaymentMethodAndLimit = async () => {
      if (selectedCurrency) {  
        try {
          setIsLoading(true);

          const isActiveResponse = await axios.get(`${API_URL}withdrawal/fees-limit-payment-method-isActive-currencies`, {
            headers: {
              'Content-Type': 'application/json',
              token,
              token_expiration: tokenExpiration,
            },
            params: {
              wallet_id: wallets.length > 0 ? wallets[0].id : null, 
              payout_cur_id: selectedCurrency,  
              transaction_type_id: '2',
              user_id: userId,
            },
          });

          const paymentMethods = isActiveResponse.data.success.paymentMethods;
          if (paymentMethods && Object.keys(paymentMethods).length > 0) {
            const paymentMethodId = Object.keys(paymentMethods)[0];
            setWithdrawalData((prev) => ({
              ...prev,
              paymentMethodId,
              totalFees: 0,
              remainAmount: 0,
            }));
 
            await handleAmountLimit();
          } else {
            Alert.alert('Error', error.response?.data?.message || 'No payment methods available for the selected currency.');
          }
        } catch (error) {
          console.error('Error fetching payment methods:', error);
          Alert.alert('Error', error.response?.data?.message || 'Failed to fetch payment methods.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchPaymentMethodAndLimit();
  }, [selectedCurrency]);  

  const handleAmountChange = (text) => {
    const regex = /^[0-9.]*$/;
    if (regex.test(text)) {
      setAmount(text);
      const amountValue = parseFloat(text) || 0;

      if (selectedWallet && selectedCurrency) {
        handleAmountLimit(amountValue);
      }
    }
  };

  const handleWalletChange = (wallet) => {
    setSelectedWallet(wallet.id);
    setAmount('');
    setWithdrawalData((prev) => ({
      ...prev,
      totalFees: 0,
      remainAmount: 0,
    }));
  };

  const handleCurrencyChange = (currency) => {
    setSelectedCurrency(currency.id);
    setAmount('');
  };

  const handleAmountLimit = async (amountValue = parseFloat(amount)) => {
    const { paymentMethodId } = withdrawalData;
    if (selectedWallet && selectedCurrency && amountValue) {
      try {
        setIsLoading(true);

        const amountLimitResponse = await axios.get(`${API_URL}withdrawal/amount-limit`, {
          headers: {
            'Content-Type': 'application/json',
            token,
            token_expiration: tokenExpiration,
          },
          params: {
            amount: amountValue,
            wallet_id: selectedWallet,
            payout_cur: selectedCurrency,
            transaction_type_id: '2',
            user_id: userId,
            payment_method_id: paymentMethodId,
          },
        });

        handleLimitResponse(amountLimitResponse.data);
      } catch (error) {
        console.error('Error fetching amount limit:', error);
        Alert.alert('Error', error.response?.data?.message || 'Failed to fetch amount limit.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLimitResponse = (response) => {
    if (response.status === 200 && response.success) {
      const { totalHtml, remain_amount, feesFixed, pFees } = response.success;

      const parsedTotalFees = parseFloat(totalHtml);
      const parsedRemainAmount = parseFloat(remain_amount) || 0;
      const parsedFeesFixed = parseFloat(feesFixed);
      const parsedPFee = parseFloat(pFees);

      setWithdrawalData((prev) => ({
        ...prev,
        totalFees: isNaN(parsedTotalFees) ? 0 : parsedTotalFees,
        remainAmount: parsedRemainAmount,
        feesFixed: parsedFeesFixed,
        pFees: parsedPFee,
      }));
      setRemainAmount(parsedRemainAmount);
      setIsValidAmount(amount <= parsedRemainAmount);
      setIsNextButtonEnabled(amount <= parsedRemainAmount);

      if (parsedRemainAmount < parseFloat(amount)) {
        Alert.alert('Warning', `Amount exceeded daily limit  ${remain_amount}.`);
      }
    } else {
      Alert.alert('Error', response.message || 'An unknown error occurred.');
    }
  };

  const handleSubmit = async () => {
    const { totalFees, pFees, feesFixed, paymentMethodId } = withdrawalData;
  
    if (!paymentMethodId) {
      Alert.alert('Error', error.response?.data?.message || 'Payment method not selected.');
      return;
    }
  
    setIsLoading(true);
  
    try {
      const response = await axios.post(
        `${API_URL}withdrawal/payout/submit`,
        {
          amount,
          wallet_id: selectedWallet,
          payout_currency: selectedCurrency,
          fee: totalFees,
          percentage_fee: pFees,
          fixed_fee: feesFixed,
          transaction_type_id: '2',
          payment_method: paymentMethodId,
          user_id: userId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            token,
            token_expiration: tokenExpiration,
          },
        }
      );
  
      setIsLoading(false);
  
      // Log the full response for 
      console.log('Withdrawal API response:', response);
  
      const { data } = response.data;
  
      if (data) {
        const { 
          banks, 
          exchange_amount, 
          currSymbol, 
          totalAmount, 
          amount, 
          exchange_rate, 
          exchange_cur_code, 
          payment_method_key,
          paymentMethodKey,
        } = data;
  
        // Log data before navigating
        console.log('Parsed data:', data);
  
        navigation.navigate('PayoutDetailScreen', {
          banks,
          validateName: 'true',
          exchangeAmount: exchange_amount,
          exchangeRate: exchange_rate,
          walletCurrencyCode: currSymbol,
          exchangeCurCode: exchange_cur_code,
          paymentMethodKey: payment_method_key,
          amount,
          totalAmount,
          totalFees,      
          pFees,         
          feesFixed,      
          paymentMethodId, 
          selectedWallet,   
          selectedCurrency, 
          userId,
          paymentMethodKey,           
        });
      } else {
       
        Alert.alert('Error', error.response?.data?.message || 'No data received from the server.');
 
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error in withdrawal request:', error);
      Alert.alert('Error', error.response?.data?.message || 'There was an error processing the withdrawal request.');
 
    }
  };
  

  const renderWalletItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.walletItem,
        selectedWallet === item.id && styles.walletItemSelected, 
      ]}
      onPress={() => {
        handleWalletChange(item);  
        setWalletModalVisible(false);
      }}
    >
      <Text style={styles.walletItemText}>{`${item.currency.name} + ${item.balance}`}</Text>
    </TouchableOpacity>
  );
  
  const renderCurrencyItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.walletItem,
        selectedCurrency === item.id && styles.walletItemSelected,  
      ]}
      onPress={() => {
        handleCurrencyChange(item);  
        setCurrencyModalVisible(false);
      }}
    >
      <Text style={styles.walletItemText}>{item.name}</Text>
    </TouchableOpacity>
  );
  
  const keyExtractorWallet = (item) => item.id ? item.id.toString() : item.currency.name;
  const keyExtractorCurrency = (item) => item.id ? item.id.toString() : item.name;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={handleAmountChange}
        keyboardType="numeric"
        placeholder="Enter amount"
      />
      {!isValidAmount && (
        <Text style={{ color: 'red', fontSize: 12 }}>Amount exceeds wallet balance</Text>
      )}
  
      <Text style={styles.label}>Wallet Source</Text>
      <TouchableOpacity
        style={styles.pickerContainer}
        onPress={() => setWalletModalVisible(true)}
      >
        <Text style={styles.walletText}>
          {selectedWallet === null ? 'Select Wallet Source' : wallets.find(w => w.id === selectedWallet)?.currency.name}
        </Text>
      </TouchableOpacity>
  
      {!isValidAmount && remainAmount !== undefined && (
        <Text style={styles.feeText}>You can Payout up to  {withdrawalData.remainAmount ? withdrawalData.remainAmount.toFixed(2) : '0.00'} daily</Text>
      )}

<Text style={styles.label}>Payout Currency</Text>
      <TouchableOpacity
        style={styles.pickerContainer}
        onPress={() => setCurrencyModalVisible(true)}
      >
        <Text style={styles.walletText}>
          {selectedCurrency === null ? 'Select Payout Currency' : currencies.find(c => c.id === selectedCurrency)?.name}
        </Text>
      </TouchableOpacity>
      <Text style={styles.feeText}>
        Fee: {typeof withdrawalData.totalFees === 'number' && !isNaN(withdrawalData.totalFees)
          ? withdrawalData.totalFees.toFixed(2) 
          : '0.00'}
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <TouchableOpacity
            style={[styles.submitButton, { opacity: !isNextButtonEnabled ? 0.5 : 1 }]}
            onPress={handleSubmit}
            disabled={!isNextButtonEnabled}   
          >
            <Text style={styles.submitButtonText}>Continue</Text>
          </TouchableOpacity>
          </>
      )}
      <Modal
        visible={isWalletModalVisible}
        animationType="slide"
        onRequestClose={() => setWalletModalVisible(false)}
      >
        <FlatList
          data={wallets}
          keyExtractor={keyExtractorWallet}
          renderItem={renderWalletItem}
        />
        <TouchableOpacity onPress={() => setWalletModalVisible(false)} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </Modal>
  
      <Modal
        visible={isCurrencyModalVisible}
        animationType="slide"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <FlatList
          data={currencies}
          keyExtractor={keyExtractorCurrency}
          renderItem={renderCurrencyItem}
        />
        <TouchableOpacity onPress={() => setCurrencyModalVisible(false)} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 8,
    paddingLeft: 8,
  },
  pickerContainer: {
    padding: 10,
    borderWidth: 1,
    borderColor: 'gray',
    marginBottom: 16,
  },
  walletText: {
    fontSize: 16,
  },
  walletItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  walletItemSelected: {
    backgroundColor: '#d3d3d3',
  },
  walletItemText: {
    fontSize: 16,
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
  closeButtonText: {
    backgroundColor: '#006400',
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 16,
    height: 45,
    width: '30%',
  },

   backgroundColor: '#006400',
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 16,
    width: '50%',
});

export default PayoutScreen;