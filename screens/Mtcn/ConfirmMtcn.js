import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import tokenValidation from '../../components/validateToken';
import ActivityIndicator from '../../screens/Condition/ActivityIndicator';

const ConfirmMtcn = ({ route }) => {
    const { formData, selectedWalletCurrency } = route.params;
    
    const [fees, setFees] = useState('Calculating...');
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false); 
    const [submitDisabled, setSubmitDisabled] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();
    const [authHeaders, setAuthHeaders] = useState(null);
    useEffect(() => {
        navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

        return () => {
            navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
        };
    }, [navigation]);
    
    useEffect(() => {
        navigation.setOptions({ title: 'Confirm Transfer' });
        initialize();
    }, []);

    const initialize = async () => {
        try {
            const { token, user_id, token_expiration } = await tokenValidation();
            setAuthHeaders({ token, token_expiration, user_id });
            fetchFees(token, user_id, token_expiration);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to validate token.');
        }
    };

    const fetchFees = async (token, user_id, token_expiration) => {
        try {
            setLoading(true);
            setSubmitDisabled(true);
            const response = await axios.get('https://imorapidtransfer.com/api/v1/token/transaction/fees', {
                headers: { token, token_expiration },
                params: {
                    user_id,
                    amount: formData.amount,
                    wallet_id: formData.debit_wallet,
                    transaction_type_id: 16,
                },
            });
            if (response.data.status === 200) {
                setFees(response.data.data.totalFees);
                setSubmitDisabled(false);
            } else {
                Alert.alert('Error', response.data.message);
                setSubmitDisabled(true);
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data.message || 'Network error occurred.');
            setSubmitDisabled(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitLoading(true);
    
        navigation.navigate('PinVerify', {
            onSuccess: async () => {
                try {
                    if (!authHeaders) {
                        throw new Error('Authentication headers are missing.');
                    }
                    const { token, user_id, token_expiration } = authHeaders;
                    const response = await axios.post(
                        'https://imorapidtransfer.com/api/v1/token/transaction/submit',
                        { ...formData, fees },
                        { headers: { token, token_expiration }, params: { user_id } }
                    );
    
                    if (response.data.status === 200) {
                        Alert.alert('Success', 'Transaction successful!');
    
                        const mtcn = response.data.data ? {
                            mtcn_code: response.data.data.mtcn_code,
                            fees: response.data.data.fees,
                            total: response.data.data.total,
                        } : null;
    
                        navigation.navigate('FinalScreen', {
                            message: 'MTCN transfer successful',
                            mtcn: mtcn, // passing mtcn data if available
                        });
                    } else {
                        Alert.alert('Error', response.data.message || 'Transaction failed.');
                    }
                } catch (error) {
                    Alert.alert('Error', error.response?.data.message || 'Network error occurred.');
                } finally {
                    setSubmitLoading(false);
                }
            },
            onFailed: () => {
                Alert.alert('Error', error.response?.data?.message || 'PIN validation failed. Please try again.');
                setSubmitLoading(false);
            },
        });
    };
    
    

    const onRefresh = async () => {
        setRefreshing(true);
        await initialize();
        setRefreshing(false);
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <ActivityIndicator visible={loading || submitLoading} />
            
            <Text style={styles.info}>First Name: {formData.first_name}</Text>
            <View style={styles.separator} />
            <Text style={styles.info}>Last Name: {formData.last_name}</Text>
            <View style={styles.separator} />
            <Text style={styles.info}>Location: {formData.merchant_location}</Text>
            <View style={styles.separator} /> 
            <Text style={styles.info}>Document Type: {formData.id_type}</Text>
            <View style={styles.separator} />
            <Text style={styles.info}>Document Number: {formData.id_number}</Text>
            <View style={styles.separator} />
            <Text style={styles.info}>Amount: {formData.amount}</Text>
            <View style={styles.separator} />
            <Text style={styles.info}>Phone Number: {formData.phone_number}</Text>
            <View style={styles.separator} />
            <Text style={styles.label}>Selected Wallet: {selectedWalletCurrency}</Text>
            <View style={styles.separator} />
            <Text style={styles.info}>Total Fees: {fees}</Text>
            <View style={styles.separator} />
            <Text style={styles.info}>Narration: {formData.note}</Text>
            <View style={styles.separator} />

            {/* Custom Submit Button with Loading State */}
            <TouchableOpacity
                style={[styles.submitButton, (submitDisabled || submitLoading) && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={submitDisabled || submitLoading}
            >
                <Text style={styles.submitButtonText}>
                    {submitLoading ? 'Processing...' : 'Submit Transaction'}
                </Text>
            </TouchableOpacity>

            <View style={styles.separator} />
            <TouchableOpacity style={styles.submitButton} onPress={() => navigation.goBack()}>
                <Text style={styles.submitButtonText}>Go Back</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
        backgroundColor: '#E3E3E3',
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    info: {
        fontSize: 18,
        marginBottom: 10,
    },
    separator: {
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
        marginVertical: 10,
    },
    submitButton: {
        backgroundColor: '#006400',
        paddingVertical: 12,
        borderRadius: 25,
        alignSelf: 'center',
        marginTop: 16,
        width: '50%',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    disabledButton: {
        backgroundColor: '#888',
    },
});

export default ConfirmMtcn;
