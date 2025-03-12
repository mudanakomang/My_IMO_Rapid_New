import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  RefreshControl,
  Modal,
  FlatList
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tokenValidation from "../../components/validateToken";
import PinCodeCheck from "../../components/PinVerificationModal";
import { Picker } from "@react-native-picker/picker";

const RequestMoney = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [editableName, setEditableName] = useState(true);
  const [currency, setCurrency] = useState(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [minAmount, setMinAmount] = useState(null);
  const [maxAmount, setMaxAmount] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchCurrencies = useCallback(async () => {
    const userData = await AsyncStorage.getItem("userData");
    const parsedData = JSON.parse(userData);
    const { token, token_expiration, user_id } = parsedData;

    try {
      const response = await fetch(
        "https://imorapidtransfer.com/api/v1/get-wallet-currencies",
        {
          method: "POST",
          headers: {
            token: token,
            token_expiration: token_expiration,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user_id,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setCurrencies(data.data);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch currencies.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch currencies.");
    }
  }, []);
 
  useEffect(() => {
    navigation.setOptions({ title: 'Request Money' });
    fetchCurrencies();
  }, [fetchCurrencies]);

  useEffect(() => {
    if (currency) {
      fetchFeeLimits();
    }
  }, [currency]);
  const fetchFeeLimits = async () => {
    setIsLoading(true);
    const userData = await AsyncStorage.getItem("userData");
    const parsedData = JSON.parse(userData);
    const { token, token_expiration, user_id } = parsedData;  
  
    try {
      const selectedCurrency = currencies.find(
        (item) => item.currency_id === currency.currency_id
      );
  
      if (!selectedCurrency) {
        Alert.alert("Error", "Invalid currency selected.");
        setIsLoading(false);
        return;
      }
  
      const response = await fetch(
        "https://imorapidtransfer.com/api/v1/fee-limit-check",
        {
          method: "POST",
          headers: {
            token: token,  
            token_expiration: token_expiration,  
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id,  
            currency_id: selectedCurrency.currency_id,
            transaction_type_id: 10,
          }),
        }
      );
  
      const data = await response.json();
  
      if (response.ok) {
        setMinAmount(data.data.min_limit);
        setMaxAmount(data.data.max_limit);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch fee limits.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while fetching fee limits.");
    } finally {
      setIsLoading(false);
    }
  };
  

  const validateEmail = async () => {
    setIsLoading(true);
    const { token, token_expiration } = await tokenValidation();

    try {
      const response = await fetch(
        "https://imorapidtransfer.com/api/v1/validate-email",
        {
          method: "POST",
          headers: {
            token: token,
            token_expiration: token_expiration,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setName(`${data.first_name} ${data.last_name}`);
        setEditableName(false);
      } else {
        setName("");
        setEditableName(true);
        Alert.alert("Error", data.message || "Email not found.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to validate email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestMoney = async () => {
    if (!currency) {
      Alert.alert("Error", "Please select a currency.");
      return;
    }
  
    if (amount < minAmount) {
      Alert.alert("Error", `Amount cannot be less than ${minAmount}.`);
      return;
    }
  
    if (maxAmount && amount > maxAmount) {
      Alert.alert("Error", `Amount cannot exceed ${maxAmount}.`);
      return;
    }
  
    const { token, token_expiration, user_id } = await tokenValidation();
  
    if (new Date(token_expiration) < new Date()) {
      Alert.alert("Error", "Session has expired. Please log in again.");
      return;
    }
  
    const requestDetails = {
      email,
      name,
      currency_id: currency.currency_id,
      amount,
      description,
      user_id,
    };
  
    Alert.alert(
      "Confirm Request",
      `Email: ${email}\nName: ${name}\nCurrency: ${currency.name}\nAmount: ${amount}\nDescription: ${description}`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Okay",
          onPress: async () => {
            try {
              setIsLoading(true);
  
              const response = await fetch(
                "https://imorapidtransfer.com/api/v1/request-money",
                {
                  method: "POST",
                  headers: {
                    token,
                    token_expiration,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(requestDetails),
                }
              );
  
              const data = await response.json();
              setIsLoading(false);
  
              if (response.ok) {
                await AsyncStorage.setItem(
                  "userData",
                  JSON.stringify({
                    ...JSON.parse(await AsyncStorage.getItem("userData")),
                    MyAccount: data.MyAccount,
                    transactions: data.transactions,
                  })
                );
  
                Alert.alert("Success", "Request sent successfully", [
                  {
                    text: "Request Again",
                    onPress: () => {},
                  },
                  {
                    text: "Go Back",
                    onPress: () => navigation.goBack(),
                  },
                ]);
              } else {
                Alert.alert("Error", data.message || "Failed to send request.");
              }
            } catch (error) {
              setIsLoading(false);
              Alert.alert("Error", "Failed to send request.");
            }
          },
        },
      ]
    );
  };
  
  

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchCurrencies();
    setIsRefreshing(false);
  }, [fetchCurrencies]);

  const filteredCurrencies = currencies.filter(currency =>
    currency.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#006400" />
          </View>
        )}

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          onBlur={validateEmail}
          placeholder="Enter email"
        />

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          editable={editableName}
          placeholder="Enter name"
        />

        <Text style={styles.label}>Currency</Text>
        <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.formInput}>
          <Text>{currency ? currency.name : "Select Currency"}</Text>
        </TouchableOpacity>

        {/* Currency Search Modal */}
        <Modal visible={isModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search currencies"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <FlatList
                data={filteredCurrencies}
                keyExtractor={(item) => item.currency_id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setCurrency(item);
                      setIsModalVisible(false);
                    }}
                  >
                    <Text style={styles.currencyItem}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="Enter amount"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter description"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleRequestMoney}
        >
          <Text style={styles.buttonText}>Request Money</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
  },
  label: { fontSize: 16, marginBottom: 5 },
  button: {
    backgroundColor: "#006400",
    padding: 15,
    alignItems: "center",
    marginTop: 16,
    width: '50%',
    borderRadius: 25,
    alignSelf: 'center',
    paddingVertical: 12,
  },
  buttonText: { color: "#fff", fontSize: 16 },
  formInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
  },
  currencyItem: {
    padding: 10,
    fontSize: 16,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
});

export default RequestMoney;
