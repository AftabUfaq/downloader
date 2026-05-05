import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";

import { WebView } from "react-native-webview";
import { Camera, XCircle } from "lucide-react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFS from "react-native-fs";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { PermissionsAndroid } from "react-native";

// Use a Mobile User Agent to get a simpler HTML structure
const MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

export default function InstagramScreen({ route }) {
  const [url, setUrl] = useState("");
  const [scrapingUrl, setScrapingUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null);
  useEffect(() => {
  if (route.params?.initialUrl) {
    console.log("Received initial URL:", route.params.initialUrl);
    setUrl(route.params.initialUrl);
  }
}, [route.params?.initialUrl]);

  // ================= PERMISSION =================
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

  // ================= DOWNLOAD (FIXED) =================
  const downloadVideo = async (videoUrl) => {
    const fileName = `Instagram_${Date.now()}.mp4`;
    const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

    return new Promise((resolve, reject) => {
      const options = {
        fromUrl: videoUrl,
        toFile: filePath,
        background: true,
        begin: (res) => console.log("Download started"),
        progress: (res) => {
          const percent = Math.round((res.bytesWritten / res.contentLength) * 100);
          setProgress(percent);
        },
      };

      RNFS.downloadFile(options).promise
        .then(async () => {
          // Save to Gallery
          const cleanPath = Platform.OS === "android" ? `file://${filePath}` : filePath;
          await CameraRoll.saveAsset(cleanPath, { type: "video", album: "SnappySave" });
          resolve(cleanPath);
        })
        .catch(reject);
    });
  };

  // ================= SCRAPER (UPDATED) =================
  const INJECTED_JS = `
    (function() {
      let attempts = 0;
      const maxAttempts = 30;

      const send = (type, payload = {}) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...payload }));
      };

      const scan = () => {
        attempts++;
        // Strategy 1: Standard Video Tag
        let video = document.querySelector('video');
        if (video && video.src && !video.src.startsWith('blob')) {
          send("SUCCESS", { url: video.src });
          return true;
        }

        // Strategy 2: Check for poster/meta if video is hidden
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
    if (!url.includes("instagram.com")) return Alert.alert("Invalid link");
    const hasPerm = await requestPermission();
    if (!hasPerm) return Alert.alert("Permission denied");

    setPreviewPath(null);
    setLoading(true);
    setProgress(0);

    const match = url.match(/instagram\.com\/(reel|p)\/([^/?]+)/);
    if (!match) {
      setLoading(false);
      return Alert.alert("Invalid format");
    }

    // Embed URL is still the best for scraping without login
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
      return Alert.alert("Video not found", "Instagram blocked the extraction. Try again in a moment.");
    }

    if (data.type === "SUCCESS" && data.url) {
      setScrapingUrl(""); // Close scraper immediately
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

        const existing = await AsyncStorage.getItem("recent_downloads");
        const downloads = existing ? JSON.parse(existing) : [];
        await AsyncStorage.setItem("recent_downloads", JSON.stringify([newDownload, ...downloads]));

        Alert.alert("Success", "Video saved to gallery!");
        setUrl("");
      } catch (e) {
        Alert.alert("Download Error", "Could not save video.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Camera size={50} color="#E1306C" />
        <Text style={styles.title}>Instagram Downloader</Text>
      </View>

   {previewPath && (
  <View style={styles.previewContainer}>
    <View style={styles.previewHeader}>
      <Text style={styles.previewLabel}>Preview Ready</Text>
      <TouchableOpacity onPress={() => setPreviewPath(null)}>
        <XCircle size={24} color="#ff0050" />
      </TouchableOpacity>
    </View>
    <View style={styles.videoBox}>
      <WebView
        key={previewPath}
        originWhitelist={["*"]}
        // CRITICAL: These two props allow local file playback
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        source={{
          html: `
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { margin: 0; background: black; display: flex; justify-content: center; align-items: center; height: 100vh; }
                  video { width: 100%; max-height: 100%; border-radius: 15px; }
                </style>
              </head>
              <body>
                <video id="v" src="${previewPath}" controls autoplay playsinline></video>
                <script>
                  // Auto-play hack for some WebView versions
                  document.getElementById('v').play();
                </script>
              </body>
            </html>
          `,
        }}
      />
    </View>
  </View>
)}

      <TextInput
        style={styles.input}
        placeholder="Paste Instagram Reel link..."
        value={url}
        editable={!loading}
        onChangeText={setUrl}
      />

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#E1306C" />
          <Text style={styles.progressText}>
            {progress > 0 ? `Downloading ${progress}%` : "Extracting video..."}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.btn} disabled={loading} onPress={handleProcess}>
        <Text style={styles.btnText}>{loading ? "Please Wait..." : "Download Video"}</Text>
      </TouchableOpacity>

      {/* Hidden Scraper WebView */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 20 },
  header: { alignItems: "center", marginTop: 40, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginTop: 10 },
  previewContainer: { marginBottom: 20 },
  previewHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  previewLabel: { fontWeight: "bold", color: "#333" },
  videoBox: { height: 230, borderRadius: 15, overflow: "hidden", backgroundColor: "#000" },
  input: { backgroundColor: "#FFF", padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: "#eee", color: "#000" },
  btn: { backgroundColor: "#E1306C", padding: 18, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  loaderContainer: { alignItems: "center", marginBottom: 20 },
  progressText: { marginTop: 8, color: "#666" },
});