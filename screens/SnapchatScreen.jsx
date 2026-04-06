import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ghost, XCircle } from 'lucide-react-native';
import RNFS from 'react-native-fs';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestStoragePermission } from '../utils/DownloadManager'; 

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export default function SnapchatScreen({route}) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null); // Added for Preview

  const activeRequestId = useRef(null);

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  const INJECTED_JS = `(function() {
    if (window.snappyScraperLoaded) return;
    window.snappyScraperLoaded = true;

    function findSnapLink() {
      const video = document.querySelector('video');
      if (video && video.src && !video.src.startsWith('blob')) return video.src;
      const meta = document.querySelector('meta[property="og:video:secure_url"]') || 
                   document.querySelector('meta[property="og:video"]');
      return meta ? meta.content : null;
    }

    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      const link = findSnapLink();
      
      if (link) {
        clearInterval(checkInterval);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SUCCESS', data: link }));
      } else if (attempts > 15) {
        clearInterval(checkInterval);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', data: 'not_found' }));
      }
    }, 500);
  })()`;

  const handleDownload = async () => {
    if (!url.includes('snapchat.com')) {
      return Alert.alert("Invalid Link", "Please paste a valid Snapchat link.");
    }
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return Alert.alert("Permission Denied", "Storage access required.");

    setPreviewPath(null); // Clear previous preview
    activeRequestId.current = Date.now().toString();
    setLoading(true);
    setProgress(0);
    setScrapingUrl(url);
  };

  const saveSnapchatVideo = async (directVideoUrl) => {
    let cleanUrl = directVideoUrl.replace(/\\u002F/g, '/').replace(/\\u0026/g, '&').replace(/\\/g, '');
    const fileName = `Snapchat_${Date.now()}.mp4`;
    
    // Using ExternalDirectoryPath to ensure system players can read it for the Downloads screen
    const filePath = `${RNFS.ExternalDirectoryPath}/${fileName}`;

    const options = {
      fromUrl: cleanUrl,
      toFile: filePath,
      background: true,
      headers: { 'User-Agent': DESKTOP_UA, 'Referer': 'https://www.snapchat.com/', 'Range': 'bytes=0-' },
      progress: (res) => {
        if (res.contentLength > 0) {
          setProgress(Math.round((res.bytesWritten / res.contentLength) * 100));
        }
      },
    };

    try {
      const result = await RNFS.downloadFile(options).promise;
      if (result.statusCode === 200 || result.statusCode === 206) {
        const cleanPath = Platform.OS === 'android' ? `file://${filePath}` : filePath;
        await CameraRoll.saveAsset(cleanPath, { type: 'video', album: 'SnappySave' });
        return cleanPath; // Return the path for the preview and list
      } else {
        throw new Error(`Server error: ${result.statusCode}`);
      }
    } catch (err) {
      throw err;
    }
  };

  const onMessage = async (e) => {
    setScrapingUrl('');
    if (!activeRequestId.current) return;
    activeRequestId.current = null;

    let response;
    try { response = JSON.parse(e.nativeEvent.data); } catch (err) { setLoading(false); return; }

    if (response.type === "ERROR") {
      setLoading(false);
      return Alert.alert("Error", "Could not find video.");
    }

    try {
      const savedPath = await saveSnapchatVideo(response.data);
      
      // Update Preview
      setPreviewPath(savedPath);

      // Save to Recent Downloads
      const newDownload = {
        id: Date.now().toString(),
        title: `Snapchat_${Date.now()}`,
        path: savedPath,
        platform: 'Snapchat',
        date: new Date().toLocaleDateString(),
      };
      const existing = await AsyncStorage.getItem('recent_downloads');
      const downloads = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem('recent_downloads', JSON.stringify([newDownload, ...downloads]));

      Alert.alert("Success", "Snapchat video saved!");
      setUrl('');
    } catch (err) {
      Alert.alert("Download Failed", "Please try again.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ghost size={50} color="#000" />
      </View>
      <Text style={styles.title}>Snapchat Downloader</Text>

      {/* --- VIDEO PREVIEW PLAYER --- */}
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
              allowsFullscreenVideo
              scrollEnabled={false}
              source={{ html: `
                <body style="margin:0;padding:0;background:black;display:flex;justify-content:center;align-items:center;">
                  <video src="${previewPath}" controls autoplay style="width:100%; height:100%; object-fit: contain;"></video>
                </body>
              `}}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      <TextInput 
        style={styles.input} 
        placeholder="Paste Snapchat Link..." 
        placeholderTextColor="#999"
        onChangeText={setUrl} 
        value={url}
        autoCapitalize="none"
        editable={!loading}
      />
      
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#000" />
          <Text style={styles.progressText}>
            {progress > 0 ? `Saving: ${progress}%` : 'Processing Link...'}
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.btn, loading && { opacity: 0.6 }]} 
        onPress={handleDownload}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Downloading...' : 'Get Snapchat Video'}</Text>
      </TouchableOpacity>

      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView 
            key={scrapingUrl} 
            source={{ uri: scrapingUrl }} 
            injectedJavaScript={INJECTED_JS} 
            userAgent={DESKTOP_UA} 
            onMessage={onMessage} 
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20, justifyContent: 'center' },
  iconWrapper: { alignSelf: 'center', backgroundColor: '#FFFC00', padding: 15, borderRadius: 20, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#000', textAlign: 'center', marginBottom: 20 },
  previewContainer: { marginBottom: 20, width: '100%' },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  previewLabel: { fontWeight: 'bold', color: '#000' },
  videoBox: { height: 250, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000', elevation: 4 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#eee', color: '#000' },
  btn: { backgroundColor: '#FFFC00', padding: 18, borderRadius: 15, alignItems: 'center' },
  btnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  loaderContainer: { marginBottom: 20, alignItems: 'center' },
  progressText: { marginTop: 8, color: '#666', fontWeight: '600' }
});