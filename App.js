import 'react-native-gesture-handler';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationContainer } from '@react-navigation/native'; 
import MainNavigator from './navigation/Navigator';

export default function App() {
  return (
    <NavigationContainer>
      <LinearGradient colors={['#353544', '#1B1B23']} style={{ flex: 1 }}>
        <MainNavigator />
      </LinearGradient>
    </NavigationContainer>
  );
}
