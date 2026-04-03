
import AsyncStorage from '@react-native-async-storage/async-storage'; // Ensure this is at the top!
import React, { useEffect, useState } from 'react';


import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  Alert, ActivityIndicator, PermissionsAndroid, Platform, StatusBar, ScrollView, 
  Settings
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RNFS from 'react-native-fs';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import SplashScreen from 'react-native-splash-screen';
import AppIntroSlider from 'react-native-app-intro-slider';


// --- LUCIDE ICON IMPORTS ---


const Tab = createBottomTabNavigator();

import {
  Music, Camera, Share, X,
  Video, Pin, Briefcase, Ghost,
  Download, Link as LinkIcon,
  MessageCircle,
  Library,
  Settings2Icon,
  Home
} from 'lucide-react-native';
import DownloadsScreen from './screens/DownloadsScreen';
import WhatsappScreen from './screens/WhatsappScreen';
import SettingsScreen from './screens/SettingsScreens';


const slides = [
  { key: 'one', title: 'Copy Link', text: 'Grab the video link from your favorite app.', icon: LinkIcon, backgroundColor: '#6C63FF' },
  { key: 'two', title: 'Paste & Fetch', text: 'We get the highest quality available.', icon: Download, backgroundColor: '#3F3D56' },
  { key: 'three', title: 'Save to Gallery', text: 'Saved directly to your phone album.', icon: Camera, backgroundColor: '#FF6584' },
];

const PLATFORMS = [
  { name: 'TikTok', icon: Music, keys: ['tiktok'], color: '#00f2ea' },
  { name: 'Instagram', icon: Camera, keys: ['instagram', 'instagr.am'], color: '#E1306C' },
  { name: 'Facebook', icon: Share, keys: ['facebook', 'fb.watch'], color: '#1877F2' },
  { name: 'Twitter/X', icon: X, keys: ['twitter', 'x.com'], color: '#000000' },
  { name: 'YouTube', icon: Video, keys: ['youtube.com', 'youtu.be'], color: '#FF0000' },
  { name: 'Pinterest', icon: Pin, keys: ['pinterest'], color: '#BD081C' },
  { name: 'LinkedIn', icon: Briefcase, keys: ['linkedin'], color: '#0A66C2' },
  { name: 'Snapchat', icon: Ghost, keys: ['snapchat'], color: '#FFFC00' },
];

// --- SCREEN: HOME (Your Downloader) ---
function HomeScreen() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          Platform.Version >= 33 
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO 
            : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) { return false; }
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
    let directUrl = "";

    if (json.medias && json.medias.length > 0) {
      const video = json.medias.find((m: any) => m.type === 'video' && m.quality === 'hd') ||
                    json.medias.find((m: any) => m.type === 'video') ||
                    json.medias[0];
      directUrl = video.url;
    } else {
      directUrl = json.url || json.video || (json.data && json.data.url);
    }

    if (!directUrl) throw new Error("No playable video found.");
    return directUrl;
  };



