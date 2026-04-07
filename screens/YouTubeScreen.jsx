import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Video, XCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startDownload, requestStoragePermission } from '../utils/DownloadManager';

// Desktop User Agent
const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export default function YouTubeScreen({ route }) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null);

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // Desktop Scraper: Searches the streamingData formats
  const INJECTED_JS = `(function() {
    function findDesktopLink() {
      try {
        // 1. Check for the global ytInitialPlayerResponse object
        if (window.ytInitialPlayerResponse && window.ytInitialPlayerResponse.streamingData) {
          const data = window.ytInitialPlayerResponse.streamingData;
          // Get the highest quality format that contains a direct URL
          const formats = data.formats || [];
          const bestFormat = formats.reverse().find(f => f.url && f.mimeType.includes('video/mp4'));
          if (bestFormat) return bestFormat.url;
        }

        // 2. Fallback: Search the video element
        const video = document.querySelector('video');
        if (video && video.src && !video.src.startsWith('blob')) return video.src;
      } catch(e) {}
      return null;
    }

    let attempts = 0;
    const check = setInterval(() => {
      const link = findDesktopLink();
      if (link) {
        window.ReactNativeWebView.postMessage(link);
        clearInterval(check);
      }
      attempts++;
      if (attempts > 15) { // 15 seconds max
        window.ReactNativeWebView.postMessage("not_found");
        clearInterval(check);
      }
    }, 1500);
  })();`;

  const handleProcess = async () => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return Alert.alert("Invalid Link", "Please paste a valid YouTube link.");
    }
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return;

    setPreviewPath(null);
    setLoading(true);
    setProgress(0);
    setScrapingUrl(url);
  };

  const onMessage = async (e) => {
    const result = e.nativeEvent.data;
    setScrapingUrl(''); 

    if (result === "not_found") {
      setLoading(false);
      return Alert.alert("Error", "Could not find video. Desktop links are often signature-protected.");
    }

    try {
      // Important: Tell DownloadManager to use Desktop UA
      const localUri = await startDownload(result, 'YouTube', (p) => setProgress(p));
      
      setPreviewPath(localUri);
      const newDownload = {
        id: Date.now().toString(),
        title: `YouTube_${Date.now()}`,
        path: localUri,
        platform: 'YouTube',
        date: new Date().toLocaleDateString(),
      };

      const existing = await AsyncStorage.getItem('recent_downloads');
      const downloads = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem('recent_downloads', JSON.stringify([newDownload, ...downloads]));

      Alert.alert("Success", "Video saved!");
      setUrl('');
    } catch (err) {
      Alert.alert("Download Failed", "YouTube's server blocked the request. Try a different video.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Video size={50} color="#FF0000" />
        <Text style={styles.title}>YouTube Desktop Mode</Text>
      </View>

      {previewPath && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewLabel}>Preview</Text>
            <TouchableOpacity onPress={() => setPreviewPath(null)}>
              <XCircle color="#ff0050" size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.videoBox}>
            <WebView
              originWhitelist={['*']}
              allowFileAccess={true}
              source={{ html: `<body style="margin:0;background:black;display:flex;justify-content:center;align-items:center;"><video src="${previewPath}" controls autoplay style="width:100%;height:100%;"></video></body>` }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Paste YouTube Link..."
        placeholderTextColor="#999"
        onChangeText={setUrl}
        value={url}
        editable={!loading}
      />

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#FF0000" />
          <Text style={styles.progressText}>{progress > 0 ? `Downloading: ${progress}%` : 'Scraping Desktop Site...'}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleProcess} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Please Wait...' : 'Download HD Video'}</Text>
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
  title: { fontSize: 22, fontWeight: 'bold', color: '#000', marginTop: 10 },
  previewContainer: { marginBottom: 20 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  previewLabel: { fontWeight: 'bold', color: '#666' },
  videoBox: { height: 230, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#eee', color: '#000' },
  btn: { backgroundColor: '#FF0000', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  loaderContainer: { marginBottom: 20, alignItems: 'center' },
  progressText: { marginTop: 8, color: '#666', fontWeight: '600' }
});