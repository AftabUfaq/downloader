import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Switch,
  Linking,
  Platform
} from 'react-native';
import { 
  Moon, 
  Star, 
  ShieldCheck, 
  Headphones, 
  Share2, 
  Crown,
  ChevronRight,
  Sun,
  Languages,
  MessageCircle
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const SettingsScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect RTL for Arabic and Urdu
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  // Dynamic Theme Colors
  const theme = {
    background: isDarkMode ? '#121212' : '#F8F9FA',
    card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    iconBg: isDarkMode ? '#333333' : '#F0F7FF',
    border: isDarkMode ? '#333333' : '#EEEEEE',
  };

  // --- HANDLER FUNCTIONS ---

  const handleRateUs = () => {
    const GOOGLE_PACKAGE_NAME = 'com.downloader'; 
    const APPLE_STORE_ID = 'YOUR_NUMERIC_ID'; 

    const url = Platform.OS === 'android'
      ? `market://details?id=${GOOGLE_PACKAGE_NAME}`
      : `itms-apps://itunes.apple.com/app/id${APPLE_STORE_ID}?action=write-review`;

    Linking.openURL(url).catch(() => {
      const webUrl = Platform.OS === 'android'
        ? `https://play.google.com/store/apps/details?id=${GOOGLE_PACKAGE_NAME}`
        : `https://apps.apple.com/app/id${APPLE_STORE_ID}`;
      Linking.openURL(webUrl);
    });
  };

  const handleContactSupport = () => {
    const email = 'sajjadamin1924@gmail.com'; 
    const subject = 'SnappySave Support Request';
    Linking.openURL(`mailto:${email}?subject=${subject}`);
  };

  const handleWhatsApp = () => {
    const phoneNumber = '923409797323'; 
    const message = 'Hello Sajjad, I need help with Snappy Save.';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
    });
  };

  const handleShareApp = () => {
    const shareMessage = "Check out Snappy Save! The fastest way to save your favorite media.";
    const url = "https://snappysave.com"; 
    Linking.openURL(`sms:&body=${shareMessage} ${url}`);
  };

  // --- REUSABLE COMPONENT ---

  const SettingItem = ({ icon: Icon, title, subtitle, showSwitch, onPress }) => (
    <TouchableOpacity 
      style={[
        styles.card, 
        { backgroundColor: theme.card, flexDirection: isRTL ? 'row-reverse' : 'row' }
      ]} 
      onPress={onPress}
      disabled={showSwitch}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer, 
        { backgroundColor: theme.iconBg, [isRTL ? 'marginLeft' : 'marginRight']: 15 }
      ]}>
        <Icon size={22} color={isDarkMode ? '#BB86FC' : '#2196F3'} strokeWidth={2} />
      </View>
      
      <View style={[styles.textContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: theme.subText, textAlign: isRTL ? 'right' : 'left' }]}>
          {subtitle}
        </Text>
      </View>

      {showSwitch ? (
        <Switch 
          value={isDarkMode} 
          onValueChange={() => setIsDarkMode(!isDarkMode)}
          trackColor={{ false: "#767577", true: "#BB86FC" }}
        />
      ) : (
        <View style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}>
          <ChevronRight size={20} color={theme.subText} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.background} 
      />
      
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('settings_header')}</Text>
        <TouchableOpacity onPress={handleShareApp}>
          <Share2 size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* PREMIUM CARD */}
        <TouchableOpacity style={[styles.premiumCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[
            styles.premiumIconCircle, 
            { [isRTL ? 'marginLeft' : 'marginRight']: 15 }
          ]}>
            <Crown size={24} color="#FFF" fill="#FFF" />
          </View>
          <View style={[styles.textContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={styles.premiumTitle}>{t('premium_title')}</Text>
            <Text style={styles.premiumSubtitle}>{t('premium_subtitle')}</Text>
          </View>
        </TouchableOpacity>

        {/* APPEARANCE */}
        <Text style={[styles.sectionLabel, { color: theme.subText, textAlign: isRTL ? 'right' : 'left' }]}>
          {t('label_appearance')}
        </Text>
        <SettingItem 
          icon={isDarkMode ? Moon : Sun} 
          title={t('dark_mode')} 
          subtitle={isDarkMode ? t('dark_on') : t('dark_off')} 
          showSwitch={true}
        />

        {/* LOCALIZATION */}
        <Text style={[styles.sectionLabel, { color: theme.subText, textAlign: isRTL ? 'right' : 'left' }]}>
          {t('label_language')}
        </Text>
        <SettingItem 
          icon={Languages} 
          title={t('change_lang')} 
          subtitle={t('change_lang_sub')} 
          onPress={() => navigation.navigate('Language')}
        />

        {/* SUPPORT & LEGAL */}
        <Text style={[styles.sectionLabel, { color: theme.subText, textAlign: isRTL ? 'right' : 'left' }]}>
          {t('label_general')}
        </Text>
        <SettingItem 
          icon={Star} 
          title={t('rate_us')} 
          subtitle={t('rate_us_sub')} 
          onPress={handleRateUs}
        />
        <SettingItem 
          icon={ShieldCheck} 
          title={t('privacy')} 
          subtitle={t('privacy_sub')} 
          onPress={() => navigation.navigate('PrivacyPolicy')}
        />
        <SettingItem 
          icon={Headphones} 
          title={t('email_support')} 
          subtitle="sajjadamin1924@gmail.com" 
          onPress={handleContactSupport}
        />
        <SettingItem 
          icon={MessageCircle} 
          title={t('whatsapp_support')} 
          subtitle={t('whatsapp_sub')} 
          onPress={handleWhatsApp}
        />

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: theme.subText }]}>{t('version')}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    height: 70, 
    paddingHorizontal: 20, 
    alignItems: 'center', 
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 28, fontWeight: '900' },
  scrollContent: { padding: 20 },
  sectionLabel: { 
    fontSize: 12, 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    marginBottom: 10, 
    marginLeft: 5, 
    letterSpacing: 1.2 
  },
  premiumCard: {
    backgroundColor: '#6C63FF', 
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  premiumIconCircle: { 
    width: 45, 
    height: 45, 
    borderRadius: 25, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  premiumTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  premiumSubtitle: { fontSize: 13, color: '#FFF', opacity: 0.9 },
  card: {
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 13, marginTop: 2 },
  footer: { marginTop: 40, alignItems: 'center', marginBottom: 20 },
  versionText: { fontSize: 12, fontWeight: '600', opacity: 0.6 },
});

export default SettingsScreen;