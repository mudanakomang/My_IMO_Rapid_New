import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, SafeAreaView, ActivityIndicator, Alert, Button, Image } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';  

const TransactionDetails = ({ route, navigation }) => {
  const { transactionId, transactions } = route.params;
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");  

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);

  useEffect(() => {
    navigation.setOptions({ title: 'Transaction Detail' });
    const fetchTransactionDetails = async () => {
      setLoading(true);
      try {
        const transaction = transactions.find(
          (item) => item.id === transactionId
        );

        if (transaction) {
          setTransactionDetails(transaction);
        } else {
          Alert.alert("Error", "Transaction not found.");
        }

        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          const fullName = `${userData.first_name} ${userData.last_name}`;
          setUserName(fullName);
        }
      } catch (error) {
        console.error("Error fetching transaction details:", error);
        Alert.alert("Error", "Failed to retrieve transaction details.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [transactionId, transactions]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  if (!transactionDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>No transaction details available.</Text>
      </SafeAreaView>
    );
  }

  const {
    uuid,
    currency_code,
    total,
    end_user_id,
    created_at,
    email,
    note,
    percentage,
    charge_percentage,
    charge_fixed,
    transaction_type_name,
    status,
  } = transactionDetails;

  const fees = (percentage || 0) + (charge_percentage || 0) + (charge_fixed || 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/splash.jpeg')}
          style={styles.logo}
        />
        <Text style={styles.headerText}>IMO Rapid Transfer</Text>
      </View>

      <View style={styles.detailContainer}>
        
        {userName && (
          <View style={styles.row}>
            <Text style={styles.detailText}>Account Holder: {userName}</Text>
          </View>
        )}

        {uuid && (
          <View style={styles.row}>
            <Text style={styles.detailText}>Reference: {uuid}</Text>
          </View>
        )}

        {currency_code && (
          <View style={styles.row}>
            <Text style={styles.detailText}>Currency: {currency_code}</Text>
          </View>
        )}

        {total && (
          <View style={styles.row}>
            <Text style={styles.detailText}>Amount: {total}</Text>
          </View>
        )}

        {end_user_id && (
          <View style={styles.row}>
            <Text style={styles.detailText}>User: {end_user_id}</Text>
          </View>
        )}

        {created_at && (
          <View style={styles.row}>
            <Text style={styles.detailText}>Date: {new Date(created_at).toLocaleDateString()}</Text>
          </View>
        )}

        {email && (
          <View style={styles.row}>
            <Text style={styles.detailText}>Email: {email}</Text>
          </View>
        )}

        {note && (
          <View style={styles.row}>
            <Text style={styles.detailText}>Description: {note}</Text>
          </View>
        )}

        {/* Fees */}
        {fees > 0 && (
          <View style={styles.row}>
            <Text style={styles.detailText}>Fees: {fees.toFixed(2)}</Text>
          </View>
        )}

        {transaction_type_name && (
          <View style={styles.row}>
            <Text style={styles.detailText}>Transaction Type: {transaction_type_name}</Text>
          </View>
        )}

        <View style={styles.row}>
          <Button
            title={status || "Unknown"}
            color={status === "success" ? "green" : "red"}
            onPress={() => Alert.alert(`Transaction Status: ${status}`)}
          />
        </View>
      </View>

      {status === "success" && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You have successfully completed your transaction, and the beneficiary will be credited instantly. Enjoy an improved quality of life with our revolutionary cross-border payment system.
          </Text>
          <Text style={styles.footerText}>
            For any assistance, please contact us at support@imorapidtransfer.com.
          </Text>
          <Text style={styles.footerText}>
            Powered by IMO Rapid Transfer (www.imorapidtransfer.com)
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3E3E3',
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "center",
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  detailContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  row: {
    flexDirection: "column",
    justifyContent: "flex-start",
    marginVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: "#333",
    marginVertical: 5,
  },
  footer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  footerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#333",
  },
});

export default TransactionDetails;
