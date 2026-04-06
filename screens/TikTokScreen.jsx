import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Music, XCircle, Play } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startDownload, requestStoragePermission } from '../utils/DownloadManager';

const { width } = Dimensions.get('window');

export default function TikTokScreen({ route }) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null);

  const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

const TIKTOK_JS = `
(function() {
  function findCleanLink() {
    // Look for the "play_addr" in the internal JSON state
    const scripts = document.querySelectorAll('script');
    for (let script of scripts) {
      const content = script.textContent;
      // TikTok's internal "SIGI_STATE" or "webapp.video-detail" contains the clean URL
      if (content.includes("playAddr")) {
        const match = content.match(/"playAddr":"(.*?)"/);
        if (match && match[1]) {
          return match[1].replace(/\\\\u0026/g, '&').replace(/\\\\u002f/g, '/');
        }
      }
    }
    
    // Fallback: The Video Tag on mobile web is often the clean version
    const video = document.querySelector('video');
    if (video && video.src && !video.src.startsWith('blob')) return video.src;
    
    return null;
  }

  let attempts = 0;
  const interval = setInterval(() => {
    const link = findCleanLink();
    if (link) {
      clearInterval(interval);
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', data: link }));
    }
    if (attempts++ > 10) clearInterval(interval);
  }, 1000);
})();
`;

  const handleProcess = async () => {
    if (!url.toLowerCase().includes('tiktok.com')) {
      return Alert.alert("Invalid Link", "Please paste a valid TikTok link.");
    }

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return Alert.alert("Permission Denied", "Storage access is required.");

    setPreviewPath(null);
    setLoading(true);
    setScrapingUrl(url);
  };

  const onScraperMessage = async (e) => {
    try {
      const response = JSON.parse(e.nativeEvent.data);

      if (response.type === 'log') {
        console.log("[WebView Log]:", response.message);
        return;
      }

      if (response.type === 'error') {
        setLoading(false);
        setScrapingUrl('');
        Alert.alert("Error", "Could not extract video. Try another link.");
        return;
      }

      if (response.type === 'success') {
        const videoUrl = response.data;
        setScrapingUrl('');

        try {
          // Download video and get local path
          const localUri = await startDownload(videoUrl, 'TikTok', (p) => setProgress(p));

          // Set preview immediately
          setPreviewPath(localUri);

          // Save metadata to AsyncStorage for the Downloads Screen
          const newDownload = {
            id: Date.now().toString(),
            title: `TikTok_${Date.now()}`,
            path: localUri,
            date: new Date().toLocaleDateString(),
          };

          const existing = await AsyncStorage.getItem('recent_downloads');
          const downloads = existing ? JSON.parse(existing) : [];
          await AsyncStorage.setItem('recent_downloads', JSON.stringify([newDownload, ...downloads]));

          Alert.alert("Success", "Video saved to gallery!");
        } catch (err) {
          Alert.alert("Download Failed", "Link might have expired. Try again.");
        } finally {
          setLoading(false);
          setProgress(0);
        }
      }
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Music size={50} color="#00f2ea" />
        <Text style={styles.title}>TikTok Downloader</Text>
      </View>

      {/* --- ONLY SHOW THIS IF A VIDEO EXISTS --- */}
      {previewPath && (
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewLabel}>Video Preview</Text>
            <TouchableOpacity onPress={() => setPreviewPath(null)}>
              <XCircle color="#ff0050" size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.videoContainer}>
            <WebView
              key={previewPath} // Forces a fresh player on every new download
              originWhitelist={['*']}
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              allowsFullscreenVideo={true}
              scrollEnabled={false}
              source={{
                html: `
                <body style="margin:0;padding:0;background:black;display:flex;justify-content:center;align-items:center;">
                  <video 
                    src="${previewPath}" 
                    controls 
                    autoplay 
                    playsinline
                    style="width:100%; height:100%; object-fit: contain;"
                  ></video>
                </body>
                `
              }}
              style={styles.previewWebView}
            />
          </View>
        </View>
      )}

      {/* --- INPUT AREA MOVES UP AUTOMATICALLY IF NO PREVIEW --- */}
      <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          placeholder="Paste TikTok Link Here..."
          placeholderTextColor="#999"
          editable={!loading}
          onChangeText={setUrl}
          value={url}
        />

        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color="#00f2ea" />
            <Text style={styles.progressText}>
              {progress > 0 ? `Downloading: ${progress}%` : 'Searching...'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleProcess}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Processing...' : 'Download Now'}</Text>
        </TouchableOpacity>
      </View>

      {/* Hidden Scraper */}
      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView
            source={{ uri: scrapingUrl }}
            injectedJavaScript={TIKTOK_JS}
            onMessage={onScraperMessage}
            userAgent={DESKTOP_UA}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
  },
  placeholderBox: {
    height: 250,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  previewCard: {
    marginBottom: 20,
    width: '100%',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  previewLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  videoContainer: {
    height: 250,
    backgroundColor: '#000',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  previewWebView: {
    flex: 1,
  },
  inputSection: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#000',
  },
  btn: {
    backgroundColor: '#000',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    borderLeftWidth: 5,
    borderLeftColor: '#00f2ea',
    borderRightWidth: 5,
    borderRightColor: '#ff0050',
  },
  btnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loaderContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  progressText: {
    marginTop: 5,
    color: '#666',
    fontWeight: '600',
  }
});