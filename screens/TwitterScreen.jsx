import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { X, XCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startDownload, requestStoragePermission } from '../utils/DownloadManager';

const MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1";

export default function TwitterScreen({ route }) {
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
    function findVideo() {
      // 1. Meta tags check
      const meta = document.querySelector('meta[property="og:video:url"]') || 
                   document.querySelector('meta[property="og:video:secure_url"]');
      if (meta && meta.content && meta.content.includes('.mp4')) return meta.content;

      // 2. Deep Script Scan
      const scripts = document.querySelectorAll('script');
      for (let s of scripts) {
        const text = s.textContent;
        if (text.includes('.mp4')) {
          // Look for variants of video_url or contentUrl
          const match = text.match(/"video_url":"(https:.*?\\.mp4)"/) || 
                        text.match(/"contentUrl":"(https:.*?\\.mp4)"/);
          if (match && match[1]) return match[1].replace(/\\\\/g, '');
        }
      }

      // 3. Video element check
      const video = document.querySelector('video');
      if (video && video.src && !video.src.startsWith('blob')) return video.src;

      return null;
    }

    let attempts = 0;
    const interval = setInterval(() => {
      const link = findVideo();
      if (link) {
        window.ReactNativeWebView.postMessage(link);
        clearInterval(interval);
      }
      attempts++;
      if (attempts > 15) {
        window.ReactNativeWebView.postMessage("not_found");
        clearInterval(interval);
      }
    }, 1500);
  })()`;

  const handleProcess = async () => {
    if (!url.includes('twitter.com') && !url.includes('x.com')) {
      return Alert.alert("Invalid Link", "Please paste a valid X / Twitter link.");
    }
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return;

    setPreviewPath(null); // Reset preview
    setLoading(true);
    setProgress(0);
    setScrapingUrl(url);
  };

  const onMessage = async (e) => {
    const result = e.nativeEvent.data;
    setScrapingUrl('');

    if (result === "not_found") {
      setLoading(false);
      return Alert.alert("Error", "Could not find video. Try a public post.");
    }

    try {
      // 1. Download video
      const localUri = await startDownload(result, 'Twitter', (p) => setProgress(p));

      // 2. Update Preview
      setPreviewPath(localUri);

      // 3. Save to AsyncStorage (Library)
      const newDownload = {
        id: Date.now().toString(),
        title: `X_${Date.now()}`,
        path: localUri,
        platform: 'Twitter',
        date: new Date().toLocaleDateString(),
      };

      const existing = await AsyncStorage.getItem('recent_downloads');
      const downloads = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem('recent_downloads', JSON.stringify([newDownload, ...downloads]));

      Alert.alert("Success", "Video saved to gallery!");
      setUrl('');
    } catch (err) {
      Alert.alert("Download Failed", "X blocked the download. Try again.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <X size={50} color="#000000" />
        <Text style={styles.title}>X Downloader</Text>
      </View>

      {/* --- VIDEO PREVIEW PLAYER (Only shows when ready) --- */}
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
        placeholder="Paste X / Twitter Link..."
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
            {progress > 0 ? `Saving: ${progress}%` : 'Searching for video...'}
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

      {/* Hidden Scraper */}
      <View style={{ height: 0, width: 0, position: 'absolute' }}>
        {scrapingUrl !== '' && (
          <WebView
            incognito={true}
            domStorageEnabled={true}
            javaScriptEnabled={true}
            source={{ uri: scrapingUrl }}
            injectedJavaScript={INJECTED_JS}
            userAgent={MOBILE_UA}
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#000', marginTop: 10 },
  previewContainer: { marginBottom: 20, width: '100%' },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  previewLabel: { fontWeight: 'bold', color: '#666' },
  videoBox: { height: 230, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000', elevation: 4 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#eee', color: '#000' },
  btn: { backgroundColor: '#000', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  loaderContainer: { marginBottom: 20, alignItems: 'center' },
  progressText: { marginTop: 10, color: '#333', fontWeight: '600' }
});