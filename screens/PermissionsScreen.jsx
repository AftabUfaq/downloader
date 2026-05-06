import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  Platform,
  StatusBar // Added StatusBar
} from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext'; // 1. Import Theme hook

const PermissionsScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();

  // 2. Extract theme data
  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDarkMode), [colors, isDarkMode]);

  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  const requestStoragePermission = async () => {
    try {
      let permissionType;
      
      if (Platform.OS === 'ios') {
        permissionType = PERMISSIONS.IOS.PHOTO_LIBRARY;
      } else {
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
          [{ text: t('continue') }]
        );
      } else {
        navigation.navigate('Onboarding');
      }
    } catch (error) {
      console.log("Permission Error: ", error);
      navigation.navigate('Onboarding');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 3. Sync StatusBar */}
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

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
          <Text style={styles.featureItem}>• {t('perm_feature_1')}</Text>
          <Text style={styles.featureItem}>• {t('perm_feature_2')}</Text>
          <Text style={styles.featureItem}>• {t('perm_feature_3')}</Text>
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

// 4. Dynamic Stylesheet
const getStyles = (colors, isDarkMode) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background // Dynamic
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
    backgroundColor: isDarkMode ? '#2D2A00' : '#FFFBE6', // Deeper yellow in Dark Mode
    borderWidth: 2,
    borderColor: '#FFE600', // Brand Yellow
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
    color: colors.text, // Dynamic
    marginBottom: 15,
    width: '100%'
  },
  description: { 
    fontSize: 16, 
    color: colors.subText, // Dynamic
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
    color: colors.text, // Dynamic
    marginVertical: 8,
  },
  footer: { 
    padding: 20 
  },
  primaryButton: {
    backgroundColor: '#FFE600', // Brand Yellow
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
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
    color: colors.subText, // Dynamic
    fontWeight: '600' 
  },
});

export default PermissionsScreen;