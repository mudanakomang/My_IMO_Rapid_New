import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import tokenValidation from "../../components/validateToken";

const validationSchema = Yup.object({
  identityType: Yup.string().required('Identity Type is required'),
  identityNumber: Yup.string().required('Identity Number is required'),
});

const Feature3EditIdentity = ({ documentVerification }) => {
  const [identityFile, setIdentityFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverResponse, setServerResponse] = useState(null);
  const navigation = useNavigation();

  const formik = useFormik({
    initialValues: {
      identityType: documentVerification?.identity_type || 'passport',
      identityNumber: documentVerification?.identity_number || '',
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!values.identityType || !values.identityNumber || !identityFile) {
        Alert.alert('Error', error.response?.data?.message || 'Please complete all fields and upload your identity proof.');
        return;
      }

      setLoading(true);
      try {
        const { token, token_expiration, user_id } = await tokenValidation();

        const formData = new FormData();
        formData.append('user_id', user_id);
        formData.append('identity_type', values.identityType);
        formData.append('identity_number', values.identityNumber);
        formData.append('identity_file', {
          uri: identityFile.uri,
          name: identityFile.name,
          type: identityFile.mimeType || 'application/octet-stream',
        });

        const response = await axios.post(
          'https://imorapidtransfer.com/api/v1/profile/personal-id-update',
          formData,
          {
            headers: { token, token_expiration },
          }
        );

        setServerResponse(response.data);  

        if (response.data.status === 'success') {
          Alert.alert('Success', 'Identity updated successfully.');
          // Reset form and state after successful submission
          formik.resetForm();
          setIdentityFile(null);
          setLoading(false); // Reset loading state
          navigation.replace('Userdetails'); // Navigate to the desired screen
        } else {
          Alert.alert('Error', response.data.message || 'Something went wrong.');
          navigation.replace('Userdetails');
        }
      } catch (error) {
        setServerResponse({
          status: 'error',
          message: 'Failed to upload identity.',
          
        });
        Alert.alert('Error', error.response?.data?.message || 'Failed to upload identity.');
      } finally {
        setLoading(false);
      }
    },
  });

  const handleFilePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setIdentityFile({
          uri: result.assets[0].uri,
          name: result.assets[0].uri.split('/').pop(),
          mimeType: 'image/jpeg',
        });
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'An error occurred while picking the image.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Identity</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Identity Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formik.values.identityType}
            onValueChange={(itemValue) =>
              formik.setFieldValue('identityType', itemValue)
            }
          >
            <Picker.Item label="Passport" value="passport" />
            <Picker.Item label="National ID" value="national_id" />
            <Picker.Item label="Driver's License" value="drivers_license" />
          </Picker>
        </View>
        {formik.errors.identityType && (
          <Text style={styles.errorText}>{formik.errors.identityType}</Text>
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Identity Number</Text>
        <TextInput
          style={styles.input}
          value={formik.values.identityNumber}
          onChangeText={formik.handleChange('identityNumber')}
          placeholder="Enter Identity Number"
        />
        {formik.errors.identityNumber && (
          <Text style={styles.errorText}>{formik.errors.identityNumber}</Text>
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Upload Identity Proof</Text>
        {!identityFile && (
          <TouchableOpacity onPress={handleFilePick} style={styles.button}>
            <Text style={styles.buttonText}>Select File</Text>
          </TouchableOpacity>
        )}
        {identityFile && (
          <>
            <Image source={{ uri: identityFile.uri }} style={styles.imagePreview} />
            <Text style={styles.fileName}>Selected File: {identityFile.name}</Text>
          </>
        )}
      </View>

      <TouchableOpacity
        onPress={formik.handleSubmit}
        style={[styles.submitButton, loading && styles.disabledButton]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit</Text>
        )}
      </TouchableOpacity>

      {/* Display server response */}
      {serverResponse && (
        <View style={styles.serverResponse}>
          <Text style={styles.serverResponseText}>
            {serverResponse.message || 'No message available.'}
          </Text>
          {serverResponse.status === 'error' && (
            <Text style={styles.errorText}>Error occurred during the update.</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#E3E3E3',
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 16,
    borderRadius: 4,
    marginTop: 5,
  },
  pickerContainer: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    marginTop: 5,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: 12,
    backgroundColor: '#006400',
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  fileName: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginTop: 10,
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: '#006400',
    alignItems: 'center',
    borderRadius: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  serverResponse: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8d7da',
    borderRadius: 4,
  },
  serverResponseText: {
    fontSize: 16,
    color: '#721c24',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
  },
});

export default Feature3EditIdentity;
