import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, SafeAreaView, Platform, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AccountCard from '../../components/AccountCard';
import TransactionCard from '../../components/TransactionCard';
import colors from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const data = await AsyncStorage.getItem('userData');
        if (data) {
          setUserData(JSON.parse(data));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    getUserData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        setUserData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const onSendPress = () => {
    navigation.navigate('Send');
  };
  const onAirtimePress = () => {
    navigation.navigate('AirtimePurchase');
  };
  const onPayBillPress = () => {
    navigation.navigate('AddBill');
  };
  const onCardsPress = () => {
    navigation.navigate('CardScreen');
  };
  const onDepositPress = () => {
    navigation.navigate('DepositScreen');
  };
  const ontokenPress = () => {
    navigation.navigate('MtcnCreate');
  };

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const transactions = userData.transactions || [];

  return (
    <LinearGradient colors={[colors.bgColor, '#D7D7D7']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeAreaView}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={{ flex: 1 }}>
            <View style={styles.topSection}>
              <LinearGradient
                colors={[colors.bgColor, '#1B1B23']}
                style={styles.topSectionContent}
              >
                <View style={styles.profileInfoContainer}>
                  <View>
                    <Text style={{ color: 'white', opacity: 0.7, fontSize: 16 }}>
                      Welcome.
                    </Text>
                    <Text
                      style={{
                        color: 'white',
                        opacity: 0.8,
                        fontSize: 20,
                        fontWeight: '600',
                      }}
                    >
                      {userData.first_name} {userData.last_name}
                    </Text>
                  </View>
                  <View style={styles.profileImgContainer}>
                    <Image
                      resizeMode="contain"
                      style={styles.profileImg}
                      source={{
                        uri: userData.profile_picture
                          ? userData.profile_picture 
                          : 'https://imorapidtransfer.com/user_dashboard/images/avatar.jpg',
                      }}
                    />
                  </View>


                </View>
                <Text style={styles.accountTitle}>MY ACCOUNTS</Text>
                <View style={styles.accountCardContainer}>
                  <AccountCard style={styles.accountCard} />
                </View>
              </LinearGradient>
            </View>
            <View style={styles.transactionSection}>
              <Text style={{ ...styles.accountTitle, marginLeft: 0 }}>
                Quick Transaction
              </Text>
              <View style={styles.transactionCardsContainer}>
                <TransactionCard
                  onPress={onSendPress}
                  style={styles.tranCard}
                  iconName="paper-plane-outline"
                  transactionName="Send Money"
                />
                <TransactionCard
                  onPress={onAirtimePress}
                  style={styles.tranCard}
                  iconName="call-outline"
                  transactionName="Buy Airtime"
                />
                <TransactionCard
                  onPress={onPayBillPress}
                  style={styles.tranCard}
                  iconName="document-text-outline"
                  transactionName="Pay Bill"
                />
                <TransactionCard
                  onPress={onCardsPress}
                  style={styles.tranCard}
                  iconName="card-outline"
                  transactionName="My Cards"
                />
                <TransactionCard
                  onPress={onDepositPress}
                  style={styles.tranCard}
                  iconName="call-outline"
                  transactionName="Deposit"
                />
                <TransactionCard
                  onPress={ontokenPress}
                  style={styles.tranCard}
                  iconName="keypad-outline"
                  transactionName="Send Token"
                />
              </View>
            </View>
            
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 40 : 50,   
  },
  topSection: {},
  topSectionContent: {
    overflow: 'visible',
  },
  profileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#4E4F57',
    marginHorizontal: 20,
    paddingVertical: 20,
  },
  profileImgContainer: {
    height: 80,
    width: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  profileImg: {
    height: 80,
    width: '100%',
  },
  accountTitle: {
    color: 'white',
    opacity: 0.4,
    marginHorizontal: 20,
    marginTop: 20,
    fontSize: 13,
    marginBottom: 7,
  },
  accountCardContainer: {
    width: '100%',
    height: 75,
    paddingHorizontal: 30,
    marginTop: 10,
    alignItems: 'center',
  },
  accountCard: {
    height: 150,
    position: 'relative',
    top: 0,
  },
  transactionSection: {
    marginTop: 80,
    marginHorizontal: 20,
  },
  transactionCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  tranCard: {
    width: '47.5%',
  },
  newSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  tableSection: {
    marginTop: 20,
    marginBottom: 30,
    width: '100%',
  },
  table: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    padding: 10,
    backgroundColor: '#f7f7f7',
    flex: 1,
    textAlign: 'center',
  },
  tableCell: {
    padding: 10,
    flex: 1,
    textAlign: 'center',
  },
  noActivitiesText: {
    textAlign: 'center',
    color: 'gray',
    padding: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: 'gray',
  },
});

export default HomeScreen;
