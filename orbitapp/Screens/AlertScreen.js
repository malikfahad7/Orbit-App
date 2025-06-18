import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Swipeable } from 'react-native-gesture-handler';
import MongoDatabase from '../services/mongodb';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';

const { width, height } = Dimensions.get('window');

const AlertScreen = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userFloor, setUserFloor] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      try {
        const floor = await AsyncStorage.getItem('userFloor');
        console.log('Fetched user floor from AsyncStorage in AlertScreen:', floor);
        if (floor) {
          setUserFloor(floor);
          await fetchAlerts(floor);
        } else {
          console.log('User floor not found in AsyncStorage');
          Alert.alert('Error', 'User floor not found. Please log in again.');
          setIsLoading(false);
        }
      } catch (e) {
        console.error('Error in initialize:', e);
        Alert.alert('Error', 'Failed to initialize. Please try again.');
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const fetchAlerts = async (floor) => {
    try {
      const data = await MongoDatabase.getUnverifiedAlerts();
      console.log('Fetched unverified alerts:', data);
    
      const floorFilteredAlerts = data.filter(alert => {
        const alertFloor = alert.FloorNo?.toString();
        return alertFloor === floor;
      });
      // Sort alerts by TimeStamp descending (newest first)
      const sortedAlerts = floorFilteredAlerts.sort((a, b) => {
        const timeA = new Date(a.TimeStamp);
        const timeB = new Date(b.TimeStamp);
        return timeB - timeA;
      });
      console.log('Filtered and sorted unverified alerts for floor', floor, ':', sortedAlerts);
      setAlerts(sortedAlerts);
    } catch (e) {
      console.log('Error fetching alerts:', e);
    } finally {
      setIsLoading(false);
    }
  };

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
    try {
      return moment.tz(timestamp, 'Asia/Karachi').format('hh:mm:ss A');
    } catch {
      return 'Unknown Time';
    }
  };

  const deleteAlert = async (id, index) => {
    try {
      await MongoDatabase.deleteAlert(id);
      setAlerts((prevAlerts) => prevAlerts.filter((_, i) => i !== index));
      Alert.alert('Success', 'Alert deleted', [{ text: 'OK' }]);
    } catch (e) {
      console.log('Error deleting alert:', e);
      Alert.alert('Error', 'Failed to delete alert', [{ text: 'OK' }]);
    }
  };

  const renderRightActions = (id, index) => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => deleteAlert(id, index)}
    >
      <Ionicons name="trash" size={24} color="white" />
    </TouchableOpacity>
  );

  const renderAlertItem = ({ item, index }) => {
    console.log('Debug - TimeStamp:', item.TimeStamp, 'Formatted:', formatTime(item.TimeStamp));
    return (
      <Swipeable renderRightActions={() => renderRightActions(item._id, index)}>
        <TouchableOpacity
          style={styles.alertCard}
          onPress={() => navigation.navigate('Verification', { alert: item })}
        >
          <Text style={styles.alertTitle}>{item.Type?.toUpperCase()} Detected</Text>
          <View style={styles.alertRow}>
            <Text style={styles.alertLabel}>ID: </Text>
            <Text style={styles.alertValue}>#{item.SuspiciousActivityId}</Text>
          </View>
          <View style={styles.alertDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={16} color="#42A5F5" />
              <Text style={styles.detailText}>{formatDate(item.TimeStamp)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={16} color="#42A5F5" />
              <Text style={styles.detailText}>{formatTime(item.TimeStamp)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="camera" size={16} color="#42A5F5" />
              <Text style={styles.detailText}>{item.CameraNo || 'N/A'}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

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
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <>
              <Text style={styles.title}>Alerts</Text>
              <Text style={styles.subtitle}>
                You have <Text style={styles.subtitleHighlight}>{alerts.length}</Text> new alerts
              </Text>
              <View style={styles.spacer} />
              {alerts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No new alerts for your floor.</Text>
                </View>
              ) : (
                <FlatList
                  data={alerts}
                  renderItem={renderAlertItem}
                  keyExtractor={(item) => item._id}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  appBar: {
    backgroundColor: '#007AFF',
    height: height * 0.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  logo: {
    height: width * 0.06,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#212121',
  },
  subtitle: {
    fontSize: 16,
    color: '#616161',
    marginTop: 8,
  },
  subtitleHighlight: {
    fontWeight: 'bold',
    color: '#42A5F5',
  },
  spacer: {
    height: height * 0.02,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#616161',
    fontStyle: 'italic',
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
  },
  alertValue: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  alertDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#424242',
    marginLeft: 6,
    fontWeight: '500',
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 12,
    marginVertical: 8,
  },
});

export default AlertScreen;