import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import MongoDatabase from '../services/mongodb';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

const FloorManagerInfoScreen = ({ route }) => {
  const params = route.params || {};
  const { userId } = params;
  const navigation = useNavigation();

  const [CNIC, setCNIC] = useState('');
  const [PhoneNo, setPhoneNo] = useState('+92');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('Male');
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [showMaritalStatusModal, setShowMaritalStatusModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [errors, setErrors] = useState({});

  const genderOptions = ['Male', 'Female'];
  const maritalStatusOptions = ['Single', 'Married'];

  useEffect(() => {
    console.log('Route params:', params);
    const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
    if (params && userId && isValidObjectId(userId)) {
      setIsReady(true);
    } else {
      console.log('Invalid route params or userId:', params);
      Toast.show({ type: 'error', text1: 'Invalid navigation data' });
      navigation.goBack();
    }
  }, [params, userId, navigation]);

  const formatCNIC = (text) => {
    const cleaned = text.replace(/[^\d]/g, '');
    if (cleaned.length <= 5) return cleaned;
    if (cleaned.length <= 12) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
  };

  const validateCNIC = (cnic) => /^\d{5}-\d{7}-\d{1}$/.test(cnic);
  const validatePhoneNo = (phone) => /^\+92\d{10}$/.test(phone);

  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.warn('Invalid date provided to formatDate, using current date:', date);
      date = new Date();
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const toggleDatePicker = () => {
    if (Platform.OS === 'ios' && showDatePicker) {
      setShowDatePicker(false);
    } else {
      setShowDatePicker(true);
    }
  };

  const toggleGenderModal = () => {
    if (Platform.OS === 'ios' && showGenderModal) {
      setShowGenderModal(false);
    } else {
      setShowGenderModal(true);
    }
  };

  const toggleMaritalStatusModal = () => {
    if (Platform.OS === 'ios' && showMaritalStatusModal) {
      setShowMaritalStatusModal(false);
    } else {
      setShowMaritalStatusModal(true);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!CNIC) newErrors.CNIC = 'Field is required';
    if (!PhoneNo || PhoneNo === '+92') newErrors.PhoneNo = 'Field is required';
    if (!street) newErrors.street = 'Field is required';
    if (!city) newErrors.city = 'Field is required';
    if (!state) newErrors.state = 'Field is required';
    if (!postalCode) newErrors.postalCode = 'Field is required';
    if (!dateOfBirth) newErrors.dateOfBirth = 'Field is required';
    if (!gender) newErrors.gender = 'Field is required';
    if (!maritalStatus) newErrors.maritalStatus = 'Field is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!userId) {
      Toast.show({ type: 'error', text1: 'User ID is missing' });
      return;
    }
    if (!validateForm()) {
      return;
    }
    if (!validateCNIC(CNIC)) {
      Toast.show({ type: 'error', text1: 'Invalid CNIC format', text2: 'Use format: XXXXX-XXXXXXX-X' });
      return;
    }
    if (!validatePhoneNo(PhoneNo)) {
      Toast.show({ type: 'error', text1: 'Invalid Phone Number', text2: 'Must start with +92 followed by 10 digits' });
      return;
    }
    setIsLoading(true);
    try {
      const Address = { Street: street, City: city, State: state, PostalCode: postalCode };
      const formattedDateOfBirth = dateOfBirth.toISOString().split('T')[0]; // Send as ISO string
      const AdditionalInfo = { DateOfBirth: formattedDateOfBirth, Gender: gender, MaritalStatus: maritalStatus };
      const personnelData = { CNIC, PhoneNo, Address, AdditionalInfo };
      console.log('Submitting personnel data:', { userId, ...personnelData });

      const response = await MongoDatabase.insertPersonnel(userId, personnelData);
      console.log('Database response:', response);

      if (response.success) {
        Toast.show({ type: 'success', text1: 'Information Submitted Successfully' });
        navigation.replace('MainTabs');
      } else {
        throw new Error('Failed to upload to database: ' + response.message);
      }
    } catch (e) {
      console.error('Error submitting personnel info:', e.message, e.stack);
      Toast.show({ type: 'error', text1: 'Failed to submit information', text2: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const renderOption = ({ item }) => (
    <TouchableOpacity
      style={styles.option}
      onPress={() => {
        if (item === gender) setShowGenderModal(false);
        else if (item === maritalStatus) setShowMaritalStatusModal(false);
        else if (genderOptions.includes(item)) {
          setGender(item);
          setShowGenderModal(false);
        } else if (maritalStatusOptions.includes(item)) {
          setMaritalStatus(item);
          setShowMaritalStatusModal(false);
        }
      }}
    >
      <Text style={styles.optionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Floor Manager Information</Text>
        <Text style={styles.subText}>Please fill in your personal details</Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.formContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={styles.input}
              placeholder="CNIC (e.g., 37406-8519843-8)"
              placeholderTextColor="#757575"
              value={CNIC}
              onChangeText={(text) => {
                setCNIC(formatCNIC(text));
                setErrors({ ...errors, CNIC: '' });
              }}
              maxLength={15}
              keyboardType="numeric"
            />
            {errors.CNIC && <Text style={styles.errorText}>{errors.CNIC}</Text>}
            <TextInput
              style={styles.input}
              placeholder="Phone Number (e.g., +923001234567)"
              placeholderTextColor="#757575"
              value={PhoneNo}
              onChangeText={(text) => {
                if (text.startsWith('+92')) setPhoneNo(text.slice(0, 13));
                else if (text === '') setPhoneNo('+92');
                setErrors({ ...errors, PhoneNo: '' });
              }}
              keyboardType="phone-pad"
              maxLength={13}
            />
            {errors.PhoneNo && <Text style={styles.errorText}>{errors.PhoneNo}</Text>}
            <TextInput
              style={styles.input}
              placeholder="Street"
              placeholderTextColor="#757575"
              value={street}
              onChangeText={(text) => {
                setStreet(text);
                setErrors({ ...errors, street: '' });
              }}
            />
            {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}
            <TextInput
              style={styles.input}
              placeholder="City"
              placeholderTextColor="#757575"
              value={city}
              onChangeText={(text) => {
                setCity(text);
                setErrors({ ...errors, city: '' });
              }}
            />
            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            <TextInput
              style={styles.input}
              placeholder="State"
              placeholderTextColor="#757575"
              value={state}
              onChangeText={(text) => {
                setState(text);
                setErrors({ ...errors, state: '' });
              }}
            />
            {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
            <TextInput
              style={styles.input}
              placeholder="Postal Code"
              placeholderTextColor="#757575"
              value={postalCode}
              onChangeText={(text) => {
                setPostalCode(text);
                setErrors({ ...errors, postalCode: '' });
              }}
              keyboardType="numeric"
            />
            {errors.postalCode && <Text style={styles.errorText}>{errors.postalCode}</Text>}
            <TouchableOpacity onPress={toggleDatePicker} style={styles.inputWithArrow}>
              <Text style={styles.inputText}>{formatDate(dateOfBirth)}</Text>
              <Text style={styles.arrow}>{showDatePicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
            )}
            {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
            <TouchableOpacity onPress={toggleGenderModal} style={styles.input}>
              <Text style={styles.inputText}>{gender}</Text>
            </TouchableOpacity>
            <Modal
              visible={showGenderModal}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowGenderModal(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <FlatList
                    data={genderOptions}
                    renderItem={renderOption}
                    keyExtractor={(item) => item}
                  />
                  <TouchableOpacity onPress={() => setShowGenderModal(false)} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
            <TouchableOpacity onPress={toggleMaritalStatusModal} style={styles.input}>
              <Text style={styles.inputText}>{maritalStatus}</Text>
            </TouchableOpacity>
            <Modal
              visible={showMaritalStatusModal}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowMaritalStatusModal(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <FlatList
                    data={maritalStatusOptions}
                    renderItem={renderOption}
                    keyExtractor={(item) => item}
                  />
                  <TouchableOpacity onPress={() => setShowMaritalStatusModal(false)} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            {errors.maritalStatus && <Text style={styles.errorText}>{errors.maritalStatus}</Text>}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
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
  header: {
    backgroundColor: '#F5F5F5',
    paddingTop: height * 0.1,
    paddingBottom: height * 0.03,
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subText: {
    fontSize: 17,
    color: '#888',
    textAlign: 'center',
    marginBottom: height * 0.01,
    paddingHorizontal: 26,
  },
  formContainer: {
    flex: 1,
    width: width * 0.9,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    marginTop: height * 0.15,
    marginBottom: 20,
    alignSelf: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
    justifyContent: 'center',
  },
  inputWithArrow: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  arrow: {
    fontSize: 16,
    color: '#007AFF',
    paddingRight: 10,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#A6A6A6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 10,
  },
  option: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 5,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FloorManagerInfoScreen;