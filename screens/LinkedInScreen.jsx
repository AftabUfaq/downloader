import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Briefcase } from 'lucide-react-native';

export default function LinkedInScreen({route}) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // LinkedIn Scraper
  const INJECTED_JS = `(function() {
    // 1. Check for OpenGraph video tags (best for LinkedIn posts)
    const meta = document.querySelector('meta[property="og:video:secure_url"]') || 
                 document.querySelector('meta[property="og:video"]');
    
    if (meta && meta.content) {
      window.ReactNativeWebView.postMessage(meta.content);
    } else {
      // 2. Fallback to finding the video element in the DOM
      const video = document.querySelector('video');
      if (video && video.src && !video.src.startsWith('blob')) {
        window.ReactNativeWebView.postMessage(video.src);
      } else {
        window.ReactNativeWebView.postMessage("not_found");
      }
    }
  })()`;

  const handleDownload = () => {
    if (!url.includes('linkedin.com')) {
      return Alert.alert("Invalid Link", "Please paste a valid LinkedIn post link.");
    }
    setScrapingUrl(url);
  };

  return (
    <View style={styles.container}>
      <Briefcase size={60} color="#0077B5" style={styles.icon} />
      <Text style={styles.title}>LinkedIn Downloader</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Paste LinkedIn Post Link..." 
        placeholderTextColor="#999"
        onChangeText={setUrl} 
        value={url}
        autoCapitalize="none"
      />
      
      <TouchableOpacity 
        style={styles.btn} 
        onPress={handleDownload}
      >
        <Text style={styles.btnText}>Extract LinkedIn Video</Text>
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
                  console.log("LinkedIn Link Found:", result);
                  setScrapingUrl('');
                  // Your download logic goes here
                  Alert.alert("Success", "Video link captured!");
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