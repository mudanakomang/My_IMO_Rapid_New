import React, { useState , useEffect  } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Modal, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import validateToken from '../../components/validateToken';   

const SquadCoPaymentScreen = ({ route }) => {
  const navigation = useNavigation();
  const { exchangeAmount, exchangeCurCode, email, phone, first_name, last_name, transInfo, exchange_rate, transactionId, squadApiPKey, squadApiSecret } = route.params;
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);

  const { token, token_expiration, user_id } = validateToken();
  
  
  useEffect(() => {
    navigation.setOptions({
      title: 'Confirm Deposit',  
    });

    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);

  const handlePayment = async () => {
    setLoading(true);
  
    if (!transactionId) {
      Alert.alert("Error", "Transaction ID is missing.");
      console.error("🚨 Missing required transaction ID");
      setLoading(false);
      return;
    }
  
    if (!squadApiSecret || !squadApiSecret.startsWith("sandbox_sk_")) {
      Alert.alert("Error", "Invalid API secret key.");
      console.error("🚨 Invalid API secret key");
      setLoading(false);
      return;
    }
  
    const requestData = {
      email: email,
      amount: exchangeAmount * 100,  
      currency: exchangeCurCode,
      transaction_ref: transactionId,
      callback_url: "https://imorapidtransfer.com/api/v1/deposit/squad/payment_processing",
      initiate_type: "inline",
      payment_channels: ["card", "ussd"],  
    };
  
    console.log("🔹 Initiating Payment with Data:", requestData);
  
    try {
      const response = await axios.post(
        "https://sandbox-api-d.squadco.com/transaction/initiate",
        requestData,
        {
          headers: {
            Authorization: `Bearer ${squadApiSecret}`, 
            "Public-Key": squadApiPKey, 
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log("✅ API Response:", response.data);
  
      if (response.data?.data?.checkout_url && !paymentUrl) {
        setPaymentUrl(response.data.data.checkout_url);
      } else {
        console.warn("⚠️ Checkout URL not found in response:", response.data);
        Alert.alert("Payment Error", "Failed to initiate payment. No checkout URL returned.");
      }
    } catch (error) {
      console.error("❌ Payment initiation error:", error);
  
      if (error.response) {
        console.error("🔻 Error Response Data:", error.response.data);
        console.error("🔻 HTTP Status Code:", error.response.status);
        console.error("🔻 Headers:", error.response.headers);
  
        if (error.response.status === 403 && error.response?.data?.message === "Authentication failed") {
          Alert.alert("Something went wrong", "Authentication failed. Please try again.");
        } else {
          Alert.alert("Error", error.response?.data?.message || "Payment service error.");
        }
      } else {
        Alert.alert("Error", "Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);  
    }
  };
  

  const validateTransaction = async (transactionRef) => {
      setLoading(true);
      try {
           
          const { token, token_expiration, user_id } = await validateToken();
          
          console.log("📡 Request URL:", `https://imorapidtransfer.com/api/v1/deposit/squad/validate-transaction/${transactionRef}`);
          console.log("📝 Request Params:", {
              user_id,
              exchangeAmount,
              exchangeCurCode,
              email,
              phone,
              first_name,
              last_name,
              transInfo,
              exchange_rate,
              transactionId: transactionRef,
          });
          console.log("🔑 Request Headers:", {
              "Content-Type": "application/json",
              token,
              token_expiration,
          });
   
          const validationResponse = await axios.get(
              `https://imorapidtransfer.com/api/v1/deposit/squad/validate-transaction/${transactionRef}`,
              {
                  params: {   
                      user_id,
                      exchangeAmount,
                      exchangeCurCode,
                      email,
                      phone,
                      first_name,
                      last_name,
                      transInfo,
                      exchange_rate,
                      transactionId: transactionRef,  
                  },
                  headers: {
                      "Content-Type": "application/json",
                      token,
                      token_expiration,
                  }
              }
          );
         
          console.log("🔍 Validation Response:", validationResponse.data);
          
          if (validationResponse.data.status === "success") {
              navigation.navigate("PaymentStatus", { status: "successful", transactionRef });
          } else if (validationResponse.data.status === "pending") {
              Alert.alert("Transaction Pending", "Your payment is still being processed.");
              navigation.navigate("PaymentStatus", { status: "pending", transactionRef });
          } else {
              navigation.navigate("PaymentStatus", { status: "failed", transactionRef });
          }     
      } catch (error) {
          console.error("❌ Transaction Validation Error:", error);
          Alert.alert("Error", "Could not validate transaction. Please try again later.");
          navigation.navigate("PaymentStatus", { status: "failed", transactionRef });
      } finally {
          setLoading(false);
      }
  };
  
  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#E3E3E3" }}>j
      {loading && (
        <Modal transparent={true} animationType="fade" visible={loading}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 10, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={{ marginTop: 20, fontSize: 16, fontWeight: "bold" }}>Processing Your Deposit</Text>
          </View>
        </View>
      </Modal>      
      )}

      {paymentUrl ? (
    
    <WebView
    source={{ uri: paymentUrl }}
    style={{ flex: 1 }}   
    containerStyle={{ width: "100%", height: "100%" }}  
    onLoadStart={() => setLoading(true)}
    onLoadEnd={() => setLoading(false)}
    onNavigationStateChange={(navState) => {
      console.log("🔹 WebView Navigation URL:", navState.url);
  
      if (navState.url.includes("payment_processing")) {
        const urlParams = new URLSearchParams(navState.url.split("?")[1]);
        const transactionRef = urlParams.get("reference");
  
        if (transactionRef) {
          validateTransaction(transactionRef);  
        }
      } else if (navState.url.includes("failed")) {
        Alert.alert("Payment Failed", "There was an issue processing the payment.");
        navigation.navigate("PaymentStatus", { status: "failed" });
      }
    }}
  />
  
     
      ) : (
        <>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>Payment Details</Text>
         
           {exchangeCurCode !== transInfo.currCode && (
                             <View style={{ padding: 10, backgroundColor: "#e3f2fd", borderRadius: 5, marginVertical: 10 }}>
                               <Text>You will be debited in {exchangeCurCode}</Text>
                                  <Text style={styles.amountText}>{exchangeCurCode} {exchangeAmount}</Text>
                               <Text style={styles.rateText}>
                                  At the rate of {transInfo.currencyCode} {exchange_rate} = {transInfo.currCode} 1 {exchangeCurCode}
                                         </Text>
                             </View>
                           )}
               
                           <View style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 10 }}>
                             <Text>Deposit Amount</Text>
                             <Text style={{ fontWeight: "bold" }}>{transInfo.currSymbol} {transInfo.amount}</Text>
                           </View>
               
                           <View style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 10 }}>
                             <Text>Fee</Text>
                             <Text style={{ fontWeight: "bold" }}>: {transInfo.currencyCode} {transInfo.fees || "0.00"}</Text>
                           </View>
               
                           <View style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 10, borderTopWidth: 1, paddingTop: 10 }}>
                             <Text style={{ fontWeight: "bold" }}>Total</Text>
                             <Text style={{ fontWeight: "bold" }}>: {transInfo.currencyCode} {transInfo.totalAmount || "0.00"}</Text>
                           </View>




                           <TouchableOpacity
                      onPress={handlePayment}
                      style={styles.confirmButton} 
                      disabled={loading}
                    >
                      {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>Confirm</Text>}
                    </TouchableOpacity>

        </>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  amountText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  rateText: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
  },
  confirmButton: {
    backgroundColor: "#006400",  
    paddingVertical: 14,        
    paddingHorizontal: 24,   
    borderRadius: 25,         
    marginTop: 20,    
    justifyContent: "center",  
    alignItems: "center",      
    opacity: 0.8,              
    width: '50%',  
    alignSelf: "center",  
  },
});

export default SquadCoPaymentScreen;

 
