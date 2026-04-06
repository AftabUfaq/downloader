// src/utils/DownloadManager.js
import { Alert, Platform, PermissionsAndroid } from 'react-native';
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
    } catch (err) {
      return false;
    }
  }
  return true;
};

export const startDownload = async (directVideoUrl, platformName, onProgress) => {
  // 1. EXTRA CLEANING: TikTok links often come with escaped slashes and unicode
  let cleanUrl = directVideoUrl
    .replace(/\\u002F/g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/\\/g, '');

  // If the URL starts with "https:u002F", manually fix it
  if (cleanUrl.includes('u002F')) {
      cleanUrl = cleanUrl.split('u002F').join('/');
  }

  console.log("Attempting final download from:", cleanUrl);

  const fileName = `${platformName}_${Date.now()}.mp4`;
  const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', cleanUrl, true);
    
    // 2. HEADERS: TikTok is extremely picky. 
    // We must mimic the browser exactly.
    xhr.setRequestHeader('User-Agent', DESKTOP_UA);
    
    if (platformName === 'TikTok') {
      xhr.setRequestHeader('Referer', 'https://www.tiktok.com/');
      xhr.setRequestHeader('Accept', '*/*');
    }

    xhr.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

xhr.onload = async () => {
      if (xhr.status === 200 || xhr.status === 206) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = reader.result.split(',')[1];
          await RNFS.writeFile(filePath, base64data, 'base64');
          
          const cleanPath = Platform.OS === 'android' ? `file://${filePath}` : filePath;
          
          // Save to gallery
          await CameraRoll.saveAsset(cleanPath, { type: 'video', album: 'SnappySave' });
          
          // CHANGE THIS: Return the path instead of true
          resolve(cleanPath); 
        };
        reader.readAsDataURL(xhr.response);
      } else {
        reject(`Server error: ${xhr.status}.`);
      }
    };

    xhr.onerror = (e) => {
      console.log("XHR Detailed Error:", e);
      reject("Network error: The connection was refused or the URL is invalid.");
    };
    
    xhr.responseType = 'blob';
    xhr.send();
  });
};