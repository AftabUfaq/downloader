import { Platform, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        Platform.Version >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
          : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) { return false; }
  }
  return true;
};

export const startDownload = async (directVideoUrl, platformName, onProgress) => {
  // 1. Thorough URL Sanitization
  const cleanUrl = directVideoUrl
    .replace(/\\u002F/g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/\\/g, '');

  const fileName = `${platformName}_${Date.now()}.mp4`;
  const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

  // 2. Comprehensive Headers for all your platforms
  const headers = {
    'User-Agent': DESKTOP_UA,
    'Accept': '*/*',
    'Connection': 'keep-alive',
    'Range': 'bytes=0-', 
  };

  // Platform-specific Referer logic
  if (platformName === 'TikTok') headers['Referer'] = 'https://www.tiktok.com/';
  if (platformName === 'YouTube') headers['Referer'] = 'https://www.youtube.com/';
  if (platformName === 'Twitter') headers['Referer'] = 'https://x.com/';
  if (platformName === 'Instagram') headers['Referer'] = 'https://www.instagram.com/';
  if (platformName === 'Pinterest') headers['Referer'] = 'https://www.pinterest.com/';
  if (platformName === 'Facebook') headers['Referer'] = 'https://www.facebook.com/';

  try {
    const downloadOptions = {
      fromUrl: cleanUrl,
      toFile: filePath,
      headers: headers,
      background: true,
      progressDivider: 1,
      progress: (res) => {
        if (res.contentLength > 0) {
          const percent = Math.round((res.bytesWritten / res.contentLength) * 100);
          if (onProgress) onProgress(percent);
        } else {
          // Fallback if contentLength is missing: show based on bytes written
          // (TikTok sometimes hides content-length)
          onProgress(Math.min(99, Math.round(res.bytesWritten / 10000))); 
        }
      },
    };

    const result = await RNFS.downloadFile(downloadOptions).promise;

    if (result.statusCode === 200 || result.statusCode === 206) {
      // 3. Save to Gallery with safe Path
      const galleryPath = Platform.OS === 'android' ? `file://${filePath}` : filePath;

      await CameraRoll.saveAsset(galleryPath, { type: 'video', album: 'SnappySave' });

      // 4. Cleanup
      if (await RNFS.exists(filePath)) {
        await RNFS.unlink(filePath);
      }
      return true;
    } else {
      throw new Error(`Server Blocked Request: ${result.statusCode}`);
    }
  } catch (error) {
    console.error("Download Error Detail:", error);
    throw error;
  }
};