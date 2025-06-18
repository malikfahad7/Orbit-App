import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import DropDownPicker from 'react-native-dropdown-picker';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import MongoDatabase from '../services/mongodb';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const STATUS_COLORS = {
  verified: { card: 'rgba(255, 152, 0, 0.1)', avatar: '#FF9800' },
  completed: { card: 'rgba(76, 175, 80, 0.1)', avatar: '#4CAF50' },
  'in progress': { card: 'rgba(255, 99, 71, 0.1)', avatar: '#FF6347' },
  default: { card: '#E0E0E0', avatar: '#B0B0B0' },
};

const FILTER_OPTIONS = [
  { label: 'All', value: 'All' },
  { label: 'Verified', value: 'Verified' },
  { label: 'Completed', value: 'Completed' },
  { label: 'In Progress', value: 'in progress' },
];

const IMPORTANT_POINTS = [
  'Respond to unverified alerts within 5 minutes to ensure timely action.',
  'Submit detailed action reports for all verified and in-progress alerts.',
  'Include clear evidence and images in your action reports.',
  'Coordinate with the security head for high-priority escalations.',
  'Notify all team members on your floor about new alerts.',
  'Regularly check the system for unverified alerts every 10 minutes.',
  'Update alert statuses promptly after verification or completion.',
];

