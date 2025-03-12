import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';

const PaymentSuccessScreen = ({ route, navigation }) => {
  const { paymentLink } = route.params;

  const handleGoToPaymentLink = () => {
     navigation.navigate('WebViewScreen', { url: paymentLink });
  };
//   useEffect(() => {
//     navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

//     return () => {
//         navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
//     };
// }, [navigation]);
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Payment Successful</Text>
      <Text style={styles.message}>Your payment was processed successfully.</Text>
      <Text style={styles.paymentLink}>
        You can view your payment details or complete the transaction here.
      </Text>
      <Button title="Go to Payment Link" onPress={handleGoToPaymentLink} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    marginBottom: 20,
  },
  paymentLink: {
    fontSize: 16,
    color: 'blue',
    textDecorationLine: 'underline',
    marginBottom: 20,
  },
});

export default PaymentSuccessScreen;
