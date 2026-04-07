import React, { useEffect, useState, useRef } from 'react';
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
  
  // Timeout ref to stop the loader if scraping takes too long
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [route.params?.initialUrl]);

  // ================= NATIVE DOWNLOADER =================
  const downloadYouTubeVideo = async (videoUrl) => {
    const fileName = `YouTube_${Date.now()}.mp4`;
    const dirPath = RNFS.CachesDirectoryPath;
    const filePath = `${dirPath}/${fileName}`;

    await RNFS.mkdir(dirPath);

    return new Promise((resolve, reject) => {
      const options = {
        fromUrl: videoUrl,
        toFile: filePath,
        background: true,
        headers: {
          'User-Agent': DESKTOP_UA,
          'Referer': 'https://www.youtube.com/',
        },
        progress: (res) => {
          const percent = Math.round((res.bytesWritten / res.contentLength) * 100);
          setProgress(percent);
        },
      };

      RNFS.downloadFile(options).promise
        .then(async (result) => {
          if (result.statusCode !== 200) return reject(`Error ${result.statusCode}`);
          
          const cleanPath = Platform.OS === 'android' ? `file://${filePath}` : filePath;
          try {
            await CameraRoll.saveAsset(cleanPath, { type: 'video', album: 'SnappySave' });
          } catch (e) {
            console.log("Gallery save failed, but file exists in cache:", e);
          }
          resolve(cleanPath);
        })
        .catch(reject);
    });
  };

  // ================= FIXED SCRAPER =================
  // Instead of Base64 (which crashes), we grab the direct URL and send it back.
  const INJECTED_JS = `(function() {
    let attempts = 0;
    function findAndSend() {
      try {
        let videoUrl = null;

        // Strategy 1: Check YouTube's internal player response
        if (window.ytInitialPlayerResponse && window.ytInitialPlayerResponse.streamingData) {
          const formats = window.ytInitialPlayerResponse.streamingData.formats || [];
          const progressive = formats.find(f => f.url && f.mimeType.includes("video/mp4"));
          if (progressive) videoUrl = progressive.url;
        }

        // Strategy 2: Check video tags
        if (!videoUrl) {
          const v = document.querySelector("video");
          if (v && v.src && !v.src.startsWith("blob")) videoUrl = v.src;
        }

        if (videoUrl) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "SUCCESS",
            url: videoUrl
          }));
        } else if (attempts < 10) {
          attempts++;
          setTimeout(findAndSend, 1500); // Retry every 1.5s
        } else {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "ERROR",
            detail: "Timeout searching for video"
          }));
        }
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "ERROR",
          detail: e.message
        }));
      }
    }
    setTimeout(findAndSend, 2000);
  })();`;

  const handleProcess = async () => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return Alert.alert("Invalid Link", "Please enter a valid YouTube URL.");
    }

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return;

    setPreviewPath(null);
    setLoading(true);
    setProgress(0);
    setScrapingUrl(url);

    // Safety timeout: If nothing happens in 20 seconds, stop loading
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setScrapingUrl('');
        Alert.alert("Timeout", "Extraction took too long. Try a different video.");
      }
    }, 20000);
  };

  const onMessage = async (e) => {
    let data;
    try { 
      data = JSON.parse(e.nativeEvent.data); 
    } catch(err) { 
      return; 
    }
    
    if (data.type === "SUCCESS" && data.url) {
      clearTimeout(timeoutRef.current);
      setScrapingUrl(''); 
      
      try {
        const localUri = await downloadYouTubeVideo(data.url);
        
        const newDownload = {
          id: Date.now().toString(),
          title: "YouTube Video",
          path: localUri,
          platform: "YouTube",
          date: new Date().toLocaleDateString(),
        };

        const existing = await AsyncStorage.getItem("recent_downloads");
        const downloads = existing ? JSON.parse(existing) : [];
        await AsyncStorage.setItem("recent_downloads", JSON.stringify([newDownload, ...downloads]));

        setPreviewPath(localUri);
        Alert.alert("Success", "Video saved to gallery!");
        setUrl("");
      } catch (err) {
        Alert.alert("Download Failed", "YouTube signature protection blocked this request.");
      } finally {
        setLoading(false);
      }
    } else if (data.type === "ERROR") {
      clearTimeout(timeoutRef.current);
      setLoading(false);
      setScrapingUrl('');
      Alert.alert("Error", "Could not find an extractable video stream.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Video size={50} color="#FF0000" />
        <Text style={styles.title}>YouTube Downloader</Text>
      </View>

      {previewPath && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewLabel}>Preview Ready</Text>
            <TouchableOpacity onPress={() => setPreviewPath(null)}>
              <XCircle color="#FF0000" size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.videoBox}>
            <WebView
              key={previewPath}
              originWhitelist={['*']}
              allowFileAccess={true}
              source={{ 
                html: `
                <html>
                  <body style="margin:0;background:black;display:flex;justify-content:center;align-items:center;height:100vh;">
                    <video id="v" src="${previewPath}" controls autoplay style="width:100%;max-height:100%;"></video>
                  </body>
                </html>` 
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
        placeholderTextColor="#999"
      />

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#FF0000" size="large" />
          <Text style={styles.progressText}>
            {progress > 0 ? `Downloading: ${progress}%` : 'Extracting source...'}
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.btn, loading && { opacity: 0.7 }]} 
        onPress={handleProcess} 
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Please Wait...' : 'Download Video'}</Text>
      </TouchableOpacity>

      {/* Hidden Scraper WebView */}
      <View style={{ height: 0, width: 0, opacity: 0, position: 'absolute' }}>
        {scrapingUrl !== '' && (
          <WebView
            source={{ uri: scrapingUrl }}
            injectedJavaScript={INJECTED_JS}
            userAgent={DESKTOP_UA}
            onMessage={onMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            // Add some platform specific props
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
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
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  previewLabel: { fontWeight: 'bold', color: '#666' },
  videoBox: { height: 230, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#eee', color: '#000' },
  btn: { backgroundColor: '#FF0000', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  loaderContainer: { marginBottom: 20, alignItems: 'center' },
  progressText: { marginTop: 8, color: '#666' }
});