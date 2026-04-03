import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ghost } from 'lucide-react-native';

export default function SnapchatScreen({route}) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // Snapchat Scraper
  const INJECTED_JS = `(function() {
    // 1. Check for standard video element (Most reliable for Spotlight)
    const video = document.querySelector('video');
    if (video && video.src && !video.src.startsWith('blob')) {
      window.ReactNativeWebView.postMessage(video.src);
    } else {
      // 2. Fallback to OpenGraph meta tags
      const meta = document.querySelector('meta[property="og:video:secure_url"]') || 
                   document.querySelector('meta[property="og:video"]');
      if (meta && meta.content) {
        window.ReactNativeWebView.postMessage(meta.content);
      } else {
        window.ReactNativeWebView.postMessage("not_found");
      }
    }
  })()`;

  const handleDownload = () => {
    if (!url.includes('snapchat.com')) {
      return Alert.alert("Invalid Link", "Please paste a valid Snapchat link.");
    }
    setScrapingUrl(url);
  };

  return (
    <View style={styles.container}>
      {/* Background container for icon to make it pop on yellow */}
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
      />
      
      <TouchableOpacity 
        style={styles.btn} 
        onPress={handleDownload}
      >
        <Text style={styles.btnText}>Get Snapchat Video</Text>
      </TouchableOpacity>

      {/* Hidden WebView for Scraper */}
      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView 
            source={{ uri: scrapingUrl }} 
            injectedJavaScript={INJECTED_JS} 
            onMessage={(e) => {
                const result = e.nativeEvent.data;
                if (result !== "not_found") {
                  console.log("Snapchat Link:", result);
                  setScrapingUrl('');
                  // Trigger your download logic here
                  Alert.alert("Link Found", "Snapshot ready for download!");
                }
            }} 
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
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 3,
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
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E600',
  },
  btnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});