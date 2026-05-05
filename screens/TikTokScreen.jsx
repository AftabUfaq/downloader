import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Music, XCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startDownload, requestStoragePermission } from '../utils/DownloadManager';
import { useTranslation } from 'react-i18next';

export default function TikTokScreen({ route }) {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null);

  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  const handleProcess = async () => {
    if (!url.toLowerCase().includes('tiktok.com')) {
      return Alert.alert(t('dl_error'), t('tt_invalid_link'));
    }

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return Alert.alert(t('perm_blocked_title'), t('perm_blocked_desc'));

    setPreviewPath(null);
    setLoading(true);

    try {
      const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url.trim())}`;
      const res = await fetch(apiUrl);
      const json = await res.json();

      if (json.code !== 0 || !json.data?.play) {
        throw new Error('No video URL returned');
      }

      const videoUrl = json.data.play;

      const localUri = await startDownload(videoUrl, 'TikTok', (p) => setProgress(p));
      setPreviewPath(localUri);

      const newDownload = {
        id: Date.now().toString(),
        title: `TikTok_${Date.now()}`,
        path: localUri,
        date: new Date().toLocaleDateString(),
      };

      const existing = await AsyncStorage.getItem('recent_downloads');
      const downloads = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem('recent_downloads', JSON.stringify([newDownload, ...downloads]));

      Alert.alert(t('continue'), t('ws_save_success'));
    } catch (err) {
      Alert.alert(t('dl_error'), t('tt_error_extract'));
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Music size={50} color="#00f2ea" />
        <Text style={styles.title}>{t('tt_header')}</Text>
      </View>

      {previewPath && (
        <View style={styles.previewCard}>
          <View style={[styles.previewHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.previewLabel}>{t('tt_preview')}</Text>
            <TouchableOpacity onPress={() => setPreviewPath(null)}>
              <XCircle color="#ff0050" size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.videoContainer}>
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
              style={styles.previewWebView}
            />
          </View>
        </View>
      )}

      <View style={styles.inputSection}>
        <TextInput
          style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={t('tt_placeholder')}
          placeholderTextColor="#999"
          editable={!loading}
          onChangeText={setUrl}
          value={url}
        />

        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color="#00f2ea" />
            <Text style={styles.progressText}>
              {progress > 0 
                ? `${t('tt_downloading')} ${progress}%` 
                : t('tt_searching')}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleProcess}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? t('tt_btn_proc') : t('tt_btn_dl')}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  headerSection: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000', marginTop: 10 },
  previewCard: { marginBottom: 20, width: '100%' },
  previewHeader: { justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 5 },
  previewLabel: { fontWeight: 'bold', color: '#333' },
  videoContainer: {
    height: 250,
    backgroundColor: '#000',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  previewWebView: { flex: 1 },
  inputSection: { marginTop: 'auto', marginBottom: 20 },
  input: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#000',
  },
  btn: {
    backgroundColor: '#000',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    borderLeftWidth: 5,
    borderLeftColor: '#00f2ea',
    borderRightWidth: 5,
    borderRightColor: '#ff0050',
  },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  loaderContainer: { alignItems: 'center', marginBottom: 15 },
  progressText: { marginTop: 5, color: '#666', fontWeight: '600' }
});