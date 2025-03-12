import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/Home/HomeScreen';
import FirstAuthScreen from '../screens/Auth/FirstAuthScreen';
import SecondAuthScreen from '../screens/Auth/SecondAuthScreen';

import SendMoneyScreen from '../screens/Send/SendMoneyScreen';
import PayoutScreen from '../screens/Send/PayoutScreen';
import FxPayoutScreen from '../screens/Send/FxPayoutScreen';
import RecieverDetailsScreen from '../screens/Send/RecieverDetailsScreen';
import ConfirmDetailsScreen from '../screens/Send/ConfirmDetailsScreen';
import PayoutDetailScreen from '../screens/Send/PayoutDetailScreen';

import Exchange from '../screens/Exchange/Converter';
import Request from '../screens/Request/RequestMoney';
import StatsScreen from '../screens/StatsScreen';
import MoreScreen from '../screens/More/MoreScreen';
import colors from '../constants/colors';
import { HomeTabIcon, MoreTabIcon } from '../components/TabBarIcons';
import ReferScreen from '../screens/Refer/ReferScreen';
import TicketScreen from '../screens/Ticket/TicketScreen';
import TicketDetails from '../screens/Ticket/TicketDetails';
import CreateTicket from '../screens/Ticket/CreateTicket';
import AirtimePurchase from '../screens/AirTime/AirtimePurchase';
import MtcnCreate from '../screens/Mtcn/MtcnCreate';
import ConfirmMtcn from '../screens/Mtcn/ConfirmMtcn';
import NewCardScreen from '../screens/Card/NewCardScreen';
import CardScreen from '../screens/Card/CardScreen';
import FundScreen from '../screens/Card/FundScreen';
import WithdrawScreen from '../screens/Card/WithdrawScreen';
import DepositScreen from '../screens/Deposit/DepositScreen';
import DepositPaymentScreen from '../screens/Deposit/DepositPaymentScreen';
import FlutterwavePaymentScreen from '../screens/Deposit/FlutterwavePaymentScreen';
import PaymentStatus from '../screens/Deposit/PaymentStatus';
import WebViewScreen from '../screens/Deposit/WebViewScreen';
import PaymentSuccessScreen from '../screens/Deposit/PaymentSuccessScreen';
import SquadCoPaymentScreen from '../screens/Deposit/SquadCoPaymentScreen';
import AddBill from '../screens/PayBill/AddBill';
import { Ionicons } from '@expo/vector-icons';
import Transaction from '../screens/Transaction/Transaction';
import TransactionDetails from '../screens/Transaction/TransactionDetails';
import Userdetails from '../screens/Settings/Userdetails';
import ChangePasswordModal from '../screens/UserProfile/ChangePasswordModal';
import PinVerify from '../screens/Condition/PinVerify';
import FinalScreen from '../screens/Condition/FinalScreen';
import PayoutFinalScreen from '../screens/Condition/PayoutFinalScreen';
import FinalRegistrationScreen from '../screens/Condition/FinalRegistrationScreen';
import PhotoVerificationScreen from '../screens/Condition/PhotoVerificationScreen';
import RateUsScreen from '../screens/Condition/RateUsScreen';

const defaultStackNavOptions = {
    headerTintColor: 'white',
    headerStyle: {
        backgroundColor: '#393948', 
        shadowOpacity: 0,
        elevation: 0,
    },
    headerBackTitleVisible: false,
};

const AuthStack = createStackNavigator();
const AuthNavigator = () => (
    <AuthStack.Navigator>
        <AuthStack.Screen name="Login" component={FirstAuthScreen} />
        <AuthStack.Screen name="SignUp" component={SecondAuthScreen} />
        <AuthStack.Screen name="FinalRegistrationScreen" component={FinalRegistrationScreen} />
        <AuthStack.Screen name="PhotoVerificationScreen" component={PhotoVerificationScreen} />
        
    </AuthStack.Navigator>
);

