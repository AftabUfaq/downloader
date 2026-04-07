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
  { 
    name: 'TikTok', 
    icon: Music, 
    target: 'TikTok', // Matches name="TikTok" in HomeStack
    keys: ['tiktok'], 
    color: '#00f2ea', 
    url: "https://www.tiktok.com/@alinaamir1/video/7619817948315667720?is_from_webapp=1&sender_device=pc" 
  },
  { 
    name: 'Instagram', 
    icon: Camera, 
    target: 'Instagram', // Matches name="Instagram" in HomeStack
    keys: ['instagram', 'instagrm.com'], 
    color: '#E1306C', 
    url: "https://www.instagram.com/reel/DOrD8anCKNH/?utm_source=ig_web_button_share_sheet" 
  },
  { 
    name: 'Facebook', 
    icon: Share, 
    target: 'Facebook', // Matches name="Facebook" in HomeStack
    keys: ['facebook', 'fb.watch'], 
    color: '#1877F2', 
    url: "https://www.facebook.com/share/r/18XFVPLS3c/" 
  },
  { 
    name: 'Twitter/X', 
    icon: X, 
    target: 'Twitter', // Matches name="Twitter" in HomeStack
    keys: ['twitter', 'x.com'], 
    color: '#000000', 
    url: "https://x.com/i/status/2040454818846945754" 
  },
   { 
    name: 'Snapchat', 
    icon: Ghost, 
    target: 'Snapchat', // Matches name="Snapchat" in HomeStack
    keys: ['snapchat'], 
    color: '#FFFC00', 
    url: "https://www.snapchat.com/@snapchat/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYeXFtbHJpdXduAZzmEYZJAZzmEYYwAAAAAQ" 
  },
 
  { 
    name: 'Pinterest', 
    icon: Pin, 
    target: 'Pinterest', // Matches name="Pinterest" in HomeStack
    keys: ['pinterest'], 
    color: '#BD081C', 
    url: "https://pin.it/63K783cCL" 
  },
  { 
    name: 'LinkedIn', 
    icon: Briefcase, 
    target: 'LinkedIn', // Matches name="LinkedIn" in HomeStack
    keys: ['linkedin'], 
    color: '#0A66C2', 
    url: "https://www.linkedin.com/posts/aisa-hai-future-with-zong-5g-ugcPost-7442101663563198464-26cM?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAAFK8i7oBDlehKrUJEBaxoob_uWNQicwmUNc" 
  },
   { 
    name: 'YouTube', 
    icon: Video, 
    target: 'YouTube', // Matches name="YouTube" in HomeStack
    keys: ['youtube.com', 'youtu.be'], 
    color: '#FF0000', 
    url: "https://youtube.com/shorts/2lKj7Nkmxcc?si=ub-9VlbUiazh3Dt5" 
  },
];



