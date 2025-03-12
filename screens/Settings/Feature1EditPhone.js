import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, FlatList, Modal } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Feature1EditPhone = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryCode, setCountryCode] = useState('');
  const [countryName, setCountryName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const getAuthHeaders = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const parsedUserData = JSON.parse(userData);
      return {
        token: parsedUserData.token,
        token_expiration: parsedUserData.token_expiration,
        user_id: parsedUserData.user_id,  
      };
    } catch (error) {
      console.error('Error retrieving user data from AsyncStorage', error);
      return null;
    }
  };

  const fetchCountries = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        Alert.alert('Error', error.response?.data?.message || 'Unable to fetch user authentication data.');
        setLoading(false);
        return;
      }
      const response = await axios.get('https://imorapidtransfer.com/api/v1/country-list', {
        headers: {
          token: headers.token,
          token_expiration: headers.token_expiration,
        },
      });
      if (response.data.status === 'success') {
        setCountries(response.data.countries);
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to load countries');
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error fetching countries:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load countries');
    }
  };

  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setCountryCode(country.phone_code);
    setCountryName(country.name);
    setShowCountryModal(false);
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const sendOtp = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        Alert.alert('Error', error.response?.data?.message || 'Unable to fetch user authentication data.');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        'https://imorapidtransfer.com/api/v1/sendotp',
        {
          phone: newPhoneNumber,
          carrierCode: countryCode,
          user_id: headers.user_id,  
          country_short_name: selectedCountry.short_name,  
          phone_code: countryCode,  
        },
        {
          headers: {
            token: headers.token,
            token_expiration: headers.token_expiration,
          },
        }
      );

      if (response.data.status === 'success') {
        Alert.alert('OTP Sent', 'A verification code has been sent to your new phone number.');
        setShowOtpInput(true);
      } else {
        Alert.alert('Error', response.data.message);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        Alert.alert('Error', error.response?.data?.message || 'Unable to fetch user authentication data.');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        'https://imorapidtransfer.com/api/v1/verifyOtp',
        {
          entered_otp: otp,
          phone: newPhoneNumber,
          pluginCarrierCode: countryCode,
          user_id: headers.user_id,  
          country_short_name: selectedCountry.short_name,  
          phone_code: countryCode, 
        },
        {
          headers: {
            token: headers.token,
            token_expiration: headers.token_expiration,
          },
        }
      );

      if (response.data.status === 'success') {
        Alert.alert('OTP Verified', 'Your OTP has been verified successfully.');
        setOtpVerified(true);
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const submitNewPhoneNumber = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        Alert.alert('Error', error.response?.data?.message || 'Unable to fetch user authentication data.');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        'https://imorapidtransfer.com/api/v1/submitNewPhoneNumber',
        {
          new_phone: newPhoneNumber,
          user_id: headers.user_id,  
          country_short_name: selectedCountry.short_name,  
          phone_code: countryCode, 
        },
        {
          headers: {
            token: headers.token,
            token_expiration: headers.token_expiration,
          },
        }
      );

      if (response.data.status === 'success') {
        Alert.alert('Success', 'Your phone number has been updated.');
      setNewPhoneNumber('');   
      setOtp('');   
      setOtpSent(false);   
      setOtpVerified(false);  
      setSelectedCountry(null);   
      setCountryCode('');   
 
      await AsyncStorage.removeItem('userData');  
      navigation.replace('Userdetails');
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to update phone number.');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit new phone number');
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#006400" />
      ) : (
        <>
          <Text style={styles.label}>Select Country</Text>
          <TouchableOpacity onPress={() => setShowCountryModal(true)} style={styles.selectCountryButton} disabled={otpVerified}>
            <Text style={styles.selectedCountryText}>
              {selectedCountry ? `${selectedCountry.name} (${countryCode})` : 'Select a country'}
            </Text>
          </TouchableOpacity>

          <Modal
            transparent={true}
            visible={showCountryModal}
            animationType="slide"
            onRequestClose={() => setShowCountryModal(false)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search country..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
                <FlatList
                  data={filteredCountries}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleSelectCountry(item)}
                      style={styles.countryItem}
                    >
                      <Text>{item.name} ({item.phone_code})</Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity onPress={() => setShowCountryModal(false)} style={styles.closeModalButton}>
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <TextInput
            style={styles.input}
            value={newPhoneNumber}
            onChangeText={setNewPhoneNumber}
            keyboardType="phone-pad"
            placeholder="Enter new phone number"
            editable={!otpVerified}
          />

          <TouchableOpacity onPress={sendOtp} style={styles.button} disabled={otpVerified}>
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>

          {showOtpInput && !otpVerified && (
            <>
              <TextInput
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                placeholder="Enter OTP"
              />
              <TouchableOpacity onPress={verifyOtp} style={styles.button}>
                <Text style={styles.buttonText}>Verify OTP</Text>
              </TouchableOpacity>
            </>
          )}

          {otpVerified && (
            <TouchableOpacity onPress={submitNewPhoneNumber} style={styles.submitButton}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#E3E3E3',
  },
  label: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  selectCountryButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  selectedCountryText: {
    fontSize: 16,
    color: '#333',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 10,
  },
  searchInput: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
  },
  countryItem: {
    padding: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  closeModalButton: {
    backgroundColor: '#006400',
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 16,
    paddingLeft: 8,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#006400',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#006400',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default Feature1EditPhone;
