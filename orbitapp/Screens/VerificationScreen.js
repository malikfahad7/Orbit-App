import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MongoDatabase from '../services/mongodb';

const { width, height } = Dimensions.get('window');

const VerificationScreen = ({ route }) => {
  const { alert: alertData } = route.params;
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);

 
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown Date';
    let date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp.$date && timestamp.$date.$numberLong) {
      date = new Date(parseInt(timestamp.$date.$numberLong));
    } else {
      return 'Unknown Date';
    }
    if (isNaN(date)) return 'Unknown Date';
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}-${month}-${year}`;
  };


  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown Time';
    let date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp.$date && timestamp.$date.$numberLong) {
      date = new Date(parseInt(timestamp.$date.$numberLong));
    } else {
      return 'Unknown Time';
    }
    if (isNaN(date)) return 'Unknown Time';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'UTC' });
  };

  const handleVerify = async (action) => {
    if (!alertData || !alertData._id) {
      Alert.alert('Invalid alert data. Please try again.');
      navigation.goBack();
      return;
    }

    setIsSubmitting(true);

    try {
      if (action === 'safe') {
        const response = await fetch(`http://192.168.1.22:3000/api/alert/${alertData._id}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ verification: 'verified' }),
        });

        const data = await response.json();
        if (response.ok) {
          console.log('Alert deleted successfully:', data);
          Alert.alert('Alert marked as safe and deleted successfully!');
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        } else {
          console.error('Error deleting alert:', data);
          Alert.alert(`Failed to delete alert: ${data.error || 'Unknown error'}`);
        }
      } else {
        
        await MongoDatabase.updateAlertStatus(alertData._id, 'verified');
       
        Alert.alert(
          'Action Required',
          'You want to submit action report right now?',
          [
            {
              text: 'Yes',
              onPress: () => navigation.navigate('ActionReport', { alert: alertData }),
            },
            {
              text: 'No',
              onPress: () => navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              }),
            },
          ],
          { cancelable: false }
        );
      }
    } catch (e) {
      console.error('Error processing alert:', e);
      Alert.alert('Failed to process alert. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!alertData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Alert not found</Text>
      </SafeAreaView>
    );
  }

  const imageUrl = alertData.Image || alertData.imageUrl || alertData.ImageUrl || 'https://via.placeholder.com/300'; // Fallback to placeholder if no image
  console.log('Debug - Full alertData:', JSON.stringify(alertData, null, 2));
  console.log('Debug - Image URL from alertData:', imageUrl);

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ backgroundColor: '#007AFF' }} edges={['top']}>
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Verify Suspicious Activity</Text>
          <Text style={styles.subtitle}>
            Review the alert details and verify the activity.
          </Text>

          <View style={styles.alertContainer}>
            <Text style={styles.fieldLabel}>Time</Text>
            <Text style={styles.fieldValue}>{formatTime(alertData.TimeStamp)}</Text>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.alertImage}
                resizeMode="contain"
                onError={(e) => console.log('Image load error:', e.nativeEvent.error, 'Failed URL:', imageUrl)}
                onLoad={() => console.log('Image loaded successfully from:', imageUrl)}
              />
            ) : (
              <Text style={styles.errorText}>No image available</Text>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.safeButton, isSubmitting && styles.buttonDisabled]}
              onPress={() => handleVerify('safe')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Verify as Safe</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.suspiciousButton, isSubmitting && styles.buttonDisabled]}
              onPress={() => handleVerify('suspicious')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Suspicious</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  appBar: {
    backgroundColor: '#007AFF',
    height: height * 0.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  logo: {
    height: width * 0.04,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  subtitle: {
    fontSize: 16,
    color: '#616161',
    marginTop: 10,
    marginBottom: 20,
  },
  alertContainer: {
    marginBottom: 30,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 15,
  },
  fieldValue: {
    fontSize: 16,
    color: '#616161',
    marginTop: 5,
  },
  alertImage: {
    width: width - 40,
    height: 300,
    marginTop: 10,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  safeButton: {
    backgroundColor: '#28a745',
  },
  suspiciousButton: {
    backgroundColor: '#dc3545',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default VerificationScreen;