const HomeScreen = () => {
  const [unverifiedAlertCount, setUnverifiedAlertCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [userFloor, setUserFloor] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const navigation = useNavigation();

  const filteredAlerts = useMemo(() => {
    if (selectedFilter === 'All') {
      return alerts;
    }
    return alerts.filter(
      alert => alert.Verification?.toLowerCase() === selectedFilter.toLowerCase()
    );
  }, [selectedFilter, alerts]);

  const checkInstructionsSeen = useCallback(async () => {
    try {
      const hasSeen = await AsyncStorage.getItem('hasSeenInstructions');
      if (!hasSeen) setShowInstructionsModal(true);
    } catch (e) {
      console.error('Error checking instructions seen:', e);
    }
  }, []);

  const fetchUnverifiedAlerts = useCallback(async (floor) => {
    try {
      const unverifiedAlerts = await MongoDatabase.getUnverifiedAlerts();
      const floorFiltered = unverifiedAlerts.filter(
        alert => alert.FloorNo?.toString() === floor
      );
      setUnverifiedAlertCount(floorFiltered.length);
    } catch (e) {
      console.error('Error fetching unverified alerts:', e);
    }
  }, []);

  const fetchAlerts = useCallback(async (floor) => {
    try {
      const fetchedAlerts = await MongoDatabase.getAllAlertsWithInprogress();
      const floorFiltered = fetchedAlerts.filter(
        alert => alert.FloorNo?.toString() === floor
      );
      // Sort alerts by TimeStamp in descending order (latest first)
      const sortedAlerts = floorFiltered.sort((a, b) => 
        new Date(b.TimeStamp) - new Date(a.TimeStamp)
      );
      setAlerts(sortedAlerts);
    } catch (e) {
      console.error('Error fetching alerts:', e);
    }
  }, []);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      const floor = await AsyncStorage.getItem('userFloor');
      if (!floor) {
        Alert.alert('Error', 'User floor not found. Please log in again.');
        return;
      }
      setUserFloor(floor);
      await Promise.all([fetchUnverifiedAlerts(floor), fetchAlerts(floor)]);
      const interval = setInterval(() => fetchUnverifiedAlerts(floor), 10000);
      return () => clearInterval(interval);
    } catch (e) {
      Alert.alert('Error', 'Failed to initialize. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchUnverifiedAlerts, fetchAlerts]);

  useEffect(() => {
    checkInstructionsSeen();
    initialize();
  }, [checkInstructionsSeen, initialize]);

  const formatDate = useCallback((timestamp) => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return date.toISOString().split('T')[0];
    } catch {
      return 'Invalid Date';
    }
  }, []);

  const formatTime = useCallback((timestamp) => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Invalid Time';
    }
  }, []);

  const handleCardPress = useCallback(async (alert) => {
    const status = alert.Verification?.toLowerCase() || '';
    try {
      if (status === 'in progress' || status === 'verified') {
        const report = await MongoDatabase.getActionReportBySuspiciousActivityId(alert.SuspiciousActivityId);
        if (report) {
          setSelectedReport(report);
          setModalVisible(true);
        } else {
          navigation.navigate('ActionReport', { alert });
        }
      } else if (status === 'completed') {
        const report = await MongoDatabase.getActionReportBySuspiciousActivityId(alert.SuspiciousActivityId);
        if (report) {
          setSelectedReport(report);
          setModalVisible(true);
        } else {
          Alert.alert('Info', 'No action report found for this alert.');
        }
      } else {
        Alert.alert('Info', 'Action reports can only be created for verified or in progress alerts.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch action report details.');
    }
  }, [navigation]);

  const handleInstructionsConfirmation = useCallback(async () => {
    try {
      setHasReadInstructions(true);
      await AsyncStorage.setItem('hasSeenInstructions', 'true');
    } catch (e) {
      console.error('Error saving instructions confirmation:', e);
    }
  }, []);

  const handleCloseInstructionsModal = useCallback(() => {
    if (hasReadInstructions) {
      setShowInstructionsModal(false);
    } else {
      Alert.alert('Please Confirm', 'You must confirm that you have read the instructions before closing.');
    }
  }, [hasReadInstructions]);

  const renderAlertItem = useCallback(({ item }) => {
    const status = item.Verification?.toLowerCase() || '';
    const { card: cardColor, avatar: avatarColor } = STATUS_COLORS[status] || STATUS_COLORS.default;

    return (
      <TouchableOpacity onPress={() => handleCardPress(item)}>
        <View style={[styles.alertCard, { backgroundColor: cardColor }]}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Ionicons name="checkmark" size={20} color="white" />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{`${item.Type} Detected`}</Text>
            <Text style={styles.alertText}>Floor: {item.FloorNo}</Text>
            <Text style={styles.alertText}>Camera: {item.CameraNo}</Text>
            <Text style={styles.alertText}>Date: {formatDate(item.TimeStamp)}</Text>
            <Text style={styles.alertText}>Time: {formatTime(item.TimeStamp)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </View>
      </TouchableOpacity>
    );
  }, [formatDate, formatTime, handleCardPress]);

  const renderImageItem = useCallback(({ item }) => (
    <Image
      source={{ uri: item }}
      style={styles.modalImage}
      resizeMode="contain"
    />
  ), []);

  const renderShimmerEffect = useCallback(() => (
    <FlatList
      data={[1, 2, 3, 4, 5]}
      renderItem={() => (
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          style={styles.shimmerCard}
          shimmerColors={['#E0E0E0', '#F5F5F5', '#E0E0E0']}
        >
          <View style={styles.alertCard}>
            <View style={styles.avatarPlaceholder} />
            <View style={styles.shimmerTextContainer}>
              <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={styles.shimmerText}
                shimmerColors={['#E0E0E0', '#F5F5F5', '#E0E0E0']}
              />
              <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={styles.shimmerText}
                shimmerColors={['#E0E0E0', '#F5F5F5', '#E0E0E0']}
              />
              <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={styles.shimmerText}
                shimmerColors={['#E0E0E0', '#F5F5F5', '#E0E0E0']}
              />
            </View>
          </View>
        </ShimmerPlaceholder>
      )}
      keyExtractor={(item) => item.toString()}
      showsVerticalScrollIndicator={false}
    />
  ), []);

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ backgroundColor: '#007AFF' }} edges={['top']}>
        <View style={styles.appBar}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.notificationContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Alert')}
              style={styles.notificationButton}
            >
              <Ionicons
                name="notifications"
                size={height * 0.04}
                color="white"
              />
              {unverifiedAlertCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unverifiedAlertCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Recent Alerts</Text>
            <DropDownPicker
              open={open}
              value={selectedFilter}
              items={FILTER_OPTIONS}
              setOpen={setOpen}
              setValue={setSelectedFilter}
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              dropDownContainerStyle={styles.dropDownContainerStyle}
              textStyle={styles.dropdownText}
              zIndex={1000}
              zIndexInverse={2000}
            />
          </View>

          <View style={styles.statusIndicators}>
            <View style={styles.statusItem}>
              <View style={[styles.statusSquare, { backgroundColor: STATUS_COLORS.verified.avatar }]} />
              <Text style={styles.statusText}>Verified</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusSquare, { backgroundColor: STATUS_COLORS['in progress'].avatar }]} />
              <Text style={styles.statusText}>In Progress</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusSquare, { backgroundColor: STATUS_COLORS.completed.avatar }]} />
              <Text style={styles.statusText}>Completed</Text>
            </View>
          </View>

          {isLoading ? (
            renderShimmerEffect()
          ) : filteredAlerts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No alerts found for your floor.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredAlerts}
              renderItem={renderAlertItem}
              keyExtractor={(item) => item._id.toString()}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>Action Report Details</Text>
                {selectedReport ? (
                  <>
                    <Text style={styles.modalLabel}>Suspicious Activity ID:</Text>
                    <Text style={styles.modalText}>{selectedReport.SuspiciousActivityId}</Text>
                    <Text style={styles.modalLabel}>Submission Date:</Text>
                    <Text style={styles.modalText}>{formatDate(selectedReport.SubmissionDate)}</Text>
                    <Text style={styles.modalLabel}>Time:</Text>
                    <Text style={styles.modalText}>{formatTime(selectedReport.SubmissionDate)}</Text>
                    <Text style={styles.modalLabel}>Location:</Text>
                    <Text style={styles.modalText}>{selectedReport.location}</Text>
                    <Text style={styles.modalLabel}>Incident Description:</Text>
                    <Text style={styles.modalText}>{selectedReport.IncidentDescription}</Text>
                    <Text style={styles.modalLabel}>Evidence:</Text>
                    <Text style={styles.modalText}>{selectedReport.Evidence}</Text>
                    {selectedReport.ImageUrls?.length > 0 && (
                      <>
                        <Text style={styles.modalLabel}>Attached Images:</Text>
                        <FlatList
                          horizontal
                          data={selectedReport.ImageUrls}
                          renderItem={renderImageItem}
                          keyExtractor={(item, index) => index.toString()}
                          showsHorizontalScrollIndicator={false}
                          style={styles.modalImageList}
                        />
                      </>
                    )}
                    <Text style={styles.modalLabel}>Additional Notes:</Text>
                    <Text style={styles.modalText}>{selectedReport.AdditionalNotes || 'N/A'}</Text>
                  </>
                ) : (
                  <Text style={styles.modalText}>No report details available.</Text>
                )}
              </ScrollView>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={showInstructionsModal}
          onRequestClose={handleCloseInstructionsModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>Important Instructions</Text>
                {IMPORTANT_POINTS.map((point, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                    <Text style={styles.instructionText}>{point}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleInstructionsConfirmation}
                >
                  <Ionicons
                    name={hasReadInstructions ? "checkmark-circle" : "checkmark-circle-outline"}
                    size={24}
                    color={hasReadInstructions ? "#4CAF50" : "#B0B0B0"}
                  />
                  <Text style={styles.confirmButtonText}>
                    I have read all the instructions
                  </Text>
                </TouchableOpacity>
              </ScrollView>
              <TouchableOpacity
                style={[styles.closeButton, !hasReadInstructions && styles.closeButtonDisabled]}
                onPress={handleCloseInstructionsModal}
                disabled={!hasReadInstructions}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  logo: {
    height: width * 0.04,
  },
  notificationContainer: {
    position: 'absolute',
    right: 10,
  },
  notificationButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 16,
    minHeight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  statusSquare: {
    width: 12,
    height: 12,
    marginRight: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  dropdownContainer: {
    width: 120,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  dropDownContainerStyle: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  dropdownText: {
    fontSize: 16,
    color: '#212121',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
    marginLeft: 10,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  alertText: {
    fontSize: 14,
    color: '#666',
  },
  shimmerCard: {
    marginBottom: 10,
    borderRadius: 8,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  shimmerTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  shimmerText: {
    height: 14,
    marginBottom: 5,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  modalImageList: {
    marginVertical: 10,
  },
  modalImage: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 5,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButtonDisabled: {
    backgroundColor: '#a0c4ff',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  confirmButtonText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
});

export default HomeScreen;