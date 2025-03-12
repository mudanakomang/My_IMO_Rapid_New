import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
   ActivityIndicator, 
  TouchableWithoutFeedback,
  TouchableOpacity
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';  
import LoginForm from '../../components/LoginForm';
import SignupForm from '../../components/SignupForm';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FirstAuthScreen = props => {
  const [isLogin, setIsLogin] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [isFingerprintSupported, setIsFingerprintSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

useLayoutEffect(() => {
    props.navigation.setOptions({
      headerStyle: {
        backgroundColor: '#006400',
      },
      headerTintColor: '#fff',
      headerTitle: '',  
    });
  }, [isLogin, props.navigation]);
  

  useEffect(() => {
    if (isLogin) {
      checkForFingerprintLogin();
    }
  }, [isLogin]);

  const checkForFingerprintLogin = async () => {
    const isFingerprintEnabled = await LocalAuthentication.hasHardwareAsync();
    const isFingerprintEnrolled = await LocalAuthentication.isEnrolledAsync();
    setIsFingerprintSupported(isFingerprintEnabled && isFingerprintEnrolled);

     
    const email = await SecureStore.getItemAsync('fingerprint_email');
    const password = await SecureStore.getItemAsync('fingerprint_password');

    if (email && password) {
      setUserEmail(email);
      setUserPassword(password);
    }
  };


  const saveCredentialsForFingerprint = async (email, password, auth_token) => {
      try {
          await SecureStore.setItemAsync('fingerprint_email', email);
          await SecureStore.setItemAsync('fingerprint_password', password);
          await SecureStore.setItemAsync('auth_token', auth_token);  
  
          console.log("Credentials saved for fingerprint login.");
      } catch (error) {
          console.error("Failed to save credentials:", error);
      }
  };
  
 const authenticateWithFingerprint = async () => {
   
    const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with Fingerprint',
        fallbackLabel: 'Use Password',
    });

    if (result.success && userEmail && userPassword) {
        setIsLoading(true); 
        try {
            const response = await fetch('https://imorapidtransfer.com/api/v1/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: userEmail,
                    password: userPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                await saveCredentialsForFingerprint(userEmail, userPassword, data.first_name);
                 
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
                    userName: String(data.first_name),  
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

                props.navigation.replace('Main');
            } else {
                console.error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Error logging in:', error);
        }
    } else {
        console.log('Fingerprint authentication failed or cancelled.');
    }
    setIsLoading(false);
};
  const logoutUser = async () => {
     await SecureStore.deleteItemAsync('fingerprint_email');
    await SecureStore.deleteItemAsync('fingerprint_password');
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    props.navigation.navigate('FirstAuthScreen');  
  };

  const switchForm = formName => {
    setIsLogin(formName === 'login');
  };

  const onAuth = () => {
    props.navigation.navigate('Main');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#D2D2D2' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : null}
      >
        {isLogin ? (
          <View style={styles.screen}>
            <Image
              source={require('../../assets/images/splash.jpeg')}
              style={styles.logo}
            />
  
                <Text style={styles.titleText}>
                <Text style={styles.imoRapidText}>IMO Rapid</Text>
                <Text style={styles.transferText}>Transfer</Text>
                </Text>

  
            {userName ? (
              <Text style={styles.welcomeText}>
                Welcome{' '}
                <Text style={styles.userNameText}>{userName}</Text>
              </Text>
            ) : null}
  
            <View onSubmit={onAuth} style={styles.formContainer}>
              <LoginForm />
            </View>

            {isLoading && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#ffffff" />
                </View>
            )}

           
            {isFingerprintSupported && userEmail && userPassword && (
              <TouchableOpacity
                onPress={authenticateWithFingerprint}
                style={styles.fingerprintContainer}
              >
                <Ionicons name="finger-print" size={50} color="#006400" />
              </TouchableOpacity>
            )}
  
             <View style={{ marginBottom: 30 }} />  
  
            <View style={styles.formOptions}>
              <TouchableWithoutFeedback onPress={() => switchForm('login')}>
                <Text
                  style={[
                    styles.formOptionText,
                    isLogin && { color: '#006400' },
                    !isLogin && { opacity: 0.3 }
                  ]}
                >
                  Log in
                </Text>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={() => switchForm('signup')}>
                <Text
                  style={[
                    styles.formOptionText,
                    !isLogin && { color: '#C6F801' },
                    isLogin && { opacity: 0.3 }
                  ]}
                >
                  Sign up
                </Text>
              </TouchableWithoutFeedback>
            </View>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View onSubmit={onAuth} style={styles.formContainer}>
              <SignupForm />
            </View>
  
            <View style={styles.formOptions}>
              <TouchableWithoutFeedback onPress={() => switchForm('login')}>
                <Text
                  style={[
                    styles.formOptionText,
                    isLogin && { color: '#006400' },
                    !isLogin && { opacity: 0.3 }
                  ]}
                >
                  Log in
                </Text>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={() => switchForm('signup')}>
                <Text
                  style={[
                    styles.formOptionText,
                    !isLogin && { color: '#C6F801' },
                    isLogin && { opacity: 0.3 }
                  ]}
                >
                  Sign up
                </Text>
              </TouchableWithoutFeedback>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
  
   
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 10,
      },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  imoRapidText: {
    color: '#006400',
  },
  transferText: {
    color: '#C6F801',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006400',
    marginBottom: 20,
  },
  userNameText: {
    color: 'black',
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  formOptions: {
    width: '85%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  formOptionText: {
    fontSize: 16,
    fontWeight: '800',
  },
  fingerprintContainer: {
    marginTop: 20,
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});

export default FirstAuthScreen;
