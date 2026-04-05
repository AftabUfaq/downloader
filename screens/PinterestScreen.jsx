import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Pin } from 'lucide-react-native';
// 1. Import your centralized download utility
import { startDownload, requestStoragePermission } from '../utils/DownloadManager'; 

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export default function PinterestScreen({ route }) {
  // All Hooks at the top
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // Pinterest Scraper with IIFE and a small delay for stability
const INJECTED_JS = `(function() {
    function huntForVideo() {
      // 1. Check standard Meta Tags (for standard Video Pins)
      const meta = document.querySelector('meta[property="og:video:secure_url"]') || 
                   document.querySelector('meta[property="og:video"]');
      if (meta && meta.content && meta.content.includes('.mp4')) return meta.content;

      // 2. DEEP SCRAPE (For Idea Pins like the one in your screenshot)
      // We search all script tags for the 'v.pinimg.com' video domain
      const scripts = document.querySelectorAll('script');
      for (let script of scripts) {
        const content = script.textContent;
        if (content.includes("v.pinimg.com")) {
          // This Regex looks for the highest quality MP4 URL in Pinterest's JSON
          const match = content.match(/"url":"(https:\\\\u002f\\\\u002fv.pinimg.com\\\\u002f.*?\\.mp4)"/);
          if (match && match[1]) {
            // Clean the URL (remove backslashes)
            return match[1].replace(/\\\\u002f/g, '/');
          }
        }
      }

      // 3. Last Resort: Physical Video Tag
      const video = document.querySelector('video');
      if (video && video.src && !video.src.startsWith('blob')) return video.src;

      return null;
    }

    // Idea Pins are "heavy." We use an interval to keep looking until the data loads.
    let attempts = 0;
    const checkInterval = setInterval(() => {
      const link = huntForVideo();
      if (link) {
        window.ReactNativeWebView.postMessage(link);
        clearInterval(checkInterval);
      }
      attempts++;
      if (attempts > 15) { // Try for about 20 seconds
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
    if (!hasPermission) return Alert.alert("Permission Denied", "Storage access is required.");

    setLoading(true);
    setProgress(0);
    setScrapingUrl(url); 
  };

  const onMessage = async (e) => {
    const result = e.nativeEvent.data;
    setScrapingUrl(''); // Close the scraper immediately

    if (result === "not_found" || result === "error") {
      setLoading(false);
      return Alert.alert("Error", "Could not find video. Ensure it's a Video Pin and not an Image.");
    }

    try {
      // 2. Trigger your DownloadManager logic
      await startDownload(result, 'Pinterest', (p) => setProgress(p));
      
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        Alert.alert("Success", "Pinterest video saved to gallery!");
        setUrl('');
      }, 500);

    } catch (err) {
      setLoading(false);
      Alert.alert("Download Failed", "Found the link, but the Pinterest server blocked the download.");
    }
  };

  return (
    <View style={styles.container}>
      <Pin size={60} color="#BD081C" style={styles.icon} />
      <Text style={styles.title}>Pinterest Downloader</Text>

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
        <Text style={styles.btnText}>
          {loading ? 'Please Wait...' : 'Download Pinterest Video'}
        </Text>
      </TouchableOpacity>

      {/* Hidden WebView - Kept inside a conditional to prevent hook issues */}
     <View style={{ height: 1, width: 1, position: 'absolute', opacity: 0 }}>
  {scrapingUrl !== '' && (
    <WebView 
      key="pinterest-scraper"
      source={{ uri: scrapingUrl }} 
      injectedJavaScript={INJECTED_JS} 
      userAgent={DESKTOP_UA} 
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
    color: '#BD081C',
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
    backgroundColor: '#BD081C',
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