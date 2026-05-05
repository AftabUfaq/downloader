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
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTranslation } from 'react-i18next'; // 1. Import hook
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useRemoteConfig } from '../hooks/useRemoteConfig';

// Define Platforms outside or inside, but we'll use t() inside the render
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
  const { t } = useTranslation(); // 2. Initialize translation
  const isAdsEnabled = useRemoteConfig();

  return (
    <View style={styles.mainWrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* 3. Translated Header */}
        <Text style={styles.headerTitle}>{t('home_title')}</Text>

        <View style={styles.gridContainer}>
          {PLATFORMS_DATA.map((app) => (
            <TouchableOpacity
              key={app.name}
              onPress={() => {
                navigation.navigate(app.target, { initialUrl: app.url });
              }}
              style={styles.gridItem}
            >
              <app.icon size={24} color={app.color} />
              {/* 4. Translated Platform Name */}
              <Text style={styles.gridText}>{t(app.name)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {isAdsEnabled && (
        <View style={styles.adContainer}>
          <BannerAd
            unitId={TestIds.BANNER}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20, // Add space so the grid isn't hidden behind the ad
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    alignItems: 'center',
    // Shadow for Android/iOS
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gridText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    color: '#333',
  },
  // Style for the Ad Container
  adContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 5,
    minHeight: 60, // Prevents layout jumping when ad loads
  },
});