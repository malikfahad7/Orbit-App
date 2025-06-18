import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import UserData from '../services/UserData';
import Toast from 'react-native-toast-message';
import MongoDatabase from '../services/mongodb';

const CNIC_REGEX = /^\d{5}-\d{7}-\d{1}$/;
const PHONE_REGEX = /^\+92\d{10}$/;
const API_URL = 'http://192.168.1.22:3000/api/users';

const PersonalInformationScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    CNIC: '',
    PhoneNo: '+92',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
  });
  const [originalData, setOriginalData] = useState({
    name: '',
    PhoneNo: '+92',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    maritalStatus: '',
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const formatCNIC = useCallback((text) => {
    const cleaned = text.replace(/[^\d]/g, '');
    if (cleaned.length <= 5) return cleaned;
    if (cleaned.length <= 12) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
  }, []);

  const formatDateOfBirth = useCallback((dob) => {
    if (!dob) return '';
    try {
      const date = new Date(dob);
      return date.toISOString().split('T')[0];
    } catch {
      return dob;
    }
  }, []);

  const updateFormData = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const loadUserData = useCallback(async () => {
    setIsLoading(true);
    try {
      await UserData.init();
      if (!UserData.userId) {
        Alert.alert('Session Expired', 'Please log in again.', [
          { text: 'OK', onPress: () => navigation.replace('Login') },
        ]);
        return;
      }

      console.log('Fetching user data for userId:', UserData.userId);
      const userResponse = await fetch(`${API_URL}/${UserData.userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user data: ${userResponse.status}`);
      }
      const userData = await userResponse.json();
      if (!userData) throw new Error('User data not found');

      console.log('Fetching personnel data for userId:', UserData.userId);
      const personnelData = await MongoDatabase.getPersonnelByUserId(UserData.userId) || {};
      const newFormData = {
        name: UserData.username || 'Unknown User',
        email: userData.email || '',
        password: '',
        CNIC: personnelData.CNIC || '',
        PhoneNo: personnelData.PhoneNo || '+92',
        street: personnelData.Address?.Street || '',
        city: personnelData.Address?.City || '',
        state: personnelData.Address?.State || '',
        postalCode: personnelData.Address?.PostalCode || '',
        dateOfBirth: formatDateOfBirth(personnelData.AdditionalInfo?.DateOfBirth) || '',
        gender: personnelData.AdditionalInfo?.Gender || '',
        maritalStatus: personnelData.AdditionalInfo?.MaritalStatus || '',
      };

      setFormData(newFormData);
      setOriginalData({
        name: newFormData.name,
        PhoneNo: newFormData.PhoneNo,
        street: newFormData.street,
        city: newFormData.city,
        state: newFormData.state,
        postalCode: newFormData.postalCode,
        maritalStatus: newFormData.maritalStatus,
      });
    } catch (e) {
      console.error('Error loading user data:', e.message);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [navigation, formatDateOfBirth]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const validatePhoneNo = useCallback((phone) => PHONE_REGEX.test(phone), []);

  const userFieldsChanged = useMemo(() => (
    formData.name !== originalData.name || formData.password !== ''
  ), [formData, originalData]);

  const personnelFieldsChanged = useMemo(() => (
    formData.PhoneNo !== originalData.PhoneNo ||
    formData.street !== originalData.street ||
    formData.city !== originalData.city ||
    formData.state !== originalData.state ||
    formData.postalCode !== originalData.postalCode ||
    formData.maritalStatus !== originalData.maritalStatus
  ), [formData, originalData]);

  const isChanged = useMemo(() => (
    userFieldsChanged || personnelFieldsChanged
  ), [userFieldsChanged, personnelFieldsChanged]);

  const handleSave = useCallback(async () => {
    console.log('UserData.userId before save:', UserData.userId);
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Name and email are required.');
      return;
    }
    if (formData.PhoneNo && !validatePhoneNo(formData.PhoneNo)) {
      Alert.alert('Error', 'Invalid Phone Number. Must start with +92 followed by 10 digits');
      return;
    }

    setIsSaving(true);
    try {
      // Update users collection if name or password changed
      if (userFieldsChanged) {
        const userUpdatePayload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
        };
        if (formData.password) {
          userUpdatePayload.password = formData.password.trim();
        }
        console.log('Updating user data with payload:', userUpdatePayload);

        const userResponse = await fetch(`${API_URL}/${UserData.userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userUpdatePayload),
        });

        if (!userResponse.ok) {
          throw new Error(`HTTP error! Status: ${userResponse.status}`);
        }

        const userResult = await userResponse.json();
        console.log('User update response:', userResult);
        if (!userResult.success) {
          throw new Error(userResult.message || 'Failed to update user information');
        }

        // Update UserData with the new username
        console.log('Updating UserData with new username:', formData.name.trim());
        await UserData.setUserData({
          username: formData.name.trim(),
          floor: UserData.floor,
          userId: UserData.userId,
          profileImageUrl: UserData.profileImageUrl,
        });
      }

      // Update personnels collection if personnel fields changed
      if (personnelFieldsChanged) {
        const Address = {
          Street: formData.street,
          City: formData.city,
          State: formData.state,
          PostalCode: formData.postalCode,
        };
        const AdditionalInfo = { MaritalStatus: formData.maritalStatus };
        const personnelUpdatePayload = {
          PhoneNo: formData.PhoneNo,
          Address,
          AdditionalInfo,
        };
        console.log('Updating personnel data with payload:', personnelUpdatePayload);

        const personnelResponse = await MongoDatabase.updatePersonnel(UserData.userId, personnelUpdatePayload);
        console.log('Personnel update response:', personnelResponse);
        if (!personnelResponse.success) {
          throw new Error(personnelResponse.message || 'Failed to update personnel information');
        }
      }

      Toast.show({ type: 'success', text1: 'Success', text2: 'Profile updated successfully!' });
      console.log('Navigating to Profile screen');
      navigation.navigate('MainTabs');
    } catch (e) { 
      console.error('Error updating user information:', {
        message: e.message,
        response: e.response ? await e.response.text() : 'No response',
      });
      Alert.alert('Error', `Failed to update profile: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [formData, originalData, userFieldsChanged, personnelFieldsChanged, navigation, validatePhoneNo]);

  const handleBack = useCallback(() => {
    if (!isChanged) navigation.goBack();
  }, [isChanged, navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        {!isChanged && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#007AFF" style={styles.backIcon} />
          </TouchableOpacity>
        )}
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {[
            { label: 'Name', field: 'name', placeholder: 'Enter your name', autoCapitalize: 'words' },
            { label: 'Email', field: 'email', editable: false, keyboardType: 'email-address', style: styles.disabledInput },
            { label: 'Password', field: 'password', placeholder: 'Enter new password (optional)', secureTextEntry: !passwordVisible, autoCapitalize: 'none', isPassword: true },
            { label: 'CNIC', field: 'CNIC', editable: false, placeholder: 'CNIC (e.g., 37406-8519843-8)', style: styles.disabledInput },
            { label: 'Phone Number', field: 'PhoneNo', placeholder: 'Enter Phone Number (e.g., +923001234567)', keyboardType: 'phone-pad', maxLength: 13, onChangeText: (text) => {
              if (text.startsWith('+92')) updateFormData('PhoneNo', text.slice(0, 13));
              else if (text === '') updateFormData('PhoneNo', '+92');
            } },
            { label: 'Street', field: 'street', placeholder: 'Enter Street', autoCapitalize: 'words' },
            { label: 'City', field: 'city', placeholder: 'Enter City', autoCapitalize: 'words' },
            { label: 'State', field: 'state', placeholder: 'Enter State', autoCapitalize: 'words' },
            { label: 'Postal Code', field: 'postalCode', placeholder: 'Enter Postal Code', keyboardType: 'numeric' },
            { label: 'Date of Birth', field: 'dateOfBirth', editable: false, placeholder: 'YYYY-MM-DD', style: styles.disabledInput },
            { label: 'Gender', field: 'gender', editable: false, placeholder: 'Enter Gender', style: styles.disabledInput },
            { label: 'Marital Status', field: 'maritalStatus', placeholder: 'Enter Marital Status', autoCapitalize: 'words' },
          ].map((input, index) => (
            <View key={index} style={styles.inputContainer}>
              <Text style={styles.label}>{input.label}</Text>
              {input.isPassword ? (
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData[input.field]}
                    onChangeText={(text) => updateFormData(input.field, text)}
                    placeholder={input.placeholder}
                    placeholderTextColor="#757575"
                    secureTextEntry={input.secureTextEntry}
                    autoCapitalize={input.autoCapitalize}
                  />
                  <TouchableOpacity
                    onPress={() => setPasswordVisible(!passwordVisible)}
                    style={styles.eyeIcon}
                  >
                    <Text style={styles.eyeIconText}>{passwordVisible ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TextInput
                  style={[styles.input, input.style]}
                  value={formData[input.field]}
                  onChangeText={input.onChangeText || ((text) => updateFormData(input.field, text))}
                  placeholder={input.placeholder}
                  placeholderTextColor="#757575"
                  editable={input.editable !== false}
                  keyboardType={input.keyboardType}
                  maxLength={input.maxLength}
                  autoCapitalize={input.autoCapitalize}
                />
              )}
            </View>
          ))}

          <View style={styles.spacer} />

          <TouchableOpacity
            style={[styles.saveButton, (!isChanged || isSaving) && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={!isChanged || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E6F0FA',
    marginRight: 10,
  },
  backIcon: {
    margin: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 50,
  },
  inputContainer: {
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 5,
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
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#757575',
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
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A6A6A6',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spacer: {
    height: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PersonalInformationScreen;