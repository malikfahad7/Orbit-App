import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import UserData from '../services/UserData';
import { CLOUDINARY_CLOUD_NAME } from '@env';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [profileImage, setProfileImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [managerName, setManagerName] = useState('Loading...');
  const [floorNumber, setFloorNumber] = useState('');

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        await UserData.init();
        if (!UserData.userId) {
          Alert.alert('Session Expired', 'Please log in again.', [
            { text: 'OK', onPress: () => navigation.replace('Login') },
          ]);
          return;
        }
        setManagerName(UserData.username || 'Unknown User');
        setFloorNumber(UserData.floor || '');
        setProfileImage(UserData.profileImageUrl);
      } catch (e) {
        Alert.alert('Error', 'Failed to load user data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, [navigation]);

  // Handle image upload to Cloudinary
  const handleImageUpload = async () => {
    if (!UserData.userId) {
      Alert.alert('Session Expired', 'Please log in again.', [
        { text: 'OK', onPress: () => navigation.replace('Login') },
      ]);
      return;
    }
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
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (pickerResult.canceled) return;

      const imageUri = pickerResult.assets[0].uri;
      setIsUploading(true);
      const publicId = `profile_${UserData.userId}`;
      const signatureResponse = await fetch('http://192.168.1.22:3000/api/cloudinary-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: publicId }),
      });
      const signatureData = await signatureResponse.json();
      if (!signatureData.signature || !signatureData.timestamp || !signatureData.apiKey) {
        throw new Error('Failed to fetch Cloudinary signature');
      }

      const formData = new FormData();
      formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'profile.jpg' });
      formData.append('api_key', signatureData.apiKey);
      formData.append('timestamp', signatureData.timestamp.toString());
      formData.append('signature', signatureData.signature);
      formData.append('public_id', publicId);
      formData.append('invalidate', 'true');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      if (data.secure_url) {
        await UserData.setProfileImageUrl(UserData.userId, data.secure_url);
        setProfileImage(data.secure_url);
        Alert.alert('Success', 'Profile image updated successfully!');
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update image: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    await UserData.clear();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  // Open Instagram link
  const handleInstagramLink = async () => {
    const url = 'https://www.instagram.com/orbitsecuritysolutions/';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open Instagram. Please ensure the app or browser is available.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open Instagram link: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={handleImageUpload} disabled={isUploading}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require('../assets/dummy.jpg')
            }
            style={styles.profileImage}
            resizeMode="cover"
          />
          {isUploading && (
            <View style={styles.uploadingOverlay}>
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.spacer} />
        <Text style={styles.managerName}>{managerName}</Text>
        <View style={styles.smallSpacer} />
        <Text style={styles.floorNumber}>Floor {floorNumber} Manager</Text>
        <View style={styles.spacer} />
        <View style={styles.largeSpacer} />
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => navigation.navigate('PersonalInformation')}
        >
          <Ionicons name="person" size={24} color="#007AFF" />
          <Text style={styles.listItemText}>Personal Information</Text>
          <Ionicons name="chevron-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.listItem} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#007AFF" />
          <Text style={styles.listItemText}>Logout</Text>
          <Ionicons name="chevron-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.listItem} onPress={handleInstagramLink}>
          <Ionicons name="logo-instagram" size={24} color="#007AFF" />
          <Text style={styles.listItemText}>Instagram</Text>
          <Ionicons name="chevron-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.largeSpacer} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#E0E0E0',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 80,
  },
  uploadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  managerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  floorNumber: {
    fontSize: 16,
    color: '#616161',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    width: '100%',
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginLeft: 10,
  },
  spacer: {
    height: 20,
  },
  smallSpacer: {
    height: 10,
  },
  largeSpacer: {
    height: 30,
  },
});

export default ProfileScreen;