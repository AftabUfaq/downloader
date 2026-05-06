import React, { useEffect, useState, useMemo } from "react"; // Added useMemo
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  StatusBar, // Added StatusBar
} from "react-native";
import { WebView } from "react-native-webview";
import { Camera, XCircle } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFS from "react-native-fs";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext"; // 1. Import your theme hook

const MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

export default function InstagramScreen({ route }) {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState("");
  const [scrapingUrl, setScrapingUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null);

  // 2. Extract theme data
  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDarkMode), [colors, isDarkMode]);

  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  const requestPermission = async () => {
    if (Platform.OS !== "android") return true;
    try {
      const permission = Platform.Version >= 33 
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO 
        : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
      const granted = await PermissionsAndroid.request(permission);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      return false;
    }
  };

  const downloadVideo = async (videoUrl) => {
    const fileName = `Instagram_${Date.now()}.mp4`;
    const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

    return new Promise((resolve, reject) => {
      const options = {
        fromUrl: videoUrl,
        toFile: filePath,
        background: true,
        progress: (res) => {
          const percent = Math.round((res.bytesWritten / res.contentLength) * 100);
          setProgress(percent);
        },
      };

      RNFS.downloadFile(options).promise
        .then(async () => {
          const cleanPath = Platform.OS === "android" ? `file://${filePath}` : filePath;
          await CameraRoll.saveAsset(cleanPath, { type: "video", album: "SnappySave" });
          resolve(cleanPath);
        })
        .catch(reject);
    });
  };

  const INJECTED_JS = `
    (function() {
      let attempts = 0;
      const maxAttempts = 30;
      const send = (type, payload = {}) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...payload }));
      };
      const scan = () => {
        attempts++;
        let video = document.querySelector('video');
        if (video && video.src && !video.src.startsWith('blob')) {
          send("SUCCESS", { url: video.src });
          return true;
        }
        let metaVideo = document.querySelector('meta[property="og:video"]');
        if (metaVideo && metaVideo.content) {
          send("SUCCESS", { url: metaVideo.content });
          return true;
        }
        if (attempts >= maxAttempts) {
          send("ERROR");
          return true;
        }
        return false;
      };
      const timer = setInterval(() => {
        if (scan()) clearInterval(timer);
      }, 1500);
    })();
  `;

  const handleProcess = async () => {
    if (!url.includes("instagram.com")) return Alert.alert(t('dl_error'), t('ig_invalid_link'));
    const hasPerm = await requestPermission();
    if (!hasPerm) return Alert.alert(t('perm_blocked_title'), t('perm_blocked_desc'));

    setPreviewPath(null);
    setLoading(true);
    setProgress(0);

    const match = url.match(/instagram\.com\/(reel|p)\/([^/?]+)/);
    if (!match) {
      setLoading(false);
      return Alert.alert(t('dl_error'), t('ig_invalid_format'));
    }
    setScrapingUrl(`https://www.instagram.com/${match[1]}/${match[2]}/embed/`);
  };

  const onMessage = async (event) => {
    let data;
    try {
      data = JSON.parse(event.nativeEvent.data);
    } catch (e) { return; }

    if (data.type === "ERROR") {
      setLoading(false);
      setScrapingUrl("");
      return Alert.alert(t('dl_error'), t('ig_not_found'));
    }

    if (data.type === "SUCCESS" && data.url) {
      setScrapingUrl("");
      try {
        const localUri = await downloadVideo(data.url);
        setPreviewPath(localUri);

        const newDownload = {
          id: Date.now().toString(),
          title: "Instagram Video",
          path: localUri,
          platform: "Instagram",
          date: new Date().toLocaleDateString(),
        };

        const existing = await AsyncStorage.getItem('recent_downloads');
        const downloads = existing ? JSON.parse(existing) : [];
        await AsyncStorage.setItem('recent_downloads', JSON.stringify([newDownload, ...downloads]));

        Alert.alert(t('continue'), t('ig_success'));
        setUrl("");
      } catch (e) {
        Alert.alert(t('dl_error'), t('ig_error_dl'));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* 3. Sync StatusBar */}
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={styles.header}>
        <Camera size={50} color="#E1306C" />
        <Text style={styles.title}>{t('ig_header')}</Text>
      </View>

      {previewPath && (
        <View style={styles.previewContainer}>
          <View style={[styles.previewHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.previewLabel}>{t('ig_preview')}</Text>
            <TouchableOpacity onPress={() => setPreviewPath(null)}>
              <XCircle size={24} color="#ff0050" />
            </TouchableOpacity>
          </View>
          <View style={styles.videoBox}>
            <WebView
              key={previewPath}
              originWhitelist={["*"]}
              allowFileAccess={true}
              allowFileAccessFromFileURLs={true}
              allowUniversalAccessFromFileURLs={true}
              source={{
                html: `
                  <html>
                    <body style="margin:0;background:black;display:flex;justify-content:center;align-items:center;height:100vh;">
                      <video id="v" src="${previewPath}" controls autoplay playsinline style="width:100%; max-height:100%; border-radius:15px;"></video>
                    </body>
                  </html>
                `,
              }}
            />
          </View>
        </View>
      )}

      <TextInput
        style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
        placeholder={t('ig_placeholder')}
        placeholderTextColor={colors.subText} // Dynamic placeholder color
        value={url}
        editable={!loading}
        onChangeText={setUrl}
      />

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#E1306C" />
          <Text style={styles.progressText}>
            {progress > 0 ? `${t('ig_downloading')} ${progress}%` : t('ig_extracting')}
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.btn, loading && { opacity: 0.7 }]} 
        disabled={loading} 
        onPress={handleProcess}
      >
        <Text style={styles.btnText}>{loading ? t('ig_btn_wait') : t('ig_btn_dl')}</Text>
      </TouchableOpacity>

      <View style={{ height: 0, width: 0, opacity: 0 }}>
        {scrapingUrl !== "" && (
          <WebView
            source={{ uri: scrapingUrl }}
            injectedJavaScript={INJECTED_JS}
            userAgent={MOBILE_UA}
            onMessage={onMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        )}
      </View>
    </View>
  );
}

// 4. Dynamic Stylesheet function
const getStyles = (colors, isDarkMode) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background, // Dynamic
    padding: 20 
  },
  header: { 
    alignItems: "center", 
    marginTop: 40, 
    marginBottom: 20 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginTop: 10, 
    color: colors.text // Dynamic
  },
  previewContainer: { 
    marginBottom: 20 
  },
  previewHeader: { 
    justifyContent: "space-between", 
    marginBottom: 5 
  },
  previewLabel: { 
    fontWeight: "bold", 
    color: colors.text // Dynamic
  },
  videoBox: { 
    height: 230, 
    borderRadius: 15, 
    overflow: "hidden", 
    backgroundColor: "#000" 
  },
  input: { 
    backgroundColor: colors.card, // Dynamic
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: colors.border, // Dynamic
    color: colors.text // Dynamic
  },
  btn: { 
    backgroundColor: "#E1306C", 
    padding: 18, 
    borderRadius: 12, 
    alignItems: "center" 
  },
  btnText: { 
    color: "#FFF", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  loaderContainer: { 
    alignItems: "center", 
    marginBottom: 20 
  },
  progressText: { 
    marginTop: 8, 
    color: colors.subText, // Dynamic
    fontWeight: '600' 
  },
});