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
import { useTranslation } from 'react-i18next';

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export default function YouTubeScreen({ route }) {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null);
  
  const timeoutRef = useRef(null);
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [route.params?.initialUrl]);

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
        headers: { 'User-Agent': DESKTOP_UA, 'Referer': 'https://www.youtube.com/' },
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
          } catch (e) { console.log(e); }
          resolve(cleanPath);
        })
        .catch(reject);
    });
  };

  const INJECTED_JS = `(function() {
    let attempts = 0;
    function findAndSend() {
      try {
        let videoUrl = null;
        if (window.ytInitialPlayerResponse && window.ytInitialPlayerResponse.streamingData) {
          const formats = window.ytInitialPlayerResponse.streamingData.formats || [];
          const progressive = formats.find(f => f.url && f.mimeType.includes("video/mp4"));
          if (progressive) videoUrl = progressive.url;
        }
        if (!videoUrl) {
          const v = document.querySelector("video");
          if (v && v.src && !v.src.startsWith("blob")) videoUrl = v.src;
        }
        if (videoUrl) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "SUCCESS", url: videoUrl }));
        } else if (attempts < 10) {
          attempts++;
          setTimeout(findAndSend, 1500);
        } else {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "ERROR" }));
        }
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "ERROR" }));
      }
    }
    setTimeout(findAndSend, 2000);
  })();`;

  const handleProcess = async () => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return Alert.alert(t('dl_error'), t('yt_invalid_link'));
    }
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return;

    setPreviewPath(null);
    setLoading(true);
    setProgress(0);
    setScrapingUrl(url);

    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setScrapingUrl('');
      Alert.alert(t('dl_error'), t('yt_timeout'));
    }, 20000);
  };

  const onMessage = async (e) => {
    let data;
    try { data = JSON.parse(e.nativeEvent.data); } catch(err) { return; }
    
    if (data.type === "SUCCESS" && data.url) {
      clearTimeout(timeoutRef.current);
      setScrapingUrl(''); 
      try {
        const localUri = await downloadYouTubeVideo(data.url);
        const newDownload = { id: Date.now().toString(), title: "YouTube Video", path: localUri, platform: "YouTube", date: new Date().toLocaleDateString() };
        const existing = await AsyncStorage.getItem("recent_downloads");
        const downloads = existing ? JSON.parse(existing) : [];
        await AsyncStorage.setItem("recent_downloads", JSON.stringify([newDownload, ...downloads]));
        setPreviewPath(localUri);
        Alert.alert(t('continue'), t('yt_success'));
        setUrl("");
      } catch (err) {
        Alert.alert(t('dl_error'), t('yt_error_sig'));
      } finally { setLoading(false); }
    } else if (data.type === "ERROR") {
      clearTimeout(timeoutRef.current);
      setLoading(false);
      setScrapingUrl('');
      Alert.alert(t('dl_error'), t('yt_error_stream'));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Video size={50} color="#FF0000" />
        <Text style={styles.title}>{t('yt_header')}</Text>
      </View>

      {previewPath && (
        <View style={styles.previewContainer}>
          <View style={[styles.previewHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.previewLabel}>{t('yt_preview')}</Text>
            <TouchableOpacity onPress={() => setPreviewPath(null)}>
              <XCircle color="#FF0000" size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.videoBox}>
            <WebView
              key={previewPath}
              originWhitelist={['*']}
              allowFileAccess={true}
              source={{ html: `<html><body style="margin:0;background:black;display:flex;justify-content:center;align-items:center;height:100vh;"><video src="${previewPath}" controls autoplay style="width:100%;max-height:100%;"></video></body></html>` }}
            />
          </View>
        </View>
      )}

      <TextInput
        style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
        placeholder={t('yt_placeholder')}
        onChangeText={setUrl}
        value={url}
        editable={!loading}
        placeholderTextColor="#999"
      />

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#FF0000" size="large" />
          <Text style={styles.progressText}>
            {progress > 0 ? `${t('yt_downloading')} ${progress}%` : t('yt_extracting')}
          </Text>
        </View>
      )}

      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleProcess} disabled={loading}>
        <Text style={styles.btnText}>{loading ? t('yt_btn_wait') : t('yt_btn_dl')}</Text>
      </TouchableOpacity>

      <View style={{ height: 0, width: 0, opacity: 0, position: 'absolute' }}>
        {scrapingUrl !== '' && (
          <WebView source={{ uri: scrapingUrl }} injectedJavaScript={INJECTED_JS} userAgent={DESKTOP_UA} onMessage={onMessage} javaScriptEnabled domStorageEnabled />
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
  previewHeader: { justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  previewLabel: { fontWeight: 'bold', color: '#666' },
  videoBox: { height: 230, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#eee', color: '#000' },
  btn: { backgroundColor: '#FF0000', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  loaderContainer: { marginBottom: 20, alignItems: 'center' },
  progressText: { marginTop: 8, color: '#666', fontWeight: '600' }
});