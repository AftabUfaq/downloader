import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ghost } from 'lucide-react-native';
// 1. Import your working utility
import { startDownload, requestStoragePermission } from '../utils/DownloadManager'; 

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export default function SnapchatScreen({route}) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // 2. Wrap in IIFE and add a small delay to ensure the video tag is rendered
  const INJECTED_JS = `(function() {
    function findSnapLink() {
      const video = document.querySelector('video');
      if (video && video.src && !video.src.startsWith('blob')) {
        return video.src;
      }
      const meta = document.querySelector('meta[property="og:video:secure_url"]') || 
                   document.querySelector('meta[property="og:video"]');
      return meta ? meta.content : null;
    }

    setTimeout(() => {
      const link = findSnapLink();
      window.ReactNativeWebView.postMessage(link || "not_found");
    }, 2000);
  })()`;

  const handleDownload = async () => {
    if (!url.includes('snapchat.com')) {
      return Alert.alert("Invalid Link", "Please paste a valid Snapchat link.");
    }

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return Alert.alert("Permission Denied", "Storage access required.");

    setLoading(true);
    setProgress(0);
    setScrapingUrl(url);
  };

  const onMessage = async (e) => {
    const result = e.nativeEvent.data;
    setScrapingUrl(''); // Close scraper

    if (result === "not_found" || result === "error") {
      setLoading(false);
      return Alert.alert("Error", "Could not find video. Is this a public Spotlight or Story?");
    }

    try {
      // 3. Call the central downloader
      await startDownload(result, 'Snapchat', (p) => setProgress(p));
      Alert.alert("Success", "Snapchat video saved to gallery!");
      setUrl('');
    } catch (err) {
      Alert.alert("Download Failed", err.toString());
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ghost size={60} color="#000" />
      </View>
      
      <Text style={styles.title}>Snapchat Downloader</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Paste Snapchat Link..." 
        placeholderTextColor="#999"
        onChangeText={setUrl} 
        value={url}
        autoCapitalize="none"
        editable={!loading}
      />
      
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#FFFC00" />
          <Text style={styles.progressText}>
            {progress > 0 ? `Saving: ${progress}%` : 'Scraping Snapchat...'}
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.btn, loading && { opacity: 0.6 }]} 
        onPress={handleDownload}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Processing...' : 'Get Snapchat Video'}</Text>
      </TouchableOpacity>

      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView 
            source={{ uri: scrapingUrl }} 
            injectedJavaScript={INJECTED_JS} 
            userAgent={DESKTOP_UA} // Essential for bypassing mobile blocks
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
  iconWrapper: {
    alignSelf: 'center',
    backgroundColor: '#FFFC00',
    padding: 20,
    borderRadius: 25,
    marginBottom: 10,
    elevation: 5,
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
    backgroundColor: '#FFFC00',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  btnText: {
    color: '#000',
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