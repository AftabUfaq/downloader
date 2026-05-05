import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGES = [
  { id: '1', name: 'English', subName: 'English', code: 'en', flag: '🇺🇸' },
  { id: '2', name: 'Spanish', subName: 'Español', code: 'es', flag: '🇪🇸' },
  { id: '3', name: 'French', subName: 'Français', code: 'fr', flag: '🇫🇷' },
  { id: '4', name: 'Arabic', subName: 'العربية', code: 'ar', flag: '🇸🇦' },
  { id: '5', name: 'Hindi', subName: 'हिन्दी', code: 'hi', flag: '🇮🇳' },
  { id: '6', name: 'Urdu', subName: 'اردو', code: 'ur', flag: '🇵🇰' },
];

const LanguageScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
  
  // Detect if current language is RTL
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  const handleSelectLanguage = (code) => {
    setSelectedLanguage(code);
    i18n.changeLanguage(code); 
  };

  const handleContinue = async () => {
    try {
      await AsyncStorage.setItem('user-language', selectedLanguage);
      navigation.navigate('SecondaryLanguage'); 
    } catch (e) {
      console.log('Error saving language', e);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedLanguage === item.code;
    
    return (
      <TouchableOpacity 
        style={[
          styles.languageCard, 
          isSelected && styles.selectedCard,
          { flexDirection: isRTL ? 'row-reverse' : 'row' } // Flip card for RTL
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
            <Text style={[styles.languageSub, isSelected && styles.selectedSub]}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 25, paddingTop: 40, marginBottom: 20 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  languageCard: {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#F7F7F7',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  mainInfo: { alignItems: 'center', flex: 1 },
  flagEmoji: { fontSize: 28 }, // Large flag for better visibility
  selectedCard: { borderColor: '#FFE600', backgroundColor: '#FFFBE6' },
  languageName: { fontSize: 18, fontWeight: '700', color: '#333' },
  languageSub: { fontSize: 14, color: '#999', marginTop: 2 },
  selectedText: { color: '#000' },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: { borderColor: '#000' },
  radioInner: { height: 12, width: 12, borderRadius: 6, backgroundColor: '#000' },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#FFF' },
  button: {
    backgroundColor: '#FFE600',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    elevation: 5,
  },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
});

export default LanguageScreen;