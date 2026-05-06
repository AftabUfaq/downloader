import {
  Briefcase,
  Camera,
  Ghost,
  Music,
  Pin,
  Share,
  Video,
  X
} from 'lucide-react-native';
import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar
} from 'react-native';
import { useTranslation } from 'react-i18next';
// Restored Ad Imports
import { BannerAd, BannerAdSize, TestIds, InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { useRemoteConfig } from '../hooks/useRemoteConfig';
import { useTheme } from '../context/ThemeContext';

// --- INTERSTITIAL CONFIG ---
// Replace with your real ID in production
const interstitialUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-7435562362672599/YOUR_ACTUAL_ID';
const interstitial = InterstitialAd.createForAdRequest(interstitialUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

const PLATFORMS_DATA = [
  { name: 'tiktok', icon: Music, target: 'TikTok', color: '#00f2ea', url: "https://www.tiktok.com/@liwany247/video/7613816485668080903" },
  { name: 'instagram', icon: Camera, target: 'Instagram', color: '#E1306C', url: "https://www.instagram.com/reel/DOrD8anCKNH/" },
  { name: 'facebook', icon: Share, target: 'Facebook', color: '#1877F2', url: "https://www.facebook.com/share/r/18XFVPLS3c/" },
  { name: 'twitter', icon: X, target: 'Twitter', color: '#000000', url: "https://x.com/i/status/2040454818846945754" },
  { name: 'snapchat', icon: Ghost, target: 'Snapchat', color: '#FFFC00', url: "https://www.snapchat.com/@snapchat/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYeXFtbHJpdXduAZzmEYZJAZzmEYYwAAAAAQ" },
  { name: 'pinterest', icon: Pin, target: 'Pinterest', color: '#BD081C', url: "https://pin.it/63K783cCL" },
  { name: 'linkedin', icon: Briefcase, target: 'LinkedIn', color: '#0A66C2', url: "https://www.linkedin.com/posts/ifeomaahuna_linkedinpartner-smallbusiness-freelancer-activity-7435436169670307840-5Cm0?utm_source=li_share&utm_content=feedcontent&utm_medium=g_dt_web&utm_campaign=copy" },
  { name: 'youtube', icon: Video, target: 'YouTube', color: '#FF0000', url: "https://youtube.com/shorts/2lKj7Nkmxcc?si=ub-9VlbUiazh3Dt5" },
];

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const isAdsEnabled = useRemoteConfig(); // Getting remote config value
  const [adLoaded, setAdLoaded] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  
  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);

  // Handle Interstitial Logic
  useEffect(() => {
    const loadUnsubscribe = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setAdLoaded(true);
    });

    const closeUnsubscribe = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setAdLoaded(false);
      // Execute the navigation we paused for the ad
      if (pendingNavigation) {
        navigation.navigate(pendingNavigation.target, { initialUrl: pendingNavigation.url });
        setPendingNavigation(null);
      }
      interstitial.load(); // Load next one
    });

    // Start loading ad if enabled
    if (isAdsEnabled) {
      interstitial.load();
    }

    return () => {
      loadUnsubscribe();
      closeUnsubscribe();
    };
  }, [pendingNavigation, isAdsEnabled]);

  const handlePlatformClick = (app) => {
    if (isAdsEnabled && adLoaded) {
      setPendingNavigation(app);
      interstitial.show();
    } else {
      navigation.navigate(app.target, { initialUrl: app.url });
    }
  };

  return (
    <View style={styles.mainWrapper}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>{t('home_title')}</Text>

        <View style={styles.gridContainer}>
          {PLATFORMS_DATA.map((app) => (
            <TouchableOpacity
              key={app.name}
              onPress={() => handlePlatformClick(app)}
              style={styles.gridItem}
            >
              <app.icon size={24} color={app.color} />
              <Text style={styles.gridText}>{t(app.name)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Banner Ad Restored */}
      {isAdsEnabled && (
        <View style={styles.adContainer}>
          <BannerAd
            unitId={TestIds.BANNER}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            onAdFailedToLoad={(error) => console.log('Banner failed:', error)}
          />
        </View>
      )}
    </View>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  mainWrapper: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  container: { 
    flexGrow: 1, 
    padding: 20, 
    paddingTop: 50, 
    paddingBottom: 20 
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: colors.text, 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  gridItem: {
    width: '48%',
    backgroundColor: colors.card,
    padding: 20, // Increased padding for better design
    borderRadius: 18, // Rounded corners
    marginBottom: 15,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.4 : 0.1,
    shadowRadius: 5,
  },
  gridText: { 
    fontSize: 14, // Slightly larger text
    fontWeight: 'bold', 
    marginTop: 10, 
    color: colors.text 
  },
  adContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
    minHeight: 70,
  },
});