const HomeStack = createStackNavigator();
const HomeNavigator = () => (
    <HomeStack.Navigator
        initialRouteName="HomeScreen"
        screenOptions={defaultStackNavOptions}
    >
        <HomeStack.Screen
            name="HomeScreen"
            component={HomeScreen}
            options={{ headerShown: false }}
        />
        <HomeStack.Screen name="Send" component={SendMoneyScreen} />
        <HomeStack.Screen name="RecieverDetails" component={RecieverDetailsScreen} />
        <HomeStack.Screen name="PayoutDetailScreen" component={PayoutDetailScreen} />
        <HomeStack.Screen name="ConfirmDetails" component={ConfirmDetailsScreen} />
        <HomeStack.Screen name="AirtimePurchase" component={AirtimePurchase} />
        <HomeStack.Screen name="MtcnCreate" component={MtcnCreate} />
        <HomeStack.Screen name="NewCardScreen" component={NewCardScreen} />
        <HomeStack.Screen name="CardScreen" component={CardScreen} />
        <HomeStack.Screen name="FundScreen" component={FundScreen} />
        <HomeStack.Screen name="WithdrawScreen" component={WithdrawScreen} />
        <HomeStack.Screen name="DepositScreen" component={DepositScreen} />
        <HomeStack.Screen name="SquadCoPaymentScreen" component={SquadCoPaymentScreen} />
        <HomeStack.Screen name="FlutterwavePaymentScreen" component={FlutterwavePaymentScreen} />
        <HomeStack.Screen name="DepositPaymentScreen" component={DepositPaymentScreen} />
        <HomeStack.Screen name="PaymentStatus" component={PaymentStatus} />
        <HomeStack.Screen name="RateUsScreen" component={RateUsScreen} />
        <HomeStack.Screen name="PaymentSuccessScreen" component={PaymentSuccessScreen} />
        <HomeStack.Screen name="WebViewScreen" component={WebViewScreen} />
        <HomeStack.Screen name="AddBill" component={AddBill} />
        <HomeStack.Screen name="PinVerify" component={PinVerify} />
        <HomeStack.Screen name="FinalScreen" component={FinalScreen} />
        <HomeStack.Screen name="PayoutFinalScreen" component={PayoutFinalScreen} />
        <MoreStack.Screen name="TransactionDetails" component={TransactionDetails} />
        <HomeStack.Screen name="Payout" component={PayoutScreen} />
        <HomeStack.Screen name="FxPayoutScreen" component={FxPayoutScreen} />
        <HomeStack.Screen name="ConfirmMtcn" component={ConfirmMtcn} />
    </HomeStack.Navigator>
);

// More Stack
const MoreStack = createStackNavigator();
const MoreNavigator = () => (
    <MoreStack.Navigator screenOptions={defaultStackNavOptions}>
        <MoreStack.Screen name="MoreScreen" component={MoreScreen} />
        <MoreStack.Screen name="ReferScreen" component={ReferScreen} />
        <MoreStack.Screen name="TicketScreen" component={TicketScreen} />
        <MoreStack.Screen name="TicketDetails" component={TicketDetails} />
        <MoreStack.Screen name="CreateTicket" component={CreateTicket} />
        <MoreStack.Screen name="Userdetails" component={Userdetails} />
        <MoreStack.Screen name="Transaction" component={Transaction} />
        <MoreStack.Screen name="TransactionDetails" component={TransactionDetails} />
        <MoreStack.Screen name="ChangePassword" component={ChangePasswordModal} />
    </MoreStack.Navigator>
);

const RequestStack = createStackNavigator();
const RequestNavigator = () => (
    <RequestStack.Navigator screenOptions={defaultStackNavOptions}>
        <RequestStack.Screen name="RequestMoney" component={Request} />
    </RequestStack.Navigator>
);

const ExchangeStack = createStackNavigator();
const ExchangeNavigator = () => (
    <ExchangeStack.Navigator screenOptions={defaultStackNavOptions}>
        <ExchangeStack.Screen name="CurrencyExchange" component={Exchange} />
    </ExchangeStack.Navigator>
);

const Tab = createBottomTabNavigator();
const TabNavigator = () => (
    <Tab.Navigator
        screenOptions={{
            tabBarShowLabel: true,
            tabBarActiveTintColor: '#C6F801',
            tabBarInactiveTintColor: '#393948',  // ALL THE HEADER DEPENDS ON THIS PLACE COLOR AND THE OTHER PART
            tabBarStyle: {
                backgroundColor: '#006400',
                borderTopWidth: 0,
                height: 60,
                borderRadius: 15,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
            },
            headerShown: false,
        }}
    >
        <Tab.Screen 
            name="Home" 
            component={HomeNavigator} 
            options={{ tabBarIcon: (props) => <HomeTabIcon {...props} size={30} /> }} 
        />
        <Tab.Screen 
            name="Request" 
            component={RequestNavigator} 
            options={{ 
                tabBarIcon: (props) => <Ionicons name="document-text-outline" size={30} color={props.color} /> 
            }} 
        />
        <Tab.Screen 
            name="Exchange" 
            component={ExchangeNavigator} 
            options={{ 
                tabBarIcon: (props) => <Ionicons name="swap-horizontal-outline" size={30} color={props.color} /> 
            }} 
        />
        <Tab.Screen 
            name="More" 
            component={MoreNavigator} 
            options={{ tabBarIcon: (props) => <MoreTabIcon {...props} size={30} /> }} 
        />
    </Tab.Navigator>
);

const RootStack = createStackNavigator();
const MainNavigator = () => (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen name="Main" component={TabNavigator} />
    </RootStack.Navigator>
);

export default MainNavigator;
   