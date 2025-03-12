import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import validateToken from '../../components/validateToken';

const WithdrawScreen = ({ route, navigation }) => {
    const { virtualCard = {}, cardId = '', balance = 0, currency = 'USD' } = route.params || {};
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);  

    const cardCurrency = virtualCard?.currency || currency;
     
    const handleAmountChange = (amount) => {
        setWithdrawAmount(amount);

        if (parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(balance)) {
            setIsSubmitDisabled(false);
        } else {
            setIsSubmitDisabled(true);
        }
    };
   
    useEffect(() => {
        navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

        return () => {
            navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
        };
    }, [navigation]);
      
    const handleWithdrawal = async () => {
        if (!withdrawAmount) {
            Alert.alert('Error', error.response?.data?.message || 'Please enter a valid amount');
            return;
        }
    
        setIsLoading(true);
    
        navigation.navigate('PinVerify', {
            onSuccess: async () => {
                try {
                    const { user_id, token, token_expiration } = await validateToken();
    
                    const response = await axios.post(
                        'https://imorapidtransfer.com/api/v1/vcards/card/create/oncard/withdraw/freeze/fund',
                        {
                            type: 'WITHDRAWAL',
                            card_currency: cardCurrency,
                            encryptedCardId: virtualCard.encryptedCardId || cardId,
                            amount: withdrawAmount,
                        },
                        {
                            headers: {
                                token,
                                token_expiration,
                            },
                            params: {
                                user_id,
                            },
                        }
                    );
    
                    if (response.data.status === 'APPROVED') {
                        navigation.navigate('FinalScreen', {
                            message: 'Withdrawal successful',
                        });
                    } else {
                        Alert.alert('Failed', 'Withdrawal failed. Please try again');
                        navigation.goBack();
                    }
                } catch (error) {
                    console.error('Error:', error);
                    Alert.alert('Error', error.response?.data?.message || 'An error occurred. Please try again later.');
                } finally {
                    setIsLoading(false);
                }
            },
            onFailed: () => {
                setIsLoading(false);
                Alert.alert('Error', error.response?.data?.message || 'PIN verification failed. Please try again.');
            },
        });
    };
    

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Card Withdrawal</Text>

            <Text style={styles.label}>Amount In ({cardCurrency})</Text>
            <TextInput
                style={styles.input}
                placeholder={`Enter amount in ${cardCurrency}`}
                keyboardType="numeric"
                value={withdrawAmount}
                onChangeText={handleAmountChange}
            />

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        isSubmitDisabled || isLoading ? styles.disabledButton : null,
                    ]}
                    onPress={handleWithdrawal}
                    disabled={isSubmitDisabled || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: 'gray' }]}
                    onPress={() => navigation.goBack()}
                    disabled={isLoading}
                >
                    <Text style={styles.submitButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
       
    backgroundColor: '#E3E3E3', 
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        width: '100%',
        marginBottom: 20,
        paddingHorizontal: 10,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    buttonContainer: {
        width: '100%',
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    submitButton: {
        backgroundColor: '#006400',
        padding: 14,
        borderRadius: 25,
        alignItems: 'center',
        paddingVertical: 12,
        alignSelf: 'center',
        marginTop: 16,
        width: '45%',
    },
    disabledButton: {
        backgroundColor: '#a5a5a5',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default WithdrawScreen;
