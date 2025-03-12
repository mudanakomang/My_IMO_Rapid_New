import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
  ScrollView,
   
  ActivityIndicator,
  Platform,
} from 'react-native';
import { FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import validateToken from '../../components/validateToken';
import { useNavigation } from '@react-navigation/native';

const PayoutDetailScreen = ({ route }) => {
  const {  banks, exchangeAmount, walletCurrencyCode, amount, totalAmount, exchangeRate, exchangeCurCode,  paymentMethodKey,
    totalFees,  pFees,  feesFixed,  paymentMethodId,  selectedWallet,  selectedCurrency,  userId, } = route.params;

  // const excludedCurrencies = ['KES', 'RWF', 'TZS', 'UGX', 'XAF', 'XOF', 'ZMW', 'ZAR', 'ETB', 'SLL'];
  const excludedCurrencies = ['GBP', 'USD'];
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [bankInput, setBankInput] = useState('');
  const [banksVisible, setBanksVisible] = useState(false);
  const [filteredBanks, setFilteredBanks] = useState(banks);
  const [isFetchingName, setIsFetchingName] = useState(false);
  const [isBeneficiaryNameEditable, setIsBeneficiaryNameEditable] = useState(true); 
  const [bankBranchNeeded, setBankBranchNeeded] = useState(false);
  const [bankBranches, setBankBranches] = useState([]);
  const [selectedBankBranch, setSelectedBankBranch] = useState(null);
  const [bankBranchInput, setBankBranchInput] = useState('');
  const [branchesVisible, setBranchesVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation();
  const [filteredBranches, setFilteredBranches] = useState([]);

  const normalizeBanks = (banks) => {
    return banks.map(bank => {
      const normalizedBank = { ...bank };
      
      if (normalizedBank.bank_name) {
        normalizedBank.name = normalizedBank.bank_name.trim();
      } else if (normalizedBank.bankName) {
        normalizedBank.name = normalizedBank.bankName.trim();
      } else if (normalizedBank.Bank) {
        normalizedBank.name = normalizedBank.Bank.trim();
      } else if (normalizedBank.bank_Name) {
        normalizedBank.name = normalizedBank.bank_Name.trim();
      } else if (normalizedBank.Bankname) {
        normalizedBank.name = normalizedBank.Bankname.trim();
      }
       
      if (normalizedBank.bank_code) {
        normalizedBank.code = normalizedBank.bank_code;
      } else if (normalizedBank.bankCode) {
        normalizedBank.code = normalizedBank.bankCode;
      } else if (normalizedBank.Code) {
        normalizedBank.code = normalizedBank.Code;
      } else if (normalizedBank.Bank_code) {
        normalizedBank.code = normalizedBank.Bank_code;
      }
      return normalizedBank;
    });
  };
  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Payout Confirmation',
    });
  }, [navigation]);
  useEffect(() => {
    const normalizedBanks = normalizeBanks(banks);
    const sortedBanks = normalizedBanks.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredBanks(sortedBanks);
  }, [banks]);

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setBankInput(bank.name);  
    setBanksVisible(false);
  };

  const handleBankSearch = (text) => {
    setBankInput(text);
  
    if (text === '') {
      const sortedBanks = normalizeBanks(banks).sort((a, b) => a.name.localeCompare(b.name));
      setFilteredBanks(sortedBanks);
    } else {
      const filtered = filteredBanks.filter((bank) =>
        bank.name && bank.name.toLowerCase().includes(text.toLowerCase())
      );
      const sortedFilteredBanks = filtered.sort((a, b) => a.name.localeCompare(b.name));
      setFilteredBanks(sortedFilteredBanks);
    }
  };
  
  const fetchBeneficiaryName = async () => {
    if (!accountNumber || !selectedBank) {
      Alert.alert('Error', error.response?.data?.message || 'Please enter an account number and select a bank.');
      return;
    }
   
    setBankBranchInput('');
    setSelectedBankBranch(null);
    setBeneficiaryName('');
    setIsBeneficiaryNameEditable(true);
    setBankBranches([]);
    setBankBranchNeeded(false);
  
    setIsFetchingName(true);
    try {
      const { token, token_expiration, user_id } = await validateToken();
  
      const requestData = {
        accountNumber,
        bankCode: selectedBank.code,
        currency: exchangeCurCode,
        user_id: user_id,
        paymentMethodKey,
        whatFor: 'nameValidate',
        bank: selectedBank,
      };
  
      const response = await axios.post(
        'https://imorapidtransfer.com/api/v1/fetch-account-name/validation/submission',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            token,
            token_expiration: token_expiration,
          },
        }
      );
  
      console.log('Response Data:', response.data);
  
      if (response.status === 200) {
        const { status, account_name, branches, message, success } = response.data;
  
        if ((status && status.toString().toUpperCase() === 'SUCCESS') || success) {
          if (account_name) {
            setBeneficiaryName(account_name);
            setIsBeneficiaryNameEditable(false);
            Alert.alert('Success', message || 'Account name verified successfully.');
          } else {
            Alert.alert('Notice', 'Account name not found in the response.');
          }
  
          if (branches && branches.length > 0) {
            setBankBranchNeeded(true);
            setBankBranches(branches.map((branch) => ({
              ...branch,
              key: branch.id,
              name: branch.branch_name,
            })));
          } else {
            setBankBranchNeeded(false);
            setBankBranches([]);
          }
        } else {
          Alert.alert('Error', error.response?.data?.message || 'Unable to fetch account name.');
        }
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to fetch account name.');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Unable to validate account name.');
    } finally {
      setIsFetchingName(false);
    }
  };
  
  const handleBranchSelect = (branch) => {
    setSelectedBankBranch(branch);
    setBankBranchInput(branch.name || branch.branch_name);  
    setBranchesVisible(false);
  };
  
  
  
  const handleBranchSearch = (text) => {
    setBankBranchInput(text);
  
    if (text === '') {
      setFilteredBranches(bankBranches);   
    } else {
      const filtered = bankBranches.filter((branch) =>
        branch.name && branch.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredBranches(filtered);   
    }
  };
  
  
 
  const handleSubmit = async () => {
    if (!accountNumber || !amount || !selectedBank || !paymentMethodKey) {
     Alert.alert('Error', error.response?.data?.message ||
        'Please ensure all required fields are filled: Account Number, Amount, Selected Bank, and Payment Method.'
      );
      return;
    }
  
    navigation.navigate('PinVerify', {
      onSuccess: async () => {
        try {
          setIsSubmitting(true);
  
          const { token, token_expiration, user_id } = await validateToken();
  
          const requestData = {
            selectedBank,
            accountNumber,
            beneficiaryName: beneficiaryName || null,
            bankBranch: selectedBankBranch || null,
            bankBranchInput: bankBranchInput || null,
            exchangeAmount: exchangeAmount || null,
            walletCurrencyCode: walletCurrencyCode || null,
            whatFor: 'submission',
            amount,
            totalAmount: totalAmount || null,
            exchangeRate: exchangeRate || null,
            exchangeCurCode: exchangeCurCode || null,
            paymentMethodKey,
            totalFees: totalFees || null,
            pFees: pFees || null,
            feesFixed: feesFixed || null,
            paymentMethodId: paymentMethodId || null,
            selectedWallet: selectedWallet || null,
            selectedCurrency: selectedCurrency || null,
            user_id,
          };
  
          console.log('Submitting data:', requestData);
  
          const response = await axios.post(
            'https://imorapidtransfer.com/api/v1/fetch-account-name/validation/submission',
            requestData,
            {
              headers: {
                'Content-Type': 'application/json',
                token,
                token_expiration,
              },
            }
          );
  
          console.log('HTTP status code:', response.status);
          console.log('Server response:', response.data);
  
          navigation.replace('PayoutFinalScreen', {
            message: response.data.message,
            status: response.data.status || 'Processing',
            walletCurrencyCode: requestData.walletCurrencyCode,
            exchangeCurCode: requestData.exchangeCurCode,
            amount: requestData.amount,
            fees: requestData.totalFees,
            destination: requestData.selectedBank.name,
            beneficiaryName: requestData.beneficiaryName,
          });
  
        } catch (error) {
          console.error('Error during submission:', error);
            
          if (error.response) {
            
            const statusCode = error.response.status;
            const errorMessage = error.response.data?.message || 'An error occurred during submission.';
  
            if (statusCode === 401) {
              Alert.alert(
                'Unauthorized',
                'Your session has expired or you are not authorized. Please log in again.'
              );
              navigation.replace('LoginScreen'); // Redirect to login
            } else {
              Alert.alert('Submission Error', errorMessage);
              navigation.replace('PayoutFinalScreen', {
                message: errorMessage,
              });
            }
          } else {
            
            Alert.alert(
              'Network Error',
              'An unexpected error occurred. Please check your internet connection and try again.'
            );
            navigation.replace('PayoutFinalScreen', {
              message: 'An unexpected error occurred during submission.',
            });
          }
        } finally {
          setIsSubmitting(false);
        }
      },
      onFailed: () => {
        navigation.replace('FinalScreen', {
          message: 'PIN verification failed.',
        });
      },
    });
  };
  
  

  const handleOutsideClick = () => {
    setBanksVisible(false);
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={[{}]} 
          renderItem={() => (
            <View style={styles.container}>
              {/* Bank Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Bank</Text>
                <TouchableOpacity onPress={() => setBanksVisible(true)}>
                  <TextInput
                    value={bankInput}
                    placeholder="Select Bank"
                    editable={false}
                    style={styles.input}
                  />
                </TouchableOpacity>
              </View>
  
              {/* Account Number */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Account Number</Text>
                <View style={styles.inputWithButton}>
                  <TextInput
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="123456789000"
                    keyboardType="numeric"
                    style={styles.inputFieldWithButton}
                  />
                  {!excludedCurrencies.includes(exchangeCurCode) && (
                    <TouchableOpacity
                      style={styles.inlineButton}
                      onPress={fetchBeneficiaryName}
                      disabled={isFetchingName}
                    >
                      {isFetchingName ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.inlineButtonText}>Query</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
  
              {/* Bank Branch */}
              {bankBranchNeeded && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Bank Branch</Text>
                  <TouchableOpacity onPress={() => setBranchesVisible(true)}>
                    <TextInput
                      value={bankBranchInput}
                      placeholder="Select Bank Branch"
                      editable={false}
                      style={styles.input}
                    />
                  </TouchableOpacity>
                </View>
              )}
  
              {/* Beneficiary Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Beneficiary Name</Text>
                <TextInput
                  value={beneficiaryName}
                  onChangeText={setBeneficiaryName}
                  placeholder="Beneficiary Name"
                  style={styles.input}
                  editable={isBeneficiaryNameEditable}
                />
              </View>
  
              {/* Confirmation Details */}
              <View style={styles.details}>
                <Text style={styles.detailsLabel}>Confirmation Details</Text>
                <Text style={styles.detailsText}>
                  Payout Amount: {walletCurrencyCode} {amount || 0}
                </Text>
                <Text style={styles.detailsText}>
                  Debit Amount + Fees: {walletCurrencyCode} {totalAmount}
                </Text>
                <Text style={styles.detailsText}>
                  Recipient will receive: {exchangeCurCode} {exchangeAmount}
                </Text>
                <Text style={styles.detailsText}>
                  At the rate of {exchangeCurCode} {exchangeRate} = 1 {walletCurrencyCode}
                </Text>
              </View>
  
              {/* Submit Button */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={handleSubmit}
                  style={styles.submitButton}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
  
       {/* Submission Indicator Modal */}
        <Modal visible={isSubmitting} transparent={true} animationType="fade">
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Transfer in Progress</Text>   
          </View>
        </Modal>

  
        {/* Dropdown for Banks */}
        {banksVisible && (
          <Modal
            visible={banksVisible}
            animationType="slide"
            transparent={true}  
            onRequestClose={() => setBanksVisible(false)}
          >
            <View style={styles.overlay}>
              <View style={styles.modalContainer}>
                <TextInput
                  placeholder="Search Bank..."
                  onChangeText={handleBankSearch}
                  style={styles.searchInput}
                />
                <FlatList
                  data={filteredBanks}
                  keyExtractor={(item) => item.code}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        handleBankSelect(item);
                        setBanksVisible(false);
                      }}
                      style={styles.bankOption}
                    >
                      <Text style={styles.bankOptionText}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>
        )}
  
        {/* Dropdown for Bank Branches */}
        {branchesVisible && (
          <Modal
            visible={branchesVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setBranchesVisible(false)}
          >
            <View style={styles.overlay}>
              <View style={styles.modalContainer}>
                <TextInput
                  placeholder="Search Branch..."
                  onChangeText={handleBranchSearch}
                  style={styles.searchInput}
                />
                <FlatList
                  data={filteredBranches.length > 0 ? filteredBranches : bankBranches}  
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        handleBranchSelect(item);
                        setBranchesVisible(false);
                      }}
                      style={styles.bankOption}
                    >
                      <Text style={styles.bankOptionText}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>
        )}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
  
  
};
  

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,  
    padding: 20,
    backgroundColor: '#F9F9F9',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    color: '#333',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingText: {
    marginTop: 10,   
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  modalContainer: {
    width: '80%',  
    maxHeight: '80%',  
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,  
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    width: '100%',
  },
  bankOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bankOptionText: {
    fontSize: 16,
    color: '#333',
  },
  details: {
    marginTop: 20,
    padding: 16,
    fontSize: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: "#e0ffe0",
  },
  detailsLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  buttonContainer: {
    marginTop: 30,
    alignItems: 'center',
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
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
  },
  inputFieldWithButton: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    color: '#333',
  },
  inlineButton: {
    backgroundColor: '#EF6C00',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 8,
  },
  inlineButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});


export default PayoutDetailScreen;