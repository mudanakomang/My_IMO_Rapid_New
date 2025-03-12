import React, { useEffect, useState } from 'react';
import { View, Text, Button, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native'; 
import { FlutterwaveInit } from 'flutterwave-react-native'; 
import { WebView } from 'react-native-webview';
import axios from 'axios';
import validateToken from '../../components/validateToken'; 
import { Feather } from '@expo/vector-icons';

const FlutterwavePaymentScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [paymentLink, setPaymentLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);  

  const {
    exchangeAmount, exchangeCurCode, transInfo, email, phone,
    first_name, last_name, transactionId, exchange_rate, publicFlwApiSKey
  } = route.params;
  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Confirm Deposit',   
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });

    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.setOptions({ tabBarStyle: { display: 'none' } });  
    }

    return () => {
      if (parentNav) {
        parentNav.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });  
      }
    };
  }, [navigation]);

  useEffect(() => {
    console.log("Flutterwave library initialized:", FlutterwaveInit);
  }, []);


  const getAuthHeaders = async () => {
    try {
      const { token, token_expiration, user_id } = await validateToken();
      return { token, token_expiration, user_id };
    } catch (error) {
      console.error("❌ Error fetching authentication headers:", error);
      throw error;
    }
  };

  const handleFlutterwavePayment = async () => {
    try {
      setLoading(true);
      const amount = (Number(exchangeAmount) || 0) + (Number(transInfo.fees) || 0);
      const paymentData = {
        authorization: publicFlwApiSKey,
        tx_ref: transactionId,
        amount: amount,
        currency: exchangeCurCode,
        customer: {
          email: email,
          phone_number: phone,
        },
        payment_options: 'card',
        firstname: first_name,
        lastname: last_name,
        redirect_url: 'https://imorapidtransfer.com/api/v1/deposit/flw/payment_processing',
      };

      console.log("🔹 Sending payment data to Flutterwave:", paymentData);
      
      const generatedPaymentLink = await FlutterwaveInit(paymentData);

      console.log("🔍 Flutterwave Response:", generatedPaymentLink);  

      if (generatedPaymentLink) {
        setPaymentLink(generatedPaymentLink);
      } else {
        Alert.alert('Payment Failed', 'Please try again.');
      }
    } catch (error) {
      console.error('❌ Flutterwave Payment Error: ', error);
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong while processing your payment.');
    } finally {
      setLoading(false);
    }
  };

  const validateTransaction = async (txRef, transactionId) => {
    setValidating(true);  
    try {
        console.log("📡 Validating transaction:", { txRef, transactionId });

        const authHeaders = await getAuthHeaders();  

        console.log("🔑 Request Headers:", {
            "Content-Type": "application/json",
            token: authHeaders.token,
            token_expiration: authHeaders.token_expiration,
        });

        const validationUrl = `https://imorapidtransfer.com/api/v1/deposit/flw/validate-transaction/${transactionId}/${txRef}`;

        const validationResponse = await axios.get(validationUrl, {
            headers: {
                "Content-Type": "application/json",
                token: authHeaders.token,
                token_expiration: authHeaders.token_expiration,
            },
        });

        console.log("🔍 Validation Response:", validationResponse.data);

        if (validationResponse.data.status === "success") {
            navigation.navigate("PaymentStatus", { status: "successful", txRef });
        } else if (validationResponse.data.status === "pending") {
            Alert.alert("Transaction Pending", "Your payment is still being processed.");
            navigation.navigate("PaymentStatus", { status: "pending", txRef });
        } else {
            navigation.navigate("PaymentStatus", { status: "failed", txRef });
        }
    } catch (error) {
        console.error("❌ Transaction Validation Error:", error);
        Alert.alert("Error", "Could not validate transaction. Please try again later.");
        navigation.navigate("PaymentStatus", { status: "failed", txRef });
    } finally {
        setValidating(false);  
    }
  };

  if (paymentLink) {
    return (
      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: paymentLink }}
          style={{ flex: 1 }}
          startInLoadingState
          renderLoading={() => <ActivityIndicator size="large" color="blue" />}
          onNavigationStateChange={(navState) => {
            console.log("🔹 WebView Navigation URL:", navState.url);
        
            if (navState.url.includes("payment_processing")) { 
                let transactionRef, transactionId;
        
                try {
                    const urlParts = navState.url.split("?")[1] || navState.url.split("#")[1]; // Handle both ? and #
                    const urlParams = new URLSearchParams(urlParts);
                    
                    transactionRef = urlParams.get("tx_ref");
                    transactionId = urlParams.get("transaction_id");
        
                    console.log("✅ Extracted Params:", { transactionRef, transactionId });
                } catch (error) {
                    console.error("❌ Error parsing transaction details:", error);
                }
        
                if (transactionRef && transactionId) {
                    validateTransaction(transactionRef, transactionId);
                } else {
                    console.warn("⚠️ Missing transaction parameters");
                }
            } else if (navState.url.includes("failed")) {
                Alert.alert("Payment Failed", "There was an issue processing the payment.");
                navigation.navigate("PaymentStatus", { status: "failed" });
            }
          }}
        />
        
        {validating && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Validating Transaction...</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Details</Text>

      {exchangeCurCode !== transInfo.currCode && (
        <View style={styles.infoBox}>
          <Text>You will be debited in {exchangeCurCode}</Text>
          <Text style={styles.amountText}>{exchangeCurCode} {exchangeAmount}</Text>
          <Text style={styles.rateText}>
            At the rate of {transInfo.currencyCode} {exchange_rate} = {transInfo.currCode} 1 {exchangeCurCode}
          </Text>
        </View>
      )}

      <View style={styles.detailRow}>
        <Text>Deposit Amount</Text>
        <Text style={styles.boldText}>{transInfo.currSymbol} {transInfo.amount}</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.detailRow}>
        <Text>Fee</Text>
        <Text style={styles.boldText}>{transInfo.currencyCode} {transInfo.fees || "0.00"}</Text>
      </View>

      <View style={styles.separator} />

      <View style={[styles.detailRow, styles.totalRow]}>
        <Text style={styles.boldText}>Total</Text>
        <Text style={styles.boldText}>{transInfo.currencyCode} {transInfo.totalAmount || "0.00"}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <TouchableOpacity style={styles.confirmButton} onPress={handleFlutterwavePayment}>
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  backButton: {
    marginLeft: 15,
  },
   
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoBox: {
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 5,
    marginVertical: 10,
    width: '100%',
  },
  amountText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  rateText: {
    textAlign: 'right',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 10,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 5,
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: 'green',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
});

export default FlutterwavePaymentScreen;