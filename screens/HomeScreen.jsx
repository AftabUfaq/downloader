import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import {
  Briefcase,
  Camera,
  Ghost,
  Music,
  Pin,
  Share,
  Video,
  X
} from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet, Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';
import RNFS from 'react-native-fs';
import { WebView } from 'react-native-webview';

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

const PLATFORMS = [
  { name: 'TikTok',     icon: Music,     keys: ['tiktok'],                  color: '#00f2ea' },
  { name: 'Instagram',  icon: Camera,    keys: ['instagram', 'instagr.am'], color: '#E1306C' },
  { name: 'Facebook',   icon: Share,     keys: ['facebook', 'fb.watch'],    color: '#1877F2' },
  { name: 'Twitter/X',  icon: X,         keys: ['twitter', 'x.com'],        color: '#000000' },
  { name: 'YouTube',    icon: Video,     keys: ['youtube.com', 'youtu.be'], color: '#FF0000' },
  { name: 'Pinterest',  icon: Pin,       keys: ['pinterest'],               color: '#BD081C' },
  { name: 'LinkedIn',   icon: Briefcase, keys: ['linkedin'],                color: '#0A66C2' },
  { name: 'Snapchat',   icon: Ghost,     keys: ['snapchat'],                color: '#FFFC00' },
];


const INJCTED_JAVACRIPT_FACEBOOK = ``
const INJECTED_JAVACRIPT_TIKTOK = ``
const INJECTED_JAVASCRIPT_INSTAGRAM = ``
const INJECTED_JAVASCRIPT_TWITTER = ``
const INJECTED_JAVASCRIPT_YOU_TUBE = ``
const INJECTED_JAVASCRIPT_PINTEREST = ``
const INJECTED_JAVASCRIPT_LINKDIN = ``
const INJECTED_JAVASCRIPT_SNAP_CHAT = ``


