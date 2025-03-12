import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isOtpModalVisible, setIsOtpModalVisible] = useState(false);
    const [otp, setOtp] = useState('');
    const [storedOtp, setStoredOtp] = useState('');
    const navigation = useNavigation();

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(prevState => !prevState);
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const saveCredentialsForFingerprint = async (email, password, username) => {
        try {
            await SecureStore.setItemAsync('fingerprint_email', email);
            await SecureStore.setItemAsync('fingerprint_password', password);
            await SecureStore.setItemAsync('fingerprint_username', username);
            console.log("Credentials saved for fingerprint login.");
        } catch (error) {
            console.error("Failed to save credentials:", error);
        }
    };
    
    // const handleLogin = async () => {
    //     if (!isValidEmail(email)) {
    //         Alert.alert("Invalid Email", "Please enter a valid email address.");
    //         return;
    //     }
    
    //     setIsLoading(true);
    //     try {
    //         await AsyncStorage.removeItem('userData');
    
    //         const response = await axios.post('https://imorapidtransfer.com/api/v1/login', {
    //             email: email,
    //             password: password,
    //         });
    
    //         const data = response.data;
    
    //         if (data.account_status === "suspended" || data.account_status === "pending") {
    //             Alert.alert(
    //                 "Account Access Restricted",
    //                 data.account_status === "suspended"
    //                     ? "Your account is suspended. Please contact support."
    //                     : "Your account is pending approval. Please wait or contact support."
    //             );
    //             setIsLoading(false);
    //             return;
    //         }
    
    //         if (data.reg_com !== '1') {
    //             const userData = {
    //                 token: String(data.token),
    //                 token_expiration: String(data.token_expiration),
    //                 user_id: String(data.user_id),
    //                 defaultcountry: String(data.defaultcountry),
    //                 email: String(data.email),
    //                 reg_com: String(data.reg_com),
    //                 red_flag: String(data.red_flag),
    //                 deposit_status: String(data.deposit_status),
    //                 payout_status: String(data.payout_status),
    //                 photo_verification: String(data.photo_verification),
    //             };
    //             await AsyncStorage.setItem('userData', JSON.stringify(userData));
    //             navigation.navigate('FinalRegistrationScreen');
    //             setIsLoading(false);
    //             return;
    //         }

    //         if (data.photo_verification !== "VERIFIED") {
    //             const userData = {
    //                 token: String(data.token),
    //                 token_expiration: String(data.token_expiration),
    //                 user_id: String(data.user_id),
    //                 email: String(data.email),
    //                 photo_verification: String(data.photo_verification),                    
    //             };
    //             await AsyncStorage.setItem('userData', JSON.stringify(userData));
    //             navigation.navigate('PhotoVerificationScreen'); 
    //             setIsLoading(false);
    //             return;
    //         }
     
    //         const userData = {
    //             token: String(data.token),
    //             token_expiration: String(data.token_expiration),
    //             user_id: String(data.user_id),
    //             first_name: String(data.first_name),
    //             last_name: String(data.last_name),
    //             userName: String(data.first_name),
    //             pin: String(data.pin),
    //             account_number: String(data.account_number),
    //             defaultcountry: String(data.defaultcountry),
    //             email: String(data.email),
    //             reg_com: String(data.reg_com),
    //             red_flag: String(data.red_flag),
    //             deposit_status: String(data.deposit_status),
    //             payout_status: String(data.payout_status),
    //             transactions: data.transactions,
    //             bank_account: String(data.bank_account),
    //             photo_verification: String(data.photo_verification),
    //             login_otp: String(data.login_otp).trim(),
    //             MyAccount: data.MyAccount,
    //             profile_picture: data.profile_picture,
    //             csrf_token: String(data.csrf_token),
    //             auth_token: String(data.auth_token)
    //         };
    
    //         await AsyncStorage.setItem('userData', JSON.stringify(userData));
    
    //         await saveCredentialsForFingerprint(email, password);
    
    //         setStoredOtp(String(data.login_otp).trim());
    //         setIsOtpModalVisible(true);
    //     } catch (error) {
    //         console.error(error);
    //         Alert.alert("Error", "Invalid credentials.");
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const handleLogin = async () => {
        if (!isValidEmail(email)) {
            Alert.alert('Error', error.response?.data?.message || "Invalid Email. Please enter a valid email address.");

            return;
        }
    
        setIsLoading(true);
        try {
            await AsyncStorage.removeItem('userData');
    
            const response = await axios.post('https://imorapidtransfer.com/api/v1/login', {
                email: email,
                password: password,
            });
    
            const data = response.data;
    
            if (data.account_status === "suspended" || data.account_status === "pending") {
                Alert.alert(
                    "Account Access Restricted",
                    data.account_status === "suspended"
                        ? "Your account is suspended. Please contact support."
                        : "Your account is pending approval. Please wait or contact support."
                );
                setIsLoading(false);
                return;
            }
    
            if (data.reg_com !== '1') {
                const userData = {
                    token: String(data.token),
                    token_expiration: String(data.token_expiration),
                    user_id: String(data.user_id),
                    defaultcountry: String(data.defaultcountry),
                    email: String(data.email),
                    reg_com: String(data.reg_com),
                    red_flag: String(data.red_flag),
                    deposit_status: String(data.deposit_status),
                    payout_status: String(data.payout_status),
                    photo_verification: String(data.photo_verification),
                };
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                navigation.navigate('FinalRegistrationScreen');
                setIsLoading(false);
                return;
            }
    
            if (data.photo_verification !== "VERIFIED") {
                const userData = {
                    token: String(data.token),
                    token_expiration: String(data.token_expiration),
                    user_id: String(data.user_id),
                    email: String(data.email),
                    photo_verification: String(data.photo_verification),
                };
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                navigation.navigate('PhotoVerificationScreen');
                setIsLoading(false);
                return;
            }
    
            const userData = {
                token: String(data.token),
                token_expiration: String(data.token_expiration),
                user_id: String(data.user_id),
                first_name: String(data.first_name),
                last_name: String(data.last_name),
                userName: String(data.first_name), // This is where the username is saved
                pin: String(data.pin),
                account_number: String(data.account_number),
                defaultcountry: String(data.defaultcountry),
                email: String(data.email),
                reg_com: String(data.reg_com),
                red_flag: String(data.red_flag),
                deposit_status: String(data.deposit_status),
                payout_status: String(data.payout_status),
                transactions: data.transactions,
                bank_account: String(data.bank_account),
                photo_verification: String(data.photo_verification),
                login_otp: String(data.login_otp).trim(),
                MyAccount: data.MyAccount,
                profile_picture: data.profile_picture,
                csrf_token: String(data.csrf_token),
                auth_token: String(data.auth_token),
            };
    
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
    
            // Save credentials to SecureStore (email, password, username)
            await saveCredentialsForFingerprint(email, password, data.first_name); // Save username here
    
            setStoredOtp(String(data.login_otp).trim());
            setIsOtpModalVisible(true);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || "Invalid credentials.");
 
        } finally {
            setIsLoading(false);
        }
    };
     
   
    const handleOtpChange = (input) => {
        setOtp(input.trim());

        if (input.trim().length === 6) {
            handleOtpVerification(input.trim());
        }
    };

    const handleOtpVerification = async (inputOtp) => {
        try {
            const trimmedOtp = inputOtp.trim();
            const userData = await AsyncStorage.getItem('userData');
            const parsedData = JSON.parse(userData);

            if (!parsedData) throw new Error("User data not found");

            if (trimmedOtp === parsedData.login_otp) {
                Alert.alert("Success", "Welcome Back!");
                setIsOtpModalVisible(false);
                setOtp('');
                navigation.replace('Main');
            } else {
                throw new Error("Invalid OTP");
            }
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to verify OTP.");
        }
    };

    const closeOtpModal = () => {
        setIsOtpModalVisible(false);
        setOtp('');
    };

    return (
        <View style={styles.formContainer}>
            <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
            />
            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#888"
                    secureTextEntry={!isPasswordVisible}
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                    <Ionicons
                        name={isPasswordVisible ? 'eye-off' : 'eye'}
                        size={24}
                        color="#888"
                    />
                </TouchableOpacity>
            </View>
            <TouchableOpacity
                style={[styles.submitButton, isLoading && { opacity: 0.6 }]}
                onPress={handleLogin}
                disabled={isLoading}
            >
                <Text style={styles.submitButtonText}>
                    {isLoading ? 'Signing in...' : 'Sign in'}
                </Text>
            </TouchableOpacity>

            {/* OTP Modal */}
            <Modal
                transparent={true}
                visible={isOtpModalVisible}
                animationType="slide"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity 
                            style={styles.closeButton} 
                            onPress={closeOtpModal}  
                        >
                            <Ionicons name="close-circle" size={30} color="#888" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Enter OTP</Text>
                        <TextInput
                            style={styles.otpInput}
                            placeholder="6-digit code"
                            keyboardType="numeric"
                            maxLength={6}
                            value={otp}
                            onChangeText={handleOtpChange}  
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};
 
const styles = StyleSheet.create({
    formContainer: {
        width: '100%',
        paddingHorizontal: 20,
        paddingVertical: 30,
        backgroundColor: 'white',
        borderRadius: 10,
        elevation: 5,
    },
    input: {
        width: '100%',
        height: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginBottom: 20,
        paddingHorizontal: 10,
        fontSize: 16,
        color: '#000',
    },
    passwordContainer: {
        position: 'relative',
    },
    eyeIcon: {
        position: 'absolute',
        right: 10,
        top: 15,
    },
    submitButton: {
        backgroundColor: '#28a745',
        paddingVertical: 15,
        paddingHorizontal: 20,  
        borderRadius: 25,
        marginTop: 20,
        width: '60%', 
        alignSelf: 'center',  
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    otpInput: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
});

export default LoginForm;