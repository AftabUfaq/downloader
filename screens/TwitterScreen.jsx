import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native'; // Using the X icon for Twitter/X

export default function TwitterScreen({route}) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // Script to find video tags or Twitter's player stream meta tags
  const INJECTED_JS = `(function() {
    const meta = document.querySelector('meta[property="og:video:secure_url"]') || 
                 document.querySelector('meta[name="twitter:player:stream"]');
    if (meta) {
      window.ReactNativeWebView.postMessage(meta.content);
    } else {
      const video = document.querySelector('video');
      if (video && video.src) window.ReactNativeWebView.postMessage(video.src);
    }
  })()`;

  const handleDownload = () => {
    if (!url.includes('twitter.com') && !url.includes('x.com')) {
      return Alert.alert("Invalid Link", "Please paste a valid Twitter or X.com link.");
    }
    setScrapingUrl(url);
  };

  return (
    <View style={styles.container}>
      {/* Icon and Header */}
      <X size={60} color="#000000" style={styles.icon} />
      <Text style={styles.title}>Twitter / X Downloader</Text>

      {/* Input Field */}
      <TextInput 
        style={styles.input} 
        placeholder="Paste X / Twitter Link..." 
        placeholderTextColor="#999"
        onChangeText={setUrl} 
        value={url}
        autoCapitalize="none"
      />
      
      {/* Download Button */}
      <TouchableOpacity 
        style={styles.btn} 
        onPress={handleDownload}
      >
        <Text style={styles.btnText}>Fetch Video</Text>
      </TouchableOpacity>

      {/* Hidden WebView for Scraper */}
      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView 
            source={{ uri: scrapingUrl }} 
            injectedJavaScript={INJECTED_JS} 
            onMessage={(e) => {
                console.log("Twitter Video Link:", e.nativeEvent.data);
                setScrapingUrl(''); // Reset after finding
                // Here you would normally trigger your startDownload(e.nativeEvent.data) function
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
    fontSize: 20,
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
    backgroundColor: '#000', // Black branding for X
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