import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Pin, XCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { PermissionsAndroid } from 'react-native';

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export default function PinterestScreen({ route }) {
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null);

  // ---------------- PERMISSION ----------------
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const permission = Platform.Version >= 33 
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO 
        : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

      const granted = await PermissionsAndroid.request(permission);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // ---------------- DOWNLOADER ----------------
  const saveVideo = (videoUrl) => {
    return new Promise(async (resolve, reject) => {
      const fileName = `Pinterest_${Date.now()}.mp4`;
      const filePath = `${RNFS.ExternalDirectoryPath}/${fileName}`;

      const xhr = new XMLHttpRequest();
      xhr.open('GET', videoUrl, true);
      xhr.setRequestHeader('User-Agent', DESKTOP_UA);
      xhr.responseType = 'blob';

      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64data = reader.result.split(',')[1];
            await RNFS.writeFile(filePath, base64data, 'base64');

            const cleanPath = Platform.OS === 'android' ? `file://${filePath}` : filePath;

            await CameraRoll.saveAsset(cleanPath, {
              type: 'video',
              album: 'SnappySave'
            });

            resolve(cleanPath);
          };
          reader.readAsDataURL(xhr.response);
        } else {
          reject("Download blocked");
        }
      };

      xhr.onerror = () => reject("Network error");
      xhr.send();
    });
  };

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  // ---------------- SCRAPER ----------------
  const INJECTED_JS = `(function() {
    function findVideoLink() {
      const scripts = document.querySelectorAll('script');

      for (let s of scripts) {
        const content = s.textContent;

        // MP4
        let mp4 = content.match(/https:[^"]+\\.mp4/g);
        if (mp4 && mp4.length > 0) {
          return mp4[0].replace(/\\\\u002f/g, '/');
        }

        // M3U8 (stream)
        let m3u8 = content.match(/https:[^"]+\\.m3u8/g);
        if (m3u8 && m3u8.length > 0) {
          return m3u8[0].replace(/\\\\u002f/g, '/');
        }
      }

      // video tag fallback
      const video = document.querySelector('video');
      if (video) {
        if (video.src && !video.src.startsWith('blob')) return video.src;

        const source = video.querySelector('source');
        if (source && source.src) return source.src;
      }

      // meta fallback
      const meta = document.querySelector('meta[property="og:video"]') ||
                   document.querySelector('meta[property="og:video:secure_url"]');

      if (meta && meta.content) return meta.content;

      return null;
    }

    let attempts = 0;

    const interval = setInterval(() => {
      const link = findVideoLink();
      attempts++;

      if (link) {
        window.ReactNativeWebView.postMessage(JSON.stringify({status: 'SUCCESS', url: link}));
        clearInterval(interval);
      }

      if (attempts > 40) {
        window.ReactNativeWebView.postMessage(JSON.stringify({status: 'ERROR'}));
        clearInterval(interval);
      }
    }, 1500);
  })();`;

  // ---------------- PROCESS ----------------
  const handleProcess = async () => {
    if (!url.includes('pinterest.com') && !url.includes('pin.it')) {
      return Alert.alert("Error", "Invalid Pinterest Link");
    }

    const hasPerm = await requestPermission();
    if (!hasPerm) return;

    setPreviewPath(null);
    setLoading(true);
    setProgress(0);
    setScrapingUrl(url);
  };

  // ---------------- MESSAGE ----------------
  const onMessage = async (e) => {
    const data = JSON.parse(e.nativeEvent.data);

    if (data.status === 'ERROR') {
      setScrapingUrl('');
      setLoading(false);
      return Alert.alert("Video Not Found", "This may not be a downloadable video.");
    }

    if (data.status === 'SUCCESS') {
      setScrapingUrl('');

      // 🚫 Block streaming files
      if (data.url.includes('.m3u8')) {
        setLoading(false);
        return Alert.alert(
          "Unsupported Video",
          "This video uses streaming format (m3u8). Try another pin."
        );
      }

      try {
        const localUri = await saveVideo(data.url);
        setPreviewPath(localUri);

        const newDownload = {
          id: Date.now().toString(),
          title: `Pinterest_${Date.now()}`,
          path: localUri,
          platform: 'Pinterest',
          date: new Date().toLocaleDateString(),
        };

        const existing = await AsyncStorage.getItem('recent_downloads');
        const downloads = existing ? JSON.parse(existing) : [];

        await AsyncStorage.setItem(
          'recent_downloads',
          JSON.stringify([newDownload, ...downloads])
        );

        Alert.alert("Success", "Video saved!");
        setUrl('');
      } catch (err) {
        Alert.alert("Download Error", "Failed to download video.");
      } finally {
        setLoading(false);
      }
    }
  };

  // ---------------- UI ----------------
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pin size={50} color="#BD081C" />
        <Text style={styles.title}>Pinterest Downloader</Text>
      </View>

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
              key={previewPath} // 🔑 CRITICAL: Forces the WebView to reload with the new file
              originWhitelist={['*']}
              allowFileAccess={true} // 📂 Essential for Android local file reading
              allowUniversalAccessFromFileURLs={true}
              allowsFullscreenVideo={true}
              scrollEnabled={false}
              source={{
                html: `
                  <body style="margin:0;padding:0;background:black;display:flex;justify-content:center;align-items:center;">
                    <video 
                      src="${previewPath}" 
                      controls 
                      autoplay 
                      playsinline
                      style="width:100%; height:100%; object-fit: contain;"
                    ></video>
                  </body>
                `
              }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Paste Pinterest Link..."
        placeholderTextColor="#999"
        value={url}
        onChangeText={setUrl}
        editable={!loading}
      />

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#BD081C" />
          <Text style={styles.progressText}>
            {progress > 0 ? `Downloading: ${progress}%` : 'Processing...'}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleProcess}>
        <Text style={styles.btnText}>
          {loading ? 'Please Wait...' : 'Download Video'}
        </Text>
      </TouchableOpacity>

      {/* Hidden scraper */}
      {scrapingUrl !== '' && (
        <WebView
          source={{ uri: scrapingUrl }}
          injectedJavaScript={INJECTED_JS}
          userAgent={DESKTOP_UA}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          style={{ height: 0, width: 0 }}
        />
      )}
    </View>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#BD081C', marginTop: 10 },

  previewContainer: { marginBottom: 20 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  previewLabel: { fontWeight: 'bold', color: '#666' },

  videoBox: { height: 250, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000' },

  input: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#000'
  },

  btn: {
    backgroundColor: '#BD081C',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center'
  },

  btnText: { color: '#FFF', fontWeight: 'bold' },

  loaderContainer: { alignItems: 'center', marginBottom: 20 },
  progressText: { marginTop: 8, color: '#666' }
});