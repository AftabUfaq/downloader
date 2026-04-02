import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  Alert, ActivityIndicator, PermissionsAndroid, Platform, StatusBar, ScrollView 
} from 'react-native';
import RNFS from 'react-native-fs';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import SplashScreen from 'react-native-splash-screen';
import AppIntroSlider from 'react-native-app-intro-slider';

const slides = [
  { key: 'one', title: 'Copy Link', text: 'Grab the video link from your favorite app.', image: '🔗', backgroundColor: '#6C63FF' },
  { key: 'two', title: 'Paste & Fetch', text: 'We get the highest quality available.', image: '⚡', backgroundColor: '#3F3D56' },
  { key: 'three', title: 'Save to Gallery', text: 'Saved directly to your phone album.', image: '🎬', backgroundColor: '#FF6584' },
];

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    setTimeout(() => { SplashScreen.hide(); }, 2000);
  }, []);

  const _renderItem = ({ item }: any) => (
    <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
      <Text style={styles.slideEmoji}>{item.image}</Text>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideText}>{item.text}</Text>
    </View>
  );

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        Platform.Version >= 33 
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO 
          : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; 
  };

  const getDirectLink = async (inputUrl: string) => {
    const apiKey = 'fb72eb7159mshf46766f30a1f769p16bce5jsn423ef9285b49';
    const apiHost = 'social-download-all-in-one.p.rapidapi.com';
    const apiUrl = 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': apiHost,
      },
      body: JSON.stringify({ url: inputUrl }),
    });
    const json = await response.json();
    let directUrl = json.url || (json.medias && json.medias[0]?.url) || (json.data && json.data.url);
    if (!directUrl) throw new Error("No video URL found.");
    return directUrl;
  };

  const handleDownload = async () => {
    if (!url) return Alert.alert("Error", "Please paste a URL first");
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return Alert.alert("Permission Denied", "App needs storage access.");

    setLoading(true); setProgress(0);
    const fileName = `video_${Date.now()}.mp4`;
    const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

    try {
      const directVideoUrl = await getDirectLink(url);
      const download = RNFS.downloadFile({
        fromUrl: directVideoUrl,
        toFile: filePath,
        headers: { 'User-Agent': 'Mozilla/5.0...' },
        progress: (res) => setProgress((res.bytesWritten / res.contentLength) * 100),
      });
      await download.promise;
      const cleanPath = Platform.OS === 'android' ? `file://${filePath}` : filePath;
      await CameraRoll.saveAsset(cleanPath, { type: 'video', album: 'SnappySave' });
      await RNFS.unlink(filePath);
      Alert.alert("Success", "Video saved to gallery!");
      setUrl('');
    } catch (error: any) {
      Alert.alert("Failed", error.message);
    } finally {
      setLoading(false); setProgress(0);
    }
  };

  if (showOnboarding) {
    return <AppIntroSlider renderItem={_renderItem} data={slides} onDone={() => setShowOnboarding(false)} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <Text style={styles.headerTitle}>SnappySave</Text>
      <Text style={styles.headerSubtitle}>Download from your favorite platforms</Text>

      {/* --- GRID SECTION --- */}
      <View style={styles.gridContainer}>
        <View style={[styles.gridItem, url.includes('tiktok') && styles.activeGridItem]}>
          <Text style={styles.gridEmoji}>♪</Text>
          <Text style={styles.gridText}>TikTok</Text>
        </View>
        <View style={[styles.gridItem, (url.includes('instagram') || url.includes('instagr.am')) && styles.activeGridItem]}>
          <Text style={styles.gridEmoji}>📸</Text>
          <Text style={styles.gridText}>Instagram</Text>
        </View>
        <View style={[styles.gridItem, (url.includes('facebook') || url.includes('fb.watch')) && styles.activeGridItem]}>
          <Text style={styles.gridEmoji}>f</Text>
          <Text style={styles.gridText}>Facebook</Text>
        </View>
        <View style={[styles.gridItem, url.includes('linkedin') && styles.activeGridItem]}>
          <Text style={styles.gridEmoji}>in</Text>
          <Text style={styles.gridText}>LinkedIn</Text>
        </View>
      </View>

      {/* --- INPUT SECTION --- */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Paste link here..."
          placeholderTextColor="#999"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
        />

        <TouchableOpacity 
          style={[styles.mainButton, loading && { backgroundColor: '#A0A0A0' }]} 
          onPress={handleDownload}
          disabled={loading}
        >
          <Text style={styles.mainButtonText}>
            {loading ? `Downloading ${progress.toFixed(0)}%` : 'Download Video'}
          </Text>
        </TouchableOpacity>
        
        {loading && <ActivityIndicator size="small" color="#fff" style={styles.loader} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F8F9FA', padding: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#1A1A1A', marginBottom: 5 },
  headerSubtitle: { fontSize: 14, color: '#666', marginBottom: 30 },
  
  // Grid Styles
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  gridItem: { 
    width: '47%', backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 15,
    alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8
  },
  activeGridItem: { borderColor: '#6C63FF', borderWidth: 2, backgroundColor: '#F0EFFF' },
  gridEmoji: { fontSize: 24, marginBottom: 8 },
  gridText: { fontSize: 14, fontWeight: '600', color: '#333' },

  // Input Area
  inputArea: { width: '100%' },
  input: { 
    backgroundColor: '#FFF', padding: 18, borderRadius: 15, fontSize: 16, color: '#000',
    marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 5
  },
  mainButton: { backgroundColor: '#6C63FF', padding: 18, borderRadius: 15, alignItems: 'center', elevation: 5 },
  mainButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  loader: { marginTop: 10 },

  // Onboarding
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  slideEmoji: { fontSize: 80, marginBottom: 20 },
  slideTitle: { fontSize: 26, color: '#fff', fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  slideText: { fontSize: 18, color: '#fff', textAlign: 'center', lineHeight: 24 }
});