export default function HomeScreen({ navigation }) {

  const [url, setUrl] = useState('');
 


  // // Merged scraping script — handles all 8 platforms
  // const INJECTED_JAVASCRIPT = `
  //   (function() {

  //     // --- Facebook: HD/SD native video URLs from embedded script JSON ---
  //     function findFacebookLink() {
  //       const scripts = document.querySelectorAll('script');
  //       for (let script of scripts) {
  //         const content = script.textContent;
  //         const match = content.match(/"browser_native_hd_url":"(.*?)"/) ||
  //                       content.match(/"browser_native_sd_url":"(.*?)"/);
  //         if (match && match[1]) {
  //           return match[1].replace(/\\\\u002f/g, '/').replace(/\\\\/g, '');
  //         }
  //       }
  //       const ogVideo = document.querySelector('meta[property="og:video:secure_url"]') ||
  //                       document.querySelector('meta[property="og:video"]');
  //       if (ogVideo && ogVideo.content && !ogVideo.content.includes('blob')) {
  //         return ogVideo.content;
  //       }
  //       return null;
  //     }

  //     // --- Instagram: Open Graph meta tags + visible video elements ---
  //     function findInstagramLink() {
  //       const meta = document.querySelector('meta[property="og:video:secure_url"]') ||
  //                    document.querySelector('meta[property="og:video"]') ||
  //                    document.querySelector('meta[name="twitter:player:stream"]');
  //       if (meta && meta.content && meta.content.startsWith('http')) {
  //         return meta.content;
  //       }
  //       const videos = document.querySelectorAll('video');
  //       for (let v of videos) {
  //         if (v.src && !v.src.startsWith('blob')) {
  //           return v.src;
  //         }
  //       }
  //       return null;
  //     }

  //     // --- TikTok: downloadAddr / video_url from embedded JSON script tags ---
  //     function findTikTokLink() {
  //       const scripts = document.querySelectorAll('script');
  //       for (let i = 0; i < scripts.length; i++) {
  //         const content = scripts[i].textContent;
  //         if (content.includes("downloadAddr") || content.includes("video_url")) {
  //           const match = content.match(/"downloadAddr":"(.*?)"/) ||
  //                         content.match(/"video_url":"(.*?)"/);
  //           if (match && match[1]) {
  //             return match[1].replace(/\\\\u0026/g, '&');
  //           }
  //         }
  //       }
  //       return null;
  //     }

  //     // --- Generic: covers Twitter/X, YouTube, Pinterest, LinkedIn, Snapchat ---
  //     function findGenericLink() {
  //       const meta = document.querySelector('meta[property="og:video:secure_url"]') ||
  //                    document.querySelector('meta[property="og:video"]') ||
  //                    document.querySelector('meta[name="twitter:player:stream"]');
  //       if (meta && meta.content && meta.content.startsWith('http')) {
  //         return meta.content;
  //       }
  //       const videos = document.querySelectorAll('video');
  //       for (let v of videos) {
  //         if (v.src && !v.src.startsWith('blob')) {
  //           return v.src;
  //         }
  //       }
  //       const scripts = document.querySelectorAll('script');
  //       for (let script of scripts) {
  //         const content = script.textContent;
  //         const match = content.match(/"downloadAddr":"(.*?)"/) ||
  //                       content.match(/"video_url":"(.*?)"/);
  //         if (match && match[1]) {
  //           return match[1].replace(/\\\\u0026/g, '&');
  //         }
  //       }
  //       return null;
  //     }

  //     let count = 0;
  //     const check = setInterval(function() {
  //       let link = null;
  //       const currentUrl = window.location.href;

  //       if (currentUrl.includes('facebook.com') || currentUrl.includes('fb.watch')) {
  //         link = findFacebookLink();
  //       } else if (currentUrl.includes('instagram.com') || currentUrl.includes('instagr.am')) {
  //         link = findInstagramLink();
  //       } else if (currentUrl.includes('tiktok.com')) {
  //         link = findTikTokLink() || findGenericLink();
  //       } else {
  //         link = findGenericLink();
  //       }

  //       if (link) {
  //         window.ReactNativeWebView.postMessage(link);
  //         clearInterval(check);
  //       }

  //       count++;
  //       if (count > 40) {
  //         window.ReactNativeWebView.postMessage("error");
  //         clearInterval(check);
  //       }
  //     }, 1500);
  //   })();
  // `;




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
            <TouchableOpacity
              key={app.name}
              onPress={() => {
                // This now sends the user to the specific screen in HomeStack
                navigation.navigate(app.target, { initialUrl: app.url });
              }}
              style={styles.gridItem}
            >
              <app.icon size={24} color={app.color} />
              <Text style={styles.gridText}>{app.name}</Text>
            </TouchableOpacity>
            );
          })}
        </View>

      
      </ScrollView>

   
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

  },
  gridText: {
    fontSize: 11,
    marginTop: 5,
    color: '#555',
  },
 
  
});
