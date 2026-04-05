import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Video } from 'lucide-react-native';
import { startDownload, requestStoragePermission } from '../utils/DownloadManager';

const MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1";

export default function YouTubeScreen({ route }) {
  // HOOKS AT THE TOP - Guaranteed order
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // 2. Advanced YouTube Scraper
  // YouTube uses ytInitialPlayerResponse to store video stream data
  const INJECTED_JS = `(function() {
  function findMobileLink() {
    // 1. Look for the actual video element (Most reliable on mobile UA)
    const video = document.querySelector('video');
    if (video && video.src && !video.src.startsWith('blob')) {
      return video.src;
    }
    
    // 2. Fallback to the 'ytInitialPlayerResponse' JSON
    try {
      if (window.ytInitialPlayerResponse) {
        const streamingData = window.ytInitialPlayerResponse.streamingData;
        const format = streamingData.formats.find(f => f.url);
        if (format) return format.url;
      }
    } catch(e) {}
    
    return null;
  }

  // Mobile YouTube takes a bit to switch from the 'preview' to the 'player'
  let attempts = 0;
  const check = setInterval(() => {
    const link = findMobileLink();
    if (link) {
      window.ReactNativeWebView.postMessage(link);
      clearInterval(check);
    }
    attempts++;
    if (attempts > 20) {
      window.ReactNativeWebView.postMessage("not_found");
      clearInterval(check);
    }
  }, 1500);
})();`;

  const handleProcess = async () => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return Alert.alert("Invalid Link", "Please paste a valid YouTube or Shorts link.");
    }

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return Alert.alert("Permission Denied", "Storage access required.");

    setLoading(true);
    setProgress(0);
    setScrapingUrl(url);
  };

  const onMessage = async (e) => {
    const result = e.nativeEvent.data;
    setScrapingUrl(''); // Immediately kill WebView to keep hook order stable

    if (result === "not_found" || result === "error") {
      setLoading(false);
      return Alert.alert("Error", "Could not find a downloadable stream. YouTube often blocks direct scraping.");
    }

    try {
      // 3. Trigger Centralized Download
      await startDownload(result, 'YouTube', (p) => setProgress(p));

      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        Alert.alert("Success", "YouTube video saved to gallery!");
        setUrl('');
      }, 500);

    } catch (err) {
      setLoading(false);
      Alert.alert("Download Failed", "Link found but download was blocked by YouTube's servers.");
    }
  };

  return (
    <View style={styles.container}>
      <Video size={60} color="#FF0000" style={styles.icon} />
      <Text style={styles.title}>YouTube Downloader</Text>

      <TextInput
        style={styles.input}
        placeholder="Paste YouTube or Shorts Link..."
        placeholderTextColor="#999"
        onChangeText={setUrl}
        value={url}
        autoCapitalize="none"
        editable={!loading}
      />

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#FF0000" />
          <Text style={styles.progressText}>
            {progress > 0 ? `Downloading: ${progress}%` : 'Searching YouTube Streams...'}
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

      {/* Hidden WebView Container - Stable in the tree */}
      <View style={{ height: 0, width: 0, position: 'absolute' }}>
        {scrapingUrl !== '' && (
          <WebView
            source={{ uri: scrapingUrl }}
            injectedJavaScript={INJECTED_JS}
            userAgent={MOBILE_UA} // Use the Mobile one here!
            onMessage={onMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
    justifyContent: 'center',
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#000',
  },
  btn: {
    backgroundColor: '#FF0000',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loaderContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  progressText: {
    marginTop: 8,
    color: '#666',
    fontWeight: '600'
  }
});