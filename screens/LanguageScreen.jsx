import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  StatusBar // 1. Added StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext'; // 2. Import Theme

const LANGUAGES = [
  { id: '1', name: 'English', subName: 'English', code: 'en', flag: '🇺🇸' },
  { id: '2', name: 'Spanish', subName: 'Español', code: 'es', flag: '🇪🇸' },
  { id: '3', name: 'French', subName: 'Français', code: 'fr', flag: '🇫🇷' },
  { id: '4', name: 'Arabic', subName: 'العربية', code: 'ar', flag: '🇸🇦' },
  { id: '5', name: 'Hindi', subName: 'हिन्दी', code: 'hi', flag: '🇮🇳' },
  { id: '6', name: 'Urdu', subName: 'اردو', code: 'ur', flag: '🇵🇰' },
];

const LanguageScreen = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
  
  // 3. Extract Theme Data
  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDarkMode), [colors, isDarkMode]);

  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  const handleSelectLanguage = (code) => {
    setSelectedLanguage(code);
    i18n.changeLanguage(code); 
  };

const handleContinue = async () => {
  if (!selectedLanguage) return;
  try {
    await AsyncStorage.setItem('user-language', selectedLanguage);
    
    // Pass the language code forward so the next screen knows what variants to show
    navigation.navigate('SecondaryLanguage', { 
      primaryLanguage: selectedLanguage, // Passing 'en', 'es', etc.
      isSettingFlow: route.params?.isSettingFlow 
    });
  } catch (e) {
    console.log('Error', e);
  }
};

  const renderItem = ({ item }) => {
    const isSelected = selectedLanguage === item.code;
    
    return (
      <TouchableOpacity 
        style={[
          styles.languageCard, 
          isSelected && styles.selectedCard,
          { flexDirection: isRTL ? 'row-reverse' : 'row' } 
        ]} 
        onPress={() => handleSelectLanguage(item.code)}
        activeOpacity={0.7}
      >
        <View style={[styles.mainInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.flagEmoji}>{item.flag}</Text>
          <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start', marginHorizontal: 15 }}>
            <Text style={[styles.languageName, isSelected && styles.selectedText]}>
              {item.name}
            </Text>
            <Text style={[styles.languageSub, isSelected && styles.selectedSubText]}>
              {item.subName}
            </Text>
          </View>
        </View>
        
        <View style={[styles.radioCircle, isSelected && styles.selectedRadio]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 4. Sync StatusBar with Theme */}
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={[styles.header, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('language_title')}
        </Text>
        <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('language_subtitle')}
        </Text>
      </View>

      <FlatList
        data={LANGUAGES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>{t('continue')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// 5. Theme-Aware Stylesheet
const getStyles = (colors, isDarkMode) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background // Dynamic
  },
  header: { 
    paddingHorizontal: 25, 
    paddingTop: 40, 
    marginBottom: 20 
  },
  title: { 
    fontSize: 30, 
    fontWeight: 'bold', 
    color: colors.text // Dynamic
  },
  subtitle: { 
    fontSize: 16, 
    color: colors.subText, // Dynamic
    marginTop: 5 
  },
  listContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 120 
  },
  languageCard: {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    backgroundColor: colors.card, // Dynamic
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.border, // Subtle border for non-selected cards
  },
  mainInfo: { 
    alignItems: 'center', 
    flex: 1 
  },
  flagEmoji: { 
    fontSize: 28 
  },
  selectedCard: { 
    borderColor: '#FFE600', // Kept brand color
    backgroundColor: isDarkMode ? '#2D2A00' : '#FFFBE6' // Darker yellow for Dark Mode
  },
  languageName: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: colors.text // Dynamic
  },
  languageSub: { 
    fontSize: 14, 
    color: colors.subText, // Dynamic
    marginTop: 2 
  },
  selectedText: { 
    color: isDarkMode ? '#FFE600' : '#000' 
  },
  selectedSubText: { 
    color: isDarkMode ? '#AAAAAA' : '#666' 
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border, // Dynamic
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: { 
    borderColor: isDarkMode ? '#FFE600' : '#000' 
  },
  radioInner: { 
    height: 12, 
    width: 12, 
    borderRadius: 6, 
    backgroundColor: isDarkMode ? '#FFE600' : '#000' 
  },
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    padding: 20, 
    backgroundColor: colors.background // Dynamic
  },
  button: {
    backgroundColor: '#FFE600', // Kept brand color
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#000' 
  },
});

export default LanguageScreen;