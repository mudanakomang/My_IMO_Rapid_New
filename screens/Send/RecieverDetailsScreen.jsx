import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import validateToken from '../../components/validateToken';

const RecieverDetailsScreen = (props) => {
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [receiverEmail, setReceiverEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [balance, setBalance] = useState(0);
  const [fee, setFee] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [receiverName, setReceiverName] = useState({ firstName: '', lastName: '' });
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);  
  const [feesPercentage, setFeesPercentage] = useState(0);   
  const [feesFixed, setFeesFixed] = useState(0);   



  useEffect(() => {
    props.navigation.setOptions({
      headerTitle: 'Send Money',
    });

    fetchWallets();
  }, [props.navigation]);

  useEffect(() => {
    if (selectedWallet && amount) {
      validateBalanceAndFees(selectedWallet, amount);
    }
  }, [selectedWallet, amount]);

  const fetchWallets = async () => {
    const validatedToken = await validateToken();
    if (!validatedToken || !validatedToken.token || !validatedToken.user_id) {
      console.error('Token validation failed.');
      return;
    }

    try {
      const response = await axios.get(
        `https://imorapidtransfer.com/api/v1/user/${validatedToken.user_id}/wallets`,
        {
          headers: {
            token: validatedToken.token,
            token_expiration: validatedToken.token_expiration,
            'Content-Type': 'application/json',
          },
        }
      );

      const walletsData = response.data.data.map((wallet) => ({
        id: wallet.id,
        balance: wallet.balance,
        currencyName: wallet.currency.name,
        currencyCode: wallet.currency.code,
      }));
      setWallets(walletsData);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchWallets();
    setSelectedWallet(null);
    setReceiverEmail('');
    setAmount('');
    setNote('');
    setReceiverName({ firstName: '', lastName: '' });
    setBalance(0);
    setFee(0);
    setTotalFees(0);
    setIsSubmitDisabled(true);
    setIsRefreshing(false);
  };

  const handleWalletChange = (walletId) => {
    const selected = wallets.find((wallet) => wallet.id === walletId);
    setSelectedWallet(walletId);
    setBalance(selected ? selected.balance : 0);
    setIsSubmitDisabled(true);
    validateBalanceAndFees(walletId, amount);
  };

  const validateBalanceAndFees = async (walletId, amountValue) => {
    if (!walletId || !amountValue) return;

    if (parseFloat(amountValue) > balance) {
      setIsSubmitDisabled(true);
      return;
    }

    try {
      const validatedToken = await validateToken();
      const response = await axios.post(
        `https://imorapidtransfer.com/api/v1/amount-limit-check`,
        { wallet_id: walletId, amount: amountValue, user_id: validatedToken.user_id, transaction_type_id: 3 },
        {
          headers: {
            token: validatedToken.token,
            token_expiration: validatedToken.token_expiration,
            'Content-Type': 'application/json',
          },
        }
      );

      const { data, status, message } = response.data;
      if (status === 200) {
        setFee(data.totalFees || 0);
        setTotalFees(data.totalFees || 0);
        setFeesPercentage(data.feesPercentage || 0);   
        setFeesFixed(data.feesFixed || 0);   
        setBalance(data.wallet_balance);
        setIsSubmitDisabled(false);
      } else if (status === 401) {
        alert(message);
        setFee(0);
        setTotalFees(0);
        setIsSubmitDisabled(true);
      } else {
        alert('Amount verification failed.');
      }
    } catch (error) {
      console.error('Error verifying amount:', error);
      alert('An error occurred while verifying the amount.');
      setIsSubmitDisabled(true);
    }
  };

  const handleEmailChange = async (email) => {
    setReceiverEmail(email);

    try {
      const validatedToken = await validateToken();
      const response = await axios.post(
        `https://imorapidtransfer.com/api/v1/user/check-email`,
        { email },
        {
          headers: {
            token: validatedToken.token,
            token_expiration: validatedToken.token_expiration,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        const { first_name, last_name } = response.data.data;
        setReceiverName({ firstName: first_name, lastName: last_name });
      } else {
        setReceiverName({ firstName: '', lastName: '' });
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
  };

  const handleAmountChange = (value) => {
    if (isNaN(value)) return;
    if (!selectedWallet) {
      alert('Please select a wallet first.');
      return;
    }
    setAmount(value);
  };

  const verifyPinAndSubmit = async () => {
    setIsLoading(true);
    try {
        props.navigation.navigate('PinVerify', {
            onSuccess: async () => {
                try {
                    const validatedToken = await validateToken();
                    const response = await axios.post(
                        `https://imorapidtransfer.com/api/v1/send/transaction/submit`,
                        {
                            wallet_id: selectedWallet,
                            receiver_email: receiverEmail,
                            amount,
                            note,
                            transaction_type_id: 3,
                            fee: totalFees,
                            feesPercentage,
                            feesFixed,
                            user_id: validatedToken.user_id,
                        },
                        {
                            headers: {
                                token: validatedToken.token,
                                token_expiration: validatedToken.token_expiration,
                                'Content-Type': 'application/json',
                            },
                        }
                    );

                    setIsLoading(false);
                    const { status, message, data } = response.data;
                    
                    props.navigation.navigate('FinalScreen', {
                        message: message || (status === 'success' 
                            ? 'Transaction submitted successfully!' 
                            : 'Failed to submit transaction!'),
                        transactionId: data?.tr_ref_id || null,
                    });
                } catch (error) {
                    setIsLoading(false);
                    props.navigation.navigate('FinalScreen', {
                        message: 'An error occurred while submitting the transaction.',
                        transactionId: null,
                    });
                }
            },
        });
    } catch (error) {
        setIsLoading(false);
        props.navigation.navigate('FinalScreen', {
            message: 'Error initializing PIN verification.',
            transactionId: null,
        });
    }
};

  
  

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1, width: '100%' }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Select Debit Wallet</Text>
            <Picker
              selectedValue={selectedWallet}
              onValueChange={handleWalletChange}
              style={styles.picker}
            >
              <Picker.Item label="Select Wallet" value={null} />
              {wallets.map((wallet) => (
                <Picker.Item
                  key={wallet.id}
                  label={`${wallet.currencyName} (${wallet.currencyCode}) - Balance: ${wallet.balance}`}
                  value={wallet.id}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Receiver Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Receiver Email"
              value={receiverEmail}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
            />
            {receiverName.firstName && receiverName.lastName ? (
              <Text style={styles.feeText}>
                Receiver: {receiverName.firstName} {receiverName.lastName}
              </Text>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Amount"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
            />
            {totalFees > 0 && (
              <Text style={styles.feeText}>
                Total Fees: {totalFees.toFixed(2)}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Note</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Note"
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={50}  
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              isSubmitDisabled && { backgroundColor: '#aaa' },
            ]}
            onPress={verifyPinAndSubmit}
            disabled={isSubmitDisabled}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 35,
    backgroundColor: '#F4F4F4',
  },
  inputContainer: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  label: {
    color: 'black',
    fontSize: 16,
    marginBottom: 5,
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    height: 50,
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
    textAlign: 'center',
    fontSize: 18,
  },
  feeText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
});

export default RecieverDetailsScreen;
