import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Share, XCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startDownload, requestStoragePermission } from '../utils/DownloadManager'; 
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export default function FacebookScreen({ route }) {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null);

  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  const INJECTED_JS = `(function() {
    function findFBLink() {
      const scripts = document.querySelectorAll('script');
      for (let script of scripts) {
        const content = script.textContent;
        const hdMatch = content.match(/"browser_native_hd_url":"(.*?)"/);
        const sdMatch = content.match(/"browser_native_sd_url":"(.*?)"/);
        const target = hdMatch ? hdMatch[1] : (sdMatch ? sdMatch[1] : null);
        if (target) return target.replace(/\\\\u002f/g, '/').replace(/\\\\/g, '');
      }
      return null;
    }
    window.ReactNativeWebView.postMessage(findFBLink() || "not_found");
  })()`;

  const handleProcess = async () => {
    if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
      return Alert.alert(t('dl_error'), t('fb_invalid_link'));
    }
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return Alert.alert(t('perm_blocked_title'), t('perm_blocked_desc'));

    setPreviewPath(null);
    setLoading(true);
    setProgress(0);
    setScrapingUrl(url);
  };

  const onMessage = async (e) => {
    const result = e.nativeEvent.data;
    setScrapingUrl(''); 

    if (result === "not_found" || result === "error" || !result.startsWith('http')) {
      setLoading(false);
      return Alert.alert(t('dl_error'), t('fb_error_extract'));
    }

    try {
      const localUri = await startDownload(result, 'Facebook', (p) => setProgress(p));
      setPreviewPath(localUri);

      const newDownload = {
        id: Date.now().toString(),
        title: `Facebook_${Date.now()}`,
        path: localUri,
        platform: 'Facebook',
        date: new Date().toLocaleDateString(),
      };

      const existing = await AsyncStorage.getItem('recent_downloads');
      const downloads = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem('recent_downloads', JSON.stringify([newDownload, ...downloads]));

      Alert.alert(t('continue'), t('fb_success'));
      setUrl(''); 
    } catch (err) {
      Alert.alert(t('fb_dl_failed'), err.toString());
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <Share size={60} color="#1877F2" />
        <Text style={styles.title}>{t('fb_header')}</Text>
      </View>

      {/* --- VIDEO PREVIEW UI --- */}
      {previewPath && (
        <View style={styles.previewBox}>
          <View style={[styles.previewHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.previewText}>{t('fb_preview')}</Text>
            <TouchableOpacity onPress={() => setPreviewPath(null)}>
              <XCircle color="#ff0050" size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.videoWrapper}>
            <WebView
              originWhitelist={['*']}
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              allowsFullscreenVideo={true}
              scrollEnabled={false}
              source={{
                html: `
                  <body style="margin:0;padding:0;background:black;display:flex;justify-content:center;align-items:center;">
                    <video src="${previewPath}" controls autoplay playsinline style="width:100%; height:100%; object-fit: contain;"></video>
                  </body>
                `
              }}
              style={styles.previewWebView}
            />
          </View>
        </View>
      )}

      <View style={styles.inputCard}>
        <TextInput 
          style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]} 
          placeholder={t('fb_placeholder')} 
          placeholderTextColor="#999"
          onChangeText={setUrl} 
          value={url}
          autoCapitalize="none"
          editable={!loading}
        />
        
        {loading && (
          <View style={styles.progressArea}>
            <ActivityIndicator color="#1877F2" size="small" />
            <Text style={styles.progressText}>
              {progress > 0 
                ? `${t('fb_downloading')} ${progress}%` 
                : t('fb_finding')}
            </Text>
            <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.btn, loading && styles.btnDisabled]} 
          onPress={handleProcess}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? t('fb_btn_wait') : t('fb_btn_dl')}
          </Text>
        </TouchableOpacity>
      </View>

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
  container: { flex: 1, backgroundColor: '#F0F2F5', padding: 20 },
  headerArea: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1877F2', marginTop: 10 },
  inputCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, elevation: 3 },
  input: { backgroundColor: '#F0F2F5', padding: 15, borderRadius: 10, fontSize: 16, color: '#000', marginBottom: 20 },
  btn: { backgroundColor: '#1877F2', padding: 16, borderRadius: 10, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#A2C5F2' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  progressArea: { alignItems: 'center', marginBottom: 20 },
  progressText: { marginTop: 10, fontSize: 13, color: '#1877F2', fontWeight: '600', marginBottom: 10 },
  barBg: { height: 6, width: '100%', backgroundColor: '#E4E6EB', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#1877F2' },
  previewBox: { marginBottom: 20, width: '100%' },
  previewHeader: { justifyContent: 'space-between', marginBottom: 8 },
  previewText: { fontWeight: 'bold', color: '#65676B' },
  videoWrapper: { height: 230, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000', elevation: 4 },
  previewWebView: { flex: 1 }
});