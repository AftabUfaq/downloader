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
import { useTranslation } from 'react-i18next'; // Localization Hook

const PermissionsScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();

  // Check if current language is RTL (Arabic or Urdu)
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  const requestStoragePermission = async () => {
    try {
      let permissionType;
      
      if (Platform.OS === 'ios') {
        permissionType = PERMISSIONS.IOS.PHOTO_LIBRARY;
      } else {
        // Android 13+ (API 33) uses READ_MEDIA_VIDEO/IMAGES
        // Older versions use WRITE_EXTERNAL_STORAGE
        permissionType = Platform.Version >= 33 
          ? PERMISSIONS.ANDROID.READ_MEDIA_VIDEO 
          : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;
      }

      const result = await request(permissionType);

      if (result === RESULTS.GRANTED) {
        navigation.navigate('Onboarding');
      } else if (result === RESULTS.BLOCKED) {
        Alert.alert(
          t('perm_blocked_title'),
          t('perm_blocked_desc'),
          [{ text: t('continue') }] // Reusing continue key for the alert button
        );
      } else {
        // If denied but not blocked, we move to onboarding so they can still see the app
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

        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'center' }]}>
          {t('perm_title')}
        </Text>
        
        <Text style={[styles.description, { textAlign: isRTL ? 'right' : 'center' }]}>
          {t('perm_desc')}
        </Text>

        <View style={[styles.featureList, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={styles.featureItem}>{t('perm_feature_1')}</Text>
          <Text style={styles.featureItem}>{t('perm_feature_2')}</Text>
          <Text style={styles.featureItem}>{t('perm_feature_3')}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={requestStoragePermission}>
          <Text style={styles.buttonText}>{t('allow_access')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => navigation.navigate('Onboarding')}
        >
          <Text style={styles.secondaryButtonText}>{t('not_now')}</Text>
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
    marginBottom: 15,
    width: '100%'
  },
  description: { 
    fontSize: 16, 
    color: '#666', 
    lineHeight: 24,
    marginBottom: 30,
    width: '100%'
  },
  featureList: {
    width: '100%',
    paddingHorizontal: 20,
  },
  featureItem: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginVertical: 8,
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