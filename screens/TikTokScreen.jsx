import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Music } from 'lucide-react-native';
import { startDownload, requestStoragePermission } from '../utils/DownloadManager';

export default function TikTokScreen({ route }) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  const TIKTOK_JS = `
  (function() {
    // Helper to send logs back to RN
    function log(msg) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: msg }));
    }

    log("Scraper Started on: " + window.location.href);

    function findLink() {
      const scripts = document.querySelectorAll('script');
      log("Found " + scripts.length + " script tags");

      for (let i = 0; i < scripts.length; i++) {
        const content = scripts[i].textContent;
        if (content.includes("downloadAddr") || content.includes("video_url")) {
          log("Found potential video key in script index: " + i);
          const match = content.match(/"downloadAddr":"(.*?)"/) ||
                        content.match(/"video_url":"(.*?)"/);
          if (match && match[1]) {
            const cleanLink = match[1].replace(/\\\\u0026/g, '&');
            log("Link Extracted Successfully!");
            return cleanLink;
          }
        }
      }

      // Fallback: Look for the video tag itself
      const videoTag = document.querySelector('video');
      if (videoTag && videoTag.src) {
        log("Fallback: Found link in <video> tag");
        return videoTag.src;
      }

      return null;
    }

    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      log("Attempt " + attempts + " to find link...");
      
      const link = findLink();
      if (link) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', data: link }));
        clearInterval(checkInterval);
      }

      if (attempts >= 20) {
        log("Max attempts reached. Failed to find link.");
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'not_found' }));
        clearInterval(checkInterval);
      }
    }, 2000);
  })();
`;

  const handleProcess = async () => {
    console.log("Button Pressed. URL:", url);
    if (!url.includes('tiktok.com')) {
      return Alert.alert("Invalid Link", "Please paste a valid TikTok link.");
    }

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return Alert.alert("Permission Denied", "We need storage access.");

    setLoading(true);
    setScrapingUrl(url); 
  };

  const onScraperMessage = async (e) => {
    try {
      const response = JSON.parse(e.nativeEvent.data);

      // Handle Logs from inside WebView
      if (response.type === 'log') {
        console.log("[WebView Log]:", response.message);
        return;
      }

      if (response.type === 'error') {
        console.log("[Scraper Error]: Could not find link");
        setLoading(false);
        setScrapingUrl('');
        Alert.alert("Error", "Could not extract video. TikTok might be blocking the request.");
        return;
      }

      if (response.type === 'success') {
        const videoUrl = response.data;
        console.log("[Scraper Success]: Link Found ->", videoUrl);
        setScrapingUrl('');
        
        try {
          await startDownload(videoUrl, 'TikTok', (p) => setProgress(p));
          Alert.alert("Success", "Video saved to gallery!");
        } catch (err) {
          console.log("[Download Error]:", err);
          Alert.alert("Download Failed", err.toString());
        } finally {
          setLoading(false);
          setProgress(0);
        }
      }
    } catch (err) {
      console.log("[Native Message Error]:", e.nativeEvent.data);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Music size={60} color="#00f2ea" style={styles.icon} />
      <Text style={styles.title}>TikTok Downloader</Text>

      <TextInput
        style={styles.input}
        placeholder="Paste TikTok Link..."
        editable={!loading}
        onChangeText={setUrl}
        value={url}
      />

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#00f2ea" />
          <Text style={styles.progressText}>
            {progress > 0 ? `Downloading: ${progress}%` : 'Check Console for logs...'}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.6 }]}
        onPress={handleProcess}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Processing...' : 'Get TikTok Video'}</Text>
      </TouchableOpacity>

      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView
            source={{ uri: scrapingUrl }}
            injectedJavaScript={TIKTOK_JS}
            onMessage={onScraperMessage}
            userAgent={DESKTOP_UA} 
            javaScriptEnabled={true}
            domStorageEnabled={true}
            // Add this to handle redirects better
            onShouldStartLoadWithRequest={(request) => {
              console.log("[WebView Navigating to]:", request.url);
              return true;
            }}
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
    backgroundColor: '#000', // TikTok style black button
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#00f2ea', // TikTok cyan
    borderRightWidth: 4,
    borderRightColor: '#ff0050', // TikTok pink
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
    marginTop: 5,
    color: '#666',
    fontWeight: 'bold'
  }
});