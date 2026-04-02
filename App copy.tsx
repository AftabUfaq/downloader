import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  Alert, ActivityIndicator, PermissionsAndroid, Platform 
} from 'react-native';
import RNFS from 'react-native-fs';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import SplashScreen from 'react-native-splash-screen';

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    // Hide the splash screen after 2 seconds or when component mounts
    setTimeout(() => {
      SplashScreen.hide();
    }, 2000);
  }, []);

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

  const getDirectLink = async (inputUrl: string) => {
    const apiKey = 'fb72eb7159mshf46766f30a1f769p16bce5jsn423ef9285b49';
    const apiHost = 'social-download-all-in-one.p.rapidapi.com';
    const apiUrl = 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': apiHost,
        },
        body: JSON.stringify({ url: inputUrl }),
      });

      const json = await response.json();
      console.log("API RAW RESPONSE:", json);
      
      // Better extraction logic to find the actual MP4 URL
      let directUrl = "";
      if (json.medias && json.medias.length > 0) {
          // Find the video media (prefer HD if available)
          const video = json.medias.find((m: any) => m.type === 'video' && m.quality === 'hd') || 
                        json.medias.find((m: any) => m.type === 'video') || 
                        json.medias[0];
          directUrl = video.url;
      } else {
          directUrl = json.url || json.video || (json.data && json.data.url);
      }

      if (!directUrl) throw new Error("No playable video found.");
      return directUrl;

    } catch (error) {
      throw new Error("Failed to get video source.");
    }
  };

  const handleDownload = async () => {
    if (!url) return Alert.alert("Error", "Please paste a URL first");
    
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return Alert.alert("Permission Denied", "App needs storage access.");

    setLoading(true);
    setProgress(0);

    const fileName = `video_${Date.now()}.mp4`;
    const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

    try {
      // 1. Get the source URL
      const directVideoUrl = await getDirectLink(url);
      
      // 2. Clear old file if it exists
      if (await RNFS.exists(filePath)) {
          await RNFS.unlink(filePath);
      }

      // 3. Download with Headers (CRITICAL)
      const download = RNFS.downloadFile({
        fromUrl: directVideoUrl,
        toFile: filePath,
        headers: {
          // This stops the server from blocking the "bot" download
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
          'Accept': '*/*',
        },
        progress: (res) => {
          const percent = (res.bytesWritten / res.contentLength) * 100;
          setProgress(percent);
        },
      });

      const status = await download.promise;
      if (status.statusCode !== 200) throw new Error("Server blocked download.");

      // Check file health
      const fileStats = await RNFS.stat(filePath);
      console.log("FINAL FILE SIZE:", fileStats.size);

      if (fileStats.size < 1000000) { // If less than 1MB, it's likely a broken file
          throw new Error("The file is too small to be a video. The link may have expired.");
      }

      await new Promise(resolve => setTimeout(() => resolve(undefined), 500));

      const cleanPath = Platform.OS === 'android' ? `file://${filePath}` : filePath;

      // 4. Save to Gallery
      await CameraRoll.saveAsset(cleanPath, { type: 'video', album: 'SocialDownloader' });
      
      await RNFS.unlink(filePath);
      Alert.alert("Success", "Video saved to gallery!");
      setUrl('');

    } catch (error: any) {
      console.error("Operation Error:", error);
      Alert.alert("Download Failed", error.message);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Universal Downloader</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Paste video link here..."
        placeholderTextColor="#666"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
      />

      <TouchableOpacity 
        style={[styles.button, loading && { backgroundColor: '#ccc' }]} 
        onPress={handleDownload}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? `Downloading ${progress.toFixed(0)}%` : 'Download Video'}
        </Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 20}} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#333' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', marginBottom: 20, color: '#000' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});