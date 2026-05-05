import React, { useEffect, useState } from "react";
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
import { X, XCircle } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFS from "react-native-fs";
import { PermissionsAndroid } from "react-native";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";

// Using a clean Desktop UA - vxtwitter handles this better for meta extraction
const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export default function TwitterScreen({ route }) {
  const [url, setUrl] = useState("");
  const [scrapingUrl, setScrapingUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState(null);

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
      const filePath = `${RNFS.ExternalDirectoryPath}/${fileName}`;

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
              const cleanPath = Platform.OS === "android" ? `file://${filePath}` : filePath;
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

  // ---------------- ENHANCED SCRAPER ----------------
  const INJECTED_JS = `(function(){
    function extract(){
      // 1. Try Meta Tags specifically for vxtwitter/fxtwitter
      const selectors = [
        'meta[property="twitter:player:stream"]',
        'meta[property="og:video:url"]',
        'meta[property="og:video:secure_url"]',
        'meta[name="twitter:video:url"]'
      ];
      
      for(let selector of selectors) {
        const meta = document.querySelector(selector);
        if(meta && meta.content && meta.content.includes('.mp4')) return meta.content;
      }

      // 2. Try JSON Deep Scrape (Search whole page source)
      const scripts = document.querySelectorAll('script');
      for (let s of scripts) {
        const content = s.textContent;
        if (content.includes(".mp4")) {
           const match = content.match(/"(https:[^"]+\\.mp4[^"]*)"/);
           if (match && match[1]) return match[1].replace(/\\\\u002f/g, '/').replace(/\\\\/g, '');
        }
      }

      // 3. Last resort: Video tag
      const video = document.querySelector("video");
      if(video && video.src && !video.src.startsWith('blob')) return video.src;

      return null;
    }

    let tries=0;
    const timer=setInterval(()=>{
      const result=extract();
      if(result){
        window.ReactNativeWebView.postMessage(result);
        clearInterval(timer);
      }
      tries++;
      if(tries > 20){ // Give it 16 seconds
        window.ReactNativeWebView.postMessage("not_found");
        clearInterval(timer);
      }
    },800);
  })();`;

 const handleProcess = async () => {
    // 1. Clean and validate the input
    let cleanUrl = url.trim();
    if (!cleanUrl.includes("twitter.com") && !cleanUrl.includes("x.com")) {
      return Alert.alert("Invalid Link", "Please paste a valid Twitter or X link.");
    }

    const hasPerm = await requestPermission();
    if (!hasPerm) return;

    setPreviewPath(null);
    setLoading(true);
    setProgress(0);

    // 2. Robust URL Transformation
    // We use a URL object to target only the hostname, avoiding double-prefixing
    try {
      let urlObj = new URL(cleanUrl);
      
      // Change hostname to vxtwitter.com only if it's twitter/x
      if (urlObj.hostname === 'x.com' || urlObj.hostname === 'twitter.com' || urlObj.hostname === 'www.x.com' || urlObj.hostname === 'www.twitter.com') {
        urlObj.hostname = 'vxtwitter.com';
      }

      // Fix the path if it uses the old /i/status/ format
      let finalUrl = urlObj.toString().replace("/i/status/", "/status/");

      console.log("[DEBUG] Final Scraping URL:", finalUrl);
      setScrapingUrl(finalUrl);
    } catch (e) {
      // Fallback for older Android engines that might struggle with new URL()
      let fallbackUrl = cleanUrl
        .replace(/(www\.)?x\.com/, "vxtwitter.com")
        .replace(/(www\.)?twitter\.com/, "vxtwitter.com")
        .replace("/i/status/", "/status/");
      
      // Safety check to prevent vxvxtwitter
      if (fallbackUrl.includes("vxvxtwitter")) {
        fallbackUrl = fallbackUrl.replace("vxvxtwitter", "vxtwitter");
      }

      console.log("[DEBUG] Fallback Scraping URL:", fallbackUrl);
      setScrapingUrl(fallbackUrl);
    }
  };

  const onMessage = async (event) => {
    const videoUrl = event.nativeEvent.data;
    setScrapingUrl(""); 

    if (videoUrl === "not_found") {
      setLoading(false);
      return Alert.alert("Video Not Found", "X/Twitter is blocking the request. Ensure the tweet has a video.");
    }

    try {
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

      Alert.alert("Success", "Video saved successfully");
      setUrl("");
    } catch (err) {
      Alert.alert("Download Error", "Could not fetch the video file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <X size={50} color="#000" />
        <Text style={styles.title}>X Downloader</Text>
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
              allowFileAccess
              source={{
                html: `
                  <body style="margin:0;background:black;display:flex;justify-content:center;align-items:center;">
                    <video src="${previewPath}" controls autoplay style="width:100%;height:100%;object-fit:contain;"></video>
                  </body>
                `,
              }}
            />
          </View>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Paste X link here..."
        placeholderTextColor="#999"
        value={url}
        editable={!loading}
        onChangeText={setUrl}
      />

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#000" />
          <Text style={styles.progressText}>
            {progress > 0 ? `Downloading ${progress}%` : "Extracting Video Link..."}
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.btn, loading && { opacity: 0.6 }]} 
        onPress={handleProcess}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Please Wait...' : 'Download Video'}</Text>
      </TouchableOpacity>

      <View style={{ height: 0, width: 0, position: 'absolute' }}>
        {scrapingUrl !== "" && (
          <WebView
            source={{ uri: scrapingUrl }}
            injectedJavaScript={INJECTED_JS}
            userAgent={DESKTOP_UA} // Using Desktop UA for better meta extraction
            onMessage={onMessage}
            domStorageEnabled
            javaScriptEnabled
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 20 },
  header: { alignItems: "center", marginTop: 40, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginTop: 10 },
  previewContainer: { marginBottom: 20 },
  previewHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  previewLabel: { fontWeight: "bold", color: "#333" },
  videoBox: { height: 230, borderRadius: 15, overflow: "hidden", backgroundColor: "#000" },
  input: { backgroundColor: "#FFF", padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: "#eee", color: "#000" },
  btn: { backgroundColor: "#000", padding: 18, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  loaderContainer: { alignItems: "center", marginBottom: 20 },
  progressText: { marginTop: 8, color: "#666" },
});











