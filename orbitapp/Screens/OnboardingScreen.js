import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = () => {
  const navigation = useNavigation();

  const handleGetStarted = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/Onboard.png')}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome to Orbit</Text>
        <Text style={styles.subtext}>
          Improving the overall reporting system with ease and efficiency
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
  },
  image: {
    width: width * 0.9,
    height: height * 0.4,
    marginBottom: height * 0.04,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
    marginBottom: height * 0.02,
  },
  subtext: {
    fontSize: 16,
    color: '#616161',
    textAlign: 'center',
    marginBottom: height * 0.05,
  },
  button: {
    width: width * 0.9,
    height: height * 0.07,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  versionText: {
    position: 'absolute',
    bottom: height * 0.03,
    alignSelf: 'center',
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});

export default OnboardingScreen;