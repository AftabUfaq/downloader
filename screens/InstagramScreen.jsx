import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Camera, XCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { PermissionsAndroid } from 'react-native';

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export default function InstagramScreen({ route }) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null);

  // --- 1. INTERNAL PERMISSION FUNCTION ---
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const permission = Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
        : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
      const granted = await PermissionsAndroid.request(permission);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // --- 2. INTERNAL DOWNLOAD FUNCTION ---
  const downloadVideo = (videoUrl) => {
    return new Promise(async (resolve, reject) => {
      console.log("[DEBUG] Starting Download for:", videoUrl);
      const fileName = `Instagram_${Date.now()}.mp4`;
      const filePath = `${RNFS.ExternalDirectoryPath}/${fileName}`;

      const xhr = new XMLHttpRequest();
      xhr.open('GET', videoUrl, true);
      xhr.setRequestHeader('User-Agent', DESKTOP_UA);
      xhr.setRequestHeader('Referer', 'https://www.instagram.com/');
      xhr.responseType = 'blob';

      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const p = Math.round((event.loaded / event.total) * 100);
          setProgress(p);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64data = reader.result.split(',')[1];
            await RNFS.writeFile(filePath, base64data, 'base64');
            const cleanPath = Platform.OS === 'android' ? `file://${filePath}` : filePath;
            await CameraRoll.saveAsset(cleanPath, { type: 'video', album: 'SnappySave' });
            console.log("[DEBUG] Download Success:", cleanPath);
            resolve(cleanPath);
          };
          reader.readAsDataURL(xhr.response);
        } else {
          console.log("[DEBUG] XHR Failed with status:", xhr.status);
          reject(xhr.status);
        }
      };

      xhr.onerror = (e) => {
        console.log("[DEBUG] XHR Network Error:", e);
        reject("Network Error");
      };
      xhr.send();
    });
  };

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // --- 3. MORE AGGRESSIVE SCRAPER ---
  const INJECTED_JS = `(function() {
    console.log("Super Scraper Started");

    // Function to force-remove login popups that block loading
    function clearOverlays() {
      const overlays = document.querySelectorAll('div[role="presentation"], ._a9-z');
      overlays.forEach(el => el.remove());
      document.body.style.overflow = 'auto';
    }

    function findIGLink() {
      clearOverlays();

      // 1. Check all <script> tags for the raw JSON data (Best for Reels)
      const scripts = document.querySelectorAll('script');
      for (let s of scripts) {
        const content = s.textContent;
        if (content.includes("video_url")) {
          // Regex to extract the URL from the JSON blob
          const match = content.match(/"video_url":"(https:.*?\\.mp4.*?)"/);
          if (match && match[1]) {
            return match[1].replace(/\\\\u0026/g, '&').replace(/\\\\/g, '');
          }
        }
      }

      // 2. Check for the 'og:video' Meta Tag
      const meta = document.querySelector('meta[property="og:video"]');
      if (meta && meta.content) return meta.content;

      // 3. Check for standard video tags
      const video = document.querySelector('video');
      if (video && video.src && !video.src.startsWith('blob')) return video.src;

      return null;
    }

    let attempts = 0;
    const check = setInterval(() => {
      const link = findIGLink();
      attempts++;
      console.log("Attempt " + attempts + ": " + (link ? "Link Found" : "Searching..."));

      if (link) {
        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'SUCCESS', url: link}));
        clearInterval(check);
      } else if (attempts > 20) {
        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ERROR', message: 'not_found'}));
        clearInterval(check);
      }
    }, 1500);
  })()`;

  const handleProcess = async () => {
    console.log("[DEBUG] User clicked Download. Input URL:", url);
    if (!url.includes('instagram.com')) return Alert.alert("Error", "Please paste a valid Instagram link");

    const hasPerm = await requestPermission();
    if (!hasPerm) return Alert.alert("Permission Error", "Need storage access to save videos");

    setPreviewPath(null);
    setLoading(true);
    setProgress(0);
    setScrapingUrl(url);
  };

  const onMessage = async (e) => {
    const data = JSON.parse(e.nativeEvent.data);
    setScrapingUrl('');

    if (data.type === 'ERROR') {
      console.log("[DEBUG] Scraper failed to find video");
      setLoading(false);
      return Alert.alert("Error", "Video not found. Ensure the post is public and not a Story.");
    }

    console.log("[DEBUG] Video Link Found:", data.url);

    try {
      const localUri = await downloadVideo(data.url);

      setPreviewPath(localUri);

      const newDownload = {
        id: Date.now().toString(),
        title: `Instagram_${Date.now()}`,
        path: localUri,
        platform: 'Instagram',
        date: new Date().toLocaleDateString(),
      };

      const existing = await AsyncStorage.getItem('recent_downloads');
      const downloads = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem('recent_downloads', JSON.stringify([newDownload, ...downloads]));

      Alert.alert("Success", "Instagram video saved!");
      setUrl('');
    } catch (err) {
      console.log("[DEBUG] Download Execution Error:", err);
      Alert.alert("Error", "Instagram blocked the download request (Status: " + err + ")");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Camera size={50} color="#E1306C" />
        <Text style={styles.title}>Instagram Downloader</Text>
      </View>

      {previewPath && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewLabel}>Video Ready</Text>
            <TouchableOpacity onPress={() => setPreviewPath(null)}>
              <XCircle color="#ff0050" size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.videoBox}>
            <WebView
              key={previewPath}
              originWhitelist={['*']}
              allowFileAccess={true}
              source={{
                html: `
                <body style="margin:0;padding:0;background:black;display:flex;justify-content:center;align-items:center;">
                  <video src="${previewPath}" controls autoplay playsinline style="width:100%; height:100%; object-fit: contain;"></video>
                </body>
              `}}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Paste Instagram Reel/Post Link..."
        placeholderTextColor="#999"
        onChangeText={setUrl}
        value={url}
        editable={!loading}
      />

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#E1306C" />
          <Text style={styles.progressText}>{progress > 0 ? `Downloading: ${progress}%` : 'Scraping Instagram...'}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleProcess} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Please Wait...' : 'Download Video'}</Text>
      </TouchableOpacity>

      <View style={{ height: 0, width: 0, position: 'absolute' }}>
        {scrapingUrl !== '' && (
          <WebView
            key="ig-scraper"
            source={{ uri: scrapingUrl }}
            injectedJavaScript={INJECTED_JS}
            userAgent={DESKTOP_UA}
            onMessage={onMessage}
            domStorageEnabled={true}
            javaScriptEnabled={true}
            // Add these two for Instagram
            startInLoadingState={true}
            mediaPlaybackRequiresUserAction={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#000', marginTop: 10 },
  previewContainer: { marginBottom: 20 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  previewLabel: { fontWeight: 'bold', color: '#666' },
  videoBox: { height: 250, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#eee', color: '#000' },
  btn: { backgroundColor: '#E1306C', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  loaderContainer: { marginBottom: 20, alignItems: 'center' },
  progressText: { marginTop: 10, color: '#E1306C', fontWeight: '600' }
});