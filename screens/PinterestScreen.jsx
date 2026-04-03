import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Pin } from 'lucide-react-native';

export default function PinterestScreen({route}) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // Pinterest Scraper
  const INJECTED_JS = `(function() {
    // 1. Try Meta Tags first (Common for standard Pins)
    const meta = document.querySelector('meta[property="og:video:secure_url"]') || 
                 document.querySelector('meta[name="twitter:player:stream"]');
    
    if (meta && meta.content) {
      window.ReactNativeWebView.postMessage(meta.content);
    } else {
      // 2. Try to find the <video> element (Common for Idea Pins/Video Pins)
      const video = document.querySelector('video');
      if (video && video.src && !video.src.startsWith('blob')) {
        window.ReactNativeWebView.postMessage(video.src);
      } else {
        window.ReactNativeWebView.postMessage("not_found");
      }
    }
  })()`;

  const handleDownload = () => {
    if (!url.includes('pinterest.com') && !url.includes('pin.it')) {
      return Alert.alert("Invalid Link", "Please paste a valid Pinterest link.");
    }
    setScrapingUrl(url);
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
      />
      
      <TouchableOpacity 
        style={styles.btn} 
        onPress={handleDownload}
      >
        <Text style={styles.btnText}>Find Pinterest Video</Text>
      </TouchableOpacity>

      {/* Hidden WebView */}
      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView 
            source={{ uri: scrapingUrl }} 
            injectedJavaScript={INJECTED_JS} 
            onMessage={(e) => {
                const result = e.nativeEvent.data;
                if (result !== "not_found") {
                  console.log("Pinterest Link:", result);
                  setScrapingUrl('');
                  Alert.alert("Link Found", "Video is ready for download!");
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
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});