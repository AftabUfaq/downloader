import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, PermissionsAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import { Pin, XCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { useTranslation } from 'react-i18next';

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export default function PinterestScreen({ route }) {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null);

  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

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

  const saveVideo = (videoUrl) => {
    return new Promise(async (resolve, reject) => {
      const fileName = `Pinterest_${Date.now()}.mp4`;
      const dir = Platform.OS === 'android' ? RNFS.ExternalDirectoryPath : RNFS.DocumentDirectoryPath;
      const filePath = `${dir}/${fileName}`;
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
            const cleanPath = `file://${filePath}`;
            await CameraRoll.saveAsset(cleanPath, { type: 'video', album: 'SnappySave' });
            resolve(cleanPath);
          };
          reader.readAsDataURL(xhr.response);
        } else { reject("Download blocked"); }
      };
      xhr.onerror = () => reject("Network error");
      xhr.send();
    });
  };

  useEffect(() => {
    if (route.params?.initialUrl) { setUrl(route.params.initialUrl); }
  }, [route.params?.initialUrl]);

  const INJECTED_JS = `(function() {
    function findVideoLink() {
      const scripts = document.querySelectorAll('script');
      for (let s of scripts) {
        const content = s.textContent;
        let mp4 = content.match(/https:[^"]+\\.mp4/g);
        if (mp4 && mp4.length > 0) return mp4[0].replace(/\\\\u002f/g, '/');
        let m3u8 = content.match(/https:[^"]+\\.m3u8/g);
        if (m3u8 && m3u8.length > 0) return m3u8[0].replace(/\\\\u002f/g, '/');
      }
      const video = document.querySelector('video');
      if (video) {
        if (video.src && !video.src.startsWith('blob')) return video.src;
        const source = video.querySelector('source');
        if (source && source.src) return source.src;
      }
      const meta = document.querySelector('meta[property="og:video"]') || document.querySelector('meta[property="og:video:secure_url"]');
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

  const handleProcess = async () => {
    if (!url.includes('pinterest.com') && !url.includes('pin.it')) {
      return Alert.alert(t('dl_error'), t('pin_invalid_link'));
    }
    const hasPerm = await requestPermission();
    if (!hasPerm) return;

    setPreviewPath(null);
    setLoading(true);
    setProgress(0);
    setScrapingUrl(url);
  };

  const onMessage = async (e) => {
    const data = JSON.parse(e.nativeEvent.data);
    if (data.status === 'ERROR') {
      setScrapingUrl('');
      setLoading(false);
      return Alert.alert(t('dl_error'), t('pin_not_found'));
    }

    if (data.status === 'SUCCESS') {
      setScrapingUrl('');
      if (data.url.includes('.m3u8')) {
        setLoading(false);
        return Alert.alert(t('dl_error'), t('pin_error_stream'));
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
        await AsyncStorage.setItem('recent_downloads', JSON.stringify([newDownload, ...downloads]));

        Alert.alert(t('continue'), t('pin_success'));
        setUrl('');
      } catch (err) {
        Alert.alert(t('dl_error'), t('pin_error_dl'));
      } finally { setLoading(false); }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pin size={50} color="#BD081C" />
        <Text style={[styles.title, { color: '#BD081C' }]}>{t('pin_header')}</Text>
      </View>

      {previewPath && (
        <View style={styles.previewContainer}>
          <View style={[styles.previewHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.previewLabel}>{t('pin_preview')}</Text>
            <TouchableOpacity onPress={() => setPreviewPath(null)}>
              <XCircle color="#ff0050" size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.videoBox}>
            <WebView
              key={previewPath}
              originWhitelist={['*']}
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              allowsFullscreenVideo={true}
              scrollEnabled={false}
              source={{
                html: `<body style="margin:0;padding:0;background:black;display:flex;justify-content:center;align-items:center;">
                    <video src="${previewPath}" controls autoplay playsinline style="width:100%; height:100%; object-fit: contain;"></video>
                  </body>`
              }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      <TextInput
        style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
        placeholder={t('pin_placeholder')}
        placeholderTextColor="#999"
        value={url}
        onChangeText={setUrl}
        editable={!loading}
      />

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#BD081C" />
          <Text style={styles.progressText}>
            {progress > 0 ? `${t('pin_downloading')} ${progress}%` : t('pin_processing')}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleProcess} disabled={loading}>
        <Text style={styles.btnText}>
          {loading ? t('pin_btn_wait') : t('pin_btn_dl')}
        </Text>
      </TouchableOpacity>

      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView
            source={{ uri: scrapingUrl }}
            injectedJavaScript={INJECTED_JS}
            userAgent={DESKTOP_UA}
            onMessage={onMessage}
            javaScriptEnabled
            domStorageEnabled
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  previewContainer: { marginBottom: 20 },
  previewHeader: { justifyContent: 'space-between' },
  previewLabel: { fontWeight: 'bold', color: '#666' },
  videoBox: { height: 250, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#eee', color: '#000' },
  btn: { backgroundColor: '#BD081C', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  loaderContainer: { alignItems: 'center', marginBottom: 20 },
  progressText: { marginTop: 8, color: '#666', fontWeight: '600' }
});