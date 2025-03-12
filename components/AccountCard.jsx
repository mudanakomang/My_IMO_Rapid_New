import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Card from './Card';
import Icon from 'react-native-vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AccountCard = (props) => {
    const [wallets, setWallets] = useState([]);
    const [currentWalletIndex, setCurrentWalletIndex] = useState(0);
    const [showBalance, setShowBalance] = useState(true);

    useEffect(() => {
        const fetchWalletsData = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    const parsedData = JSON.parse(userData);
                    setWallets(parsedData.MyAccount || []);
                }
            } catch (error) {
                console.error('Error fetching wallet data:', error);
            }
        };

        fetchWalletsData();
    }, []);

    const handlePrevious = () => {
        setCurrentWalletIndex((prevIndex) =>
            prevIndex > 0 ? prevIndex - 1 : wallets.length - 1
        );
    };

    const handleNext = () => {
        setCurrentWalletIndex((prevIndex) =>
            prevIndex < wallets.length - 1 ? prevIndex + 1 : 0
        );
    };

    const handleShowBalance = () => {
        setShowBalance(true);
        setTimeout(() => {
            setShowBalance(false);
        }, 10000);   
    };

    const wallet = wallets[currentWalletIndex];

    return (
        <Card style={{ ...styles.card, ...props.style }}>
            {wallet ? (
                <View style={styles.cardContent}>
                    <View style={styles.accDetails}>
                        <Text style={styles.walletTitle}>
                            {wallet.currency_code} Wallet
                        </Text>
                        <Text style={styles.walletDetail}>
                            Account Number: {wallet.account_number || 'Not Available'}
                        </Text>
                        <Text style={styles.walletDetail}>
                            Bank Name: {wallet.bank_name || 'IMO'}
                        </Text>
                    </View>

                    <View style={styles.balanceContainer}>
                        {!showBalance ? (
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={handleShowBalance}
                                style={styles.balanceBtnWrapper} // Adjusted style to cover the whole area
                            >
                                <View style={styles.balanceBtn}>
                                    <Text style={styles.balanceBtnText}>Show my balance</Text>
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.balanceDetails}>
                                <Text style={styles.balanceText}>
                                    Balance: {wallet.balance} {wallet.currency_code}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.arrowButtons}>
                        <TouchableOpacity onPress={handlePrevious} style={styles.arrowBtn}>
                            <Icon name="left" style={styles.arrowText} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleNext} style={styles.arrowBtn}>
                            <Icon name="right" style={styles.arrowText} />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <Text style={styles.errorText}>No wallet data available</Text>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '100%',
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
    },
    cardContent: {
        width: '100%',
        height: '100%',
        padding: 15,
        justifyContent: 'space-between',
    },
    accDetails: {},
    walletTitle: {
        color: 'white',
        fontSize: 17,
        opacity: 0.9,
        fontWeight: '500',
        marginBottom: 7,
    },
    walletDetail: {
        color: 'white',
        fontSize: 15,
        opacity: 0.6,
    },
    balanceContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    balanceBtnWrapper: {
        width: '100%',  
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',  
    },
    balanceBtn: {
        borderWidth: 1,
        borderColor: 'white',
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 5,
        marginBottom: 10,
    },
    balanceBtnText: {
        color: 'white',
        opacity: 0.7,
    },
    balanceDetails: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    balanceText: {
        color: 'white',
        opacity: 0.7,
    },
    arrowButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'absolute',
        bottom: 15,
        left: 15,
        right: 15,
        zIndex: 1,
    },
    arrowBtn: {
        padding: 10,
        borderRadius: 5,
    },
    arrowText: {
        color: '#C6F801',
        fontSize: 18,
    },
    errorText: {
        color: 'white',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
});

export default AccountCard;
