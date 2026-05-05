import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
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
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(''); // 'extracting' | 'downloading'
  const [previewPath, setPreviewPath] = useState(null);

  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  useEffect(() => {
    if (route.params?.initialUrl) setUrl(route.params.initialUrl);
  }, [route.params?.initialUrl]);

  const handleProcess = async () => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return Alert.alert(t('dl_error'), t('yt_invalid_link'));
    }
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return;

    setPreviewPath(null);
    setLoading(true);
    setProgress(0);
    setStatus('extracting');

    try {
      // Step 1: Submit URL — loader.to processes it server-side
      const submitRes = await fetch(
        `https://loader.to/ajax/download.php?button=1&start=1&end=1&format=720&url=${encodeURIComponent(url.trim())}`
      );
      const submitData = await submitRes.json();

      if (!submitData.success || !submitData.progress_url) {
        throw new Error('Submission failed');
      }

      // Step 2: Poll progress_url until download_url is ready (max 60s)
      let downloadUrl = null;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const pollRes = await fetch(submitData.progress_url);
        const pollData = await pollRes.json();
        if (pollData.success === 1 && pollData.download_url) {
          downloadUrl = pollData.download_url;
          break;
        }
      }

      if (!downloadUrl) throw new Error('Timeout waiting for video');

      // Step 3: Download the MP4
      setStatus('downloading');
      const fileName = `YouTube_${Date.now()}.mp4`;
      const dir = Platform.OS === 'android' ? RNFS.ExternalDirectoryPath : RNFS.DocumentDirectoryPath;
      const filePath = `${dir}/${fileName}`;

      const result = await RNFS.downloadFile({
        fromUrl: downloadUrl,
        toFile: filePath,
        headers: { 'User-Agent': DESKTOP_UA, 'Referer': 'https://loader.to/' },
        progress: (res) => {
          if (res.contentLength > 0) {
            setProgress(Math.round((res.bytesWritten / res.contentLength) * 100));
          }
        },
      }).promise;

      if (result.statusCode !== 200 && result.statusCode !== 206) {
        throw new Error(`Server error: ${result.statusCode}`);
      }

      const cleanPath = `file://${filePath}`;
      await CameraRoll.saveAsset(cleanPath, { type: 'video', album: 'SnappySave' });
      setPreviewPath(cleanPath);

      const newDownload = {
        id: Date.now().toString(),
        title: submitData.info?.title || `YouTube_${Date.now()}`,
        path: cleanPath,
        platform: 'YouTube',
        date: new Date().toLocaleDateString(),
      };
      const existing = await AsyncStorage.getItem('recent_downloads');
      const downloads = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem('recent_downloads', JSON.stringify([newDownload, ...downloads]));

      Alert.alert(t('continue'), t('yt_success'));
      setUrl('');
    } catch (err) {
      Alert.alert(t('dl_error'), t('yt_error_sig'));
    } finally {
      setLoading(false);
      setProgress(0);
      setStatus('');
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
              allowUniversalAccessFromFileURLs={true}
              allowsFullscreenVideo={true}
              scrollEnabled={false}
              source={{ html: `<body style="margin:0;padding:0;background:black;display:flex;justify-content:center;align-items:center;"><video src="${previewPath}" controls autoplay playsinline style="width:100%;height:100%;object-fit:contain;"></video></body>` }}
              style={{ flex: 1 }}
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
            {status === 'downloading' && progress > 0
              ? `${t('yt_downloading')} ${progress}%`
              : t('yt_extracting')}
          </Text>
        </View>
      )}

      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleProcess} disabled={loading}>
        <Text style={styles.btnText}>{loading ? t('yt_btn_wait') : t('yt_btn_dl')}</Text>
      </TouchableOpacity>
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
  progressText: { marginTop: 8, color: '#666', fontWeight: '600' },
});
