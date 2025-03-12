import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Modal, FlatList } from 'react-native';

import axios from 'axios'; 
import validateToken from '../../components/validateToken';
import { Picker } from '@react-native-picker/picker';
import debounce from 'lodash/debounce';

const API_URL = 'https://imorapidtransfer.com/api/v1/';

const FxPayoutScreen = ({ navigation }) => {
    const [wallets, setWallets] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [selectedDestination, setSelectedDestination] = useState(null);
    const [selectedBank, setSelectedBank] = useState(null);
    const [amount, setAmount] = useState('');
    const [destinationCurrencyRateHtml, setExchangeRate] = useState(null);
    const [getAmountMoneyFormat, setGetAmountMoneyFormat] = useState('');
    const [getdestinationCurrencyCode, destinationCurrencyCode] = useState(null);
    const [isConfirmationModalVisible, setConfirmationModalVisible] = useState(false);
    const [bankName, setBankName] = useState('');
    const [routingNumber, setRoutingNumber] = useState('');
    const [swiftCode, setSwiftCode] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [streetNumber, setStreetNumber] = useState('');
    const [streetName, setStreetName] = useState('');
    const [city, setCity] = useState('');
    const [accNumber, setaccountNumber] = useState('');
    const [accName, setaccountName] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('Loading...');
    const [showWalletPicker, setShowWalletPicker] = useState(false);
    const [showDestinationPicker, setShowDestinationPicker] = useState(false);
    const [showBankPicker, setShowBankPicker] = useState(false);
    const [isWalletModalVisible, setWalletModalVisible] = useState(false);
    const [isDestinationModalVisible, setDestinationModalVisible] = useState(false);
  
    useEffect(() => {
        navigation.setOptions({
            title: 'FX Transfer',
        });
    }, [navigation]);

    useEffect(() => {
        navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

        return () => {
            navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
        };
    }, [navigation]);

    const fetchWalletsAndDestinations = async () => {
        setLoading(true);
        try {
            const { user_id, token, token_expiration } = await validateToken();
    
            const [walletResponse, destinationResponse] = await Promise.all([
                axios.get(`${API_URL}wallets/payout`, {
                    headers: {
                        'Content-Type': 'application/json',
                        token,
                        token_expiration,
                    },
                    params: {
                        user_id,
                    },
                }),
                axios.post(`${API_URL}transfer/fx/destinations`, {
                    user_id,
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        token,
                        token_expiration,
                    },
                }),
            ]);
    
            console.log('Wallets Request:', { user_id });
            console.log('Wallets Response:', walletResponse.data);
            console.log('Destinations Request:', { user_id });
            console.log('Destinations Response:', destinationResponse.data);
    
            if (walletResponse.data && walletResponse.data.data) {
                setWallets(walletResponse.data.data);
            } else {
                alert(walletResponse.data.message || 'Failed to fetch wallets.');
                return;
            }
            
            if (destinationResponse.data && Array.isArray(destinationResponse.data)) {
                setDestinations(destinationResponse.data);
            } else {
                alert('Failed to fetch destinations.');
                return;
            }
        } catch (error) {
            console.error('Error fetching wallets or destinations:', error);
            alert('Error fetching data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletsAndDestinations();
    }, []);

    useEffect(() => {
        if (!selectedWallet || !selectedDestination || !amount) {
            setExchangeRate(null);
            setGetAmountMoneyFormat('');
            return;
        }
        fetchExchangeRate();
    }, [amount, selectedWallet, selectedDestination]);
    

    const fetchExchangeRate = useCallback(debounce(async () => {
        if (!selectedWallet || !selectedDestination || !amount) return;

        try {
            const { token, token_expiration, user_id } = await validateToken();
            const selectedWalletData = wallets.find(wallet => wallet.id === selectedWallet);
            const selectedDestinationData = destinations.find(destination => destination.id === selectedDestination);

            if (!selectedWalletData?.currency || !selectedDestinationData?.currency_id) {
                console.error('Missing currency data for wallet or destination');
                return;
            }

            const response = await axios.post(
                'https://imorapidtransfer.com/api/v1/vcards/exchange/get-currencies-exchange-rate',
                {
                    fromWallet: selectedWalletData.currency?.id,
                    fromWalletCode: selectedWalletData.currency?.code,
                    toWallet: selectedDestinationData?.currency_id,
                    amount,
                },
                { headers: { token, token_expiration } }
            );
             
            const originalData = response.data?.original;
            if (originalData?.exchange_value && originalData?.getAmountMoneyFormat) {
                setExchangeRate(originalData.exchange_value);
                
                setGetAmountMoneyFormat(originalData.getAmountMoneyFormat);
            } else {
                throw new Error("Invalid response data");
            }
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            setExchangeRate(null);
            Alert.alert('Error', 'Failed to fetch exchange rate. Please try again.');
        }
    }, 500));
    
    

    useEffect(() => {
        fetchExchangeRate();
    }, [amount, selectedWallet, selectedDestination]);

    useEffect(() => {
        if (!selectedDestination) {
            setBanks([]);  
            return;
        }
    
        const fetchBanks = async () => {
            setLoading(true);
            try {
                const { token, token_expiration } = await validateToken();
                const iso2 = destinations.find(destination => destination.id === selectedDestination)?.iso2;
                const response = await axios.post(
                    'https://imorapidtransfer.com/api/v1/get-for-fx/payout/bank',
                    { iso2 },
                    { headers: { token, token_expiration } }
                );
    
                console.log('Banks Request:', { iso2 });
                console.log('Banks Response:', response.data);
    
                if (response.data.status === 'success' && response.data.data.banks.length > 0) {
                    setBanks(response.data.data.banks);
                } else {
                    setBanks([]);  
                }
            } catch (error) {
                // console.error('Error fetching banks:', error);
                Alert.alert('', 'Unable to Fetch Destination Bank, Key in the Bank Name');
            } finally {
                setLoading(false);
            }
        };
    
        fetchBanks();
    }, [selectedDestination]);
     
    const handleAmountChange = (value) => {
        const selectedWalletData = wallets.find(wallet => wallet.id === selectedWallet);
        const walletBalance = parseFloat(selectedWalletData?.balance || 0);
        const walletLimit = parseFloat(selectedWalletData?.limit_amount || 0);

        const parsedValue = parseFloat(value) || 0;

        if (parsedValue > walletBalance) {
            Alert.alert('Error', 'Amount exceeds wallet balance');
            setAmount('');
            return;
        }

        if (parsedValue > walletLimit) {
            Alert.alert('Error', 'Amount exceeds wallet limit');
            setAmount('');
            return;
        }

        setAmount(value);
    };

    

    const handleWalletChange = (itemValue) => {
        setSelectedWallet(itemValue);
        setAmount('');  
    };
    const handleWalletSelection = (walletId) => {
        setSelectedWallet(walletId);
        setWalletModalVisible(false);
    };
    
    const handleDestinationChange = (itemValue) => {
        setSelectedDestination(itemValue);
        setAmount('');  
        setSelectedBank(null);
    };
  
    const handleDestinationSelection = (destinationId) => { 
        setSelectedDestination(destinationId);
        setDestinationModalVisible(false);
        setSelectedBank(null);  
        setBanks([]);
    };
    

    const handleBankChange = (itemValue) => {
        setSelectedBank(itemValue.code);  
        setBankName('');  
    };
    
    
    
    const handleSubmit = () => {
        if (!selectedWallet || !amount || !selectedDestination || (!selectedBank && !bankName) || !routingNumber || !swiftCode || !postalCode || !streetNumber || !streetName || !city) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
    
        setConfirmationModalVisible(true);
    };
    
    const handleConsentAndVerifyPin = () => {
        setConfirmationModalVisible(false);
        
        navigation.navigate('PinVerify', {
            onSuccess: () => {
                proceedWithSubmission();
            },
            onFailed: () => {
                Alert.alert('Error', 'Pin verification failed. Please try again.');
            }
        });
    };
    
    
    const proceedWithSubmission = async () => {
        setLoadingMessage('Submitting transfer...');  
        setLoading(true);
    
        try {
            const { token, token_expiration, user_id } = await validateToken();
            const selectedDestinationData = destinations.find(destination => destination.id === selectedDestination);
            const selectedBankData = banks.find(bank => bank.code === selectedBank);
    
            const response = await axios.post('https://imorapidtransfer.com/api/v1/transfer/fx/submit', {
                wallet_id: selectedWallet,
                amount,
                destination: selectedDestinationData,  
                bank_name: selectedBankData || bankName, 
                account_number: accNumber,
                account_name: accName,
                routing_number: routingNumber,
                swift_code: swiftCode,
                postal_code: postalCode,
                street_number: streetNumber,
                street_name: streetName,
                city,
                user_id,
            }, {
                headers: { token, token_expiration },
            });
    
            console.log('Transfer Submit Response:', response.data);
    
            const txRef = response.data.txRef; 
    
            if (response.data.status === 'success') {
                navigation.navigate("PaymentStatus", { status: "successful", txRef });
                Alert.alert('Success', 'Transfer submitted successfully!');
            } else {
                navigation.navigate("PaymentStatus", { status: "pending", txRef });
                Alert.alert('Error', response.data.message);
            }
        } catch (error) {
            console.error('Error submitting transfer:', error);
            navigation.navigate("PaymentStatus", { status: "failed", txRef: null }); 
            Alert.alert('Error', 'Failed to submit transfer. Please try again.');
        } finally {
            setLoading(false);
            setLoadingMessage('Loading...');  
        }
    };
    
    

    return (
        <View style={styles.container}>
            {loading && (
                <Modal transparent animationType="fade">
                    <View style={styles.overlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>{loadingMessage || 'Loading...'}</Text>
                    </View>
                </Modal>
            )}

            <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.section}>
                    <Text style={styles.label}>Select Wallet</Text>
                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => setWalletModalVisible(true)}
                    >
                        <Text>
                            {selectedWallet
                                ? wallets.find((wallet) => wallet.id === selectedWallet)?.currency?.name
                                : 'Select a wallet'}
                        </Text>
                    </TouchableOpacity>
                    <Modal visible={isWalletModalVisible} animationType="slide" onRequestClose={() => setWalletModalVisible(false)}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modal}>
                                <FlatList
                                    data={wallets}
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity onPress={() => handleWalletSelection(item.id)}>
                                            <Text style={styles.modalItem}>{`${item.currency.name} + ${item.balance}`}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                                <TouchableOpacity
                                    style={styles.modalClose}
                                    onPress={() => setWalletModalVisible(false)}
                                >
                                    <Text style={styles.modalCloseText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Select Destination</Text>
                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => setDestinationModalVisible(true)}
                    >
                        <Text>
                            {selectedDestination
                                ? destinations.find((destination) => destination.id === selectedDestination)?.country_name
                                : 'Select a destination'}
                        </Text>
                    </TouchableOpacity>
                    <Modal visible={isDestinationModalVisible} animationType="slide" onRequestClose={() => setDestinationModalVisible(false)}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modal}>
                                <FlatList
                                    data={destinations}
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity onPress={() => handleDestinationSelection(item.id)}>
                                            <Text style={styles.modalItem}>{item.country_name}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                                <TouchableOpacity
                                    style={styles.modalClose}
                                    onPress={() => setDestinationModalVisible(false)}
                                >
                                    <Text style={styles.modalCloseText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                        </View>
                        <View style={styles.section}>
                        <Text style={styles.label}>Amount</Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={handleAmountChange}
                            keyboardType="numeric"
                            placeholder="Enter Amount"
                        />
                    </View>

                    {getAmountMoneyFormat && (
                        <View style={styles.section}>
                            <Text style={styles.detailsText}>
                                Amount in Destination: {getAmountMoneyFormat}
                            </Text>
                        </View>
                    )}

                <Modal visible={showBankPicker} animationType="slide" transparent>
                    <View style={styles.modalContainer}>
                        <View style={styles.modal}>
                        <FlatList
                                data={banks}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.modalItemContainer}
                                        onPress={() => {
                                            handleBankChange(item);   
                                            setShowBankPicker(false);
                                        }}
                                    >
                                        <Text style={styles.modalItem}>{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                            />

                            <TouchableOpacity
                                style={styles.modalClose}
                                onPress={() => setShowBankPicker(false)}
                            >
                                <Text style={styles.modalCloseText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {banks.length > 0 ? (
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Select Bank</Text>
                        <TouchableOpacity onPress={() => setShowBankPicker(true)} style={styles.selectInput}>
                            <Text style={styles.inputValue}>
                                {selectedBank 
                                    ? banks.find(bank => bank.code === selectedBank)?.name || 'Choose Bank' 
                                    : 'Choose Bank'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TextInput
                        placeholder="Bank Name"
                        value={bankName}
                        onChangeText={setBankName}
                        style={styles.input}
                    />
                )}
                   <View style={styles.section}>
                    <Text style={styles.label}>Account Number</Text>
                    <TextInput
                        style={styles.input}
                        value={accNumber}
                        onChangeText={setaccountNumber}
                        placeholder="Account Number"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Account name</Text>
                    <TextInput
                        style={styles.input}
                        value={accName}
                        onChangeText={setaccountName}
                        placeholder="Beneficiary name"
                    />
                </View>
                <View style={styles.section}>
                    <Text style={styles.label}>Routing Number</Text>
                    <TextInput
                        style={styles.input}
                        value={routingNumber}
                        onChangeText={setRoutingNumber}
                        keyboardType="numeric"
                        placeholder="Enter Routing Number"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>SWIFT Code</Text>
                    <TextInput
                        style={styles.input}
                        value={swiftCode}
                        onChangeText={setSwiftCode}
                        placeholder="Enter SWIFT Code"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Postal Code</Text>
                    <TextInput
                        style={styles.input}
                        value={postalCode}
                        onChangeText={setPostalCode}
                        placeholder="Enter Postal Code"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Street Number</Text>
                    <TextInput
                        style={styles.input}
                        value={streetNumber}
                        onChangeText={setStreetNumber}
                        placeholder="Enter Street Number"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Street Name</Text>
                    <TextInput
                        style={styles.input}
                        value={streetName}
                        onChangeText={setStreetName}
                        placeholder="Enter Street Name"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>City</Text>
                    <TextInput
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="Enter City"
                    />
                </View>

                <Modal
                  visible={isConfirmationModalVisible}
                       transparent
                           animationType="slide"
                            >
                                <View style={styles.modalContainer}>
                                    <View style={styles.modal}>
                                        <Text style={styles.modalTitle}>Confirm Transaction</Text>
                                        <View style={styles.separator} />
                                        
                                        <ScrollView contentContainerStyle={styles.scrollContainer}>
                                        <View style={styles.modalItemContain}>
                                                <Text style={styles.labeler}>Debit Amount:</Text>
                                                <Text style={styles.content}>
                                                {amount}  {wallets.find(wallet => wallet.id === selectedWallet)?.currency?.code || 'N/A'}
                                                </Text>
                                            </View>
                                         
                                            <View style={styles.separatorLine} />
                                            <View style={styles.modalItemContain}>
                                                <Text style={styles.labeler}>Destination:</Text>
                                                <Text style={styles.content}>
                                                    {selectedDestination
                                                        ? destinations.find((destination) => destination.id === selectedDestination)?.country_name
                                                        : 'No destination selected'}
                                                </Text>
                                            </View>

                                            <View style={styles.separatorLine} />

                                           
                                            <View style={styles.modalItemContain}>
                                                <Text style={styles.labeler}>City:</Text>
                                                <Text style={styles.content}>{city}</Text>
                                            </View>
                                            <View style={styles.separatorLine} />
                                            <View style={styles.modalItemContain}>
                                                <Text style={styles.labeler}>Destination Amount:</Text>
                                                <Text style={styles.content}>{getAmountMoneyFormat}</Text>
                                            </View>
                                            <View style={styles.separatorLine} />

                                            <View style={styles.modalItemContain}>
                                                <Text style={styles.labeler}>Bank:</Text>
                                                <Text style={styles.content}>
                                                    {selectedBank
                                                        ? banks.find(bank => bank.code === selectedBank)?.name || 'Bank not found'
                                                        : bankName || 'No bank selected'}
                                                </Text>
                                            </View>
                                            <View style={styles.separatorLine} />

                                            <View style={styles.modalItemContain}>
                                                <Text style={styles.labeler}>Beneficiary:</Text>
                                                <Text style={styles.content}>{accName}</Text>
                                            </View>
                                            <View style={styles.separatorLine} />

                                            <View style={styles.modalItemContain}>
                                                <Text style={styles.labeler}>Account number:</Text>
                                                <Text style={styles.content}>{accNumber}</Text>
                                            </View>

                                            <View style={styles.separatorLine} />

                                            <View style={styles.modalItemContain}>
                                                <Text style={styles.labeler}>Routing Number:</Text>
                                                <Text style={styles.content}>{routingNumber}</Text>
                                            </View>

                                            <View style={styles.separatorLine} />

                                            <View style={styles.modalItemContain}>
                                                <Text style={styles.labeler}>SWIFT Code:</Text>
                                                <Text style={styles.content}>{swiftCode}</Text>
                                            </View>

                                            <View style={styles.separatorLine} />

                                            <View style={styles.modalItemContain}>
                                                <Text style={styles.labeler}>Postal Code:</Text>
                                                <Text style={styles.content}>{postalCode}</Text>
                                            </View>

                                            <View style={styles.separatorLine} />

                                            <View style={styles.modalItemContain}>
                                                <Text style={styles.labeler}>Street Number:</Text>
                                                <Text style={styles.content}>{streetNumber}</Text>
                                            </View>

                                            <View style={styles.separatorLine} />

                                            <View style={styles.modalItemContain}>
                                                <Text style={styles.labeler}>Street Name:</Text>
                                                <Text style={styles.content}>{streetName}</Text>
                                            </View>
                                            <View style={styles.separatorLine} />

                                            <View style={styles.detailsText}>
                                            <Text style={styles.label}>i confirm the payment instruction provided and agree IMO Rapid Transfer is not liable for any payment to un-intended parties</Text>
                                           
                                            <View style={styles.separatorLine} />
                                            <Text style={styles.label}>Payment made outside Africa are takes 0-24hrs durring working days:</Text>
                                            </View>

                                            <View style={styles.separatorLine} />

                                        <View style={styles.buttonContain}>
                                            <TouchableOpacity onPress={handleConsentAndVerifyPin} style={styles.confirmButton}>
                                                <Text style={styles.buttonText}>Consent & Proceed</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setConfirmationModalVisible(false)} style={styles.cancelButton}>
                                                <Text style={styles.buttonText}>Cancel</Text>
                                            </TouchableOpacity>
                                        </View>
                                        </ScrollView>
                                    </View>
                                </View>
                            </Modal>




                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        padding: 16,
    },
    section: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        marginTop: 8,
        borderRadius: 8,
        justifyContent: 'center',
        height: 50,
        fontSize: 16,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    modal: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 8,
        width: '97%',
        maxHeight: '85%',
    },
    modalItem: {
        padding: 16,
        fontSize: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    modalItemContainer: {
        marginVertical: 5,
    },
    modalClose: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        borderRadius: 25,
        alignSelf: 'center',
        marginTop: 16,
        width: '50%',
    },
    modalCloseText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    overlay: {
        flex: 1,
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#fff',
        fontSize: 16,
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
    selectInput: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        justifyContent: 'center',
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    detailsText: {
        backgroundColor: '#e0f7fa',
        padding: 8,
        marginVertical: 3,
        borderRadius: 5,
        fontSize: 14,
    },

    modalTitle: {
        fontSize: 22,
        fontWeight: '900',  
        textAlign: 'center',
        marginBottom: 15,
    },

    separator: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginBottom: 20,
    },
    modalItemContain: {
        flexDirection: 'row',  
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    labeler: {
        fontWeight: 'bold',
        fontSize: 14,  
        // flex: 1,  
    },
    content: {
        fontSize: 14,  
        color: '#555',
        flex: 2,  
        textAlign: 'right', 
    },
    separatorLine: {
        borderBottomWidth: 0.5,
        borderBottomColor: '#ddd',
        marginVertical: 10,
    },
    buttonContain: {
        flexDirection: 'row',
        justifyContent: 'space-between',  
        width: '100%', 
        marginTop: 20,
    },
    confirmButton: {
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 8,
        width: '48%', 
    },
    cancelButton: {
        backgroundColor: '#dc3545',
        padding: 12,
        borderRadius: 8,
        width: '48%',  
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    
});

export default FxPayoutScreen;