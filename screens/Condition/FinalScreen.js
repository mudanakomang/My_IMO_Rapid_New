import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const FinalScreen = ({ route, navigation }) => {
  const { message, mtcn, transactionId } = route.params || { message: 'No message available' };  

  useEffect(() => {
    navigation.setOptions({  
      title: ' ',
    });
  }, [navigation]);

  const handleGoBack = () => {
    navigation.replace('Main');  
  };

  const handleRateUs = () => {
    if (transactionId) {
      navigation.navigate('RateUsScreen', { transactionId });
    }
  };

  const isSuccess = message.toLowerCase().includes('success');
  const isPending = message.toLowerCase().includes('pending');

  return (
    <View style={styles.container}>
      <Text style={[styles.message, isSuccess ? styles.successText : styles.errorText]}>
        {message}
      </Text>

      {mtcn ? (
        <>
          <Text style={styles.mtcnText}>MTCN Code: {mtcn.mtcn_code}</Text>
          <Text style={styles.mtcnText}>Fees: {mtcn.fees}</Text>
          <Text style={styles.mtcnText}>Total: {mtcn.total}</Text>
        </>
      ) : (
        <Text style={styles.mtcnText}>No MTCN data available.</Text>
      )}

      {/* Conditional rendering of the 'Rate Us' button */}
      {(isSuccess || isPending) && (
        <TouchableOpacity style={styles.button} onPress={handleRateUs}>
          <Text style={styles.buttonText}>Rate Us</Text>
        </TouchableOpacity>
      )}

      {/* 'Go Back' button */}
      <TouchableOpacity style={styles.button} onPress={handleGoBack}>
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
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
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  successText: {
    color: '#006400', 
  },
  errorText: {
    color: '#FF0000',  
  },
  button: {
    backgroundColor: '#006400',  
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mtcnText: {
    fontSize: 16,
    marginTop: 5,
  }
});

export default FinalScreen;
