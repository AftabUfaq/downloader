import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Modal, Dimensions, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { PlayCircle, Trash2, Clock, Video, XCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../utils/adsConfig';
import { useTheme } from '../context/ThemeContext'; // 1. Import your theme hook

const { width, height } = Dimensions.get('window');

export default function DownloadsScreen() {
  const { t, i18n } = useTranslation();
  const [list, setList] = useState([]);
  const [playingPath, setPlayingPath] = useState(null);
  const isFocused = useIsFocused();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  // 2. Access the theme
  const { colors, isDarkMode } = useTheme();

  // 3. Create dynamic styles
  const styles = useMemo(() => getStyles(colors, isDarkMode), [colors, isDarkMode]);

  const loadDownloads = async () => {
    try {
      const data = await AsyncStorage.getItem('recent_downloads');
      if (data) setList(JSON.parse(data));
    } catch (err) {
      console.error("Error loading downloads:", err);
    }
  };

  useEffect(() => {
    if (isFocused) loadDownloads();
  }, [isFocused]);

  const handlePlay = (path) => {
    if (!path) return Alert.alert(t('dl_error'), t('dl_invalid_path'));
    setPlayingPath(path);
  };

  const handleDelete = async (id) => {
    const updatedList = list.filter(item => item.id !== id);
    setList(updatedList);
    await AsyncStorage.setItem('recent_downloads', JSON.stringify(updatedList));
  };

  return (
    <View style={styles.container}>
      {/* 4. Sync StatusBar with theme */}
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Clock color={colors.accent} size={28} />
        <Text style={[styles.headerTitle, { marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }]}>
          {t('dl_header')}
        </Text>
      </View>

      <Modal
        visible={!!playingPath}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPlayingPath(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.playerBox}>
            <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.modalTitle}>{t('dl_playing')}</Text>
              <TouchableOpacity onPress={() => setPlayingPath(null)}>
                <XCircle color="#ff0050" size={30} />
              </TouchableOpacity>
            </View>

            <View style={styles.webviewWrapper}>
              <WebView
                originWhitelist={['*']}
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
                allowsFullscreenVideo={true}
                javaScriptEnabled={true}
                source={{
                  html: `
                  <body style="margin:0;padding:0;background:black;display:flex;justify-content:center;align-items:center;">
                    <video src="${playingPath}" controls autoplay style="width:100%; height:100%; object-fit: contain;"></video>
                  </body>
                `}}
                style={{ flex: 1, backgroundColor: 'black' }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.info, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.videoTitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                {item.platform ? `[${item.platform}] ` : ''}{item.title || t('dl_video')}
              </Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>
            
            <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity onPress={() => handlePlay(item.path)} style={{ marginHorizontal: 15 }}>
                <PlayCircle color={colors.accent} size={32} />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Trash2 color="#ff0050" size={24} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Video color={colors.border} size={80} />
            <Text style={styles.emptyText}>{t('dl_empty')}</Text>
          </View>
        }
      />
      
      <View style={styles.adWrapper}>
        <BannerAd
            unitId={AD_UNIT_IDS.BANNER}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        />
      </View>
    </View>
  );
}

// 5. Dynamic Stylesheet function
const getStyles = (colors, isDarkMode) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background, // Dynamic
    padding: 20 
  },
  header: { 
    alignItems: 'center', 
    marginTop: 50, 
    marginBottom: 20 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: colors.text // Dynamic
  },
  card: {
    backgroundColor: colors.card, // Dynamic
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 4,
  },
  info: { flex: 1 },
  videoTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: colors.text // Dynamic
  },
  date: { 
    fontSize: 12, 
    color: colors.subText, // Dynamic 
    marginTop: 4 
  },
  actions: { alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { 
    textAlign: 'center', 
    marginTop: 10, 
    color: colors.subText, // Dynamic
    fontSize: 16 
  },
  modalContainer: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  playerBox: { 
    width: width * 0.95, 
    height: height * 0.6, 
    backgroundColor: colors.card, // Dynamic
    borderRadius: 20, 
    overflow: 'hidden', 
    paddingBottom: 10 
  },
  modalHeader: { 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: colors.text // Dynamic
  },
  webviewWrapper: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  adWrapper: {
    alignItems: 'center',
    backgroundColor: colors.background
  }
});