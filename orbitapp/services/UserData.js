import AsyncStorage from '@react-native-async-storage/async-storage';

const UserData = {
  username: null,
  floor: null,
  userId: null,
  profileImageUrl: null,

  async init() {
    try {
      this.username = await AsyncStorage.getItem('userName') || 'Unknown User';
      this.floor = await AsyncStorage.getItem('floor') || 'Unknown Floor';
      this.userId = await AsyncStorage.getItem('userId') || null;

      console.log('UserData.init - Loaded userId:', this.userId);

      if (this.userId) {
        this.profileImageUrl = await AsyncStorage.getItem(`profileImage_${this.userId}`) || null;
        console.log('UserData.init - Loaded profileImageUrl:', this.profileImageUrl);
      } else {
        this.profileImageUrl = null;
        console.warn('UserData.init - No userId found, skipping profileImageUrl load');
      }

      console.log('UserData after init:', {
        username: this.username,
        floor: this.floor,
        userId: this.userId,
        profileImageUrl: this.profileImageUrl,
      });
    } catch (e) {
      console.error('Error initializing UserData:', e.message, e.stack);
      throw e;
    }
  },

  async setUserData({ username, floor, userId, profileImageUrl }) {
    try {
      this.username = username || 'Unknown User';
      this.floor = floor || 'Unknown Floor';
      this.userId = userId || null;
      this.profileImageUrl = profileImageUrl || null;

      await AsyncStorage.setItem('userName', String(this.username));
      await AsyncStorage.setItem('floor', String(this.floor));
      if (this.userId) {
        await AsyncStorage.setItem('userId', String(this.userId));
      } else {
        await AsyncStorage.removeItem('userId');
      }
      if (this.profileImageUrl && this.userId) {
        await AsyncStorage.setItem(`profileImage_${this.userId}`, this.profileImageUrl);
      } else if (this.userId) {
        await AsyncStorage.removeItem(`profileImage_${this.userId}`);
      }

      console.log('UserData.setUserData - Updated UserData:', {
        username: this.username,
        floor: this.floor,
        userId: this.userId,
        profileImageUrl: this.profileImageUrl,
      });
    } catch (e) {
      console.error('Error setting user data:', e.message, e.stack);
      throw e;
    }
  },

  async setProfileImageUrl(userId, imageUrl) {
    try {
      if (!userId) {
        throw new Error('userId is required to set profile image URL');
      }
      this.profileImageUrl = imageUrl;
      await AsyncStorage.setItem(`profileImage_${userId}`, imageUrl);

      const response = await fetch(`http://192.168.1.22:3000/api/users/${userId}/profile-image`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileImageUrl: imageUrl }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error('Failed to update profile image URL on the backend: ' + (data.message || 'Unknown error'));
      }
      console.log('UserData.setProfileImageUrl - Updated profileImageUrl:', imageUrl);
    } catch (e) {
      console.error('Error saving profile image URL:', e.message, e.stack);
      throw e;
    }
  },

  async clear() {
    try {
      const oldUserId = this.userId;
      this.username = null;
      this.floor = null;
      this.userId = null;
      this.profileImageUrl = null;

      await AsyncStorage.removeItem('userName');
      await AsyncStorage.removeItem('floor');
      await AsyncStorage.removeItem('userId');
      if (oldUserId) {
        await AsyncStorage.removeItem(`profileImage_${oldUserId}`);
      }

      console.log('UserData after clear:', {
        username: this.username,
        floor: this.floor,
        userId: this.userId,
        profileImageUrl: this.profileImageUrl,
      });
    } catch (e) {
      console.error('Error clearing UserData:', e.message, e.stack);
      throw e;
    }
  },

  async getEmail() {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      console.log('UserData.getEmail - Retrieved email:', email);
      return email;
    } catch (e) {
      console.error('Error getting email:', e.message, e.stack);
      return null;
    }
  },
};

export default UserData;