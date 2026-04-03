import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Share } from 'lucide-react-native';

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export default function FacebookScreen({route}) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // Facebook Specific Scraper - Looks for HD/SD source in script tags
  const INJECTED_JS = `(function() {
    try {
      const scripts = document.querySelectorAll('script');
      let foundLink = null;
      
      for (let script of scripts) {
        const content = script.textContent;
        // Search for HD or SD video keys in the script JSON
        const match = content.match(/"browser_native_hd_url":"(.*?)"/) || 
                      content.match(/"browser_native_sd_url":"(.*?)"/);
        if (match && match[1]) {
          foundLink = match[1].replace(/\\\\u002f/g, '/').replace(/\\\\/g, '');
          break;
        }
      }

      if (foundLink) {
        window.ReactNativeWebView.postMessage(foundLink);
      } else {
        // Fallback to OpenGraph meta tags
        const ogVideo = document.querySelector('meta[property="og:video:secure_url"]') || 
                        document.querySelector('meta[property="og:video"]');
        if (ogVideo && ogVideo.content) {
          window.ReactNativeWebView.postMessage(ogVideo.content);
        } else {
          window.ReactNativeWebView.postMessage("not_found");
        }
      }
    } catch (e) {
      window.ReactNativeWebView.postMessage("error");
    }
  })()`;

  const handleDownload = () => {
    if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
      return Alert.alert("Invalid Link", "Please paste a valid Facebook or FB Watch link.");
    }
    setScrapingUrl(url);
  };

  return (
    <View style={styles.container}>
      <Share size={60} color="#1877F2" style={styles.icon} />
      <Text style={styles.title}>Facebook Downloader</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Paste Facebook Video Link..." 
        placeholderTextColor="#999"
        onChangeText={setUrl} 
        value={url}
        autoCapitalize="none"
      />
      
      <TouchableOpacity 
        style={styles.btn} 
        onPress={handleDownload}
      >
        <Text style={styles.btnText}>Find Facebook Video</Text>
      </TouchableOpacity>

      {/* Hidden WebView with Desktop User Agent */}
      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView 
            source={{ uri: scrapingUrl }} 
            injectedJavaScript={INJECTED_JS} 
            userAgent={DESKTOP_UA} 
            onMessage={(e) => {
                const result = e.nativeEvent.data;
                if (result !== "not_found" && result !== "error") {
                  console.log("Facebook Video Link Found:", result);
                  setScrapingUrl('');
                  // Your download logic goes here
                  Alert.alert("Link Found", "Ready to download!");
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
    color: '#1877F2',
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
    backgroundColor: '#1877F2',
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