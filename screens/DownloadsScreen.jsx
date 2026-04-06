import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Modal, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { PlayCircle, Trash2, Clock, Video, XCircle } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function DownloadsScreen() {
  const [list, setList] = useState([]);
  const [playingPath, setPlayingPath] = useState(null); // Track which video is playing
  const isFocused = useIsFocused();

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
    if (!path) return Alert.alert("Error", "Invalid file path");
    // Set the path to open the Modal player
    setPlayingPath(path);
  };

  const handleDelete = async (id) => {
    const updatedList = list.filter(item => item.id !== id);
    setList(updatedList);
    await AsyncStorage.setItem('recent_downloads', JSON.stringify(updatedList));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Clock color="#00f2ea" size={28} />
        <Text style={styles.headerTitle}>Recent Downloads</Text>
      </View>

      {/* --- VIDEO PLAYER MODAL --- */}
      <Modal
        visible={!!playingPath}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPlayingPath(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.playerBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Playing Video</Text>
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
          <View style={styles.card}>
            <View style={styles.info}>
              <Text style={styles.videoTitle} numberOfLines={1}>
                {item.platform ? `[${item.platform}] ` : ''}{item.title || "Video"}
              </Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>
            
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handlePlay(item.path)} style={{ marginRight: 15 }}>
                <PlayCircle color="#00f2ea" size={32} />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Trash2 color="#ff0050" size={24} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Video color="#eee" size={80} />
            <Text style={styles.emptyText}>No downloads yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 50, marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginLeft: 10, color: '#000' },
  card: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
  },
  info: { flex: 1 },
  videoTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  date: { fontSize: 12, color: '#999', marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { textAlign: 'center', marginTop: 10, color: '#999', fontSize: 16 },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerBox: {
    width: width * 0.95,
    height: height * 0.6,
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  webviewWrapper: { flex: 1, backgroundColor: '#000' }
});