const handleDownload = async () => {
  if (!url) return Alert.alert("Error", "Please paste a URL first");
  const hasPermission = await requestStoragePermission();
  if (!hasPermission) return Alert.alert("Permission Denied", "App needs storage access.");

  setLoading(true); 
  setProgress(0);
  
  const fileName = `video_${Date.now()}.mp4`;
  const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

  try {
    const directVideoUrl = await getDirectLink(url);
    if (await RNFS.exists(filePath)) { await RNFS.unlink(filePath); }

    const download = RNFS.downloadFile({
      fromUrl: directVideoUrl,
      toFile: filePath,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        'Accept': '*/*',
      },
      progress: (res) => {
        const percent = (res.bytesWritten / res.contentLength) * 100;
        setProgress(isNaN(percent) ? 0 : percent); // Safety check for NaN
      },
    });

    const status = await download.promise;
    if (status.statusCode !== 200) throw new Error("Server blocked download.");

    const fileStats = await RNFS.stat(filePath);
    if (fileStats.size < 10000) throw new Error("File corrupted or link expired.");

    // Wait for file system to settle
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    
    const cleanPath = Platform.OS === 'android' ? `file://${filePath}` : filePath;
    
    // 1. Save to Gallery
    await CameraRoll.saveAsset(cleanPath, { type: 'video', album: 'SnappySave' });

    // 2. Save to History (AsyncStorage)
    try {
      const newDownload = {
        id: Date.now().toString(),
        url: url, 
        fileName: fileName,
        date: new Date().toLocaleDateString(),
      };

      const existingDownloads = await AsyncStorage.getItem('downloads');
      const downloadsArray = existingDownloads ? JSON.parse(existingDownloads) : [];
      downloadsArray.unshift(newDownload); 
      
      // Keep only last 20-30 items to keep the app fast
      const limitedArray = downloadsArray.slice(0, 30); 
      await AsyncStorage.setItem('downloads', JSON.stringify(limitedArray));
    } catch (storageError) {
      console.log("History failed to save, but video is safe in gallery.");
    }
    
    // 3. Clean up cache
    await RNFS.unlink(filePath);
    
    Alert.alert("Success", "Video saved to gallery!");
    setUrl('');
  } catch (error: any) {
    Alert.alert("Failed", error.message);
  } finally {
    setLoading(false); 
    setProgress(0);
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>SnappySave</Text>
      <View style={styles.gridContainer}>
        {PLATFORMS.map((app) => {
          const isActive = app.keys.some(k => url.toLowerCase().includes(k));
          const Icon = app.icon;
          return (
            <View key={app.name} style={[styles.gridItem, isActive && { borderColor: app.color, borderWidth: 2, backgroundColor: `${app.color}10` }]}>
              <Icon size={24} color={isActive ? app.color : '#555'} />
              <Text style={[styles.gridText, isActive && { color: app.color, fontWeight: 'bold' }]}>{app.name}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.inputArea}>
        <TextInput style={styles.input} placeholder="Paste link here..." placeholderTextColor="#999" value={url} onChangeText={setUrl} autoCapitalize="none" />
        <TouchableOpacity style={[styles.mainButton, loading && { backgroundColor: '#A0A0A0' }]} onPress={handleDownload} disabled={loading}>
          <Text style={styles.mainButtonText}>{loading ? `Downloading ${progress.toFixed(0)}%` : 'Download Video'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}



// --- MAIN APP COMPONENT ---
export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    setTimeout(() => { SplashScreen.hide(); }, 2000);
  }, []);

  if (showOnboarding) {
    const slides = [
      { key: 'one', title: 'Copy Link', text: 'Grab the link.', icon: LinkIcon, backgroundColor: '#6C63FF' },
      { key: 'two', title: 'Paste', text: 'Fetch the video.', icon: Download, backgroundColor: '#3F3D56' },
    ];
    return (
      <AppIntroSlider 
        renderItem={({item}) => (
          <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
            <item.icon size={100} color="#fff" />
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideText}>{item.text}</Text>
          </View>
        )} 
        data={slides} 
        onDone={() => setShowOnboarding(false)} 
      />
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#6C63FF',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { paddingBottom: 5, height: 60 },
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'Home') return <Home size={size} color={color} />;
            if (route.name === 'WhatsApp') return <MessageCircle size={size} color={color} />;
            if (route.name === 'Downloads') return <Library size={size} color={color} />;
            if (route.name === 'Settings') return <Settings2Icon size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="WhatsApp" component={WhatsappScreen} />
        <Tab.Screen name="Downloads" component={DownloadsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
         
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F8F9FA', padding: 20, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  screenText: { fontSize: 18, marginTop: 10, fontWeight: 'bold', color: '#333' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1A1A1A', marginBottom: 20, textAlign: 'center' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  gridItem: { width: '48%', backgroundColor: '#FFF', padding: 12, borderRadius: 15, marginBottom: 10, alignItems: 'center', elevation: 2 },
  gridText: { fontSize: 11, marginTop: 5 },
  inputArea: { width: '100%', marginTop: 10 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  mainButton: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  mainButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  slideTitle: { fontSize: 24, color: '#fff', fontWeight: 'bold', marginTop: 20 },
  slideText: { fontSize: 16, color: '#fff', textAlign: 'center', marginTop: 10 }
});