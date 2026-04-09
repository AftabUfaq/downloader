import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  Platform 
} from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const PermissionsScreen = ({ navigation }) => {

  const requestStoragePermission = async () => {
    try {
      // Determine which permission to ask for based on Platform and Version
      let permissionType;
      
      if (Platform.OS === 'ios') {
        permissionType = PERMISSIONS.IOS.PHOTO_LIBRARY;
      } else {
        // For Android 13+ (API 33), use READ_MEDIA_VIDEO/IMAGES
        // For older versions, use WRITE_EXTERNAL_STORAGE
        permissionType = Platform.Version >= 33 
          ? PERMISSIONS.ANDROID.READ_MEDIA_VIDEO 
          : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;
      }

      const result = await request(permissionType);

      if (result === RESULTS.GRANTED) {
        // Move to Onboarding or Home
        navigation.navigate('Onboarding');
      } else if (result === RESULTS.BLOCKED) {
        Alert.alert(
          "Permission Blocked",
          "Please enable storage access in your device settings to save media.",
          [{ text: "OK" }]
        );
      } else {
        // If they deny, we still let them move forward, 
        // but they won't be able to save until they grant it later.
        navigation.navigate('Onboarding');
      }
    } catch (error) {
      console.log("Permission Error: ", error);
      navigation.navigate('Onboarding');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Visual Icon Area */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>💾</Text>
        </View>

        <Text style={styles.title}>Storage Access</Text>
        <Text style={styles.description}>
          To save your favorite videos and photos directly to your gallery, 
          Snappy Save needs permission to access your storage.
        </Text>

        <View style={styles.featureList}>
          <Text style={styles.featureItem}>✅ Save HD Videos</Text>
          <Text style={styles.featureItem}>✅ Instant Gallery Sync</Text>
          <Text style={styles.featureItem}>✅ Offline Viewing</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={requestStoragePermission}>
          <Text style={styles.buttonText}>Allow Access</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => navigation.navigate('Onboarding')}
        >
          <Text style={styles.secondaryButtonText}>Not Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  content: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 30 
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFBE6',
    borderWidth: 2,
    borderColor: '#FFE600',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  iconEmoji: { 
    fontSize: 50 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#000', 
    marginBottom: 15 
  },
  description: { 
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center', 
    lineHeight: 24,
    marginBottom: 30 
  },
  featureList: {
    alignItems: 'flex-start',
    width: '100%',
    paddingLeft: '15%',
  },
  featureItem: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginVertical: 5,
  },
  footer: { 
    padding: 20 
  },
  primaryButton: {
    backgroundColor: '#FFE600',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#000' 
  },
  secondaryButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryButtonText: { 
    fontSize: 16, 
    color: '#999', 
    fontWeight: '600' 
  },
});

export default PermissionsScreen;