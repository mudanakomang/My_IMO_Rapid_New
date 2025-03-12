import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tokenValidation from "../../components/validateToken";
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get("screen");

const Transaction = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

 
  const getUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsedData = JSON.parse(data);
        setUserData(parsedData);
        setTransactions(parsedData.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert("Error", "Failed to retrieve user data.");
    }
  };

  
  const fetchTransactions = useCallback(async () => {
    if (!userData) return;

    setLoading(true);
    try {
      const validatedToken = await tokenValidation();

      if (validatedToken.token) {
        const transactionResponse = await axios.get(
          "https://imorapidtransfer.com/api/v1/transaction/all",
          {
            headers: {
              token: validatedToken.token,
              token_expiration: validatedToken.token_expiration,
            },
            params: {
              user_id: userData.user_id,
              filter: selectedFilter,
              start_date: startDate,
              end_date: endDate,
            },
          }
        );

        
        setTransactions(transactionResponse.data.transactions || []);

         
        await AsyncStorage.setItem(
          'userData',
          JSON.stringify({ ...userData, transactions: transactionResponse.data.transactions })
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to retrieve data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userData, selectedFilter, startDate, endDate]);

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);
   
   useEffect(() => {
    getUserData();
  }, []);

   const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

   const onDateChange = (event, selectedDate, type) => {
    if (type === "start") {
      setShowStartPicker(false);
      setStartDate(selectedDate || startDate);
    } else {
      setShowEndPicker(false);
      setEndDate(selectedDate || endDate);
    }
  };

   if (loading && !transactions.length) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

   const renderTransaction = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("TransactionDetails", {
          transactionId: item.id,
          transactions: transactions,
        })
      }
      style={styles.transactionRow}
    >
      <View style={styles.transactionDetails}>
        <Text style={styles.tableCell}>{item.uuid}</Text>
        <Text style={styles.tableCell}>{item.currency_code}{item.total}</Text>
        <Text style={styles.tableCell}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterContainer}>
        <RNPickerSelect
          onValueChange={(value) => {
            setSelectedFilter(value);
            fetchTransactions();  
          }}
          items={[
            { label: "All", value: "all" },
            { label: "Pending", value: "pending" },
            { label: "Completed", value: "completed" },
            { label: "Failed", value: "failed" },
          ]}
          style={pickerSelectStyles}
          value={selectedFilter}
        />
        <TouchableOpacity onPress={() => setShowStartPicker(true)}>
          <Text style={styles.dateText}>
            Start Date: {startDate?.toLocaleDateString() || "Select"}
          </Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => onDateChange(event, date, "start")}
          />
        )}
        <TouchableOpacity onPress={() => setShowEndPicker(true)}>
          <Text style={styles.dateText}>
            End Date: {endDate?.toLocaleDateString() || "Select"}
          </Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => onDateChange(event, date, "end")}
          />
        )}
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderCell}>Transaction ID</Text>
        <Text style={styles.tableHeaderCell}>Amount</Text>
        <Text style={styles.tableHeaderCell}>Status</Text>
      </View>

      <FlatList
        data={transactions.slice(0, 15)}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id.toString()}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.submitButton}
            onPress={fetchTransactions}  
          >
            <Text style={styles.buttonText}>View All Transactions</Text>
          </TouchableOpacity>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    color: 'black',
    fontSize: 16,
    width: '100%',
    marginBottom: 10,
  },
  inputAndroid: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    color: 'black',
    fontSize: 16,
    width: '100%',
    marginBottom: 10,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3E3E3',
  },
  filterContainer: {
    padding: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f1f1",
    paddingVertical: 10,
    justifyContent: "space-between",
  },
  tableHeaderCell: {
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  transactionRow: {
    marginBottom: 10,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  transactionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tableCell: {
    flex: 1,
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: "#006400",
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: "center",
    marginTop: 16,
    width: "50%",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  dateText: {
    fontSize: 16,
    marginVertical: 10,
    color: "black",
  },
});

export default Transaction;
