import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';

const LANGUAGES = [
  { 
    id: 'en', 
    name: 'English', 
    flag: '🌐', 
    variants: [
      { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
      { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' }
    ] 
  },
  { 
    id: 'ar', 
    name: 'العربية', 
    flag: '🌐',
    variants: [
      { code: 'ar-SA', name: 'العربية (السعودية)', flag: '🇸🇦' },
      { code: 'ar-EG', name: 'العربية (مصر)', flag: '🇪🇬' },
      { code: 'ar-AE', name: 'العربية (الإمارات)', flag: '🇦🇪' }
    ]
  },
  { id: 'ur_parent', code: 'ur', name: 'اردو', flag: '🇵🇰', variants: null },
  { id: 'hi_parent', code: 'hi', name: 'हिन्दी', flag: '🇮🇳', variants: null },
  { id: 'es_parent', code: 'es', name: 'Español', flag: '🇪🇸', variants: null },
  { id: 'fr_parent', code: 'fr', name: 'Français', flag: '🇫🇷', variants: null },
];

const SecondaryLanguageScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [currentVariants, setCurrentVariants] = useState(null); 
  const [parentName, setParentName] = useState(''); 

  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  const handleSelect = (item) => {
    if (item.variants) {
      setCurrentVariants(item.variants);
      setParentName(item.name);
    } else {
      const code = item.code;
      setSelectedLanguage(code);
      i18n.changeLanguage(code);
    }
  };

  const handleVariantSelect = (variant) => {
    setSelectedLanguage(variant.code);
    // Changes language based on the base code (e.g., 'en' from 'en-US')
    i18n.changeLanguage(variant.code.split('-')[0]); 
  };

  const handleContinue = async () => {
    if (!selectedLanguage) return;
    try {
      await AsyncStorage.setItem('secondary-language', selectedLanguage);
      navigation.navigate('Permissions');
    } catch (e) {
      console.error("Failed to save language", e);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedLanguage === item.code || 
                       (item.variants && item.variants.some(v => v.code === selectedLanguage));
    
    return (
      <TouchableOpacity 
        style={[
          styles.languageCard, 
          isSelected && styles.selectedCard,
          { flexDirection: isRTL ? 'row-reverse' : 'row' }
        ]} 
        onPress={() => currentVariants ? handleVariantSelect(item) : handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.mainInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.flagEmoji}>{item.flag}</Text>
          <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start', marginHorizontal: 15 }}>
            <Text style={[styles.languageName, isSelected && styles.selectedText]}>
              {item.name}
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
        {currentVariants && (
          <TouchableOpacity 
            onPress={() => setCurrentVariants(null)} 
            style={{ marginBottom: 15 }}
          >
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
              <View style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}>
                <ArrowLeft size={20} color="#666" />
              </View>
              <Text style={{ color: '#666', marginHorizontal: 8, fontWeight: '600' }}>
                {t('back')}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
          {currentVariants ? `${parentName}` : t('secondary_title')}
        </Text>
        <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {currentVariants ? t('select_variant') : t('secondary_subtitle')}
        </Text>
      </View>

      <FlatList
        data={currentVariants || LANGUAGES}
        keyExtractor={(item) => item.code || item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, !selectedLanguage && { opacity: 0.5 }]} 
          onPress={handleContinue}
          disabled={!selectedLanguage}
        >
          <Text style={styles.buttonText}>{t('finish_setup')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 25, paddingTop: 40, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  languageCard: {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F7F7F7',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  mainInfo: { alignItems: 'center', flex: 1 },
  flagEmoji: { fontSize: 28 },
  selectedCard: { borderColor: '#FFE600', backgroundColor: '#FFFBE6' },
  languageName: { fontSize: 18, fontWeight: '700', color: '#333' },
  selectedText: { color: '#000' },
  radioCircle: { 
    height: 24, 
    width: 24, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: '#CCC', 
    alignItems: 'center', 
    justifyContent: 'center' 
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
});

export default SecondaryLanguageScreen;