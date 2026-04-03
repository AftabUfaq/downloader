import React, { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Alert, Platform, PermissionsAndroid, ScrollView
} from 'react-native';
import { WebView } from 'react-native-webview'; // Add this
import RNFS from 'react-native-fs';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Music, Camera, Share, X, Video, Pin, Briefcase, Ghost,
  Download, Link as LinkIcon
} from 'lucide-react-native';
const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
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

export default function HomeScreen() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scrapingUrl, setScrapingUrl] = useState(''); // New state
  const webViewRef = useRef(null);

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

  const handleScrape = async () => {
    if (!url) return Alert.alert("Error", "Please paste a URL first");
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return Alert.alert("Permission Denied", "App needs storage access.");

    setLoading(true);
    setScrapingUrl(url); // This triggers the WebView to load the page
  };

  const onWebViewMessage = async (event) => {
    const result = event.nativeEvent.data;
    

    if (result === "error") {
      setLoading(false);
      setScrapingUrl('');
      Alert.alert("Failed", "Video link could not be found. Try a different link or make sure the video is public.");
      return;
    }
    const cleanUrl = result
      .replace(/\\u002F/g, '/')
      .replace(/\\/g, '');

    console.log("Sanitized Link:", cleanUrl);

    setScrapingUrl('');
    if (cleanUrl.startsWith('https')) {
      startDownload(cleanUrl);
    }

  };



  const startDownload = async (directVideoUrl) => {
    const fileName = `video_${Date.now()}.mp4`;
    const filePath = `${RNFS.ExternalCachesDirectoryPath || RNFS.CachesDirectoryPath}/${fileName}`;

    // Detect which platform we are downloading from
  const isInstagram = directVideoUrl.includes('instagram.com') || url.includes('instagram.com');
  const isTikTok = directVideoUrl.includes('tiktok.com') || url.includes('tiktok.com');

    try {
      setLoading(true);
      setProgress(0);

      const xhr = new XMLHttpRequest();
      xhr.open('GET', directVideoUrl, true);

      // Set your required headers
    xhr.setRequestHeader('User-Agent', DESKTOP_UA);
    if (isTikTok) {
      xhr.setRequestHeader('Referer', 'https://www.tiktok.com/');
    } else if (isInstagram) {
      xhr.setRequestHeader('Referer', 'https://www.instagram.com/');
    }

    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setProgress(percentComplete);
      }
    };

     xhr.onload = async () => {
      if (xhr.status === 200) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = reader.result.split(',')[1];
          await RNFS.writeFile(filePath, base64data, 'base64');
          const cleanPath = Platform.OS === 'android' ? `file://${filePath}` : filePath;
          await CameraRoll.saveAsset(cleanPath, { type: 'video', album: 'SnappySave' });
          
          Alert.alert("Success", "Video saved to gallery!");
          setUrl('');
          setLoading(false);
          setProgress(0);
        };
        reader.readAsDataURL(xhr.response);
      } else {
        Alert.alert("Error", `Instagram/Server returned status: ${xhr.status}`);
        setLoading(false);
      }
    };

      xhr.onerror = (e) => {
        console.error(e);
        Alert.alert("Download Failed", "Network error occurred.");
        setLoading(false);
      };

      xhr.responseType = 'blob'; // Crucial for binary video data
      xhr.send();

    } catch (error) {
      console.error("XHR Error:", error);
      setLoading(false);
    }
  };
  // Script to find video source in the page
const INJECTED_JAVASCRIPT = `
  (function() {
    function findLink() {
      // 1. Check Meta Tags (Best for Instagram/Facebook)
      const meta = document.querySelector('meta[property="og:video:secure_url"]') || 
                   document.querySelector('meta[property="og:video"]') ||
                   document.querySelector('meta[name="twitter:player:stream"]');
      if (meta && meta.content && meta.content.startsWith('http')) {
        return meta.content;
      }

      // 2. Instagram Specific: Look for the video element
      // Instagram often uses multiple video tags; we want the one that is visible
      const videos = document.querySelectorAll('video');
      for (let v of videos) {
        if (v.src && !v.src.startsWith('blob')) {
          return v.src;
        }
      }

      // 3. TikTok/JSON Fallback (Your existing logic)
      const scripts = document.querySelectorAll('script');
      for (let i = 0; i < scripts.length; i++) {
        const content = scripts[i].textContent;
        if (content.includes("downloadAddr") || content.includes("video_url")) {
          const match = content.match(/"downloadAddr":"(.*?)"/) || content.match(/"video_url":"(.*?)"/);
          if (match && match[1]) {
            return match[1].replace(/\\\\u0026/g, '&');
          }
        }
      }

      return null;
    }

    let count = 0;
    const check = setInterval(function() {
      const link = findLink();
      if (link) {
        window.ReactNativeWebView.postMessage(link);
        clearInterval(check);
      }
      count++;
      if (count > 40) { // Increased timeout for Instagram
        window.ReactNativeWebView.postMessage("error");
        clearInterval(check);
      }
    }, 1500); // Instagram takes a bit longer to hydrate the DOM
  })();
`;



  return (
    <View style={{ flex: 1 }}>
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
          <TextInput
            style={styles.input}
            placeholder="Paste link here..."
            placeholderTextColor="#000" // Force a visible gray
            value={url}
            onChangeText={setUrl}
          />

          {/* VISUAL PROGRESS BAR */}
          {loading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {progress > 0 ? `Downloading: ${progress}%` : 'Connecting to TikTok...'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.mainButton, loading && { backgroundColor: '#A0A0A0' }]}
            onPress={handleScrape}
            disabled={loading}
          >
            <Text style={styles.mainButtonText}>
              {loading ? `Please wait...` : 'Download Video'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView
            ref={webViewRef}
            source={{ uri: scrapingUrl }}
            injectedJavaScript={INJECTED_JAVASCRIPT}
            onMessage={onWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            // --- ADD THIS BLOCK ---
            onShouldStartLoadWithRequest={(request) => {
              // Only allow standard web links. Block snssdk://, itms://, etc.
              return request.url.startsWith('http');
            }}
            // -----------------------
            userAgent={DESKTOP_UA}
          />
        </View>
      )}
    </View>
  )
};



const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F8F9FA', padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1A1A1A', marginBottom: 20, textAlign: 'center' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  gridItem: { width: '48%', backgroundColor: '#FFF', padding: 12, borderRadius: 15, marginBottom: 10, alignItems: 'center', elevation: 2 },
  gridText: { fontSize: 11, marginTop: 5 },
  inputArea: { width: '100%', marginTop: 10 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  mainButton: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  mainButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  progressContainer: {
    width: '100%',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6C63FF', // Matching your button color
  },
  progressText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
