import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import MongoDatabase from '../services/mongodb';
import UserData from '../services/UserData';
import { registerForPushNotificationsAsync } from '../utils/notification'; 

const { width, height } = Dimensions.get('window');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigation = useNavigation();

  const validateEmail = (email) => EMAIL_REGEX.test(email);

  const checkPushToken = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('pushToken');
      if (storedToken && typeof storedToken !== 'string') {
        await AsyncStorage.removeItem('pushToken');
        Toast.show({
          type: 'info',
          text1: 'Notification Setup Reset',
          text2: 'Invalid notification token cleared. Please log in again.',
        });
      }
    } catch (e) {
      console.error('Error checking pushToken:', e.message);
    }
  }, []);

  const setupNotifications = useCallback(async (userId) => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token && typeof token === 'string') {
        await AsyncStorage.setItem('pushToken', token);
        if (userId) {
          const response = await fetch('http://192.168.1.22:3000/api/store-push-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, pushToken: token }),
          });
          const data = await response.json();
          if (!data.success) {
            Toast.show({
              type: 'error',
              text1: 'Notification Setup Failed',
              text2: 'Push notifications may not work. Please try logging in again.',
            });
          }
        } else {
          Toast.show({
            type: 'error',
            text1: 'Notification Setup Failed',
            text2: 'User ID is missing. Please try logging in again.',
          });
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Notification Setup Failed',
          text2: 'Unable to register for notifications. Please check your permissions.',
        });
      }
    } catch (e) {
      console.error('Error setting up notifications:', e.message);
      Toast.show({
        type: 'error',
        text1: 'Notification Setup Error',
        text2: 'Failed to set up notifications. Please try again.',
      });
    }
  }, []);

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'All fields are required' });
      return;
    }
    if (!validateEmail(email)) {
      Toast.show({ type: 'error', text1: 'Enter a valid Gmail address' });
      return;
    }

    setIsLoading(true);
    try {
      // Selectively clear relevant AsyncStorage keys instead of clearing all
      await Promise.all([
        AsyncStorage.removeItem('userEmail'),
        AsyncStorage.removeItem('userFloor'),
        AsyncStorage.removeItem('pushToken'),
      ]);
      console.log('Cleared specific AsyncStorage keys before login');

      const user = await MongoDatabase.getUser(email.trim(), password.trim());
      if (!user) {
        Toast.show({ type: 'error', text1: 'Invalid credentials or role is not Floor Manager' });
        return;
      }

      const floorNumber = await MongoDatabase.getFloorByEmail(email.trim()) || 'N/A';
      if (!user._id) throw new Error('User ID is missing in backend response');

      await UserData.setUserData({
        username: user.name || 'Unknown User',
        floor: floorNumber,
        userId: user._id,
        profileImageUrl: user.profileImageUrl || null,
      });
      await AsyncStorage.setItem('userEmail', email.trim());
      await AsyncStorage.setItem('userFloor', floorNumber.toString());

      const personnelExists = await MongoDatabase.checkPersonnelByUserId(user._id);
      if (personnelExists) {
        await setupNotifications(user._id);
        Toast.show({ type: 'success', text1: 'Login Successful' });
        setEmail('');
        setPassword('');
        navigation.replace('MainTabs');
      } else {
        navigation.replace('FloorManagerInfo', { userId: user._id });
      }
    } catch (e) {
      console.error('Login error:', e.message);
      Toast.show({
        type: 'error',
        text1: 'Error during login',
        text2: e.message || 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, password, validateEmail, setupNotifications, navigation]);

  useEffect(() => {
    checkPushToken();
  }, [checkPushToken]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require('../assets/logo-text.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subText}>Please enter email and password to continue</Text>
        </View>
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#757575"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#757575"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={styles.eyeIcon}
            >
              <Text style={styles.eyeIconText}>{passwordVisible ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: height * 0.05,
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.1,
    paddingBottom: height * 0.03,
  },
  logo: {
    width: 180,
    height: 100,
    marginBottom: height * 0.005,
  },
  subText: {
    fontSize: 17,
    color: '#888',
    textAlign: 'center',
    marginBottom: height * 0.04,
    paddingHorizontal: 26,
  },
  formContainer: {
    width: width * 0.9,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 0.2,
    borderColor: '#888',
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    marginBottom: 24,
    borderWidth: 0.2,
    borderColor: '#888',
  },
  passwordInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 12,
  },
  eyeIconText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A6A6A6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default LoginScreen;