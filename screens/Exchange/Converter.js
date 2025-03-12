
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import tokenValidation from "../../components/validateToken";

const SearchableDropdown = ({ data, selectedValue, onSelect, placeholder }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = data.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setIsVisible(true)}
      >
        <Text>
          {selectedValue
            ? data.find((item) => item.value === selectedValue)?.label
            : placeholder}
        </Text>
      </TouchableOpacity>
      <Modal visible={isVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setIsVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.input}
            placeholder="Search..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.value.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => {
                  onSelect(item.value);
                  setIsVisible(false);
                }}
              >
                <Text>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
};
const Converter = ({ navigation }) => {
  const [wallets, setWallets] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [amount, setAmount] = useState("");
  const [exchangeDetails, setExchangeDetails] = useState(null);
  const [fetchingData, setFetchingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);


useFocusEffect(
  useCallback(() => {
    navigation.setOptions({ title: "Currency Exchange" });
    fetchWalletsAndCurrencies();
  }, [navigation, fetchWalletsAndCurrencies])
);

  const fetchWalletsAndCurrencies = useCallback(async () => {
    try {
      setFetchingData(true);

      const { token, token_expiration, user_id } = await tokenValidation();

      if (!user_id) {
        Alert.alert("Session Expired", "Please log in again.");
        return;
      }

      const walletsResponse = await axios.get(
        `https://imorapidtransfer.com/api/v1/converter/transactional/balance/${user_id}`,
        {
          headers: { token, token_expiration },
        }
      );

      const fetchedWallets = walletsResponse.data.data || [];
      setWallets(
        fetchedWallets.map((w) => ({
          label: `${w.currency?.name} (${w.currency?.code})`,
          value: w.id,
          currencyId: w.currency?.id,
          currencyCode: w.currency?.code,
        }))
      );

      const currenciesResponse = await axios.get(
        `https://imorapidtransfer.com/api/v1/exchange/get-currencies/converting-to/currency`,
        {
          headers: { token, token_expiration },
        }
      );

      const fetchedCurrencies = currenciesResponse.data.currencies || [];
      setCurrencies(
        fetchedCurrencies.map((c) => ({
          label: `${c.name} (${c.code})`,
          value: c.id,
          currencyId: c.id,
          currencyCode: c.code,
        }))
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Could not load data. Please try again later.");
    } finally {
      setFetchingData(false);
      setRefreshing(false);
    }
  }, []);

  const filteredCurrencies = selectedWallet
    ? currencies.filter(
        (c) =>
          c.currencyId !==
          wallets.find((w) => w.value === selectedWallet)?.currencyId
      )
    : currencies;

  const handleConvert = async () => {
    if (!selectedWallet || !selectedCurrency || !amount) {
      Alert.alert("Error", "Please select all fields and input an amount.");
      return;
    }

    try {
      setIsConverting(true);  
      const { token, token_expiration } = await tokenValidation();
      const selectedWalletData = wallets.find((w) => w.value === selectedWallet);
      const selectedCurrencyData = currencies.find((c) => c.value === selectedCurrency);

      const payload = {
        wallet_id: selectedWallet,
        currency_id: selectedCurrency,
        amount,
        wallet_currency_id: selectedWalletData.currencyId,
        wallet_currency_code: selectedWalletData.currencyCode,
        target_currency_id: selectedCurrencyData.currencyId,
        target_currency_code: selectedCurrencyData.currencyCode,
      };

      const response = await axios.post(
        `https://imorapidtransfer.com/api/v1/exchange/get_exchange_rate`,
        payload,
        {
          headers: { token, token_expiration },
        }
      );

      const data = response.data;

      if (!data.status) {
        Alert.alert("Error", "Invalid exchange rate response.");
        return;
      }

      setExchangeDetails({
        exchangeValue: data.exchange_value,
        rateHtml: data.destinationCurrencyRateHtml,
        fromCurrency: `${selectedWalletData.currencyCode} 1`,
        toCurrency: `${data.destinationCurrencyCode}`,
      });
    } catch (error) {
      console.error("Error converting currency:", error);
      Alert.alert("Error", "Failed to fetch exchange rate. Please try again later.");
    } finally {
      setIsConverting(false);  
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setSelectedWallet("");
    setSelectedCurrency("");
    setAmount("");
    setExchangeDetails(null);
    fetchWalletsAndCurrencies();
  };

  useFocusEffect(
    useCallback(() => {
     
      fetchWalletsAndCurrencies();
    }, [fetchWalletsAndCurrencies])
  );

  if (fetchingData) {
    return <ActivityIndicator size="large" color="#006400" />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.heading}>Select Wallet</Text>
      <SearchableDropdown
        data={wallets}
        selectedValue={selectedWallet}
        onSelect={setSelectedWallet}
        placeholder="Select Wallet"
      />

      <Text style={styles.heading}>Select Currency</Text>
      <SearchableDropdown
        data={filteredCurrencies}
        selectedValue={selectedCurrency}
        onSelect={setSelectedCurrency}
        placeholder="Select Currency"
      />
      <Text style={styles.heading}>Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleConvert}
        disabled={isConverting}  
      >
        {isConverting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Convert</Text>
        )}
      </TouchableOpacity>

      {exchangeDetails && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>
            You will get: {exchangeDetails.exchangeValue}
          </Text>
          <Text style={styles.resultText}>
            Exchange rate from {exchangeDetails.fromCurrency} to {exchangeDetails.toCurrency}: {exchangeDetails.rateHtml}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#E3E3E3" },
  heading: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  picker: { height: 50, backgroundColor: "#fff", borderRadius: 8, marginBottom: 16, justifyContent: "center", paddingHorizontal: 12 },
  input: { height: 50, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, backgroundColor: "#fff" },
  button: { backgroundColor: "#006400", paddingVertical: 12, borderRadius: 25, alignSelf: "center", marginTop: 16, width: "50%", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16 },
  resultContainer: { marginTop: 16, padding: 16, backgroundColor: "#e0ffe0", borderRadius: 8 },
  resultText: { fontSize: 16, color: "#006400" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalContainer: { marginTop: "50%", marginHorizontal: 20, backgroundColor: "#fff", borderRadius: 8, padding: 16 },
  listItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#ccc" },
});

export default Converter;