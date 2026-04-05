import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';
import { startDownload, requestStoragePermission } from '../utils/DownloadManager'; 

// Use a specific Mobile User Agent - X is often more "open" to mobile guests than desktop
const MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1";

export default function TwitterScreen({ route }) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // Enhanced Scraper: Uses an interval to hunt for the URL in multiple places
  const INJECTED_JS = `(function() {
    function findVideo() {
      // 1. Check for standard MP4 in Meta tags (Best Case)
      const meta = document.querySelector('meta[property="og:video:url"]') || 
                   document.querySelector('meta[property="og:video:secure_url"]');
      if (meta && meta.content && meta.content.includes('.mp4')) return meta.content;

      // 2. Scan scripts for JSON data containing video_url (Common for X)
      const scripts = document.querySelectorAll('script');
      for (let s of scripts) {
        const text = s.textContent;
        if (text.includes('.mp4')) {
          const match = text.match(/"video_url":"(https:.*?\\.mp4)"/);
          if (match && match[1]) return match[1].replace(/\\\\/g, '');
        }
      }

      // 3. Check video elements (If rendered)
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
      if (attempts > 15) { // Stop after ~22 seconds
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
    if (!hasPermission) return Alert.alert("Permission Denied", "Storage access required.");

    setLoading(true);
    setProgress(0);
    setScrapingUrl(url); 
  };

  const onMessage = async (e) => {
    const result = e.nativeEvent.data;
    setScrapingUrl(''); // Unmount WebView

    if (result === "not_found") {
      setLoading(false);
      return Alert.alert(
        "Link Not Found", 
        "X often hides videos behind a login wall. Try a public tweet or ensure the link is correct."
      );
    }

    try {
      await startDownload(result, 'Twitter', (p) => setProgress(p));
      
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        Alert.alert("Success", "Video saved to gallery!");
        setUrl('');
      }, 500);
    } catch (err) {
      setLoading(false);
      Alert.alert("Download Error", "The link was found but X blocked the download request.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <X size={60} color="#000000" />
        <Text style={styles.title}>X Downloader</Text>
      </View>

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
          <ActivityIndicator color="#000" size="large" />
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
        <Text style={styles.btnText}>
          {loading ? 'Processing...' : 'Download Video'}
        </Text>
      </TouchableOpacity>

      {/* WebView Container: Keep it 1x1 to stay active but invisible */}
      <View style={{ height: 1, width: 1, position: 'absolute', opacity: 0 }}>
        {scrapingUrl !== '' && (
          <WebView 
            key="twitter-scraper"
            source={{ uri: scrapingUrl }} 
            injectedJavaScript={INJECTED_JS} 
            userAgent={MOBILE_UA} 
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
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
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
    elevation: 2,
  },
  btn: {
    backgroundColor: '#000',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  btnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loaderContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  progressText: {
    marginTop: 10,
    color: '#333',
    fontWeight: '600',
    fontSize: 16
  }
});