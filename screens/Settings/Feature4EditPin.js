import React, { useState } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, Image, Modal, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tokenValidation from '../../components/validateToken';

const Feature4EditPin = () => {
  const navigation = useNavigation();
  const [profileImage, setProfileImage] = useState(null);
  const [isPinModalVisible, setPinModalVisible] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMessage, setResponseMessage] = useState(null);  // To store the server response

  const primaryColor = '#006400';

  const getHeaders = async () => {
    try {
      const { token, token_expiration, user_id } = await tokenValidation();
      return {
        token,
        token_expiration,
        user_id,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('Error fetching headers:', error);
      throw new Error('Failed to fetch headers');
    }
  };

  const handleImagePicker = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Grant permission to access the media library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0]?.uri || null);
    }
  };

  const handleProfileImageSubmit = async () => {
    setIsSubmitting(true);  // Set submitting state to true
    try {
      const userData = await AsyncStorage.getItem('userData');
      const { user_id } = JSON.parse(userData);
      const formData = new FormData();
      formData.append('user_id', user_id);  
      formData.append('profile_image', {
        uri: profileImage,
        type: 'image/jpeg',
        name: 'profile_image.jpg',
      });

      const apiUrl = 'https://imorapidtransfer.com/api/v1/update-profile-image';
      const headers = await getHeaders();   

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          ...headers,   
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',  
        },
        body: formData,
      });

      const result = await response.json();
      setIsSubmitting(false);  // Set submitting state back to false

      // Show the response from the server
      if (response.ok) {
        setResponseMessage('Profile image updated successfully!');
        Alert.alert('Success', 'Profile image updated successfully!');
      } else {
        setResponseMessage(result.message || 'Failed to update profile image.');
        Alert.alert('Error', result.message || 'Failed to update profile image.');
      }

    } catch (error) {
      setIsSubmitting(false);
      console.error('Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'An error occurred while updating the profile image.');
    }
  };

  const handleSubmitPinChange = async () => {
    if (!oldPin || !newPin || !confirmPin) {
      Alert.alert('Error', error.response?.data?.message || 'All fields are required.');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Error', error.response?.data?.message || 'New PIN and Confirm PIN do not match.');
      return;
    }

    if (newPin.length !== 4 || isNaN(newPin)) {
      Alert.alert('Error', error.response?.data?.message || 'PIN must be a 4-digit number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const userDataString = await AsyncStorage.getItem('userData');
      const userData = JSON.parse(userDataString);

      if (userData.pin !== oldPin) {
        Alert.alert('Error', error.response?.data?.message || 'Old PIN is incorrect.');
        return;
      }

      const headers = await getHeaders();  
      const response = await fetch('https://imorapidtransfer.com/api/v1/user/update-pin', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: userData.user_id,  
          new_pin: newPin,
        }),
      });

      const result = await response.json();
      if (result.status === 'success') {
        userData.pin = newPin;
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        setPinModalVisible(false);
        Alert.alert('Success', 'Your PIN has been updated.');
      } else {
        throw new Error(result.message || 'Failed to update PIN.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Update Profile Image</Text>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handleImagePicker}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.placeholderText}>Select Image</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleProfileImageSubmit}
            style={[styles.submitButton, { backgroundColor: primaryColor }]}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Profile Image'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Change PIN</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setPinModalVisible(true)}
        >
          <Text style={styles.buttonText}>Change PIN</Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={isPinModalVisible}
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change PIN</Text>
            <TextInput
              placeholder="Old PIN"
              style={styles.input}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={oldPin}
              onChangeText={setOldPin}
            />
            <TextInput
              placeholder="New PIN"
              style={styles.input}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={newPin}
              onChangeText={setNewPin}
            />
            <TextInput
              placeholder="Confirm PIN"
              style={styles.input}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={confirmPin}
              onChangeText={setConfirmPin}
            />
            <TouchableOpacity
              onPress={handleSubmitPinChange}
              style={[styles.submitButton, { backgroundColor: primaryColor }]}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPinModalVisible(false)}
              style={[styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {responseMessage && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseText}>{responseMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#E3E3E3',
  },
  responseContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  responseText: {
    fontSize: 16,
    color: '#333',
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#FF0000',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  },
  card: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
  },
  submitButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    fontSize: 16,
  },
  button: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#006400',
    borderRadius: 5,
    alignItems: 'center',
  },
});

export default Feature4EditPin;
