import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, PermissionsAndroid } from "react-native";
import { WebView } from "react-native-webview";
import { X, XCircle } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFS from "react-native-fs";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { useTranslation } from "react-i18next";

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export default function TwitterScreen({ route }) {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null);

  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  const requestPermission = async () => {
    if (Platform.OS !== "android") return true;
    const permission = Platform.Version >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
      : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
    const granted = await PermissionsAndroid.request(permission);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  useEffect(() => {
    if (route.params?.initialUrl) {
      setUrl(route.params.initialUrl);
    }
  }, [route.params]);

  const saveVideo = (videoUrl) => {
    return new Promise(async (resolve, reject) => {
      const fileName = `Twitter_${Date.now()}.mp4`;
      const dir = Platform.OS === 'android' ? RNFS.ExternalDirectoryPath : RNFS.DocumentDirectoryPath;
      const filePath = `${dir}/${fileName}`;
      const xhr = new XMLHttpRequest();
      xhr.open("GET", videoUrl, true);
      xhr.setRequestHeader("User-Agent", DESKTOP_UA);
      xhr.responseType = "blob";

      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64data = reader.result.split(",")[1];
              await RNFS.writeFile(filePath, base64data, "base64");
              const cleanPath = `file://${filePath}`;
              await CameraRoll.saveAsset(cleanPath, { type: "video", album: "SnappySave" });
              resolve(cleanPath);
            } catch (err) { reject("Save failed"); }
          };
          reader.readAsDataURL(xhr.response);
        } else { reject("Status: " + xhr.status); }
      };
      xhr.onerror = () => reject("Network error");
      xhr.send();
    });
  };

  const extractTweetId = (rawUrl) => {
    const match = rawUrl.match(/\/status(?:es)?\/(\d+)/);
    return match ? match[1] : null;
  };

  const handleProcess = async () => {
    const cleanUrl = url.trim();
    if (!cleanUrl.includes("twitter.com") && !cleanUrl.includes("x.com")) {
      return Alert.alert(t('dl_error'), t('tw_invalid_link'));
    }

    const hasPerm = await requestPermission();
    if (!hasPerm) return;

    const tweetId = extractTweetId(cleanUrl);
    if (!tweetId) {
      return Alert.alert(t('dl_error'), t('tw_invalid_link'));
    }

    setPreviewPath(null);
    setLoading(true);
    setProgress(0);

    try {
      const res = await fetch(`https://api.fxtwitter.com/status/${tweetId}`);
      const json = await res.json();

      const videos = json?.tweet?.media?.videos;
      if (!videos || videos.length === 0) {
        throw new Error('No video found');
      }

      // Pick highest quality
      const best = videos.reduce((a, b) => (b.width > a.width ? b : a));
      const videoUrl = best.url;

      const localUri = await saveVideo(videoUrl);
      setPreviewPath(localUri);

      const newDownload = {
        id: Date.now().toString(),
        title: `X_${Date.now()}`,
        path: localUri,
        platform: "Twitter",
        date: new Date().toLocaleDateString(),
      };
      const existing = await AsyncStorage.getItem("recent_downloads");
      const downloads = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem("recent_downloads", JSON.stringify([newDownload, ...downloads]));

      Alert.alert(t('continue'), t('tw_success'));
      setUrl("");
    } catch (err) {
      Alert.alert(t('dl_error'), t('tw_not_found'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <X size={50} color="#000" />
        <Text style={styles.title}>{t('tw_header')}</Text>
      </View>

      {previewPath && (
        <View style={styles.previewContainer}>
          <View style={[styles.previewHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.previewLabel}>{t('tw_preview')}</Text>
            <TouchableOpacity onPress={() => setPreviewPath(null)}>
              <XCircle size={24} color="#ff0050" />
            </TouchableOpacity>
          </View>
          <View style={styles.videoBox}>
            <WebView
              key={previewPath}
              originWhitelist={["*"]}
              allowFileAccess
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
        placeholder={t('tw_placeholder')}
        placeholderTextColor="#999"
        value={url}
        editable={!loading}
        onChangeText={setUrl}
      />

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#000" />
          <Text style={styles.progressText}>
            {progress > 0 ? `${t('tw_downloading')} ${progress}%` : t('tw_extracting')}
          </Text>
        </View>
      )}

      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleProcess} disabled={loading}>
        <Text style={styles.btnText}>{loading ? t('tw_btn_wait') : t('tw_btn_dl')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 20 },
  header: { alignItems: "center", marginTop: 40, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginTop: 10, color: '#000' },
  previewContainer: { marginBottom: 20 },
  previewHeader: { justifyContent: "space-between", marginBottom: 5 },
  previewLabel: { fontWeight: "bold", color: "#333" },
  videoBox: { height: 230, borderRadius: 15, overflow: "hidden", backgroundColor: "#000" },
  input: { backgroundColor: "#FFF", padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: "#eee", color: "#000" },
  btn: { backgroundColor: "#000", padding: 18, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  loaderContainer: { alignItems: "center", marginBottom: 20 },
  progressText: { marginTop: 8, color: "#666", fontWeight: '600' },
});
