import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
 
  StatusBar,
  Switch
} from 'react-native';
import { 
  Moon, 
  Star, 
  ShieldCheck, 
  Headphones, 
  Share2, 
  Info, 
  Crown,
  ChevronRight,
  Sun
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SettingsScreen = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dynamic Theme Colors
  const theme = {
    background: isDarkMode ? '#121212' : '#F8F9FA',
    card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    iconBg: isDarkMode ? '#333333' : '#F0F7FF',
    border: isDarkMode ? '#333333' : '#EEEEEE',
  };

  const SettingItem = ({ icon: Icon, title, subtitle, showSwitch, onPress }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.card }]} 
      onPress={onPress}
      disabled={showSwitch}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
        <Icon size={22} color={isDarkMode ? '#BB86FC' : '#2196F3'} strokeWidth={2} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: theme.subText }]}>{subtitle}</Text>
      </View>
      {showSwitch ? (
        <Switch 
          value={isDarkMode} 
          onValueChange={() => setIsDarkMode(!isDarkMode)}
          trackColor={{ false: "#767577", true: "#BB86FC" }}
        />
      ) : (
        <ChevronRight size={20} color={theme.subText} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      {/* --- CLEAN SIMPLE HEADER --- */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headIcon}><Share2 size={22} color={theme.text} /></TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* --- PREMIUM CARD --- */}
        <TouchableOpacity style={styles.premiumCard}>
          <View style={styles.premiumIconCircle}>
            <Crown size={24} color="#FFF" fill="#FFF" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.premiumTitle}>Go Premium!</Text>
            <Text style={styles.premiumSubtitle}>Support us and unlock all features.</Text>
          </View>
        </TouchableOpacity>

        {/* --- SETTINGS LIST --- */}
        <Text style={[styles.sectionLabel, { color: theme.subText }]}>Appearance</Text>
        <SettingItem 
          icon={isDarkMode ? Moon : Sun} 
          title="Dark Mode" 
          subtitle={isDarkMode ? "Dark theme is ON" : "Light theme is ON"} 
          showSwitch={true}
        />

        <Text style={[styles.sectionLabel, { color: theme.subText }]}>General</Text>
        <SettingItem 
          icon={Star} 
          title="Rate Us" 
          subtitle="Enjoying our app? Give us a 5 star." 
        />
        <SettingItem 
          icon={ShieldCheck} 
          title="Privacy Policy" 
          subtitle="Read our terms and conditions." 
        />
        <SettingItem 
          icon={Headphones} 
          title="Contact Support" 
          subtitle="Need help? Reach out to us." 
        />

        {/* --- FOOTER --- */}
        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: theme.subText }]}>SnappySave v1.0.0</Text>
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
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 28, fontWeight: '900' },
  headerIcons: { flexDirection: 'row' },
  headIcon: { marginLeft: 15 },
  
  scrollContent: { padding: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10, marginLeft: 5, letterSpacing: 1 },

  premiumCard: {
    backgroundColor: '#6C63FF', // Matching your onboarding/main button color
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  premiumIconCircle: { width: 45, height: 45, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  premiumTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  premiumSubtitle: { fontSize: 13, color: '#FFF', opacity: 0.9 },

  card: {
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
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
    marginRight: 15,
  },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 13, marginTop: 2 },

  footer: { marginTop: 40, alignItems: 'center', marginBottom: 20 },
  versionText: { fontSize: 12, fontWeight: '600', opacity: 0.6 },
});

export default SettingsScreen;