import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next'; // 1. Import hook
import AsyncStorage from '@react-native-async-storage/async-storage'; // 2. Import Storage

const LANGUAGES = [
  { id: '1', name: 'English', subName: 'English', code: 'en' },
  { id: '2', name: 'Spanish', subName: 'Español', code: 'es' },
  { id: '3', name: 'French', subName: 'Français', code: 'fr' },
  { id: '4', name: 'Arabic', subName: 'العربية', code: 'ar' },
  { id: '5', name: 'Hindi', subName: 'हिन्दी', code: 'hi' },
  { id: '6', name: 'Urdu', subName: 'اردو', code: 'ur' },
];

const LanguageScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation(); // 3. Get translation functions
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');

  // 4. Update language as soon as the user selects one
  const handleSelectLanguage = (code) => {
    setSelectedLanguage(code);
    i18n.changeLanguage(code); // This changes the UI text instantly
  };

const handleContinue = async () => {
  try {
    await AsyncStorage.setItem('user-language', selectedLanguage);
    // ✅ MUST MATCH App.tsx EXACTLY (Capital L)
    navigation.navigate('SecondaryLanguage'); 
  } catch (e) {
    console.log('Error saving language', e);
  }
};

  const renderItem = ({ item }) => {
    const isSelected = selectedLanguage === item.code;
    
    return (
      <TouchableOpacity 
        style={[styles.languageCard, isSelected && styles.selectedCard]} 
        onPress={() => handleSelectLanguage(item.code)} // Change logic here
        activeOpacity={0.7}
      >
        <View>
          <Text style={[styles.languageName, isSelected && styles.selectedText]}>
            {item.name}
          </Text>
          <Text style={[styles.languageSub, isSelected && styles.selectedSub]}>
            {item.subName}
          </Text>
        </View>
        
        <View style={[styles.radioCircle, isSelected && styles.selectedRadio]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* 6. Use t('key') instead of hardcoded text */}
        <Text style={styles.title}>{t('language_title')}</Text>
        <Text style={styles.subtitle}>{t('language_subtitle')}</Text>
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

// ... styles remain the same ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 25, paddingTop: 40, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  languageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#F7F7F7',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
});

export default LanguageScreen;