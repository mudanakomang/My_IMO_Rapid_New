import React, { useState } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  Alert,
  TextInput,
  Button,
  Text,
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { argonTheme } from "../../constants";
import { IMO_Api } from "../constants/API";

const { width } = Dimensions.get("screen");

const OTPVerification = ({ route }) => {
  const { phoneNumber, onOtpVerified } = route.params;
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const verifyOtp = () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP");
      return;
    }

    setLoading(true);
    fetch(`${IMO_Api}/verify/registrationcode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone_number: phoneNumber, otp }),
    })
      .then((response) => response.json())
      .then((res) => {
        if (res.success) {
          Alert.alert("Success", "OTP Verified");
          onOtpVerified(); // Notify the parent screen that OTP is verified
          navigation.navigate("RegisterFinal", { phoneNumber });
        } else {
          Alert.alert("Error", "Invalid OTP");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        Alert.alert("Error", "Network error. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        keyboardType="numeric"
        value={otp}
        onChangeText={setOtp}
      />
      <Button title="Verify OTP" onPress={verifyOtp} />
      {loading && <Text>Loading...</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  input: {
    width: width * 0.8,
    borderColor: argonTheme.COLORS.BORDER,
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
});

export default OTPVerification;
