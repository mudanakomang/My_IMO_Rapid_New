import React, { useState, useEffect } from 'react';
import { FlatList, Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import validateToken from '../../components/validateToken';  
import AsyncStorage from '@react-native-async-storage/async-storage';

const NewCardScreen = ({ navigation }) => {
    const [cardCurrency, setCardCurrency] = useState('USD');
    const [cardType, setCardType] = useState('');
    const [cardBrand, setCardBrand] = useState('');
    const [walletId, setWalletId] = useState('');
    const [cardFor, setCardFor] = useState('');
    const [bvn, setBvn] = useState('');
    const [pin, setPin] = useState('');
    const [friendEmail, setFriendEmail] = useState('');
    const [friendPhone, setFriendPhone] = useState('');
    const [wallets, setWallets] = useState([]);
    const [fees, setFees] = useState(null);
    const [exchangeRate, setExchangeRate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isNigeriaUser, setIsNigeriaUser] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [getAmountMoneyFormat, setGetAmountMoneyFormat] = useState(null);
    const [exchangeValue, setExchangeValue] = useState(null);


    useEffect(() => {
        navigation.setOptions({ title: 'New Card' });
    }, [navigation]);
    useEffect(() => {
        navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

        return () => {
            navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
        };
    }, [navigation]);
    useEffect(() => {
        const fetchWallets = async () => {
            setLoading(true);
            try {
                const { user_id, token, token_expiration } = await validateToken();
                const response = await fetch('https://imorapidtransfer.com/api/v1/virtual/card/wallets', {
                    method: 'POST',
                    headers: {
                        token,
                        token_expiration,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ user_id }),
                });
    
                const result = await response.json();
    
                if (result.status !== 'success') {
                    alert(result.message);
                    return;
                }
    
                setWallets(result.data.wallets);
            } catch (error) {
                console.error('Error fetching wallets:', error);
                alert('Error fetching wallets. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchWallets();
    }, []);

    const selectWallet = (wallet) => {
        setSelectedWallet(wallet);
        setWalletId(wallet.id);  
        setIsModalVisible(false);
    };
    
    
    useEffect(() => {
        if (cardCurrency === 'NGN') {
            setPin('');
        }
    }, [cardCurrency]);
    

  
    
    
    const makeApiRequest = async (url, data) => {
        try {
            const { user_id, token, token_expiration } = await validateToken();
            
            const requestBody = JSON.stringify({ ...data, user_id });
    
            const headers = {
                'Content-Type': 'application/json',
                token,
                token_expiration,
            };
    
            console.log(`API Request to ${url}`);
            console.log('Request Headers:', headers);
            console.log('Request Body:', requestBody);
    
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: requestBody,
            });
    
            const result = await response.json();
    
            console.log('Response:', result);
    
            if (!response.ok) {
                throw new Error(result.message || 'API request failed');
            }
    
            return result;
        } catch (error) {
            console.error('Error during API request:', error);
            throw error;
        }
    };
    
    const fetchFeesAndExchangeRate = async () => {
        if (!walletId) {
            alert('Please select a wallet to fund from');
            return;
        }
    
        setLoading(true);
        try {
            const feeResponse = await makeApiRequest(
                'https://imorapidtransfer.com/api/v1/vcard/get-fees',
                {
                    card_type: cardType,
                    card_currency: cardCurrency,
                    card_for: cardFor,
                }
            );
    
            if (feeResponse && feeResponse.mergefee !== undefined) {
                console.log(`Card Brand Merge Fee: ${feeResponse.mergefee}`);
            } else {
                console.log('Merge fee not available in the response.');
            }
    
            setFees(feeResponse);
    
           
            const exchangeResponse = await makeApiRequest(
                'https://imorapidtransfer.com/api/v1/vcards/exchange/get-currencies-exchange-rate',
                {
                    wallet_id: walletId,
                    amount: cardCurrency === 'USD' ? '1.5' : '0',
                    fromWalletCode: cardCurrency,
                    fromWallet: cardCurrency === 'USD' ? '24' : '22',
                    toWallet: selectedWallet ? selectedWallet.currency_id : '',     
                }
            );
    
            if (exchangeResponse?.original?.exchange_value) {
                setExchangeRate(exchangeResponse);
                setGetAmountMoneyFormat(exchangeResponse.original.getAmountMoneyFormat);
                setExchangeValue(exchangeResponse.original.exchange_value);
            } else {
                alert('Failed to fetch exchange rate. Please try again.');
            }
        } catch (error) {
            console.error('Error fetching fees or exchange rate:', error);
            alert('Error fetching fees or exchange rate. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    
  
    {exchangeRate && exchangeRate.getAmountMoneyFormat && (
        <View style={styles.feesContainer}>
            <Text style={styles.feeText}>Exchange Rate: {exchangeRate.getAmountMoneyFormat} {cardCurrency}</Text>
        </View>
    )}
    
    
    
    
    
    useEffect(() => {
        if (cardCurrency && cardType && walletId && cardFor) {
            fetchFeesAndExchangeRate();
        }
    }, [cardCurrency, cardType, walletId, cardFor]);

    const renderWalletItem = ({ item }) => (
        <TouchableOpacity
            style={styles.walletItem}
            onPress={() => selectWallet(item)}
        >
            <Text style={styles.walletText}>{`${item.code} + Balance: ${item.balance}`}</Text>
        </TouchableOpacity>
    );
    
    // const handleSubmit = async () => {
    //     if (!walletId) {
    //         alert('Please select a wallet to fund from');
    //         return;
    //     }
    
    //     const walletBalance = parseFloat(selectedWallet?.balance || 0);
    //     const exchangeAmount = parseFloat(exchangeValue || 0);
    
    //     if (exchangeAmount > walletBalance) {
    //         alert('Insufficient wallet balance for this transaction.');
    //         return;
    //     }
    
    //     try {
    //         setLoading(true);
    //         const result = await makeApiRequest(
    //             'https://imorapidtransfer.com/api/v1/vcards/card/create/oncard/withdraw/freeze/fund',
    //             {
    //                 type: 'CARDCREATING',
    //                 cardCurrency,
    //                 cardType,
    //                 cardBrand,
    //                 walletId,
    //                 cardFor,
    //                 pin: cardCurrency === 'NGN' ? pin : null,
    //                 bvn: cardCurrency === 'NGN' ? bvn : null,
    //                 friendEmail: cardFor === 'friend' ? friendEmail : null,
    //                 friendPhone: cardFor === 'friend' ? friendPhone : null,
    //                 exchangeAmount: getAmountMoneyFormat,
    //                 exchange_value: exchangeValue
    //             }
    //         );
    
    //         if (result.success) {
    //             alert('Card Created Successfully');
    //             navigation.goBack(); 
    //         } else {
    //             alert(result.message || 'Error creating card');
    //             navigation.goBack();
    //         }
    //     } catch (error) {
    //         alert('Error submitting form. Please try again.');
    //         navigation.goBack(); // Navigate back in case of error
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    const handleSubmit = async () => {
        if (!walletId) {
            alert('Please select a wallet to fund from');
            return;
        }
    
        const walletBalance = parseFloat(selectedWallet?.balance || 0);
        const exchangeAmount = parseFloat(exchangeValue || 0);
    
        if (exchangeAmount > walletBalance) {
            alert('Insufficient wallet balance for this transaction.');
            return;
        }
    
        try {
            setLoading(true);
    
            // Navigate to PinVerify screen for PIN verification
            const pinVerificationResult = await navigation.navigate('PinVerify', {
                onSuccess: () => 'onSuccess',
                onFailed: () => 'onFailed',
            });
    
            if (pinVerificationResult === 'onFailed') {
                alert('PIN validation failed. Please try again.');
                setLoading(false);
                return;
            }
    
            // Proceed with API request if PIN verification is successful
            const result = await makeApiRequest(
                'https://imorapidtransfer.com/api/v1/vcards/card/create/oncard/withdraw/freeze/fund',
                {
                    type: 'CARDCREATING',
                    cardCurrency,
                    cardType,
                    cardBrand,
                    walletId,
                    cardFor,
                    pin: cardCurrency === 'NGN' ? pin : null,
                    bvn: cardCurrency === 'NGN' ? bvn : null,
                    friendEmail: cardFor === 'friend' ? friendEmail : null,
                    friendPhone: cardFor === 'friend' ? friendPhone : null,
                    exchangeAmount: getAmountMoneyFormat,
                    exchange_value: exchangeValue,
                }
            );
    
            if (result.success) {
                alert('Card Created Successfully');
                navigation.goBack();
            } else {
                alert(result.message || 'Error creating card');
                navigation.goBack();
            }
        } catch (error) {
            alert('Error submitting form. Please try again.');
            navigation.goBack();  
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>Card Currency</Text>
            <View style={styles.radioContainer}>
                <TouchableOpacity onPress={() => setCardCurrency('USD')}>
                    <Text style={cardCurrency === 'USD' ? styles.radioSelected : styles.radio}>USD</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCardCurrency('NGN')}>
                    <Text style={cardCurrency === 'NGN' ? styles.radioSelected : styles.radio}>NGN</Text>
                </TouchableOpacity>
            </View>
  
            <Text style={styles.label}>Card Type</Text>
              <View style={styles.pickerContainer}>
                 <Picker selectedValue={cardType} onValueChange={setCardType} style={styles.picker}>
                <Picker.Item label="Select Card Type" value="" />
                <Picker.Item label="Virtual Card" value="virtual" />
            </Picker>
            </View>

            {fees && fees.mergefee > 0 && selectedWallet?.code && (
                <Text style={styles.feeText}>Fee: {fees.mergefee} {selectedWallet.code}</Text>
            )}


             
          <Text style={styles.label}>Card Brand</Text>
            <View style={styles.pickerContainer}>
            <Picker selectedValue={cardBrand} onValueChange={setCardBrand} style={styles.picker}>
                <Picker.Item label="Select Brand" value="" />
                <Picker.Item label="Visa" value="Visa" />
            </Picker>
            </View>

            
            {isNigeriaUser && (
                <>
                    <Text style={styles.label}>BVN (Nigeria Only)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        maxLength={11}
                        value={bvn}
                        onChangeText={setBvn}
                    />
                </>
            )}


           
            {cardCurrency === 'NGN' && (
                <>
                    <Text style={styles.label}>Set PIN (NGN Only)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        maxLength={6}
                        value={pin}
                        onChangeText={setPin}
                    />
                </>
            )}
 
<Text style={styles.label}>Wallet Source</Text>
            <TouchableOpacity
                style={styles.pickerContainer}
                onPress={() => setIsModalVisible(true)}
            >
                <Text style={styles.walletText}>
                        {selectedWallet ? `${selectedWallet.code} + Balance: ${selectedWallet.balance}` : 'Select Wallet'}
                    </Text>

            </TouchableOpacity>  
            {exchangeRate && exchangeRate.original.getAmountMoneyFormat && (
                <View style={styles.feesContainer}>
                    <Text style={styles.feeText}>Exchange Rate: {exchangeRate.original.getAmountMoneyFormat} {cardCurrency}</Text>
                </View>
            )}
            
<Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Debit Wallet</Text>

                        {loading ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : (
                            <FlatList
                                data={wallets}
                                renderItem={renderWalletItem}
                                keyExtractor={(item) => item.id.toString()}
                            />
                        )}

                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setIsModalVisible(false)}
                        >
                            <Text style={styles.modalCloseButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>


      
            <Text style={styles.label}>Card For</Text>
            <View style={styles.pickerContainer}>
                <Picker selectedValue={cardFor} onValueChange={setCardFor} style={styles.picker}>
                    <Picker.Item label="Select Card For" value="" />
                    <Picker.Item label="My self" value="personal" />
                    <Picker.Item label="For a Friend" value="friend" />
                </Picker>
            </View>

            {cardFor === 'friend' && (
                <>
                    <Text style={styles.label}>Friend's Email</Text>
                    <TextInput
                        style={styles.input}
                        value={friendEmail}
                        onChangeText={setFriendEmail}
                    />

                    <Text style={styles.label}>Friend's Phone</Text>
                    <TextInput
                        style={styles.input}
                        value={friendPhone}
                        onChangeText={setFriendPhone}
                    />
                </>
            )}

         
        <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit}
            disabled={!exchangeValue || parseFloat(exchangeValue) > parseFloat(selectedWallet?.balance || 0)}
        >
            <Text style={styles.submitButtonText}>Create Card</Text>
        </TouchableOpacity>

        </ScrollView>
    );
};
//gdgdg
const styles = StyleSheet.create({
    container: {
        // padding: 20,
        
    // flex: 1,  
    padding: 20,
    backgroundColor: '#E3E3E3', 
    },
    label: {
        fontSize: 16,
        marginBottom: 10,
    },
    radioContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    radio: {
        fontSize: 16,
        marginRight: 20,
    },
    radioSelected: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 20,
        color: '#007400',
    },
    picker: {
        height: 50,
        width: '100%',
        textAlign: 'center',
        marginBottom: 10, 
        paddingHorizontal: 10, 
      },
      pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 20,
        height: 50,
        width: '100%',   
        justifyContent: 'center',
      },
      
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 20,
    },
    submitButton: {
        backgroundColor: '#006400',
        padding: 15,
        alignItems: 'center',
        marginBottom: 25,
        width: '50%',
        borderRadius: 25,
        alignSelf: 'center'
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    walletText: {
        fontSize: 16,
        color: '#333',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
       
    },
    modalContent: {
        backgroundColor: 'white',
        width: '80%',
        borderRadius: 10,
        padding: 20,
        height: 350,
        alignItems: 'center',
    },
    feesContainer: {
        marginTop: 2,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    feeText: {
        fontSize: 14,
        color: '#333',
        marginVertical: 5,
    },
    modalTitle: {
        fontSize: 18,
        marginBottom: 20,
    },
    walletItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        width: '100%',
    },
    modalCloseButton: {
        backgroundColor: '#006400',
        padding: 10,
        marginTop: 20,
        borderRadius: 5,
    },
    modalCloseButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default NewCardScreen;