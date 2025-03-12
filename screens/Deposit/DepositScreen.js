import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import validateToken from "../../components/validateToken";
import debounce from "lodash.debounce";
import { WebView } from 'react-native-webview';

const width = Dimensions.get("window").width;

const Deposit = () => {
  const [selectedCurrencyId, setSelectedCurrencyId] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [currencyList, setCurrencyList] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [amount, setAmount] = useState("");
  const [fees, setFees] = useState({ percentage: 0, fixed: 0, total: 0 });
  const [walletLoading, setWalletLoading] = useState(false);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [feesLoading, setFeesLoading] = useState(false);
  const [userData, setUserData] = useState({ user_id: null, token: "", token_expiration: "" });
  const [amountLimit, setAmountLimit] = useState(10000);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ title: "Deposit" });
    validateTokenAndSetData();
  }, []);
  
  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);

  const validateTokenAndSetData = async () => {
    try {
      const { user_id, token, token_expiration } = await validateToken();
      setUserData({ user_id, token, token_expiration });
      fetchWallets(user_id, token, token_expiration);
    } catch (error) {
      Alert.alert("Error", "Failed to validate token.");
      navigation.navigate("LoginForm");
    }
  };

  const fetchWallets = async (user_id, token, token_expiration) => {
    setWalletLoading(true);
    try {
      const response = await axios.post(
        "https://imorapidtransfer.com/api/v1/deposit/deposit/currency/wallet",
        { user_id },
        {
          headers: {
            token,
            token_expiration,
            "Content-Type": "application/json",
          },
        }
      );
  
      const filteredWallets = response.data.data.filter(wallet => wallet.currency_id);  
      setCurrencyList(
        filteredWallets.map((wallet) => ({
          walletId: wallet.wallet_id,
          balance: wallet.balance,
          currencyId: wallet.currency_id,  
          currency_id: wallet.currency_id,  
          currencyName: wallet.currency_name,
          currencyCode: wallet.currency_code,
          isDefault: wallet.is_default,
        }))
      );
      
    } catch (error) {
      console.error("Error fetching wallets:", error);
      Alert.alert("Error", "Failed to fetch wallets.");
    } finally {
      setWalletLoading(false);
    }
  };
  

  const fetchPaymentMethods = async (currencyId, currencyCode) => {
    setMethodsLoading(true);
    try {
      const response = await axios.post(
        "https://imorapidtransfer.com/api/v1/deposit/submiter/fetch-method/method",
        {
          currencyCode,
          transaction_type_id: 1,
          user_id: userData.user_id,
        },
        {
          headers: {
            token: userData.token,
            token_expiration: userData.token_expiration,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success && response.data.success.paymentMethods) {
        setPaymentMethods(Object.values(response.data.success.paymentMethods));
      } else {
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      Alert.alert("Error", "Failed to fetch payment methods.");
    } finally {
      setMethodsLoading(false);
    }
  };

  const fetchDepositFees = useCallback(
    debounce(async () => {
      if (!amount || !selectedCurrencyId || !selectedPaymentMethod) return;
  
      console.log("Selected Currency ID:", selectedCurrencyId);
      // console.log("Currency List:", currencyList);
   
      const selectedWallet = currencyList.find(
        (wallet) => String(wallet.walletId) === String(selectedCurrencyId)
      );
  
      if (!selectedWallet) {
        Alert.alert("Error", "Please select a valid wallet.");
        return;
      }
  
      const { currencyCode, currencyId } = selectedWallet;  
      console.log("Wallet ID:", selectedCurrencyId);
      console.log("Currency ID:", currencyId);
  
      try {
        const response = await axios.post(
          "https://imorapidtransfer.com/api/v1/fees/limit/fees",
          {
            amount,
            currency_id: currencyId,  
            payment_method_id: selectedPaymentMethod,
            transaction_type_id: 1,
            user_id: userData.user_id,
            currencyCode,
          },
          {
            headers: {
              token: userData.token,
              token_expiration: userData.token_expiration,
              "Content-Type": "application/json",
            },
          }
        );
  
        const feesPercentage = parseFloat(response.data.success.feesPercentage).toFixed(2);
        const feesFixed = parseFloat(response.data.success.feesFixed).toFixed(2);
        const totalFees = parseFloat(response.data.success.totalFees).toFixed(2);
  
        setFees({
          percentage: feesPercentage,
          fixed: feesFixed,
          total: totalFees,
        });
      } catch (error) {
        console.error("Error fetching deposit fees:", error);
        Alert.alert("Error", "Failed to calculate fees.");
      } finally {
        setFeesLoading(false);
      }
    }, 500),
    [amount, selectedCurrencyId, selectedPaymentMethod]
  );
  
  
  useEffect(() => {
    const validateForm = () => {
      if (!amount || !selectedCurrencyId || !selectedPaymentMethod) {
        return true;
      }
  
      const selectedWallet = currencyList.find((wallet) => wallet.walletId === selectedCurrencyId);
      if (!selectedWallet) {
        return true;
      }
  
      const { min, max } = fees;
      const amountValue = parseFloat(amount);
  
      if (isNaN(amountValue) || amountValue < parseFloat(min) || (max && amountValue > parseFloat(max))) {
        return true;
      }
  
      if (!fees || !fees.total || fees.total === "0.00") {
        return true;
      }
  
      return false;
    };
  
    setIsButtonDisabled(validateForm());
  }, [amount, selectedCurrencyId, selectedPaymentMethod, fees, currencyList]);
  
  useEffect(() => {
    setFees({ percentage: 0, fixed: 0, total: 0 });
    fetchDepositFees();
  }, [selectedCurrencyId, selectedPaymentMethod, amount]);

  const handleCurrencyChange = (value) => {
    const selectedWallet = currencyList.find((wallet) => wallet.walletId === value);
    if (selectedWallet) {
      setSelectedCurrencyId(selectedWallet.walletId);
      fetchPaymentMethods(selectedWallet.walletId, selectedWallet.currencyCode);
    } else {
      setSelectedCurrencyId("");  
    }
  };
  
  const [htmlContent, setHtmlContent] = useState('');

  

  const handleSubmit = async () => {
    if (!amount || amount > amountLimit || !selectedPaymentMethod) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
  
    setIsSubmitting(true); // Show ActivityIndicator
  
    const selectedWallet = currencyList.find(
      (wallet) => wallet.walletId === selectedCurrencyId
    );
  
    if (!selectedWallet) {
      Alert.alert("Error", "Please select a valid wallet.");
      setIsSubmitting(false); // Hide ActivityIndicator
      return;
    }
  
    const { currencyCode, currency_id } = selectedWallet;
    const mobile_app = true;
  
    try {
      const payload = {
        amount,
        wallet_id: selectedCurrencyId,
        payment_method_id: selectedPaymentMethod,
        fees: fees.total,
        percentage_fee: fees.percentage,
        transaction_type_id: 1,
        mobile_app,
        user_id: userData.user_id,
        currencyCode,
        fixed_fee: fees.fixed,
        currency_id,
      };
  
      console.log("Request Payload:", payload);
  
      const response = await axios.post(
        "https://imorapidtransfer.com/api/v1/deposit/submit",
        payload,
        {
          headers: {
            token: userData.token,
            token_expiration: userData.token_expiration,
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log("Response received:", response.data);
  
      if (response.data.status) {
        const paymentMethodScreen = response.data.payment_method;
  
        if (paymentMethodScreen === "SquadCoPaymentScreen.js") {
          navigation.navigate("SquadCoPaymentScreen", {
            transactionId: response.data.data.reference,
            squad_reference: response.data.data.squad_reference,
            email: response.data.data.email,
            phone: response.data.data.phone,
            first_name: response.data.data.first_name,
            last_name: response.data.data.last_name,
            transInfo: response.data.data.transInfo,
            exchangeAmount: response.data.data.exchange_amount,
            exchange_rate: response.data.data.exchange_rate,
            exchangeCurCode: response.data.data.exchange_cur_code,
            squadApiPKey: response.data.data.squadApiPKey,
            squadApiSecret: response.data.data.squadApiSKey,
          });
        } else if (paymentMethodScreen === "FlutterwavePaymentScreen.js") {
          navigation.navigate("FlutterwavePaymentScreen", {
            transactionId: response.data.data.reference,
            email: response.data.data.email,
            phone: response.data.data.phone,
            first_name: response.data.data.first_name,
            last_name: response.data.data.last_name,
            transInfo: response.data.data.transInfo,
            exchangeAmount: response.data.data.exchange_amount,
            exchange_rate: response.data.data.exchange_rate,
            exchangeCurCode: response.data.data.exchange_cur_code,
            secretFlwApiSKey: response.data.data.secretFlwApiSKey,
            publicFlwApiSKey: response.data.data.publicFlwApiSKey,
          });
        } else {
          Alert.alert("Error", "Unknown payment method.");
        }
      } else {
        console.error("Error in response:", response.data);
        Alert.alert("Error", response.data.message || "Failed to submit deposit.");
      }
    } catch (error) {
      console.error("Error occurred:", error);
  
      if (error.response) {
        console.error("Error response data:", error.response.data);
        Alert.alert(
          "Error",
          error.response.data.message ||
            "Request failed with status code " + error.response.status
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
        Alert.alert("Error", "No response received from server.");
      } else {
        console.error("Error in setup:", error.message);
        Alert.alert("Error", error.message);
      }
      setIsSubmitting(false);
    }
  };
  


  const unsubscribe = navigation.addListener('focus', () => {
    navigation.setOptions({
      tabBarVisible: false, // Hide bottom tab bar when this screen is focused
    });
  });

  const unsubscribeBlur = navigation.addListener('blur', () => {
    navigation.setOptions({
      tabBarVisible: true,  
    });
  });

  return (
    <View style={styles.container}>
      {(walletLoading || methodsLoading || feesLoading) && (
        <Modal transparent>
          <View style={styles.modalBackground}>
            <ActivityIndicator size="large" color="#007bff" />
          </View>
        </Modal>
      )}
  
      <View style={styles.formContainer}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="numeric"
          style={styles.input}
        />
  
        <Text style={styles.label}>Select Wallet</Text>
        <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCurrencyId}
          onValueChange={handleCurrencyChange}
          style={styles.picker}
        >
          <Picker.Item label="Select Wallet" value="" />
          {currencyList.length > 0 ? (
            currencyList.map((item) => (
              <Picker.Item
                key={item.walletId}
                label={`${item.currencyCode} - ${item.currencyName} (Balance: ${item.balance})`}
                value={item.walletId}
              />
            ))
          ) : (
            <Picker.Item label="No wallets available" value="" />
          )}
        </Picker>
        </View>
        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedPaymentMethod}
          onValueChange={setSelectedPaymentMethod}
          style={styles.picker}
        >
          <Picker.Item label="Select Payment Method" value="" />
          {paymentMethods.map((item) => (
            <Picker.Item key={item.id} label={item.name} value={item.id} />
          ))}
        </Picker>
        </View>
        <Text style={styles.feeText}>Fee: {fees.total}</Text>
  
        <TouchableOpacity
            style={[styles.submitButton, isButtonDisabled || isSubmitting ? styles.disabledButton : {}]}
            onPress={handleSubmit}
            disabled={isButtonDisabled || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </TouchableOpacity>

        
      </View>
    </View>
  );
};
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-start",  
      paddingTop: 70,  
      paddingHorizontal: 19,
      backgroundColor: "#f4f4f4",
    },
   
    label: {
      marginTop: 10,
      fontSize: 16,
      fontWeight: "500",
      color: "#333",
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 8,
      marginTop: 5,
      backgroundColor: "#fff",
      overflow: "hidden",
      height: 48,  
      justifyContent: "center",  
      paddingHorizontal: 10,   
    },
    
    input: {
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 8,
      padding: 12,
      marginTop: 1,
      fontSize: 16,
      backgroundColor: "#fff",
    },
    picker: {
      fontSize: 16,
      height: 50,  
      width: "100%", 
      color: "#333",
      textAlignVertical: "center",  
    },
    feeText: {
      marginTop: 12,
      fontSize: 16,
      fontWeight: "bold",
      color: "#444",
    },
    submitButton: {
      backgroundColor: '#006400',
      padding: 12,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
      width: '50%',
      alignSelf: 'center', 
      paddingVertical: 12,   
      marginTop: 16,
    },
    disabledButton: {
      backgroundColor: '#28a745',
    },
    submitText: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "bold",
    },
    modalBackground: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    
    
  });
  
export default Deposit;
