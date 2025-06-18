import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  FlatList,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { CLOUDINARY_CLOUD_NAME } from '@env';
import MongoDatabase from '../services/mongodb'; // Import MongoDatabase

const { width, height } = Dimensions.get('window');

const BASE_URL = 'http://192.168.1.22:3000';

const ActionReportScreen = ({ route }) => {
  const { alert: alertData } = route.params;
  const navigation = useNavigation();

  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState([]); // Array to store selected image URIs
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [recommendedReports, setRecommendedReports] = useState([]); // State for recommended reports
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true); // State for recommendation loading

  useEffect(() => {
    console.log('Alert Data:', alertData);

    const fetchEmailAndRecommendations = async () => {
      try {
        // Fetch user email
        const email = await AsyncStorage.getItem('userEmail');
        if (email) {
          setUserEmail(email);
          console.log('Fetched user email from AsyncStorage:', email);
        } else {
          console.log('No email found in AsyncStorage');
          alert('No user email found. Please log in again.');
          navigation.replace('Login');
          return;
        }

        // Fetch recommended reports
        if (alertData.Type) {
          const reports = await MongoDatabase.getRecommendedActionReportsByType(alertData.Type);
          console.log('Fetched recommended reports:', reports);
          // Sort reports by rating in descending order, filter out invalid ratings, and limit to 5
          const sortedReports = reports
            .filter(item => !isNaN(parseFloat(item.rating)))
            .sort((a, b) => {
              const ratingA = parseFloat(a.rating) || 0;
              const ratingB = parseFloat(b.rating) || 0;
              return ratingB - ratingA;
            })
            .slice(0, 5);
          setRecommendedReports(sortedReports);
        } else {
          console.log('No Type found in alertData, skipping recommendations');
        }
      } catch (error) {
        console.error('Error fetching email or recommendations:', error);
        alert('Error fetching user email or recommendations. Please try again.');
        navigation.replace('Login');
      } finally {
        setIsLoading(false);
        setIsLoadingRecommendations(false);
      }
    };

    fetchEmailAndRecommendations();
  }, [navigation, alertData]);

  // Handle image selection
  const pickImages = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Denied',
          'Permission to access photo library is required! Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType?.images || 'images',
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 1,
      });

      if (pickerResult.canceled) {
        console.log('Image picker canceled by user');
        return;
      }

      const selectedImages = pickerResult.assets.map(asset => asset.uri);
      setImages([...images, ...selectedImages]);
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images: ' + error.message);
    }
  };

  // Remove an image from the selected list
  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Upload images to Cloudinary and return their URLs
  const uploadImagesToCloudinary = async (userId, reportId) => {
    setIsUploadingImages(true);
    const uploadedUrls = [];

    try {
      for (let i = 0; i < images.length; i++) {
        const imageUri = images[i];
        const publicId = `actionreport_${reportId}_${i}`;
        console.log('Fetching Cloudinary signature for public_id:', publicId);
        const signatureResponse = await fetch(`${BASE_URL}/api/cloudinary-signature`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ public_id: publicId }),
        });
        const signatureData = await signatureResponse.json();
        if (!signatureData.signature || !signatureData.timestamp || !signatureData.apiKey) {
          throw new Error('Failed to fetch Cloudinary signature: ' + (signatureData.error || 'Unknown error'));
        }

        console.log('Uploading to Cloudinary with public_id:', publicId);
        const formData = new FormData();
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: `actionreport_${i}.jpg`,
        });
        formData.append('api_key', signatureData.apiKey);
        formData.append('timestamp', signatureData.timestamp.toString());
        formData.append('signature', signatureData.signature);
        formData.append('public_id', publicId);
        formData.append('invalidate', 'true');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();
        console.log('Cloudinary response:', data);

        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        } else {
          throw new Error(data.error?.message || 'Upload failed');
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setIsUploadingImages(false);
    }

    return uploadedUrls;
  };

  const submitActionReport = async () => {
    if (!description || !evidence || !notes) {
      alert('All fields are required');
      return;
    }

    setIsSubmitting(true);

    if (!userEmail) {
      console.log('User email is null');
      alert('User email not found. Please log in again.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Fetch user ID by email
      const userResponse = await fetch(`${BASE_URL}/api/user-by-email/${userEmail}`);
      const userData = await userResponse.json();
      if (!userResponse.ok || !userData.userId) {
        throw new Error('User ID not found for email: ' + userEmail);
      }
      const userObjectId = userData.userId;

      // Update alert status to Inprogress
      const statusResponse = await fetch(`${BASE_URL}/api/alert/${alertData._id}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verification: 'in progress' }),
      });

      const statusData = await statusResponse.json();
      if (!statusResponse.ok) {
        throw new Error(statusData.error || 'Failed to update alert status');
      }

      // Submit action report (without images first to get report ID)
      const actionReportData = {
        userId: String(userObjectId),
        SuspiciousActivityId: String(alertData.SuspiciousActivityId),
        SubmissionDate: new Date().toISOString(),
        location: String(`Floor ${alertData.FloorNo}`),
        IncidentDescription: String(description),
        Evidence: String(evidence),
        AdditionalNotes: String(notes),
        ImageUrls: [], // Placeholder, will be updated after upload
      };

      console.log('Submitting action report:', actionReportData);
      const reportResponse = await fetch(`${BASE_URL}/api/action-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionReportData),
      });

      const reportData = await reportResponse.json();
      if (!reportResponse.ok) {
        throw new Error(reportData.error || 'Failed to submit report');
      }

      // Upload images to Cloudinary if any
      let imageUrls = [];
      if (images.length > 0) {
        imageUrls = await uploadImagesToCloudinary(userObjectId, reportData.insertedId);
        // Update the report with the image URLs
        const updateResponse = await fetch(`${BASE_URL}/api/action-report/${reportData.insertedId}/update-images`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ImageUrls: imageUrls }),
        });
        const updateData = await updateResponse.json();
        if (!updateResponse.ok) {
          throw new Error(updateData.error || 'Failed to update report with image URLs');
        }
      }

      alert('Report submitted successfully!');
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (e) {
      console.error('Error submitting action report:', e);
      alert('Failed to submit report: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle recommended report tap
  const handleReportTap = (report) => {
    setDescription(report.IncidentDescription || '');
    setEvidence(report.Evidence || '');
    setNotes(report.AdditionalNotes || '');
  };

  // Render selected images
  const renderImageItem = ({ item, index }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item }} style={styles.selectedImage} resizeMode="cover" />
      <TouchableOpacity
        style={styles.removeImageButton}
        onPress={() => removeImage(index)}
      >
        <Ionicons name="close-circle" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  // Render recommended report item
  const renderRecommendedReportItem = ({ item }) => {
    const ratingValue = parseFloat(item.rating);
    return (
      <TouchableOpacity onPress={() => handleReportTap(item)}>
        <View style={styles.recommendedReportContainer}>
          <Text style={styles.recommendedReportText}>
            <Text style={styles.recommendedReportLabel}>Rating: </Text>
            {!isNaN(ratingValue) ? ratingValue.toFixed(1) : 'N/A'}
          </Text>
          <Text style={styles.recommendedReportText}>
            <Text style={styles.recommendedReportLabel}>Description: </Text>
            {item.IncidentDescription}
          </Text>
          <Text style={styles.recommendedReportText}>
            <Text style={styles.recommendedReportLabel}>Evidence: </Text>
            {item.Evidence}
          </Text>
          <Text style={styles.recommendedReportText}>
            <Text style={styles.recommendedReportLabel}>Additional Notes: </Text>
            {item.AdditionalNotes}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

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
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {/* Recommended Reports Section */}
              <Text style={styles.recommendedTitle}>Recommended for you</Text>
              {isLoadingRecommendations ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.uploadingText}>Loading Recommendations...</Text>
                </View>
              ) : recommendedReports.length > 0 ? (
                <View style={styles.recommendedListContainer}>
                  <FlatList
                    data={recommendedReports}
                    renderItem={renderRecommendedReportItem}
                    keyExtractor={(item) => item._id}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              ) : (
                <Text style={styles.noRecommendationsText}>No recommended reports available.</Text>
              )}

              {/* Action Report Form */}
              <View style={styles.formContainer}>
                <Text style={styles.title}>Action Report</Text>
                <Text style={styles.subtitle}>
                  Submit an action report.
                </Text>
                <Text style={styles.sectionTitle}>Action Report Details</Text>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={styles.textInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter Description"
                  multiline
                  numberOfLines={3}
                />
                <Text style={styles.fieldLabel}>Evidence</Text>
                <TextInput
                  style={styles.textInput}
                  value={evidence}
                  onChangeText={setEvidence}
                  placeholder="Enter Evidence"
                  multiline
                  numberOfLines={2}
                />
                <Text style={styles.fieldLabel}>Image Attachments (Optional)</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickImages}
                  disabled={isSubmitting || isUploadingImages}
                >
                  <Ionicons name="camera" size={24} color="#007AFF" />
                  <Text style={styles.uploadButtonText}>Add Images</Text>
                </TouchableOpacity>
                {images.length > 0 && (
                  <FlatList
                    horizontal
                    data={images}
                    renderItem={renderImageItem}
                    keyExtractor={(item, index) => index.toString()}
                    style={styles.imageList}
                    showsHorizontalScrollIndicator={false}
                  />
                )}
                {isUploadingImages && (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.uploadingText}>Uploading Images...</Text>
                  </View>
                )}
                <Text style={styles.fieldLabel}>Additional Notes</Text>
                <TextInput
                  style={styles.textInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Enter Additional Notes"
                  multiline
                  numberOfLines={2}
                />
                <TouchableOpacity
                  style={[styles.submitButton, (isSubmitting || isUploadingImages) && styles.submitButtonDisabled]}
                  onPress={submitActionReport}
                  disabled={isSubmitting || isUploadingImages}
                >
                  {isSubmitting || isUploadingImages ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 35,
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: height * 0.03,
  },
  recommendedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 20,
    marginBottom: 10,
  },
  recommendedReportContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recommendedReportText: {
    fontSize: 14,
    color: '#212121',
    marginBottom: 5,
  },
  recommendedReportLabel: {
    fontWeight: 'bold',
  },
  recommendedListContainer: {
    marginBottom: 20,
  },
  noRecommendationsText: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#212121',
    marginTop: 20,
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#f9f9f9',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    marginBottom: 10,
  },
  uploadButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  imageList: {
    marginBottom: 10,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#616161',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#a0c4ff',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
  },
});

export default ActionReportScreen;