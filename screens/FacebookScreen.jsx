import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Share } from 'lucide-react-native';
// Ensure this path matches where you saved your utility file
import { startDownload, requestStoragePermission } from '../utils/DownloadManager'; 

const { width } = Dimensions.get('window');
const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export default function FacebookScreen({ route }) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // Facebook Scraper: HD/SD script matching + OpenGraph fallback
  const INJECTED_JS = `(function() {
    try {
      function findLink() {
        const scripts = document.querySelectorAll('script');
        for (let script of scripts) {
          const content = script.textContent;
          const match = content.match(/"browser_native_hd_url":"(.*?)"/) || 
                        content.match(/"browser_native_sd_url":"(.*?)"/);
          if (match && match[1]) {
            return match[1].replace(/\\\\u002f/g, '/').replace(/\\\\/g, '');
          }
        }
        const ogVideo = document.querySelector('meta[property="og:video:secure_url"]') || 
                        document.querySelector('meta[property="og:video"]');
        return ogVideo ? ogVideo.content : null;
      }

      // Check once immediately, then again after a short delay
      const initialLink = findLink();
      if (initialLink) {
        window.ReactNativeWebView.postMessage(initialLink);
      } else {
        setTimeout(() => {
          const secondLink = findLink();
          window.ReactNativeWebView.postMessage(secondLink || "not_found");
        }, 2000);
      }
    } catch (e) {
      window.ReactNativeWebView.postMessage("error");
    }
  })()`;

  const handleProcess = async () => {
    if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
      return Alert.alert("Invalid Link", "Please paste a valid Facebook or FB Watch link.");
    }

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      return Alert.alert("Permission Denied", "Storage access is required to save videos.");
    }

    setLoading(true);
    setProgress(0);
    setScrapingUrl(url);
  };

  const onMessage = async (e) => {
    const result = e.nativeEvent.data;
    setScrapingUrl(''); // Kill the webview immediately to save resources

    if (result === "not_found" || result === "error" || !result.startsWith('http')) {
      setLoading(false);
      return Alert.alert("Error", "Could not find the video source. Make sure the post is Public.");
    }

    try {
      // Start the actual file download
      await startDownload(result, 'Facebook', (p) => setProgress(p));
      Alert.alert("Success", "Facebook video saved to gallery!");
      setUrl(''); // Clear input on success
    } catch (err) {
      Alert.alert("Download Failed", err.toString());
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <Share size={60} color="#1877F2" />
        <Text style={styles.title}>Facebook Downloader</Text>
        <Text style={styles.subtitle}>HD & SD Video Support</Text>
      </View>

      <View style={styles.inputCard}>
        <TextInput 
          style={styles.input} 
          placeholder="Paste Facebook Link..." 
          placeholderTextColor="#999"
          onChangeText={setUrl} 
          value={url}
          autoCapitalize="none"
          editable={!loading}
        />
        
        {loading && (
          <View style={styles.progressArea}>
            <ActivityIndicator color="#1877F2" size="small" />
            <Text style={styles.progressText}>
              {progress > 0 ? `Downloading: ${progress}%` : 'Finding video link...'}
            </Text>
            <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.btn, loading && styles.btnDisabled]} 
          onPress={handleProcess}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? 'Please Wait...' : 'Download Video'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hidden Scraper */}
      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView 
            source={{ uri: scrapingUrl }} 
            injectedJavaScript={INJECTED_JS} 
            userAgent={DESKTOP_UA} 
            onMessage={onMessage} 
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Facebook-ish grey
    padding: 20,
  },
  headerArea: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1877F2',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#65676B',
  },
  inputCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    backgroundColor: '#F0F2F5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#1877F2',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#A2C5F2',
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressText: {
    marginTop: 10,
    fontSize: 13,
    color: '#1877F2',
    fontWeight: '600',
    marginBottom: 10,
  },
  barBg: {
    height: 6,
    width: '100%',
    backgroundColor: '#E4E6EB',
    borderRadius: 3,
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    backgroundColor: '#1877F2'
  }
});