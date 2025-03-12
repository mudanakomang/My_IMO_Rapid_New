import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import App from './App';  
import { name as appName } from './app.json';  

// Request permission for notifications
messaging().requestPermission();

// Handle background messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});


AppRegistry.registerComponent(appName, () => App);
