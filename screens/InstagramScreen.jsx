import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Camera } from 'lucide-react-native'; // Better icon for IG
import { startDownload, requestStoragePermission } from '../utils/DownloadManager'; 

// Instagram often hides video data from mobile scrapers; Desktop UA is more reliable
const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export default function InstagramScreen({ route }) {
  // Hooks at the top (Stable Order)
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // Enhanced Scraper for Instagram Reels/Posts
  const INJECTED_JS = `(function() {
    function findIGVideo() {
      // 1. Try Meta Tags first (Standard for public posts)
      const meta = document.querySelector('meta[property="og:video"]') || 
                   document.querySelector('meta[property="og:video:secure_url"]');
      if (meta && meta.content) return meta.content;

      // 2. Deep Scrape the video element
      const video = document.querySelector('video');
      if (video && video.src && !video.src.startsWith('blob')) return video.src;

      // 3. Last Resort: Search script tags for the 'video_url' string
      const scripts = document.querySelectorAll('script');
      for (let s of scripts) {
        if (s.textContent.includes('video_url')) {
          const match = s.textContent.match(/"video_url":"(https:.*?\\.mp4.*?)"/);
          if (match && match[1]) return match[1].replace(/\\\\u0026/g, '&');
        }
      }
      return null;
    }

    // Give IG 3 seconds to bypass the "Login" interstitial or lazy-load
    setTimeout(() => {
      const link = findIGVideo();
      window.ReactNativeWebView.postMessage(link || "not_found");
    }, 3000);
  })()`;

  const handleProcess = async () => {
    if (!url.includes('instagram.com')) {
      return Alert.alert("Invalid Link", "Please paste a valid Instagram link.");
    }

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return Alert.alert("Permission Denied", "Storage access required.");

    setLoading(true);
    setProgress(0);
    setScrapingUrl(url); 
  };

  const onMessage = async (e) => {
    const result = e.nativeEvent.data;
    setScrapingUrl(''); // Kill WebView

    if (result === "not_found") {
      setLoading(false);
      return Alert.alert("Error", "Could not find video. Instagram might be blocking this request or the post is private.");
    }

    try {
      // Call your DownloadManager
      await startDownload(result, 'Instagram', (p) => setProgress(p));
      
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        Alert.alert("Success", "Instagram video saved to gallery!");
        setUrl('');
      }, 500);
    } catch (err) {
      setLoading(true); // Allow retry
      setLoading(false);
      Alert.alert("Download Error", "The link was found but Instagram's server blocked the download.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Camera size={60} color="#E1306C" />
        <Text style={styles.title}>Instagram Downloader</Text>
      </View>

      <TextInput 
        style={styles.input} 
        placeholder="Paste Instagram Link (Reels or Post)..." 
        placeholderTextColor="#999"
        onChangeText={setUrl} 
        value={url}
        autoCapitalize="none"
        editable={!loading}
      />
      
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#E1306C" size="large" />
          <Text style={styles.progressText}>
            {progress > 0 ? `Saving: ${progress}%` : 'Scraping Instagram...'}
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.btn, loading && { opacity: 0.6 }]} 
        onPress={handleProcess}
        disabled={loading}
      >
        <Text style={styles.btnText}>
          {loading ? 'Please Wait...' : 'Download Video'}
        </Text>
      </TouchableOpacity>

      {/* Hidden WebView Container */}
      <View style={{ height: 1, width: 1, position: 'absolute', opacity: 0 }}>
        {scrapingUrl !== '' && (
          <WebView 
            key="instagram-scraper"
            source={{ uri: scrapingUrl }} 
            injectedJavaScript={INJECTED_JS} 
            userAgent={DESKTOP_UA} 
            onMessage={onMessage} 
            javaScriptEnabled={true}
            domStorageEnabled={true}
            incognito={true} // Helps bypass some rate limits
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
  },
  btn: {
    backgroundColor: '#E1306C',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
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
    color: '#E1306C',
    fontWeight: '600',
  }
});