import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const PaymentStatus = ({ route, navigation }) => {
  const { status, ...params } = route.params;

  const transactionReference = 
    params.transactionRef || 
    params.transactionID || 
    params.txRef || 
    params.reference || 
    params.Reference;

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
      navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
  }, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
      headerTitle: '',
    });
  }, [navigation]);

  // Show Rate Us button only if the status is "successful" or "pending"
  const showRateUsButton = status === 'successful' || status === 'pending';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Status</Text>
      {status === 'successful' ? (
        <View style={styles.successContainer}>
          <Text style={styles.statusSuccess}>Payment Successful</Text>
        </View>
      ) : status === 'pending' ? (
        <View style={styles.pendingContainer}>
          <Text style={styles.statusPending}>Payment Pending</Text>
        </View>
      ) : (
        <View style={styles.failedContainer}>
          <Text style={styles.statusFailed}>Payment Failed</Text>
        </View>
      )}
      <Text style={styles.reference}>Reference: {transactionReference}</Text>

      {/* Buttons separated */}
      <View style={styles.buttonsContainer}>
        <View style={styles.buttonWrapper}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('HomeScreen')}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>

        {/* Show Rate Us Button only if the status is successful or pending */}
        {showRateUsButton && (
          <View style={styles.buttonWrapper}>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.navigate('RateUsScreen', { transactionId: transactionReference })}
            >
              <Text style={styles.buttonText}>Rate Us</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statusSuccess: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'green',
    marginTop: 10,
  },
  statusPending: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'orange',
    marginTop: 10,
  },
  statusFailed: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'red',
    marginTop: 10,
  },
  reference: {
    fontSize: 16,
    marginTop: 20,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pendingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  failedContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonsContainer: {
    flex: 1,
    width: '55%',
    justifyContent: 'space-between',
    paddingVertical: 70,
  },
  buttonWrapper: {
    width: '100%',
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#006400',  
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentStatus;
