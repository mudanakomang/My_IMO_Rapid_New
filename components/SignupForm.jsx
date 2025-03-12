import React, { useState } from 'react';
import { StyleSheet, View, Linking, Text, TextInput, TouchableOpacity, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import Icon from 'react-native-vector-icons/FontAwesome';  
import AuthFormInput from '../components/AuthFormInput';
 
import axios from 'axios';  

const SignupForm = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [city, setCity] = useState('');
    const [otpModalVisible, setOtpModalVisible] = useState(false);
    const [verificationModalVisible, setVerificationModalVisible] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [country, setCountry] = useState(null);
    const [dialCode, setDialCode] = useState('');
    const [countryPickerVisible, setCountryPickerVisible] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);  
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);  
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOtpValid, setIsOtpValid] = useState(false);

    const onSelectCountry = (country) => {
        setCountry(country);
        setCountryCode(country.cca2);
        setDialCode(country.callingCode[0]);
        setCountryPickerVisible(false);
    };

    const handlePhoneNumberChange = (value) => {
        setPhoneNumber(value);
    };

    const validateForm = () => {
        let valid = true;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address');
            valid = false;
        } else {
            setEmailError('');
        }

        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
            valid = false;
        } else {
            setPasswordError('');
        }

        return valid;
    };

    const handleSubmit = async () => {
        if (validateForm() && isOtpValid) {
            setIsLoading(true);

             
            const nameParts = fullName.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];

            const userData = {
                fullName,
                firstName,
                lastName,
                email,
                countryCode: dialCode,
                phoneNumber,
                password,
                city,
                verificationCode,  
                countryName: country?.name,
                countryIso2: country?.cca2,
                countryIso3: country?.ccn3,
            };

            try {
                const response = await axios.post('https://imorapidtransfer.com/api/v1/register', userData);

                if (response.data.status === 'success') {
                    alert('Registration successful!');
                } else {
                    alert('Registration failed, please try again');
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Error registering user:', error);
                alert('Error during registration. Please try again.');
                setIsLoading(false);
            }
        } else {
            alert('Please verify the OTP first.');
        }
    };

    const handleVerifyOtp = async () => {
        try {
            const response = await axios.post('https://imorapidtransfer.com/api/v1/verify-otp', {
                countryCode: dialCode,
                phoneNumber: phoneNumber,
                otp: verificationCode,
            });

            if (response.data.status === 'verified') {
                setIsOtpValid(true);
                setVerificationModalVisible(false);
                alert('Phone verified successfully');
            } else {
                alert('Invalid OTP. Please try again.');
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            alert('Error verifying OTP. Please try again.');
        }
    };

    const handleResendOtp = async () => {
        try {
            const response = await axios.post('https://imorapidtransfer.com/api/v1/resend-otp', {
                countryCode: dialCode,
                phoneNumber: phoneNumber,
            });

            if (response.data.status === 'success') {
                alert('OTP resent. Please check your phone');
            } else {
                alert('Failed to resend OTP, please try again');
            }
        } catch (error) {
            console.error('Error resending OTP:', error);
            alert('Error resending OTP. Please try again.');
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.container}>
                    {/* Full Name */}
                    <AuthFormInput
                        placeholder="Full Name"
                        value={fullName}
                        onChangeText={(text) => setFullName(text)}
                        placeholderTextColor="white"
                        style={styles.input}
                    />

                    {/* Email */}
                    <AuthFormInput
                        placeholder="Email Address"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (emailError) {
                                setEmailError('');   
                            }
                        }}
                    />
                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                    {/* Password */}
                    <AuthFormInput
                        placeholder="Password"
                        secureTextEntry={!isPasswordVisible}  
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (passwordError) {
                                setPasswordError('');  
                            }
                        }}
                        style={styles.input}
                        rightIcon={
                            <Icon name={isPasswordVisible ? 'eye-slash' : 'eye'} size={20} color="gray" />
                        }
                        onIconPress={() => setIsPasswordVisible(!isPasswordVisible)} 
                    />

                    {/* Confirm Password */}
                    <AuthFormInput
                        placeholder="Confirm Password"
                        secureTextEntry={!isConfirmPasswordVisible}   
                        value={confirmPassword}
                        onChangeText={(text) => {
                            setConfirmPassword(text);
                            if (passwordError) {
                                setPasswordError('');   
                            }
                        }}
                        style={styles.input}
                        rightIcon={
                            <Icon name={isConfirmPasswordVisible ? 'eye-slash' : 'eye'} size={20} color="gray" />
                        }
                        onIconPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}  
                    />
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                  {/* Country */}
                  <View style={[styles.input, styles.countryContainer]}>
                        <TouchableOpacity 
                            onPress={() => setCountryPickerVisible(true)} 
                            style={styles.countryPickerButton}
                        >
                            {country && (
                                <>
                                    <Text style={styles.countryFlag}></Text>
                                    <Text style={styles.selectedCountryText}>
                                        {country.name}
                                    </Text>
                                </>
                            )}
                            {!country && <Text style={styles.placeholderText}></Text>}
                        </TouchableOpacity>
                        <CountryPicker
                            countryCode={countryCode}
                            withFilter
                            withFlag
                            withCallingCode
                            onSelect={onSelectCountry}
                            visible={countryPickerVisible}
                            onClose={() => setCountryPickerVisible(false)}
                        />
                    </View>


                    {/* Phone Number */}
                    <View style={styles.formContainer}>
                        <Text style={styles.formTitle}></Text>
                        <View style={styles.phoneInputContainer}>
                            <TextInput
                                style={styles.dialCodeInput}
                                value={dialCode}
                                editable={false}
                            />
                            <TextInput
                                style={styles.phoneNumberInput}
                                value={phoneNumber}
                                onChangeText={handlePhoneNumberChange}
                                placeholder="Phone Number"
                                placeholderTextColor="white"  
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading || !isOtpValid}>
                        <Text style={styles.submitButtonText}>Submit</Text>
                    </TouchableOpacity>

                    {/* terms */}
                    <View style={{ flex: 1, flexDirection: 'row', marginTop: 20 }}>
                        <Text 
                            style={{
                                color: '#9393A7',
                                alignSelf: 'flex-end',
                                marginBottom: 10,
                                textAlign: 'center'
                            }}
                        >
                            By signing up, you agree to the{' '}
                            <Text 
                                style={{ color: '#7562EB' }} 
                                onPress={() => Linking.openURL('https://imorapidtransfer.com/terms-conditions')}
                            >
                                Terms & Conditions
                            </Text> and{' '}
                            <Text 
                                style={{ color: '#7562EB' }} 
                                onPress={() => Linking.openURL('https://imorapidtransfer.com/privacy-policy')}
                            >
                                Privacy Policy
                            </Text>.
                        </Text>
                    </View>
                </View>

                {/* OTP Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={otpModalVisible}
                    onRequestClose={() => setOtpModalVisible(false)}
                >
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>OTP Verification</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter OTP"
                            value={verificationCode}
                            onChangeText={(text) => setVerificationCode(text)}
                            keyboardType="numeric"
                            maxLength={6}
                        />
                        <TouchableOpacity 
                            style={styles.verifyOtpButton} 
                            onPress={handleVerifyOtp}
                        >
                            <Text style={styles.verifyOtpButtonText}>Verify OTP</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.resendOtpButton} 
                            onPress={handleResendOtp}
                        >
                            <Text style={styles.resendOtpButtonText}>Resend OTP</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#1E1E1E',
        borderRadius: 15,
        shadowOpacity: 0.1,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    input: {
        marginBottom: 10,
        height: 45,
        borderColor: 'white',
        borderWidth: 1,
        borderRadius: 10,
        paddingLeft: 10,
        color: 'white',
        backgroundColor: '#2C2C37',
    },
    countryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    countryPickerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    countryFlag: {
        marginRight: 10,
        fontSize: 20,
    },
    selectedCountryText: {
        fontSize: 16,
        color: 'white',
    },
    placeholderText: {
        color: '#A0A0A0',
    },
    formContainer: {
        marginBottom: 15,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dialCodeInput: {
        backgroundColor: '#2D2D2D',
        color: 'white',
        padding: 10,
        borderRadius: 8,
        width: 60,
    },
    phoneNumberInput: {
        backgroundColor: '#2D2D2D',
        color: 'white',
        padding: 10,
        borderRadius: 8,
        flex: 1,
        marginLeft: 10,
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
        fontWeight: 'bold'
    },
    errorText: {
        color: 'red',
        fontSize: 12,
    },
    modalView: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalInput: {
        backgroundColor: '#2D2D2D',
        color: 'white',
        marginTop: 15,
        padding: 10,
        borderRadius: 8,
        width: '80%',
    },
    verifyOtpButton: {
        backgroundColor: '#28A745',
        paddingVertical: 15,
        borderRadius: 8,
        marginTop: 20,
        width: '80%',
        alignItems: 'center',
    },
    verifyOtpButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    resendOtpButton: {
        backgroundColor: '#FFA500',
        paddingVertical: 15,
        borderRadius: 8,
        marginTop: 10,
        width: '80%',
        alignItems: 'center',
    },
    resendOtpButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default SignupForm;
