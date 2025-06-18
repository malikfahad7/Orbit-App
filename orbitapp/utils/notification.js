import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Set the default notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export async function registerForPushNotificationsAsync() {
  let token;

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Checking and Request notification permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token: Permission not granted');
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.projectId;
    if (!projectId) {
      throw new Error('Project ID not found in app configuration. Ensure "projectId" is set in app.json or app.config.js.');
    }
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    console.log('Expo Push Token:', token);
  } catch (e) {
    console.error('Error getting push token:', e.message, e.stack);
    throw e;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const subscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Foreground notification received:', notification);
  
  });

  global.notificationSubscription = subscription;

  return token;
}

export function removeNotificationListener() {
  if (global.notificationSubscription) {
    global.notificationSubscription.remove();
    console.log('Notification listener removed');
    global.notificationSubscription = null;
  }
}