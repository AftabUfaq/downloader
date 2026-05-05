import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Briefcase, XCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startDownload, requestStoragePermission } from '../utils/DownloadManager';
import { useTranslation } from 'react-i18next';

const LI_API = 'https://us-central1-hyperclapper.cloudfunctions.net/getVideoInfo';

export default function LinkedInScreen({ route }) {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null);

  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  useEffect(() => {
    if (route.params?.initialUrl) setUrl(route.params.initialUrl);
  }, [route.params?.initialUrl]);

  const handleProcess = async () => {
    if (!url.includes('linkedin.com')) {
      return Alert.alert(t('dl_error'), t('li_invalid_link'));
    }
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return Alert.alert(t('perm_blocked_title'), t('perm_blocked_desc'));

    setPreviewPath(null);
    setLoading(true);
    setProgress(0);

    try {
      const res = await fetch(LI_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();

      // Pick highest bitrate format, fall back to videoUrl
      let videoUrl = json.videoUrl;
      if (json.formats?.length) {
        const best = json.formats.reduce((a, b) => ((b.tbr || 0) > (a.tbr || 0) ? b : a));
        if (best?.url) videoUrl = best.url;
      }

      if (!videoUrl) throw new Error('No video URL');

      const localUri = await startDownload(videoUrl, 'LinkedIn', (p) => setProgress(p));
      setPreviewPath(localUri);

      const newDownload = {
        id: Date.now().toString(),
        title: json.title || `LinkedIn_${Date.now()}`,
        path: localUri,
        platform: 'LinkedIn',
        date: new Date().toLocaleDateString(),
      };
      const existing = await AsyncStorage.getItem('recent_downloads');
      const downloads = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem('recent_downloads', JSON.stringify([newDownload, ...downloads]));

      Alert.alert(t('continue'), t('li_success'));
      setUrl('');
    } catch (err) {
      Alert.alert(t('dl_error'), t('li_error_extract'));
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Briefcase size={50} color="#0A66C2" />
        <Text style={styles.title}>{t('li_header')}</Text>
      </View>

      {previewPath && (
        <View style={styles.previewContainer}>
          <View style={[styles.previewHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.previewLabel}>{t('li_preview')}</Text>
            <TouchableOpacity onPress={() => setPreviewPath(null)}>
              <XCircle color="#ff0050" size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.videoBox}>
            <WebView
              originWhitelist={['*']}
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              allowsFullscreenVideo={true}
              scrollEnabled={false}
              javaScriptEnabled={true}
              source={{ html: `<body style="margin:0;padding:0;background:black;display:flex;justify-content:center;align-items:center;"><video src="${previewPath}" controls autoplay playsinline style="width:100%;height:100%;object-fit:contain;"></video></body>` }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      <TextInput
        style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
        placeholder={t('li_placeholder')}
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
            {progress > 0 ? `${t('li_downloading')} ${progress}%` : t('li_analyzing')}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.6 }]}
        onPress={handleProcess}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? t('li_btn_wait') : t('li_btn_dl')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F6F8', padding: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0A66C2', marginTop: 10 },
  previewContainer: { marginBottom: 20, width: '100%' },
  previewHeader: { justifyContent: 'space-between', marginBottom: 8 },
  previewLabel: { fontWeight: 'bold', color: '#666' },
  videoBox: { height: 230, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000', elevation: 4 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#DEE3E9', color: '#000' },
  btn: { backgroundColor: '#0A66C2', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  loaderContainer: { marginBottom: 20, alignItems: 'center' },
  progressText: { marginTop: 8, color: '#666', fontWeight: '600' },
});
