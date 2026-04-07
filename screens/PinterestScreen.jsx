import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Pin, XCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startDownload, requestStoragePermission } from '../utils/DownloadManager';

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export default function PinterestScreen({ route }) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null); // State for Preview

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  const INJECTED_JS = `(function() {
    function huntForVideo() {
      const meta = document.querySelector('meta[property="og:video:secure_url"]') || 
                   document.querySelector('meta[property="og:video"]');
      if (meta && meta.content && meta.content.includes('.mp4')) return meta.content;

      const scripts = document.querySelectorAll('script');
      for (let script of scripts) {
        const content = script.textContent;
        if (content.includes("v.pinimg.com")) {
          const match = content.match(/"url":"(https:\\\\u002f\\\\u002fv.pinimg.com\\\\u002f.*?\\.mp4)"/);
          if (match && match[1]) {
            return match[1].replace(/\\\\u002f/g, '/');
          }
        }
      }
      const video = document.querySelector('video');
      if (video && video.src && !video.src.startsWith('blob')) return video.src;
      return null;
    }

    let attempts = 0;
    const checkInterval = setInterval(() => {
      const link = huntForVideo();
      if (link) {
        window.ReactNativeWebView.postMessage(link);
        clearInterval(checkInterval);
      }
      attempts++;
      if (attempts > 15) {
        window.ReactNativeWebView.postMessage("not_found");
        clearInterval(checkInterval);
      }
    }, 1500);
  })()`;

  const handleProcess = async () => {
    if (!url.includes('pinterest.com') && !url.includes('pin.it')) {
      return Alert.alert("Invalid Link", "Please paste a valid Pinterest link.");
    }
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return;

    setPreviewPath(null); // Clear previous preview
    setLoading(true);
    setProgress(0);
    setScrapingUrl(url);
  };

  const onMessage = async (e) => {
    const result = e.nativeEvent.data;
    setScrapingUrl('');

    if (result === "not_found") {
      setLoading(false);
      return Alert.alert("Error", "Could not find video. Ensure it's a Video Pin.");
    }

    try {
      // 1. Download and get local path
      const localUri = await startDownload(result, 'Pinterest', (p) => setProgress(p));

      // 2. Set for Preview
      setPreviewPath(localUri);

      // 3. Save to Library (AsyncStorage)
      const newDownload = {
        id: Date.now().toString(),
        title: `Pinterest_${Date.now()}`,
        path: localUri,
        platform: 'Pinterest',
        date: new Date().toLocaleDateString(),
      };

      const existing = await AsyncStorage.getItem('recent_downloads');
      const downloads = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem('recent_downloads', JSON.stringify([newDownload, ...downloads]));

      Alert.alert("Success", "Pinterest video saved!");
      setUrl('');
    } catch (err) {
      Alert.alert("Download Failed", "Pinterest blocked the request.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pin size={50} color="#BD081C" />
        <Text style={styles.title}>Pinterest Downloader</Text>
      </View>

      {/* --- VIDEO PREVIEW PLAYER (POP-UP) --- */}
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
              allowUniversalAccessFromFileURLs={true}
              allowsFullscreenVideo={true}
              scrollEnabled={false}
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
        placeholder="Paste Pinterest Link..."
        placeholderTextColor="#999"
        onChangeText={setUrl}
        value={url}
        autoCapitalize="none"
        editable={!loading}
      />

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#BD081C" />
          <Text style={styles.progressText}>
            {progress > 0 ? `Downloading: ${progress}%` : 'Searching for video...'}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.6 }]}
        onPress={handleProcess}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Please Wait...' : 'Download Video'}</Text>
      </TouchableOpacity>

      <View style={{ height: 0, width: 0, position: 'absolute' }}>
        {scrapingUrl !== '' && (
          <WebView
            source={{ uri: scrapingUrl }}
            injectedJavaScript={INJECTED_JS}
            userAgent={DESKTOP_UA}
            onMessage={onMessage}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#BD081C', marginTop: 10 },
  previewContainer: { marginBottom: 20, width: '100%' },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  previewLabel: { fontWeight: 'bold', color: '#666' },
  videoBox: { height: 250, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000', elevation: 4 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#eee', color: '#000' },
  btn: { backgroundColor: '#BD081C', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  loaderContainer: { marginBottom: 20, alignItems: 'center' },
  progressText: { marginTop: 8, color: '#666', fontWeight: '600' }
});