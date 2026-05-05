import React, { useEffect, useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, Platform 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Video, XCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { requestStoragePermission } from '../utils/DownloadManager';

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export default function YouTubeScreen({ route }) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null);
   useEffect(() => {
    if (route.params?.initialUrl) {
      console.log("Received initial URL:", route.params.initialUrl);
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // ================= THE "INTERNAL FETCH" SCRAPER =================
  const INJECTED_JS = `(function() {
    async function getBase64(url) {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }

    async function findAndDownload() {
      try {
        let videoUrl = null;
        if (window.ytInitialPlayerResponse && window.ytInitialPlayerResponse.streamingData) {
          const formats = window.ytInitialPlayerResponse.streamingData.formats || [];
          const best = formats.find(f => f.url && f.mimeType.includes('video/mp4'));
          if (best) videoUrl = best.url;
        }

        if (!videoUrl) {
          const v = document.querySelector('video');
          if (v && v.src && !v.src.startsWith('blob')) videoUrl = v.src;
        }

        if (videoUrl) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATUS', msg: 'Converting to file...' }));
          const base64Data = await getBase64(videoUrl);
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SUCCESS', data: base64Data }));
        } else {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR' }));
        }
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', detail: e.message }));
      }
    }

    // Wait for YT to stabilize
    setTimeout(findAndDownload, 3000);
  })();`;

  const handleProcess = async () => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return Alert.alert("Invalid Link");
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return;

    setLoading(true);
    setProgress(0);
    setScrapingUrl(url);
  };

  const onMessage = async (e) => {
    let response;
    try { response = JSON.parse(e.nativeEvent.data); } catch(err) { return; }

    if (response.type === 'STATUS') {
      console.log(response.msg);
      return;
    }

    setScrapingUrl(''); // Stop the WebView

    if (response.type === 'ERROR') {
      setLoading(false);
      return Alert.alert("Error", "YouTube blocked access to this video stream.");
    }

    if (response.type === 'SUCCESS') {
      try {
        const fileName = `YouTube_${Date.now()}.mp4`;
        const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
        
        // Extract base64 part
        const base64Code = response.data.split('base64,')[1];
        
        // Write the file natively
        await RNFS.writeFile(filePath, base64Code, 'base64');
        
        const cleanPath = Platform.OS === 'android' ? `file://${filePath}` : filePath;
        
        // Save to Gallery
        await CameraRoll.saveAsset(cleanPath, { type: 'video', album: 'SnappySave' });
        
        setPreviewPath(cleanPath);
        Alert.alert("Success", "Video saved to gallery!");
      } catch (err) {
        Alert.alert("Save Error", "Could not write video file to storage.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Video size={50} color="#FF0000" />
        <Text style={styles.title}>YouTube Scraper</Text>
      </View>

      {previewPath && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewLabel}>Preview Ready</Text>
            <TouchableOpacity onPress={() => setPreviewPath(null)}>
              <XCircle color="#ff0050" size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.videoBox}>
            <WebView
              key={previewPath}
              originWhitelist={['*']}
              allowFileAccess={true}
              source={{ 
                html: `<body style="margin:0;background:black;"><video src="${previewPath}" controls autoplay style="width:100%;height:100%;"></video></body>` 
              }}
            />
          </View>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Paste YouTube Link..."
        onChangeText={setUrl}
        value={url}
        editable={!loading}
      />

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#FF0000" size="large" />
          <Text style={styles.progressText}>Processing internal stream...</Text>
        </View>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleProcess} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Please Wait...' : 'Scrape & Download'}</Text>
      </TouchableOpacity>

      <View style={{ height: 0, width: 0, opacity: 0 }}>
        {scrapingUrl !== '' && (
          <WebView
            source={{ uri: scrapingUrl }}
            injectedJavaScript={INJECTED_JS}
            userAgent={DESKTOP_UA}
            onMessage={onMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#000', marginTop: 10 },
  previewContainer: { marginBottom: 20 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  previewLabel: { fontWeight: 'bold', color: '#666' },
  videoBox: { height: 230, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#eee', color: '#000' },
  btn: { backgroundColor: '#FF0000', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  loaderContainer: { marginBottom: 20, alignItems: 'center' },
  progressText: { marginTop: 8, color: '#666' }
});