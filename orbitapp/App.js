import 'react-native-gesture-handler';
import React, { useEffect, useCallback } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserData from './services/UserData';
import { registerForPushNotificationsAsync } from './utils/notification';

// Screens
import LoginScreen from './Screens/Loginscreen';
import HomeScreen from './Screens/HomeScreen';
import StatsScreen from './Screens/StatsScreen';
import ProfileScreen from './Screens/ProfileScreen';
import AlertScreen from './Screens/AlertScreen'; // Fixed typo
import VerificationScreen from './Screens/VerificationScreen';
import ActionReportScreen from './Screens/ActionReportScreen';
import PersonalInformationScreen from './Screens/PersonalInformationScreen';
import OnboardingScreen from './Screens/OnboardingScreen';
import FloorManagerInfo from './Screens/FloorManagerInfoScreen';

const PRIMARY_COLOR = '#007AFF';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;

const tabIcons = {
  Home: ['home', 'home-outline'],
  Stats: ['stats-chart', 'stats-chart-outline'],
  Profile: ['person', 'person-outline'],
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          const [focusedIcon, outlineIcon] = tabIcons[route.name] || ['home', 'home-outline'];
          return (
            <View style={styles.tabIconContainer}>
              <Ionicons
                name={focused ? focusedIcon : outlineIcon}
                size={isSmallScreen ? 18 : 22}
                color={color}
              />
            </View>
          );
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          backgroundColor: PRIMARY_COLOR,
          borderTopWidth: 0,
          elevation: 5,
          paddingBottom: Platform.OS === 'ios' ? 10 : 5,
          paddingTop: 5,
          height: Platform.OS === 'ios' ? 70 : 50,
          paddingHorizontal: isSmallScreen ? 2 : 5,
        },
        tabBarLabelStyle: {
          fontSize: isSmallScreen ? 9 : 11,
          fontWeight: '500',
          marginBottom: 2,
        },
        tabBarItemStyle: {
          marginHorizontal: isSmallScreen ? 2 : 5,
          padding: 0,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: isSmallScreen ? 2 : 4,
    borderRadius: 6,
  },
});

export default function App() {
  const navigationRef = useNavigationContainerRef();

  const handleNotificationNavigation = useCallback(async (alertId) => {
    if (!alertId || !navigationRef.current) {
      console.log('No alertId or navigationRef not ready:', { alertId, navigationRef: !!navigationRef.current });
      return;
    }
    try {
      const res = await fetch(`http://192.168.1.22:3000/api/alert/${alertId}`);
      console.log('Fetch response status:', res.status); // Log the HTTP status code
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const alert = await res.json();
      if (alert && !alert.error) {
        console.log('Navigating to VerificationScreen with alert:', alert);
        navigationRef.current.navigate('Verification', { alert });
      } else {
        console.log('Alert not found or error fetching alert:', alert);
      }
    } catch (e) {
      console.error('Error fetching alert for navigation:', e.message, e.stack);
      if (e.message.includes('Unexpected character: <')) {
        console.log('Likely received HTML error page. Check server response or network.');
      }
    }
  }, []);

  useEffect(() => {
    const setupApp = async () => {
      try {
        await UserData.init();
        console.log('UserData initialized:', UserData);
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await AsyncStorage.setItem('pushToken', token);
          console.log('Push token stored:', token);
        } else {
          console.log('No push token retrieved');
        }
      } catch (e) {
        console.error('Error during app setup:', e);
      }
    };

    setupApp();

    const foregroundSubscription = Notifications.addNotificationReceivedListener(
      (notification) => console.log('Notification received in foreground:', notification)
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        const { alertId } = response.notification.request.content.data;
        handleNotificationNavigation(alertId);
      }
    );

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        console.log('App opened from notification (killed state):', response);
        const { alertId } = response.notification.request.content.data;
        handleNotificationNavigation(alertId);
      }
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, [handleNotificationNavigation]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <StatusBar hidden />
        <Stack.Navigator
          initialRouteName="Onboarding"
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: PRIMARY_COLOR },
            headerTintColor: '#fff',
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="PersonalInformation" component={PersonalInformationScreen} options={{ title: 'Personal Information' }} />
          <Stack.Screen name="FloorManagerInfo" component={FloorManagerInfo} />
          <Stack.Screen name="Alert" component={AlertScreen} />
          <Stack.Screen name="Profilescreen" component={ProfileScreen} />
          <Stack.Screen name="Verification" component={VerificationScreen} />
          <Stack.Screen name="ActionReport" component={ActionReportScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}