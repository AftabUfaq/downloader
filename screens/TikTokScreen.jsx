import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Music } from 'lucide-react-native';

export default function TikTokScreen({ route }) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // TikTok Specific Scraper
  const TIKTOK_JS = `(function() {
    try {
      const scripts = document.querySelectorAll('script');
      let foundLink = null;

      for (let i = 0; i < scripts.length; i++) {
        const content = scripts[i].textContent;
        if (content.includes("downloadAddr") || content.includes("video_url")) {
          const match = content.match(/"downloadAddr":"(.*?)"/) || 
                        content.match(/"video_url":"(.*?)"/);
          if (match && match[1]) {
            foundLink = match[1].replace(/\\\\u0026/g, '&');
            break;
          }
        }
      }

      if (foundLink) {
        window.ReactNativeWebView.postMessage(foundLink);
      } else {
        // Fallback to basic video element
        const video = document.querySelector('video');
        if (video && video.src && !video.src.startsWith('blob')) {
          window.ReactNativeWebView.postMessage(video.src);
        } else {
          window.ReactNativeWebView.postMessage("not_found");
        }
      }
    } catch (e) {
      window.ReactNativeWebView.postMessage("error");
    }
  })()`;

  const handleDownload = () => {
    if (!url.includes('tiktok.com')) {
      return Alert.alert("Invalid Link", "Please paste a valid TikTok link.");
    }
    setScrapingUrl(url);
  };

  return (
    <View style={styles.container}>
      <Music size={60} color="#00f2ea" style={styles.icon} />
      <Text style={styles.title}>TikTok Downloader</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Paste TikTok Link..." 
        placeholderTextColor="#999"
        onChangeText={setUrl} 
        value={url}
        autoCapitalize="none"
      />
      
      <TouchableOpacity 
        style={styles.btn} 
        onPress={handleDownload}
      >
        <Text style={styles.btnText}>Get TikTok Video</Text>
      </TouchableOpacity>

      {/* Hidden WebView for Scraper */}
      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView 
            source={{ uri: scrapingUrl }} 
            injectedJavaScript={TIKTOK_JS} 
            onMessage={(e) => {
                const result = e.nativeEvent.data;
                if (result !== "not_found" && result !== "error") {
                  console.log("TikTok Video Link:", result);
                  setScrapingUrl('');
                  Alert.alert("Link Found", "Video is ready!");
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
});