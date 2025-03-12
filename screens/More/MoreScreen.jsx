import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert, Modal, Button, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tokenValidation from '../../components/validateToken';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import PinVerificationModal from '../../components/PinVerificationModal';
import { Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';


const ResetPinModal = ({ isVisible, onClose, onSubmit }) => {
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleSubmit = () => {
    if (newPin !== confirmPin) {
      Alert.alert('Error', 'The new PIN and confirm PIN do not match.');
      return;
    }

    if (!otp || !newPin || !confirmPin) {
      Alert.alert('Error', 'Please fill in all the fields.');
      return;
    }

    onSubmit(otp, newPin); 
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Reset Your PIN</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            value={otp}
            onChangeText={(text) => {
              if (text.length <= 6) {  
                setOtp(text);
              }
            }}
            maxLength={6}  
          />

          <TextInput
            style={styles.input}
            placeholder="Enter New PIN"
            value={newPin}
            onChangeText={setNewPin}
            secureTextEntry
            maxLength={4}  
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm New PIN"
            value={confirmPin}
            onChangeText={setConfirmPin}
            secureTextEntry
            maxLength={4} 
          />

          <View style={styles.buttonContainer}>
            <Button title="Submit" onPress={handleSubmit} color="#006400" />
            <Button title="Cancel" onPress={onClose} color="red" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const OptionSet = ({ iconName, title, onPress, navigateTo }) => {
  const validIcons = [
    "lock-closed", "people-circle", "cash-outline", "business", "information-circle-outline", "person-add", "exit", "ios-send"
  ];

  const iconColor = "#C6F801";
  const iconSize = 26;

  const iconToRender = validIcons.includes(iconName) ? iconName : "ios-alert"; 

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(navigateTo)}>
      <View style={styles.optionSet}>
        <View>
          <Ionicons name={iconToRender} style={{ opacity: 0.8 }} size={iconSize} color={iconColor} />
        </View>
        <Text style={{ color: 'black', opacity: 0.7, marginRight: 'auto', marginLeft: 40, fontSize: 15 }}>
          {title}
        </Text>
        <Ionicons name="arrow-forward" size={24} color="#585858" />
      </View>
    </TouchableOpacity>
  );
};

const MoreScreen = ({ navigation }) => {
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);   
  const [isResetPinModalVisible, setIsResetPinModalVisible] = useState(false);   
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'More', // Set screen title
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={30} color="white" style={{ marginLeft: 15 }} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  const handleResetPinRequest = async () => {
    try {
      console.log("Requesting OTP for PIN reset...");
      const { token, token_expiration, user_id } = await tokenValidation();

      const response = await fetch('https://imorapidtransfer.com/api/v1/pin/reset/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: token,  
          token_expiration: token_expiration,
        },
        body: JSON.stringify({ user_id }),   
      });

      const result = await response.json();

      console.log("OTP response:", result);

      if (response.ok) {
        setIsResetPinModalVisible(true);
      } else {
        Alert.alert('Error', result.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting OTP:', error);
      Alert.alert('Error', 'An error occurred while requesting OTP. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        Alert.alert('Error', 'User data not found. Please log in again.');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth', params: { screen: 'Login' } }],
        });
        return;
      }

      const { user_id, token, token_expiration } = JSON.parse(userData);

      const response = await fetch('https://imorapidtransfer.com/api/v1/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: token,  
          token_expiration: token_expiration,
        },
        body: JSON.stringify({ user_id }),  
      });

      const result = await response.json();

      if (response.ok) {
        await AsyncStorage.clear();

        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth', params: { screen: 'Login' } }],
        });
      } else {
        Alert.alert('Error', result.message || 'Failed to log out.');
      }
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('Error', 'An error occurred while logging out. Please try again.');
    }
  };
   
  

  const handlePress = (screen) => {
    console.log(`Pressed: ${screen}`);
    if (screen === 'NearestOffices') {
      Linking.openURL('https://imorapidtransfer.com/service-locations');   
    } else if (screen === 'ResetPin'){
    // if (screen === 'ResetPin') {
      handleResetPinRequest();   
    } else if (screen === 'Logout') {
      Alert.alert(
        'Logout',
        'Are you sure you want to log out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes', onPress: handleLogout },
        ]
      );
    } else if (screen === 'ChangePasswordModal') {
      console.log("Navigating to Change Password Modal...");
      setIsPinModalVisible(true); 
    } else if (screen) {
      navigation.navigate(screen);
    }
  };

  const handlePinVerified = () => {
    console.log("PIN Verified, closing PIN modal...");
    setIsPinModalVisible(false);
 
    setTimeout(() => {
      console.log("Opening Password Modal...");
      setIsPasswordModalVisible(true);  
    }, 200);
  };

  const handleResetPin = async (otp, newPin) => {
    console.log("Resetting PIN with OTP:", otp, "and new PIN:", newPin);
    try {
      const { token, token_expiration, user_id } = await tokenValidation();

      const response = await fetch('https://imorapidtransfer.com/api/v1/pin/reset/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: token,
          token_expiration: token_expiration,
        },
        body: JSON.stringify({
          otp,  
          new_pin: newPin,  
          user_id
        }),   
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Your PIN has been successfully reset.');
        navigation.goBack();
        setIsResetPinModalVisible(false); 
      } else {
        Alert.alert('Error', result.message || 'Failed to change PIN.');
      }
    } catch (error) {
      console.error('Error changing PIN:', error);
      Alert.alert('Error', 'An error occurred while changing the PIN. Please try again.');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: '#D7D7D7' }]}>
      <ScrollView>
        <View>
          <OptionSet iconName="people-circle" title="Activities" onPress={handlePress} navigateTo="Transaction" />
          <OptionSet iconName="lock-closed" title="Settings" onPress={handlePress} navigateTo="Userdetails" />
          <OptionSet iconName="business" title="Find our Nearest Offices" onPress={handlePress} navigateTo="NearestOffices" />
          <OptionSet iconName="information-circle-outline" title="Tickets" onPress={handlePress} navigateTo="TicketScreen" /> 
          <OptionSet iconName="person-add" title="Invite Friends" onPress={handlePress} navigateTo="ReferScreen" />
          <OptionSet iconName="cash-outline" title="Reset PIN" onPress={handlePress} navigateTo="ResetPin" />
          <OptionSet iconName="lock-closed" title="Change Password" onPress={handlePress} navigateTo="ChangePassword" />
          <OptionSet iconName="exit" title="Logout" onPress={handlePress} navigateTo="Logout" />
        </View>
      </ScrollView>

      <PinVerificationModal
        isVisible={isPinModalVisible}
        onClose={() => setIsPinModalVisible(false)}
        onVerified={handlePinVerified}
      />

      <ResetPinModal
        isVisible={isResetPinModalVisible}
        onClose={() => setIsResetPinModalVisible(false)}
        onSubmit={handleResetPin}
      />

      <ChangePasswordModal
        isVisible={isPasswordModalVisible}
        onClose={() => setIsPasswordModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 20,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  optionSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#4848484d',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
});

export default MoreScreen;

