import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import WebView from 'react-native-webview';

const DepositPaymentScreen = ({ route }) => {
    const { transactionId, currencyCode } = route.params;
    const [paymentHtml, setPaymentHtml] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

        return () => {
            navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
        };
    }, [navigation]);
    
    useEffect(() => {
        const fetchPaymentHtml = async () => {
            try {
                const response = await fetch('https://imorapidtransfer.com/api/v1/deposit/payment-view', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ transactionId, currencyCode }),
                });
                const data = await response.json();
                console.log('Payment HTML Response:', data);
            
                if (data.view) {
                    setPaymentHtml(data.view);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching payment HTML:', error);
                Alert.alert('Error', error.response?.data?.message || 'Unable to fetch payment view');
                setLoading(false);
            }
        };

        fetchPaymentHtml();
    }, [transactionId, currencyCode]);

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }

    return (
        <View style={{ flex: 1 }}>
            {paymentHtml ? (
                <WebView 
                    originWhitelist={['*']} 
                    source={{ html: paymentHtml }}  
                />
            ) : (
                <View>
                    <Text>Error: Unable to load payment page</Text>
                </View>
            )}
        </View>
    );
};

export default DepositPaymentScreen;
