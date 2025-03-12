import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../constants/colors';
import { PieChart } from 'react-native-chart-kit';
import Card from '../components/Card';
import { ScrollView } from 'react-native-gesture-handler';

const StatsScreen = props => {
  const [transactionStats, setTransactionStats] = useState({
    failedDeposit: 0,
    successfulDeposit: 0,
    failedPayout: 0,
    successfulPayout: 0,
  });

  useEffect(() => {
    
    const fetchTransactionStats = async () => {
      try {
        const response = await fetch('https://imorapidtransfer.com/api/v1/transaction-statistics');
        const data = await response.json();
        setTransactionStats({
          failedDeposit: data.failedDeposit,
          successfulDeposit: data.successfulDeposit,
          failedPayout: data.failedPayout,
          successfulPayout: data.successfulPayout,
        });
      } catch (error) {
        console.error('Error fetching transaction stats:', error);
      }
    };

    fetchTransactionStats();
  }, []);

  // Pie Chart Data for failed and successful deposits
  const depositData = [
    {
      name: "Failed Deposits",
      population: transactionStats.failedDeposit,
      color: "red",
      legendFontColor: "#7F7F7F",
      legendFontSize: 13
    },
    {
      name: "Successful Deposits",
      population: transactionStats.successfulDeposit,
      color: "green",
      legendFontColor: "#7F7F7F",
      legendFontSize: 13
    }
  ];

  return (
    <LinearGradient colors={[colors.bgColor, '#1B1B23']} style={styles.screen}>
      <ScrollView style={{ paddingHorizontal: 20 }}>
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Deposits</Text>
          <Card style={styles.chartCard}>
            <PieChart
              data={depositData}
              width={Dimensions.get('window').width - 40}
              height={220}
              chartConfig={{
                color: (opacity = 1) => '#9D60D5',
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute={false}
            />
          </Card>
        </View>

        {/* Transaction Stats */}
        <View style={styles.transactionStatsContainer}>
          <Text style={styles.transactionStatsTitle}>Transaction Stats</Text>
          <Card style={styles.transactionStatsCard}>
            <Text style={styles.transactionStatText}>Failed Deposits: {transactionStats.failedDeposit}</Text>
            <Text style={styles.transactionStatText}>Successful Deposits: {transactionStats.successfulDeposit}</Text>
            <Text style={styles.transactionStatText}>Failed Payouts: {transactionStats.failedPayout}</Text>
            <Text style={styles.transactionStatText}>Successful Payouts: {transactionStats.successfulPayout}</Text>
          </Card>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

StatsScreen.navigationOptions = navData => {
  return {
    headerTitle: 'Statistics',
  };
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  chartContainer: {
    marginVertical: 20,
  },
  chartTitle: {
    marginLeft: 7,
    color: 'white',
    fontSize: 16,
    opacity: 0.5,
    fontWeight: '600',
  },
  chartCard: {
    marginVertical: 10,
    overflow: 'hidden',
  },
  transactionStatsContainer: {
    marginTop: 20,
  },
  transactionStatsTitle: {
    marginLeft: 7,
    color: 'white',
    fontSize: 16,
    opacity: 0.5,
    fontWeight: '600',
  },
  transactionStatsCard: {
    marginVertical: 10,
    padding: 15,
    backgroundColor: '#2C2C38',
    borderRadius: 8,
  },
  transactionStatText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '400',
    marginVertical: 5,
  },
});

export default StatsScreen;
