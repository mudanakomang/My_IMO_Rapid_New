import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const PinVerify = ({ route }) => {
  const [pin, setPin] = useState('');
  const [isFingerprintSupported, setIsFingerprintSupported] = useState(false);
  const navigation = useNavigation();

  const { onSuccess, onFailed } = route.params || {};
  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Authorization',
      headerLeft: () => null,
    });
    const checkFingerprintSupport = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsFingerprintSupported(compatible);
      
    };
    checkFingerprintSupport();
  }, []);

  const handlePinChange = async (text) => {
    if (text.length <= 4) {
      setPin(text);
    }
    if (text.length === 4) {
      await verifyPin(text);
    }
  };

  const verifyPin = async (enteredPin) => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const parsedUserData = JSON.parse(userData);

      if (enteredPin === parsedUserData.pin) {
        await AsyncStorage.setItem('savedPin', enteredPin);
        onSuccess && onSuccess();
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Incorrect PIN');
     
        onFailed && onFailed();
        navigation.goBack(); 
      }
    } catch (error) {
      console.error('Error retrieving user data from AsyncStorage:', error);
    
      onFailed && onFailed();
      navigation.goBack(); 
    }
  };

  const triggerFingerprintAuthentication = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate using your fingerprint',
      });

      if (result.success) {
        onSuccess && onSuccess();
        navigation.goBack(); 
      } else {
        Alert.alert('Error', 'Fingerprint authentication failed');
        onFailed && onFailed();
        navigation.goBack(); 
      }
    } catch (error) {
      console.error('Fingerprint authentication failed', error);
      onFailed && onFailed();
      navigation.goBack();  
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter your PIN</Text>
      <TextInput
        style={styles.pinInput}
        value={pin}
        onChangeText={handlePinChange}
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
      />
      {isFingerprintSupported && (
        <TouchableOpacity onPress={triggerFingerprintAuthentication} style={styles.fingerprintContainer}>
          <Ionicons name="finger-print" size={50} color="#006400" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3E3E3',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  pinInput: {
    height: 50,
    width: 250,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    textAlign: 'center',
    fontSize: 20,
    backgroundColor: '#FFFFFF',
  },
  fingerprintContainer: {
    marginTop: 20,
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PinVerify;
