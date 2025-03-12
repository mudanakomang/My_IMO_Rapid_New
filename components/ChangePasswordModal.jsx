import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import PinVerificationModal from '../components/PinVerificationModal'; 
import tokenValidation from '../components/validateToken'; 

const ChangePasswordModal = ({ isVisible, onClose, onPasswordChanged }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isPinVerified, setIsPinVerified] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New Password and Confirm New Password do not match.');
      return;
    }

    try {
      const { token, token_expiration } = await tokenValidation();  
      
      const response = await fetch('https://imorapidtransfer.com/api/v1/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: token,
          token_expiration: token_expiration,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Your password has been changed successfully.');
        onPasswordChanged();
        onClose();
      } else {
        Alert.alert('Error', result.message || 'Failed to change password.');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'An error occurred while changing the password. Please try again.');
    }
  };

  const handlePinVerification = () => {
    onClose(); 
    navigation.navigate('PinVerificationModal', {
      onPinVerified: () => {
        setIsPinVerified(true);
      },
    });
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {!isPinVerified ? (
          <PinVerificationModal 
            onPinVerified={handlePinVerification}
            onClose={onClose}
          />
        ) : (
          <View style={styles.modalContent}>
            <Text style={styles.title}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Old Password"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
            />
            <Button title="Change Password" onPress={handlePasswordChange} />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
  },
});

export default ChangePasswordModal;
