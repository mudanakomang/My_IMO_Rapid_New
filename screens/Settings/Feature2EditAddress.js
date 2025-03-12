import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import tokenValidation from '../../components/validateToken';

const Feature2EditAddress = () => {
  const [addressFile, setAddressFile] = useState(null);
  const [loading, setLoading] = useState(false);  
  const navigation = useNavigation();

  const formik = useFormik({
    initialValues: {
      address_file: '',
    },
    validationSchema: Yup.object({
      address_file: Yup.mixed()
        .required('This field is required')
        .test(
          'fileType',
          'Please select a valid file (pdf, png, jpg, jpeg)',
          (value) => {
            if (!value) return false;
            const allowedTypes = [
              'application/pdf',
              'image/png',
              'image/jpg',
              'image/jpeg',
              'image/gif',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ];
            const fileType = value?.mimeType || value?.uri.split('.').pop();
            return allowedTypes.includes(fileType);
          }
        ),
    }),
    onSubmit: async (values) => {
      setLoading(true);  
      try {
        const { user_id, token, token_expiration } = await tokenValidation();

        const formData = new FormData();
        formData.append('user_id', user_id);
        formData.append('address_file', {
          uri: addressFile.uri,
          name: addressFile.fileName || 'upload.jpg',
          type: addressFile.mimeType || 'image/jpeg',
        });

        const response = await fetch(
          'https://imorapidtransfer.com/api/v1/profile/personal-address-update',
          {
            method: 'POST',
            headers: {
              token: token,
              token_expiration: token_expiration,
              'Content-Type': 'multipart/form-data',
            },
            body: formData,
          }
        );

        const responseData = await response.json();

        if (response.ok) {
          Alert.alert('Success', responseData.success || 'Your address has been updated.');
          formik.resetForm();
          setAddressFile(null);
          navigation.replace('Userdetails');
        } else {
          Alert.alert('Error', responseData.error || 'Failed to update address.');
          formik.resetForm();
          setAddressFile(null);
          navigation.replace('Userdetails');
        }
      } catch (error) {
        console.error('Submission Error:', error);
        Alert.alert('Error', error.response?.data?.message || 'An error occurred while updating your address.');
        formik.resetForm();
          setAddressFile(null);
          navigation.replace('Userdetails');
      } finally {
        setLoading(false);  
      }
    },
  });

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Restrict to images
        quality: 1,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        setAddressFile(file);
        formik.setFieldValue('address_file', file);
      }
    } catch (error) {
      console.error('Image Picker Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to select an image.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Address</Text>

      <View style={styles.form}>
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {addressFile ? (
            <Image source={{ uri: addressFile.uri }} style={styles.image} />
          ) : (
            <Text style={styles.imagePlaceholder}>Upload Address Proof</Text>
          )}
        </TouchableOpacity>

        {formik.touched.address_file && formik.errors.address_file && (
          <Text style={styles.error}>{formik.errors.address_file}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={formik.handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#E3E3E3',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  form: {
    marginBottom: 20,
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 20,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imagePlaceholder: {
    fontSize: 16,
    color: '#888',
  },
  error: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#006400',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Feature2EditAddress;
