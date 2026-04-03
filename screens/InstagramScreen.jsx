import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Camera } from 'lucide-react-native';

export default function InstagramScreen({route}) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  const INJECTED_JS = `(function() {
    const meta = document.querySelector('meta[property="og:video:secure_url"]') || document.querySelector('meta[property="og:video"]');
    if (meta) window.ReactNativeWebView.postMessage(meta.content);
  })()`;

  return (
    <View style={styles.container}>
      <Camera size={50} color="#E1306C" style={{ alignSelf: 'center', marginBottom: 20 }} />
      
      <TextInput 
        style={styles.input} 
        placeholder="Paste Instagram Link..." 
        placeholderTextColor="#999"
        onChangeText={setUrl} 
        value={url}
      />
      
      <TouchableOpacity 
        style={[styles.btn, { backgroundColor: '#E1306C' }]} 
        onPress={() => setScrapingUrl(url)}
      >
        <Text style={styles.btnText}>Download Instagram Video</Text>
      </TouchableOpacity>

      {/* Keep WebView hidden but functional */}
      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView 
            source={{ uri: scrapingUrl }} 
            injectedJavaScript={INJECTED_JS} 
            onMessage={(e) => console.log("Video URL found:", e.nativeEvent.data)} 
          />
        </View>
      )}
    </View>
  );
}

// THE MISSING PIECE:
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
    justifyContent: 'center',
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