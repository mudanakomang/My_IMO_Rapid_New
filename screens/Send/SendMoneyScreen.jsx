import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../constants/colors';
import axios from 'axios';
import tokenValidation from "../../components/validateToken"; 

const SendMoneyScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

        return () => {
            navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
        };
    }, [navigation]);

    useEffect(() => {
        const fetchTokenData = async () => {
            const validatedToken = await tokenValidation();

            if (!validatedToken || !validatedToken.token || !validatedToken.user_id) {
                console.error("Token validation failed.");
                return;
            }

            try {
                const transactionResponse = await axios.get(
                    "https://imorapidtransfer.com/api/v1/transaction/all",
                    {
                        headers: {
                            token: validatedToken.token,
                            token_expiration: validatedToken.token_expiration,
                        },
                        params: {
                            user_id: validatedToken.user_id,
                        },
                    }
                );

                const recentTransactions = transactionResponse.data.transactions.slice(0, 15);
                setTransactions(recentTransactions);
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTokenData();
    }, []);

    const navigateTo = (screen, params = {}) => {
        navigation.navigate(screen, params);
    };

    return (
        <LinearGradient colors={['#F4F4F4', '#F4F4F4']} style={styles.container}>
            <View style={styles.tabContainer}>
                <TouchableOpacity style={styles.tabButton} onPress={() => navigateTo("Payout")}>
                    <Text style={styles.tabText}>Pay Out</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabButton} onPress={() => navigateTo("RecieverDetails")}>
                    <Text style={styles.tabText}>Send</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabButton} onPress={() => navigateTo("FxPayoutScreen")}>
                    <Text style={styles.tabText}>FX Transfer</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer}>
                <View style={styles.contactSection}>
                    <Text style={styles.sectionText}>Last recent transactions</Text>

                    <View style={styles.tableHeader}>
                        <Text style={styles.tableHeaderCell}>Reference</Text>
                        <Text style={styles.tableHeaderCell}>Amount</Text>
                        <Text style={styles.tableHeaderCell}>Status</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={colors.primary} />
                    ) : transactions.length > 0 ? (
                        transactions.map((transaction) => (
                            <TouchableOpacity
                                key={transaction.id}  
                                onPress={() =>
                                    navigateTo("TransactionDetails", {
                                        transactionId: transaction.id,
                                        transactions: transactions,
                                    })
                                }
                                style={styles.transactionRow}
                            >
                                <View style={styles.transactionDetails}>
                                    <Text style={styles.tableCell}>{transaction.uuid}</Text>
                                    <Text style={styles.tableCell}>{transaction.currency_code} {transaction.total}</Text>
                                    <Text style={styles.tableCell}>{transaction.status}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text>No recent transactions available.</Text>
                    )}
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
        marginTop: 20,
    },
    tabButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        margin: 10,
        backgroundColor: '#F3F3F3',
        elevation: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '500',
    },
    scrollContainer: {
        paddingHorizontal: 20,
    },
    contactSection: {
        marginBottom: 40,
    },
    sectionText: {
        color: 'black',
        opacity: 0.5,
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        marginVertical: 5,
    },
    tableHeaderCell: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    transactionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 5,
        marginVertical: 3,
        elevation: 2,
        borderBottomWidth: 1,
    },
    transactionDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    tableCell: {
        fontSize: 14,
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
});

export default SendMoneyScreen;
