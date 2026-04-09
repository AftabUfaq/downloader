import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Briefcase, XCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startDownload, requestStoragePermission } from '../utils/DownloadManager'; 

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export default function LinkedInScreen({ route }) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null);

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  const INJECTED_JS = `(function() {
    function findLinkedInVideo() {
      const meta = document.querySelector('meta[property="og:video:secure_url"]') || 
                   document.querySelector('meta[property="og:video"]');
      if (meta && meta.content && meta.content.startsWith('http')) return meta.content;
      
      const video = document.querySelector('video');
      if (video && video.src && !video.src.startsWith('blob')) return video.src;

      const scripts = document.querySelectorAll('script');
      for (let script of scripts) {
        const content = script.textContent;
        if (content.includes("contentUrl")) {
            const match = content.match(/"contentUrl":"(.*?)"/);
            if (match && match[1]) return match[1].replace(/\\\\u002f/g, '/');
        }
      }
      return null;
    }
    setTimeout(() => {
      const link = findLinkedInVideo();
      window.ReactNativeWebView.postMessage(link || "not_found");
    }, 2500);
  })()`;

  const handleProcess = async () => {
    if (!url.includes('linkedin.com')) {
      return Alert.alert("Invalid Link", "Please paste a valid LinkedIn post link.");
    }
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return Alert.alert("Permission Denied", "Storage access required.");

    setPreviewPath(null);
    setLoading(true);
    setProgress(0);
    setScrapingUrl(url); 
  };

  const onMessage = async (e) => {
    const result = e.nativeEvent.data;
    setScrapingUrl(''); 

    if (result === "not_found") {
      setLoading(false);
      return Alert.alert("Error", "Could not find video. Ensure the post is public.");
    }

    try {
      const localUri = await startDownload(result, 'LinkedIn', (p) => setProgress(p));
      setPreviewPath(localUri);

      const newDownload = {
        id: Date.now().toString(),
        title: `LinkedIn_${Date.now()}`,
        path: localUri,
        platform: 'LinkedIn',
        date: new Date().toLocaleDateString(),
      };

      const existing = await AsyncStorage.getItem('recent_downloads');
      const downloads = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem('recent_downloads', JSON.stringify([newDownload, ...downloads]));

      Alert.alert("Success", "LinkedIn video saved!");
      setUrl('');
    } catch (err) {
      Alert.alert("Download Failed", "Check your connection.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Briefcase size={50} color="#0A66C2" />
        <Text style={styles.title}>LinkedIn Downloader</Text>
      </View>

      {/* --- FIXED VIDEO PREVIEW PLAYER --- */}
      {previewPath && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewLabel}>Video Ready</Text>
            <TouchableOpacity onPress={() => setPreviewPath(null)}>
              <XCircle color="#ff0050" size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.videoBox}>
            <WebView
              // CRITICAL: These 3 props allow the video to play from storage
              originWhitelist={['*']}
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              
              allowsFullscreenVideo={true}
              scrollEnabled={false}
              javaScriptEnabled={true}
              source={{ html: `
                <body style="margin:0;padding:0;background:black;display:flex;justify-content:center;align-items:center;">
                  <video 
                    src="${previewPath}" 
                    controls 
                    autoplay 
                    playsinline
                    style="width:100%; height:100%; object-fit: contain;">
                  </video>
                </body>
              `}}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      <TextInput 
        style={styles.input} 
        placeholder="Paste LinkedIn Post Link..." 
        placeholderTextColor="#999"
        onChangeText={setUrl} 
        value={url}
        autoCapitalize="none"
        editable={!loading}
      />
      
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#0A66C2" />
          <Text style={styles.progressText}>
            {progress > 0 ? `Downloading: ${progress}%` : 'Analyzing Post...'}
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.btn, loading && { opacity: 0.6 }]} 
        onPress={handleProcess}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Please Wait...' : 'Download Video'}</Text>
      </TouchableOpacity>

      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView 
            source={{ uri: scrapingUrl }} 
            injectedJavaScript={INJECTED_JS} 
            userAgent={DESKTOP_UA} 
            onMessage={onMessage} 
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F6F8', padding: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0A66C2', marginTop: 10 },
  previewContainer: { marginBottom: 20, width: '100%' },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  previewLabel: { fontWeight: 'bold', color: '#666' },
  videoBox: { height: 230, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000', elevation: 4 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#DEE3E9', color: '#000' },
  btn: { backgroundColor: '#0A66C2', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  loaderContainer: { marginBottom: 20, alignItems: 'center' },
  progressText: { marginTop: 8, color: '#666', fontWeight: '600' }
});