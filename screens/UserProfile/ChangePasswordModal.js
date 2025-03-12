import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';   
import tokenValidation from '../../components/validateToken'; 
import { useEffect } from 'react';

const ChangePassword = ({ onPasswordChanged }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const navigation = useNavigation();   
  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);

  useEffect(() => {
    navigation.setOptions({ title: 'Change Password' });
  }, [navigation]);

  const handlePasswordChange = useCallback(async () => {
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New Password and Confirm New Password do not match.');
      return;
    }

    try {
      const { token, token_expiration, user_id } = await tokenValidation();  

      const response = await fetch('https://imorapidtransfer.com/api/v1/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: token,
          token_expiration: token_expiration,
        },
        body: JSON.stringify({
          user_id: user_id,  
          old_password: oldPassword,
          password: newPassword,
          password_confirmation: confirmNewPassword,
        }),
      });

      const result = await response.json();
      if (response.ok && result.status === 'success') {
        Alert.alert('Success', result.message || 'Your password has been changed successfully.');
        onPasswordChanged();
        navigation.replace('Main');   
      } else {
        Alert.alert('Error', result.message || 'Failed to change password.');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'An error occurred while changing the password. Please try again.');
    }
  }, [newPassword, confirmNewPassword, oldPassword, onPasswordChanged, navigation]);

  const handleCancel = () => {
    navigation.replace('Main');   
  };

  return (
    <View style={styles.container}>
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
      <TouchableOpacity style={styles.changeButton} onPress={handlePasswordChange}>
        <Text style={styles.buttonText}>Change Password</Text>
      </TouchableOpacity>
      {/* <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#E3E3E3',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  changeButton: {
    backgroundColor: "#006400",
    padding: 15,
    alignItems: "center",
    marginTop: 16,
    width: '50%',
    borderRadius: 25,
    alignSelf: 'center',
    paddingVertical: 12,
  },
  cancelButton: {
    backgroundColor: 'red',
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    width: '50%',
    borderRadius: 25,
    alignSelf: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default ChangePassword;