export default function HomeScreen() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scrapingUrl, setScrapingUrl] = useState('');
  const webViewRef = useRef(null);

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
            : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  const handleScrape = async () => {
    if (!url) return Alert.alert("Error", "Please paste a URL first");
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return Alert.alert("Permission Denied", "App needs storage access.");
    setLoading(true);
    setScrapingUrl(url);
  };

  const onWebViewMessage = async (event) => {
    const result = event.nativeEvent.data;

    if (result === "error") {
      setLoading(false);
      setScrapingUrl('');
      Alert.alert("Failed", "Video link could not be found. Try a different link or make sure the video is public.");
      return;
    }

    const cleanUrl = result
      .replace(/\\u002F/g, '/')
      .replace(/\\/g, '');

    console.log("Sanitized Link:", cleanUrl);

    setScrapingUrl('');
    if (cleanUrl.startsWith('https') || cleanUrl.startsWith('http')) {
      startDownload(cleanUrl);
    }
  };

  const startDownload = async (directVideoUrl) => {
    const fileName = `video_${Date.now()}.mp4`;
    const filePath = `${RNFS.ExternalCachesDirectoryPath || RNFS.CachesDirectoryPath}/${fileName}`;

    const isFacebook  = directVideoUrl.includes('fbcdn') || url.includes('facebook.com') || url.includes('fb.watch');
    const isInstagram = directVideoUrl.includes('instagram.com') || url.includes('instagram.com');
    const isTikTok    = directVideoUrl.includes('tiktok.com') || url.includes('tiktok.com');
    const isTwitter   = url.includes('twitter.com') || url.includes('x.com');
    const isYouTube   = url.includes('youtube.com') || url.includes('youtu.be');
    const isPinterest = url.includes('pinterest.com');
    const isLinkedIn  = url.includes('linkedin.com');
    const isSnapchat  = url.includes('snapchat.com');

    try {
      setLoading(true);
      setProgress(0);

      const xhr = new XMLHttpRequest();
      xhr.open('GET', directVideoUrl, true);

      xhr.setRequestHeader('User-Agent', DESKTOP_UA);

      if (isFacebook) {
        xhr.setRequestHeader('Referer', 'https://www.facebook.com/');
      } else if (isTikTok) {
        xhr.setRequestHeader('Referer', 'https://www.tiktok.com/');
      } else if (isInstagram) {
        xhr.setRequestHeader('Referer', 'https://www.instagram.com/');
      } else if (isTwitter) {
        xhr.setRequestHeader('Referer', 'https://twitter.com/');
      } else if (isYouTube) {
        xhr.setRequestHeader('Referer', 'https://www.youtube.com/');
      } else if (isPinterest) {
        xhr.setRequestHeader('Referer', 'https://www.pinterest.com/');
      } else if (isLinkedIn) {
        xhr.setRequestHeader('Referer', 'https://www.linkedin.com/');
      } else if (isSnapchat) {
        xhr.setRequestHeader('Referer', 'https://www.snapchat.com/');
      }

      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64data = reader.result.split(',')[1];
            await RNFS.writeFile(filePath, base64data, 'base64');
            const cleanPath = Platform.OS === 'android' ? `file://${filePath}` : filePath;
            await CameraRoll.saveAsset(cleanPath, { type: 'video', album: 'SnappySave' });
            Alert.alert("Success", "Video saved to gallery!");
            setUrl('');
            setLoading(false);
            setProgress(0);
          };
          reader.readAsDataURL(xhr.response);
        } else {
          Alert.alert("Error", `Server returned status: ${xhr.status}`);
          setLoading(false);
        }
      };

      xhr.onerror = (e) => {
        console.error(e);
        Alert.alert("Download Failed", "Network error occurred.");
        setLoading(false);
      };

      xhr.responseType = 'blob';
      xhr.send();

    } catch (error) {
      console.error("XHR Error:", error);
      setLoading(false);
    }
  };

  // Merged scraping script — handles all 8 platforms
  const INJECTED_JAVASCRIPT = `
    (function() {

      // --- Facebook: HD/SD native video URLs from embedded script JSON ---
      function findFacebookLink() {
        const scripts = document.querySelectorAll('script');
        for (let script of scripts) {
          const content = script.textContent;
          const match = content.match(/"browser_native_hd_url":"(.*?)"/) ||
                        content.match(/"browser_native_sd_url":"(.*?)"/);
          if (match && match[1]) {
            return match[1].replace(/\\\\u002f/g, '/').replace(/\\\\/g, '');
          }
        }
        const ogVideo = document.querySelector('meta[property="og:video:secure_url"]') ||
                        document.querySelector('meta[property="og:video"]');
        if (ogVideo && ogVideo.content && !ogVideo.content.includes('blob')) {
          return ogVideo.content;
        }
        return null;
      }

      // --- Instagram: Open Graph meta tags + visible video elements ---
      function findInstagramLink() {
        const meta = document.querySelector('meta[property="og:video:secure_url"]') ||
                     document.querySelector('meta[property="og:video"]') ||
                     document.querySelector('meta[name="twitter:player:stream"]');
        if (meta && meta.content && meta.content.startsWith('http')) {
          return meta.content;
        }
        const videos = document.querySelectorAll('video');
        for (let v of videos) {
          if (v.src && !v.src.startsWith('blob')) {
            return v.src;
          }
        }
        return null;
      }

      // --- TikTok: downloadAddr / video_url from embedded JSON script tags ---
      function findTikTokLink() {
        const scripts = document.querySelectorAll('script');
        for (let i = 0; i < scripts.length; i++) {
          const content = scripts[i].textContent;
          if (content.includes("downloadAddr") || content.includes("video_url")) {
            const match = content.match(/"downloadAddr":"(.*?)"/) ||
                          content.match(/"video_url":"(.*?)"/);
            if (match && match[1]) {
              return match[1].replace(/\\\\u0026/g, '&');
            }
          }
        }
        return null;
      }

      // --- Generic: covers Twitter/X, YouTube, Pinterest, LinkedIn, Snapchat ---
      function findGenericLink() {
        const meta = document.querySelector('meta[property="og:video:secure_url"]') ||
                     document.querySelector('meta[property="og:video"]') ||
                     document.querySelector('meta[name="twitter:player:stream"]');
        if (meta && meta.content && meta.content.startsWith('http')) {
          return meta.content;
        }
        const videos = document.querySelectorAll('video');
        for (let v of videos) {
          if (v.src && !v.src.startsWith('blob')) {
            return v.src;
          }
        }
        const scripts = document.querySelectorAll('script');
        for (let script of scripts) {
          const content = script.textContent;
          const match = content.match(/"downloadAddr":"(.*?)"/) ||
                        content.match(/"video_url":"(.*?)"/);
          if (match && match[1]) {
            return match[1].replace(/\\\\u0026/g, '&');
          }
        }
        return null;
      }

      let count = 0;
      const check = setInterval(function() {
        let link = null;
        const currentUrl = window.location.href;

        if (currentUrl.includes('facebook.com') || currentUrl.includes('fb.watch')) {
          link = findFacebookLink();
        } else if (currentUrl.includes('instagram.com') || currentUrl.includes('instagr.am')) {
          link = findInstagramLink();
        } else if (currentUrl.includes('tiktok.com')) {
          link = findTikTokLink() || findGenericLink();
        } else {
          link = findGenericLink();
        }

        if (link) {
          window.ReactNativeWebView.postMessage(link);
          clearInterval(check);
        }

        count++;
        if (count > 40) {
          window.ReactNativeWebView.postMessage("error");
          clearInterval(check);
        }
      }, 1500);
    })();
  `;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>SnappySave</Text>

        {/* Platform Grid */}
        <View style={styles.gridContainer}>
          {PLATFORMS.map((app) => {
            const isActive = app.keys.some(k => url.toLowerCase().includes(k));
            const Icon = app.icon;
            return (
              <View
                key={app.name}
                style={[
                  styles.gridItem,
                  isActive && { borderColor: app.color, borderWidth: 2, backgroundColor: `${app.color}10` }
                ]}
              >
                <Icon size={24} color={isActive ? app.color : '#555'} />
                <Text style={[styles.gridText, isActive && { color: app.color, fontWeight: 'bold' }]}>
                  {app.name}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Input & Download */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Paste link here..."
            placeholderTextColor="#999"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {loading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {progress > 0 ? `Downloading: ${progress}%` : 'Connecting...'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.mainButton, loading && { backgroundColor: '#A0A0A0' }]}
            onPress={handleScrape}
            disabled={loading}
          >
            <Text style={styles.mainButtonText}>
              {loading ? 'Please wait...' : 'Download Video'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Hidden WebView — loads the page and extracts the video URL */}
      {scrapingUrl !== '' && (
        <View style={{ height: 0, width: 0, position: 'absolute' }}>
          <WebView
            ref={webViewRef}
            source={{ uri: scrapingUrl }}
            injectedJavaScript={INJECTED_JAVASCRIPT}
            onMessage={onWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            onShouldStartLoadWithRequest={(request) => request.url.startsWith('http')}
            userAgent={DESKTOP_UA}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
  },
  gridText: {
    fontSize: 11,
    marginTop: 5,
    color: '#555',
  },
  inputArea: {
    width: '100%',
    marginTop: 10,
  },
  input: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#000',
  },
  mainButton: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  mainButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6C63FF',
  },
  progressText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
