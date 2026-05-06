import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  StatusBar 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define 6 variants for every language code from your LanguageScreen
const ALL_VARIANTS = {
  en: [
    { code: 'en-US', name: 'English (United States)', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English (United Kingdom)', flag: '🇬🇧' },
    { code: 'en-CA', name: 'English (Canada)', flag: '🇨🇦' },
    { code: 'en-AU', name: 'English (Australia)', flag: '🇦🇺' },
    { code: 'en-NZ', name: 'English (New Zealand)', flag: '🇳🇿' },
    { code: 'en-IE', name: 'English (Ireland)', flag: '🇮🇪' },
  ],
  es: [
    { code: 'es-ES', name: 'Español (España)', flag: '🇪🇸' },
    { code: 'es-MX', name: 'Español (México)', flag: '🇲🇽' },
    { code: 'es-AR', name: 'Español (Argentina)', flag: '🇦🇷' },
    { code: 'es-CO', name: 'Español (Colombia)', flag: '🇨🇴' },
    { code: 'es-CL', name: 'Español (Chile)', flag: '🇨🇱' },
    { code: 'es-US', name: 'Español (Estados Unidos)', flag: '🇺🇸' },
  ],
  fr: [
    { code: 'fr-FR', name: 'Français (France)', flag: '🇫🇷' },
    { code: 'fr-CA', name: 'Français (Canada)', flag: '🇨🇦' },
    { code: 'fr-BE', name: 'Français (Belgique)', flag: '🇧🇪' },
    { code: 'fr-CH', name: 'Français (Suisse)', flag: '🇨🇭' },
    { code: 'fr-LU', name: 'Français (Luxembourg)', flag: '🇱🇺' },
    { code: 'fr-MC', name: 'Français (Monaco)', flag: '🇲🇨' },
  ],
  ar: [
    { code: 'ar-SA', name: 'العربية (السعودية)', flag: '🇸🇦' },
    { code: 'ar-EG', name: 'العربية (مصر)', flag: '🇪🇬' },
    { code: 'ar-AE', name: 'العربية (الإمارات)', flag: '🇦🇪' },
    { code: 'ar-MA', name: 'العربية (المغرب)', flag: '🇲🇦' },
    { code: 'ar-QA', name: 'العربية (قطر)', flag: '🇶🇦' },
    { code: 'ar-KW', name: 'العربية (الكويت)', flag: '🇰🇼' },
  ],
  hi: [
    { code: 'hi-IN', name: 'हिन्दी (भारत)', flag: '🇮🇳' },
    { code: 'hi-FJ', name: 'हिन्दी (फ़िजी)', flag: '🇫🇯' },
    { code: 'hi-MU', name: 'हिन्दी (मॉरीशस)', flag: '🇲🇺' },
    { code: 'hi-SR', name: 'हिन्दी (सूरीनाम)', flag: '🇸🇷' },
    { code: 'hi-GY', name: 'हिन्दी (गयाना)', flag: '🇬🇾' },
    { code: 'hi-NP', name: 'हिन्दी (नेपाल)', flag: '🇳🇵' },
  ],
  ur: [
    { code: 'ur-PK', name: 'اردو (پاکستان)', flag: '🇵🇰' },
    { code: 'ur-IN', name: 'اردو (भारत)', flag: '🇮🇳' },
    { code: 'ur-AE', name: 'اردو (متحدہ عرب امارات)', flag: '🇦🇪' },
    { code: 'ur-GB', name: 'اردو (برطانیہ)', flag: '🇬🇧' },
    { code: 'ur-SA', name: 'اردو (سعودی عرب)', flag: '🇸🇦' },
    { code: 'ur-CA', name: 'اردو (کینیڈا)', flag: '🇨🇦' },
  ],
  'zh-CN': [
    { code: 'zh-CN', name: 'Mandarin (Mainland)', flag: '🇨🇳' },
    { code: 'zh-SG', name: 'Mandarin (Singapore)', flag: '🇸🇬' },
    { code: 'zh-MY', name: 'Mandarin (Malaysia)', flag: '🇲🇾' },
    { code: 'zh-HK-S', name: 'Cantonese (Simplified)', flag: '🇨🇳' },
    { code: 'zh-CN-WU', name: 'Wu Chinese (Shanghai)', flag: '🇨🇳' },
    { code: 'zh-CN-MN', name: 'Min Nan (Simplified)', flag: '🇨🇳' },
  ],
  'zh-TW': [
    { code: 'zh-TW', name: 'Traditional (Taiwan)', flag: '🇹🇼' },
    { code: 'zh-HK', name: 'Cantonese (Hong Kong)', flag: '🇭🇰' },
    { code: 'zh-MO', name: 'Cantonese (Macau)', flag: '🇲🇴' },
    { code: 'zh-TW-HA', name: 'Hakka (Taiwan)', flag: '🇹🇼' },
    { code: 'zh-TW-MN', name: 'Hokkien (Taiwan)', flag: '🇹🇼' },
    { code: 'zh-TW-HO', name: 'Traditional (Overseas)', flag: '🌏' },
  ],
  de: [
    { code: 'de-DE', name: 'Deutsch (Deutschland)', flag: '🇩🇪' },
    { code: 'de-AT', name: 'Deutsch (Österreich)', flag: '🇦🇹' },
    { code: 'de-CH', name: 'Deutsch (Schweiz)', flag: '🇨🇭' },
    { code: 'de-LU', name: 'Deutsch (Luxemburg)', flag: '🇱🇺' },
    { code: 'de-LI', name: 'Deutsch (Liechtenstein)', flag: '🇱🇮' },
    { code: 'de-BE', name: 'Deutsch (Belgien)', flag: '🇧🇪' },
  ],
  pt: [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'pt-PT', name: 'Português (Portugal)', flag: '🇵🇹' },
    { code: 'pt-AO', name: 'Português (Angola)', flag: '🇦🇴' },
    { code: 'pt-MZ', name: 'Português (Moçambique)', flag: '🇲🇿' },
    { code: 'pt-CV', name: 'Português (Cabo Verde)', flag: '🇨🇻' },
    { code: 'pt-GW', name: 'Português (Guiné-Bissau)', flag: '🇬🇼' },
  ],
  it: [
    { code: 'it-IT', name: 'Italiano (Italia)', flag: '🇮🇹' },
    { code: 'it-CH', name: 'Italiano (Svizzera)', flag: '🇨🇭' },
    { code: 'it-SM', name: 'Italiano (San Marino)', flag: '🇸🇲' },
    { code: 'it-VA', name: 'Italiano (Vaticano)', flag: '🇻🇦' },
    { code: 'it-HR', name: 'Italiano (Istria)', flag: '🇭🇷' },
    { code: 'it-US', name: 'Italiano (Stati Uniti)', flag: '🇺🇸' },
  ],
  ru: [
    { code: 'ru-RU', name: 'Русский (Россия)', flag: '🇷🇺' },
    { code: 'ru-BY', name: 'Русский (Беларусь)', flag: '🇧🇾' },
    { code: 'ru-KZ', name: 'Русский (Казахстан)', flag: '🇰🇿' },
    { code: 'ru-KG', name: 'Русский (Киргизия)', flag: '🇰🇬' },
    { code: 'ru-UA', name: 'Русский (Украина)', flag: '🇺🇦' },
    { code: 'ru-MD', name: 'Русский (Молдова)', flag: '🇲🇩' },
  ],
  ja: [
    { code: 'ja-JP', name: '日本語 (標準語)', flag: '🇯🇵' },
    { code: 'ja-JP-KS', name: '日本語 (関西弁)', flag: '🇯🇵' },
    { code: 'ja-JP-KY', name: '日本語 (九州弁)', flag: '🇯🇵' },
    { code: 'ja-JP-TH', name: '日本語 (東北弁)', flag: '🇯🇵' },
    { code: 'ja-JP-OK', name: '日本語 (沖縄弁)', flag: '🇯🇵' },
    { code: 'ja-JP-HK', name: '日本語 (北海道弁)', flag: '🇯🇵' },
  ],
  ko: [
    { code: 'ko-KR', name: '한국어 (대한민국)', flag: '🇰🇷' },
    { code: 'ko-KR-SL', name: '한국어 (서울/경기)', flag: '🇰🇷' },
    { code: 'ko-KR-GS', name: '한국어 (경상도)', flag: '🇰🇷' },
    { code: 'ko-KR-JL', name: '한국어 (전라도)', flag: '🇰🇷' },
    { code: 'ko-KR-CC', name: '한국어 (충청도)', flag: '🇰🇷' },
    { code: 'ko-KR-JJ', name: '한국어 (제주도)', flag: '🇰🇷' },
  ],
  tr: [
    { code: 'tr-TR', name: 'Türkçe (Türkiye)', flag: '🇹🇷' },
    { code: 'tr-CY', name: 'Türkçe (Kıbrıs)', flag: '🇨🇾' },
    { code: 'tr-AZ', name: 'Türkçe (Azerbaycan)', flag: '🇦🇿' },
    { code: 'tr-DE', name: 'Türkçe (Almanya)', flag: '🇩🇪' },
    { code: 'tr-BG', name: 'Türkçe (Bulgaristan)', flag: '🇧🇬' },
    { code: 'tr-MK', name: 'Türkçe (Makedonya)', flag: '🇲🇰' },
  ],
  id: [
    { code: 'id-ID', name: 'Bahasa (Indonesia)', flag: '🇮🇩' },
    { code: 'id-JW', name: 'Bahasa (Jawa)', flag: '🇮🇩' },
    { code: 'id-SU', name: 'Bahasa (Sunda)', flag: '🇮🇩' },
    { code: 'id-MS', name: 'Bahasa (Melayu)', flag: '🇮🇩' },
    { code: 'id-BT', name: 'Bahasa (Batak)', flag: '🇮🇩' },
    { code: 'id-MY', name: 'Bahasa (Malaysia)', flag: '🇲🇾' },
  ],
};
const SecondaryLanguageScreen = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState('');
  
  // Get the primary language passed from the previous screen (e.g., 'en', 'ar')
  const primaryLanguageCode = route.params?.primaryLanguage || 'en';

  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDarkMode), [colors, isDarkMode]);
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  // Automatically load the correct variants for the selected primary language
  const currentVariants = useMemo(() => {
    return ALL_VARIANTS[primaryLanguageCode] || ALL_VARIANTS['en'];
  }, [primaryLanguageCode]);

  const handleVariantSelect = (variant) => {
    setSelectedLanguage(variant.code);
  };

  const handleContinue = async () => {
    if (!selectedLanguage) return;
    try {
      await AsyncStorage.setItem('secondary-language', selectedLanguage);

      if (route.params?.isSettingFlow) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }], 
        });
      } else {
        navigation.navigate('Permissions');
      }
    } catch (e) {
      console.log('Error saving secondary language:', e);
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
        onPress={() => handleVariantSelect(item)}
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
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={[styles.header, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={{ marginBottom: 15 }}
        >
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
            <View style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}>
              <ArrowLeft size={20} color={colors.subText} />
            </View>
            <Text style={{ color: colors.subText, marginHorizontal: 8, fontWeight: '600' }}>
              {t('back')}
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('select_variant')}
        </Text>
        <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('secondary_subtitle')}
        </Text>
      </View>

      <FlatList
        data={currentVariants}
        keyExtractor={(item) => item.code}
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

const getStyles = (colors, isDarkMode) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 25, paddingTop: 40, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 16, color: colors.subText, marginTop: 5 },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  languageCard: {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.card,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  mainInfo: { alignItems: 'center', flex: 1 },
  flagEmoji: { fontSize: 28 },
  selectedCard: { 
    borderColor: '#FFE600', 
    backgroundColor: isDarkMode ? '#2D2A00' : '#FFFBE6' 
  },
  languageName: { fontSize: 18, fontWeight: '700', color: colors.text },
  selectedText: { color: isDarkMode ? '#FFE600' : '#000' },
  radioCircle: { 
    height: 24, 
    width: 24, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: colors.border,
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  selectedRadio: { borderColor: isDarkMode ? '#FFE600' : '#000' },
  radioInner: { 
    height: 12, 
    width: 12, 
    borderRadius: 6, 
    backgroundColor: isDarkMode ? '#FFE600' : '#000' 
  },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: colors.background },
  button: { 
    backgroundColor: '#FFE600', 
    paddingVertical: 18, 
    borderRadius: 18, 
    alignItems: 'center', 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 8,
  },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
});

export default SecondaryLanguageScreen;