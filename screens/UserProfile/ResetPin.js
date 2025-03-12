import React, { useState , useEffect} from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  ActivityIndicator 
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import tokenValidation from "../../components/validateToken";

const ResetPinSchema = Yup.object().shape({
  code: Yup.string()
    .required("This field is required.")
    .matches(/^\d{6}$/, "Please enter a valid 6-digit code."),
  pincode: Yup.string()
    .required("This field is required.")
    .matches(/^\d{4}$/, "Please enter a valid 4-digit pincode."),
  confirm_pincode: Yup.string()
    .required("This field is required.")
    .matches(/^\d{4}$/, "Please enter a valid 4-digit pincode.")
    .oneOf([Yup.ref("pincode"), null], "Pin codes must match."),
});
useEffect(() => {
  navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

  return () => {
      navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
  };
}, [navigation]);

const ResetPin = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);

   const handleResetPin = () => {
    Alert.alert(
      "Reset PIN",
      "Are you sure you want to reset your PIN?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        { text: "Yes", onPress: () => initiatePinReset() },
      ],
      { cancelable: false }
    );
  };

   const initiatePinReset = async () => {
    try {
      const { token, token_expiration } = await tokenValidation();

       setOtpModalVisible(true);

     

    } catch (error) {
      console.error("Error in token validation", error);
    }
  };

   
  const handleSubmit = async (values, { setSubmitting }) => {
    const { token, token_expiration } = await tokenValidation();
    const params = {
      code: values.code,
      pincode: values.pincode,
      confirm_pincode: values.confirm_pincode,
    };

    try {
      const response = await axios.post("https://imorapidtransfer.com/api/v1/reset-pin", params, {
        headers: {
          token: token,
          token_expiration: token_expiration,
        },
      });

      if (response.data.success) {
        Alert.alert("Success", "PIN reset successfully.");
        navigation.navigate("HomeScreen");
      } else {
        Alert.alert("Error", "Failed to reset PIN.");
      }
    } catch (error) {
      console.error("Error resetting PIN:", error);
      if (error.response && error.response.status === 401) {
        Alert.alert("Session Expired", "Please log in again.");
        navigation.navigate("LoginForm");
      } else {
        Alert.alert("Error", "An error occurred while resetting the PIN.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      
      <TouchableOpacity style={styles.button} onPress={handleResetPin}>
        <Text style={styles.buttonText}>Reset PIN</Text>
      </TouchableOpacity>

       
      <Modal
        animationType="slide"
        transparent={true}
        visible={otpModalVisible}
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Formik
            initialValues={{ code: "" }}
            validationSchema={Yup.object().shape({
              code: Yup.string().required("OTP is required").matches(/^\d{6}$/, "Invalid OTP"),
            })}
            onSubmit={handleSubmit}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View style={styles.modalContent}>
                <TextInput
                  style={styles.input}
                  onChangeText={handleChange("code")}
                  onBlur={handleBlur("code")}
                  value={values.code}
                  placeholder="Enter OTP"
                  keyboardType="numeric"
                  maxLength={6}
                />
                {touched.code && errors.code && <Text style={styles.error}>{errors.code}</Text>}

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitText}>Submit OTP</Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        </View>
      </Modal>

      
      <Modal
        animationType="slide"
        transparent={true}
        visible={pinModalVisible}
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Formik
            initialValues={{ pincode: "", confirm_pincode: "" }}
            validationSchema={ResetPinSchema}
            onSubmit={handleSubmit}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View style={styles.modalContent}>
                <TextInput
                  style={styles.input}
                  onChangeText={handleChange("pincode")}
                  onBlur={handleBlur("pincode")}
                  value={values.pincode}
                  placeholder="New PIN"
                  secureTextEntry
                  maxLength={4}
                />
                {touched.pincode && errors.pincode && <Text style={styles.error}>{errors.pincode}</Text>}

                <TextInput
                  style={styles.input}
                  onChangeText={handleChange("confirm_pincode")}
                  onBlur={handleBlur("confirm_pincode")}
                  value={values.confirm_pincode}
                  placeholder="Confirm PIN"
                  secureTextEntry
                  maxLength={4}
                />
                {touched.confirm_pincode && errors.confirm_pincode && (
                  <Text style={styles.error}>{errors.confirm_pincode}</Text>
                )}

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitText}>Submit New PIN</Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        </View>
      </Modal>

      {/* Loading Spinner */}
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#E3E3E3',
  },
  button: {
    backgroundColor: "#006400",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  modalView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 5,
    alignItems: "center",
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  submitButton: {
    backgroundColor: "#006400",
    padding: 10,
    borderRadius: 5,
  },
  submitText: {
    color: "#fff",
  },
  error: {
    color: "red",
    fontSize: 12,
  },
});

export default ResetPin;
