import React, { useState, useEffect } from 'react';
import { View, Text, Button, TouchableOpacity, Modal, StyleSheet, Alert, FlatList } from 'react-native';
import DatePicker  from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import tokenValidation from "../../components/validateToken";
import RNPickerSelect  from '@react-native-picker/picker';
import { getUserData } from '@react-native-async-storage/async-storage';

const TransactionActivities = () => {
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userId, setUserId] = useState('');
  const [transactions, setTransactions] = useState([]);
  const { control, handleSubmit, setValue, getValues } = useForm({
    defaultValues: {
      type: 'all',
      status: 'all',
      wallet: 'all',
    }
  });

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
       
        const userData = await getUserData();
        if (userData) {
          setUserId(userData.user_id);
        } else {
          Alert.alert('Error', 'User data not found.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to retrieve user data.');
      }
    };

    fetchUserData();
  }, []);

  const onSubmit = async data => {
    try {
      const response = await axios.post(
        `${api.baseUrl}/activities/filter`,
        {
          ...data,
          from: startDate,
          to: endDate,
          user_id: userId,  
        }
      );
      setTransactions(response.data.transactions);  
    } catch (error) {
      console.error('Error submitting filter:', error);
      Alert.alert('Error', 'Failed to submit filter.');
    }
  };

  const handleDateChange = (date, type) => {
    if (type === 'start') {
      setStartDate(date);
      setValue('from', date);
    } else if (type === 'end') {
      setEndDate(date);
      setValue('to', date);
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionContainer}>
      <Text style={styles.transactionText}>{item.title}</Text>
      <Text style={styles.transactionText}>{item.amount}</Text>
      <TouchableOpacity
          onPress={() => navigation.navigate('TransactionDetails', {
            transactionId: item.id,
            transactions: transactions
          })}
        >
          <Text style={styles.viewDetails}>View Details</Text>
        </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setShowModal(true)} style={styles.dateRangeButton}>
        <Text>{startDate && endDate ? `${startDate} - ${endDate}` : 'Select Date Range'}</Text>
      </TouchableOpacity>
      
      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) => (
          <Picker
            selectedValue={value}
            onValueChange={(itemValue) => onChange(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="All Transaction Types" value="all" />
            <Picker.Item label="Deposit" value="Deposit" />
            <Picker.Item label="Withdrawal" value="Withdrawal" />
            <Picker.Item label="Payment Sent" value="sent" />
            <Picker.Item label="Payment Request" value="request" />
            <Picker.Item label="Payment Received" value="received" />
            <Picker.Item label="Exchanges" value="exchange" />
          </Picker>
        )}
      />

      <Controller
        control={control}
        name="status"
        render={({ field: { onChange, value } }) => (
          <Picker
            selectedValue={value}
            onValueChange={(itemValue) => onChange(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="All Statuses" value="all" />
            <Picker.Item label="Success" value="Success" />
            <Picker.Item label="Pending" value="Pending" />
            <Picker.Item label="Refund" value="Refund" />
            <Picker.Item label="Blocked" value="Blocked" />
          </Picker>
        )}
      />

      <Controller
        control={control}
        name="wallet"
        render={({ field: { onChange, value } }) => (
          <Picker
            selectedValue={value}
            onValueChange={(itemValue) => onChange(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="All Currencies" value="all" />
            {/* Dynamically generate Picker.Item elements here */}
          </Picker>
        )}
      />

      <Button title="Filter" onPress={handleSubmit(onSubmit)} />

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text>No transactions found.</Text>}
      />

      <Modal
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <DatePicker
            style={styles.datePicker}
            date={startDate}
            mode="date"
            placeholder="Select start date"
            format="DD-MM-YYYY"
            onDateChange={(date) => handleDateChange(date, 'start')}
          />
          <DatePicker
            style={styles.datePicker}
            date={endDate}
            mode="date"
            placeholder="Select end date"
            format="DD-MM-YYYY"
            onDateChange={(date) => handleDateChange(date, 'end')}
          />
          <Button title="Done" onPress={() => setShowModal(false)} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#E3E3E3',
  },
  dateRangeButton: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    marginBottom: 20,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePicker: {
    width: 200,
    marginBottom: 20,
  },
  transactionContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  transactionText: {
    fontSize: 16,
  },
  viewDetails: {
    color: '#007bff',
    marginTop: 5,
  },
});

export default TransactionActivities;
