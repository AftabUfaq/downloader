import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Briefcase } from 'lucide-react-native';
// 1. Import the working utility
import { startDownload, requestStoragePermission } from '../utils/DownloadManager'; 

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export default function LinkedInScreen({route}) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // 2. Updated Scraper Logic with IIFE and Timing
  const INJECTED_JS = `(function() {
    function findLinkedInVideo() {
      // Check Meta tags (LinkedIn often populates these for public posts)
      const meta = document.querySelector('meta[property="og:video:secure_url"]') || 
                   document.querySelector('meta[property="og:video"]');
      if (meta && meta.content && meta.content.startsWith('http')) {
        return meta.content;
      }
      
      // Fallback: Check for the actual video element source
      const video = document.querySelector('video');
      if (video && video.src && !video.src.startsWith('blob')) {
        return video.src;
      }

      // Deep Scrape: LinkedIn sometimes stores URLs in script tags as JSON
      const scripts = document.querySelectorAll('script');
      for (let script of scripts) {
        const content = script.textContent;
        if (content.includes("contentUrl")) {
            const match = content.match(/"contentUrl":"(.*?)"/);
            if (match && match[1]) return match[1].replace(/\\\\u002f/g, '/');
        }
      }
      return null;
    }

    // Give the page 2 seconds to load dynamic content
    setTimeout(() => {
      const link = findLinkedInVideo();
      window.ReactNativeWebView.postMessage(link || "not_found");
    }, 2500);
  })()`;

  const handleProcess = async () => {
    if (!url.includes('linkedin.com')) {
      return Alert.alert("Invalid Link", "Please paste a valid LinkedIn post link.");
    }

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return Alert.alert("Permission Denied", "Storage access is required.");

    setLoading(true);
    setProgress(0);
    setScrapingUrl(url); // Trigger WebView
  };

  const onMessage = async (e) => {
    const result = e.nativeEvent.data;
    setScrapingUrl(''); // Close scraper

    if (result === "not_found") {
      setLoading(false);
      return Alert.alert("Error", "Could not find video. Ensure the post is public and contains a video.");
    }

    try {
      // 3. Trigger Centralized Download & Gallery Save
      await startDownload(result, 'LinkedIn', (p) => setProgress(p));
      
      // Half-second delay for stability before alert
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        Alert.alert("Success", "LinkedIn video saved to gallery!");
        setUrl('');
      }, 500);

    } catch (err) {
      setLoading(false);
      Alert.alert("Download Failed", "Found the link, but couldn't save it. Check your internet.");
    }
  };

  return (
    <View style={styles.container}>
      <Briefcase size={60} color="#0A66C2" style={styles.icon} />
      <Text style={styles.title}>LinkedIn Downloader</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Paste LinkedIn Post Link..." 
        placeholderTextColor="#999"
        onChangeText={setUrl} 
        value={url}
        autoCapitalize="none"
        editable={!loading}
      />
      
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#0A66C2" />
          <Text style={styles.progressText}>
            {progress > 0 ? `Downloading: ${progress}%` : 'Analyzing LinkedIn Post...'}
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.btn, loading && { opacity: 0.6 }]} 
        onPress={handleProcess}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Please Wait...' : 'Download LinkedIn Video'}</Text>
      </TouchableOpacity>

      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView 
            source={{ uri: scrapingUrl }} 
            injectedJavaScript={INJECTED_JS} 
            userAgent={DESKTOP_UA} 
            onMessage={onMessage} 
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
    justifyContent: 'center',
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0A66C2',
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
    backgroundColor: '#0A66C2',
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