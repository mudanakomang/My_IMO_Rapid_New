import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Image } from 'react-native';

const FinalRegistrationScreen = ({ navigation }) => {
  const [dob, setDob] = useState(new Date());
  const [gender, setGender] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirmation, setPinConfirmation] = useState('');
  const [identityType, setIdentityType] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [identityFile, setIdentityFile] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);  
  const [generatedCode, setGeneratedCode] = useState('');  
  const [referrerWalletId, setReferrerWalletId] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          if (parsedUserData?.user_id && parsedUserData?.token) {
            setUserData(parsedUserData);
          } else {
            Alert.alert('Error', 'Missing user information. Please login again.');
          }
        } else {
          Alert.alert('Error', 'No user data found. Please log in again.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to retrieve user data.');
      }
    };

    fetchUserData();
  }, []);
  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);
   useEffect(() => {
     navigation.setOptions({
       title: 'Complete Registration',
     });
   }, [navigation]);
 
  const generateRandomCode = () => {
    const characters = 'A0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setGeneratedCode(result);  
  };
  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setDob(selectedDate);
    }
    setShowDatePicker(false);
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your gallery.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setIdentityFile(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    console.log('Submit Button Pressed');

    if (!userData) {
      Alert.alert('Error', 'Missing user information. Please login again.');
      return;
    }

    setIsSubmitting(true); 

    try {
      const { user_id, token } = userData;

      if (!token) {
        Alert.alert('Error', 'Missing authentication details.');
        return;
      }

      if (pin !== pinConfirmation) {
        Alert.alert('Error', 'PIN and confirmation PIN do not match.');
        return;
      }

      if (pin.length < 4) {
        Alert.alert('Error', 'PIN must be at least 4 digits.');
        return;
      }

      if (!dob || !gender || !address1 || !pin || !identityType || !identityNumber || !identityFile) {
        Alert.alert('Error', 'Please fill in all required fields.');
        return;
      }

      const formData = new FormData();
      formData.append('dob', dob.toISOString().split('T')[0]);
      formData.append('gender', gender);
      formData.append('address_1', address1);
      formData.append('address_2', address2);
      formData.append('pin', pin);
      formData.append('pin_confirmation', pinConfirmation);
      formData.append('identity_type', identityType);
      formData.append('identity_number', identityNumber);
      formData.append('user_id', user_id);
      formData.append('token', token);

      if (identityFile) {
        const uriParts = identityFile.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('identity_file', {
          uri: identityFile,
          name: `identity.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      if (referrerWalletId) {
        formData.append('referrer_wallet_id', referrerWalletId);  
      }

      console.log('Sending request to server with data:', formData);

      const response = await axios.post(
        'https://imorapidtransfer.com/api/v1/register/complete',
        formData,
        {
          headers: {
            'token': token,
            'token_expiration': userData.token_expiration,
          },
        }
      );

      console.log('Server response:', response.data);

      if (response.status === 200) {
        Alert.alert('Success', 'Registration completed successfully!');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth', params: { screen: 'Login' } }],
        });
      } else {
        Alert.alert('Error', response?.data?.message || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit the form. Please try again.');
    } finally {
      setIsSubmitting(false);  
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Date of Birth <Text style={styles.required}>*</Text></Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
          <Text>{dob.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dob}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 10))}
          />
        )}
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Set Pin <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Pin"
          secureTextEntry
          keyboardType="numeric"  
          value={pin}
          onChangeText={setPin}
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Confirm Pin <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm Pin"
          secureTextEntry
          keyboardType="numeric"  
          value={pinConfirmation}
          onChangeText={setPinConfirmation}
        />

      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Gender <Text style={styles.required}>*</Text></Text>
        <View style={styles.inputContainer}>
          <Picker selectedValue={gender} style={styles.picker} onValueChange={setGender}>
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Identity Type <Text style={styles.required}>*</Text></Text>
        <View style={styles.inputContainer}>
          <Picker selectedValue={identityType} style={styles.picker} onValueChange={setIdentityType}>
            <Picker.Item label="Select Identity Type" value="" />
            <Picker.Item label="National ID" value="national_id" />
            <Picker.Item label="Passport" value="passport" />
            <Picker.Item label="Driver's License" value="drivers_license" />
          </Picker>
        </View>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Identity Number <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Identity Number"
          value={identityNumber}
          onChangeText={setIdentityNumber}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Address 1 <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.input} placeholder="Enter Address 1" value={address1} onChangeText={setAddress1} />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Address 2</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Address 2"
          value={address2}
          onChangeText={setAddress2}
        />
      </View>
      <View style={styles.formGroup}>

          <Text style={styles.label}>Referrer <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Referrer Wallet ID"
            value={referrerWalletId}
            onChangeText={setReferrerWalletId}
          />
          </View>

          <View style={styles.formGroup}>
          <Text style={styles.label}>Referral Code <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter Referral Code"
              value={generatedCode}
              onChangeText={setGeneratedCode}
            />
            <TouchableOpacity style={styles.inlineButton} onPress={generateRandomCode}>
              <Text style={styles.buttonText}>Generate</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Upload Identity Proof <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity onPress={handleImagePicker} style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Choose File</Text>
          </TouchableOpacity>
          {identityFile && <Image source={{ uri: identityFile }} style={styles.imagePreview} />}
        </View>


      <View style={styles.formGroup}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: isSubmitting ? '#ccc' : '#4CAF50' }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
      

      <Modal visible={isSubmitting} transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.modalText}>Submitting...</Text>
          </View>
        </View>
      </Modal>
      
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  required: {
    color: 'red',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingLeft: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    position: 'relative',
  },
  inlineButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    position: 'absolute',  
    right: 0,   
    top: '35%', 
    justifyContent: 'center', 
    transform: [{ translateY: -12 }], 
    justifyContent: 'center',
  },
  
  picker: {
    height: 50,
    width: '100%',
  },
  button: {
    backgroundColor: '#006400',
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 16,
    width: '50%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default FinalRegistrationScreen;