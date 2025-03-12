import React, { useEffect } from 'react';
import { View } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';

const ApiEndpoint = () => {
  useEffect(() => {
   
    PushNotification.configure({
      onNotification: function(notification) {
        console.log('Notification received:', notification);
      },
      requestPermissions: true,
    });

    const requestUserPermission = async () => {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('FCM Authorization status:', authStatus);
      }
    };

    requestUserPermission();

   
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('FCM Message received:', remoteMessage);

      PushNotification.localNotification({
        title: remoteMessage.notification?.title || 'New Notification',
        message: remoteMessage.notification?.body || 'You have a new message.',
      });
    });
   
    return () => unsubscribe();
  }, []);

  return <View />;
};

export default ApiEndpoint;
