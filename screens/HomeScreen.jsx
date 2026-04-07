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
import React, { useState, useEffect } from 'react'; // Added useEffect
import {
  ScrollView,
  StyleSheet, 
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// --- 1. IMPORT ADS AND REMOTE CONFIG ---
import mobileAds, { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useRemoteConfig } from '../hooks/useRemoteConfig'; 

const PLATFORMS = [
  { 
    name: 'TikTok', 
    icon: Music, 
    target: 'TikTok', 
    keys: ['tiktok'], 
    color: '#00f2ea', 
    url: "https://www.tiktok.com/@sanorita_official/video/7618248251703266581" 
  },
  { 
    name: 'Instagram', 
    icon: Camera, 
    target: 'Instagram', 
    keys: ['instagram'], 
    color: '#E1306C', 
    url: "https://www.instagram.com/reel/DOrD8anCKNH/" 
  },
  { 
    name: 'Facebook', 
    icon: Share, 
    target: 'Facebook', 
    keys: ['facebook', 'fb.watch'], 
    color: '#1877F2', 
    url: "https://www.facebook.com/share/r/18XFVPLS3c/" 
  },
  { 
    name: 'Twitter/X', 
    icon: X, 
    target: 'Twitter', 
    keys: ['twitter', 'x.com'], 
    color: '#000000', 
    url: "https://x.com/i/status/2040454818846945754" 
  },
  { 
    name: 'Snapchat', 
    icon: Ghost, 
    target: 'Snapchat', 
    keys: ['snapchat'], 
    color: '#FFFC00', 
    url: "https://www.snapchat.com/@snapchat/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYeXFtbHJpdXduAZzmEYZJAZzmEYYwAAAAAQ" 
  },
  { 
    name: 'Pinterest', 
    icon: Pin, 
    target: 'Pinterest', 
    keys: ['pinterest'], 
    color: '#BD081C', 
    url: "https://pin.it/63K783cCL" 
  },
  { 
    name: 'LinkedIn', 
    icon: Briefcase, 
    target: 'LinkedIn', 
    keys: ['linkedin'], 
    color: '#0A66C2', 
    url: "https://www.linkedin.com/posts/aisa-hai-future-with-zong-5g-ugcPost-7442101663563198464-26cM?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAAFK8i7oBDlehKrUJEBaxoob_uWNQicwmUNc" 
  },
  { 
    name: 'YouTube', 
    icon: Video, 
    target: 'YouTube', 
    keys: ['youtube.com', 'youtu.be'], 
    color: '#FF0000', 
    url: "https://youtube.com/shorts/2lKj7Nkmxcc?si=ub-9VlbUiazh3Dt5" 
  },
];

export default function HomeScreen({ navigation }) {
  const [url, setUrl] = useState('');
  
  // --- 2. CALL THE REMOTE CONFIG HOOK ---
  const isAdsEnabled = useRemoteConfig();

  // --- 3. INITIALIZE ADS SDK ---
  useEffect(() => {
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('Ads SDK Initialized');
      });
  }, []);

  return (
    <View style={styles.mainWrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>SnappySave</Text>

        {/* Platform Grid */}
        <View style={styles.gridContainer}>
          {PLATFORMS.map((app) => (
            <TouchableOpacity
              key={app.name}
              onPress={() => {
                navigation.navigate(app.target, { initialUrl: app.url });
              }}
              style={styles.gridItem}
            >
              <app.icon size={24} color={app.color} />
              <Text style={styles.gridText}>{app.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* --- 4. THE BANNER AD (FIXED AT BOTTOM) --- */}
      {isAdsEnabled && (
        <View style={styles.adContainer}>
          <BannerAd
            // SWAP TestIds.BANNER for your REAL ID below:
            unitId="ca-app-pub-1872370171643223/2208977545" 
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            onAdFailedToLoad={(error) => {
              console.log('Ad failed to load: ', error);
            }}
            onAdLoaded={() => {
              console.log('Real Ad loaded successfully!');
            }}
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