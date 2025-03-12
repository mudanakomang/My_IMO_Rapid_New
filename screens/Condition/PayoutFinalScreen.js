import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const PayoutFinalScreen = ({ route, navigation }) => {
  const { message, status, amount, fees, destination, beneficiaryName, walletCurrencyCode, exchangeCurCode } = route.params || {}; // Add walletCurrencyCode
  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);
  useEffect(() => {
      navigation.setOptions({ 
        title: ' ',
      });
    }, [navigation]);
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
     
      {status && (
        <Text
          style={[
            styles.status,
            status === 'success' ? styles.success : status === 'failed' ? styles.error : styles.pending,
          ]}
        >
          {status.toUpperCase()}
        </Text>
      )}

      {/* Display the Rest of the Details */}
      <View style={styles.detailsContainer}>
        {message && (
          <>
            <Text style={styles.detailItem}>
              <Text style={styles.detailLabel}>Message:</Text> {message}
            </Text>
            <View style={styles.separator} />
          </>
        )}
        {amount && (
          <>
            <Text style={styles.detailItem}>
              <Text style={styles.detailLabel}>Amount:</Text> {walletCurrencyCode} {amount}
            </Text>
            <View style={styles.separator} />
          </>
        )}
        {fees && (
          <>
            <Text style={styles.detailItem}>
              <Text style={styles.detailLabel}>Fees:</Text> {exchangeCurCode} {fees}
            </Text>
            <View style={styles.separator} />
          </>
        )}
        {destination && (
          <>
            <Text style={styles.detailItem}>
              <Text style={styles.detailLabel}>Destination:</Text> {destination}
            </Text>
            <View style={styles.separator} />
          </>
        )}
        {beneficiaryName && (
          <>
            <Text style={styles.detailItem}>
              <Text style={styles.detailLabel}>Beneficiary Name:</Text> {beneficiaryName}
            </Text>
            <View style={styles.separator} />
          </>
        )}
      </View>

      {/* Back to Dashboard Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Main')}
      >
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,  
    backgroundColor: '#f5f7fa',
  },
  status: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    
  },
  success: {
    color: '#27ae60',
  },
  error: {
    color: '#e74c3c',
  },
  pending: {
    color: '#f39c12',
  },
  detailsContainer: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailItem: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 10,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#34495e',
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginVertical: 10,
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
    textAlign: 'center',
    fontSize: 18,
  },
});

export default PayoutFinalScreen;
