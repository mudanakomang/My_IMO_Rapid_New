import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Card from './Card';

const NewsCard = ({ transaction, style }) => {
  const { uuid, transaction_reference_id, created_at, currency_id, total, status, transaction_type_id } = transaction || {};

  // Format date
  const transactionDate = created_at ? new Date(created_at).toLocaleDateString() : 'N/A';

  return (
    <Card style={{ ...styles.card, ...style }}>
      <View style={styles.newDetails}>
        <Text style={styles.newHeadline}>Transaction ID: {uuid || 'Unknown'}</Text>
        <Text style={styles.newHeadline}>Transaction Type ID: {transaction_type_id || 'Unknown'}</Text>
        <Text style={styles.newHeadline}>Date: {transactionDate}</Text>
        <Text style={styles.newHeadline}>
          Amount: {currency_id} {total || '0.00'}
        </Text>
        <Text style={styles.newHeadline}>Status: {status || 'Pending'}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
    card: {
      backgroundColor: '#D7D7D7',  
      marginBottom: 20,
      borderRadius: 10,
      padding: 15,
    },
    newDetails: {
      flexDirection: 'column',
      justifyContent: 'flex-start',
    },
    newHeadline: {
      fontSize: 16,
      marginBottom: 10,
      color: '#333',  
    },
  });

export default NewsCard;
