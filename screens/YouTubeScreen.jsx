import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Video } from 'lucide-react-native';

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export default function YouTubeScreen({route}) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // YouTube Specific Scraper
  const INJECTED_JS = `(function() {
    // Attempt to find the video source in meta tags first
    const meta = document.querySelector('meta[property="og:video:url"]') || 
                 document.querySelector('meta[property="og:video:secure_url"]');
    
    if (meta && meta.content) {
      window.ReactNativeWebView.postMessage(meta.content);
    } else {
      // Fallback: check for the first video element with a source
      const video = document.querySelector('video');
      if (video && video.src && !video.src.startsWith('blob')) {
        window.ReactNativeWebView.postMessage(video.src);
      } else {
        // If it's a "Shorts" or specific player, we send an error to retry
        window.ReactNativeWebView.postMessage("not_found");
      }
    }
  })()`;

  const handleDownload = () => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return Alert.alert("Invalid Link", "Please paste a valid YouTube or Shorts link.");
    }
    setScrapingUrl(url);
  };

  return (
    <View style={styles.container}>
      <Video size={60} color="#FF0000" style={styles.icon} />
      <Text style={styles.title}>YouTube Downloader</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Paste YouTube or Shorts Link..." 
        placeholderTextColor="#999"
        onChangeText={setUrl} 
        value={url}
        autoCapitalize="none"
      />
      
      <TouchableOpacity 
        style={styles.btn} 
        onPress={handleDownload}
      >
        <Text style={styles.btnText}>Extract Video</Text>
      </TouchableOpacity>

      {/* Hidden WebView with Desktop User Agent */}
      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView 
            source={{ uri: scrapingUrl }} 
            injectedJavaScript={INJECTED_JS} 
            userAgent={DESKTOP_UA} // Critical for YouTube scraping
            onMessage={(e) => {
                const result = e.nativeEvent.data;
                if (result !== "not_found") {
                  console.log("YouTube Video Link:", result);
                  setScrapingUrl('');
                  // Trigger your download logic here
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
    backgroundColor: '#FF0000',
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