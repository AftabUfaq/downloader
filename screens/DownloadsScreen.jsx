import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native'; // <--- Add this
import { PlayCircle, Trash2, Clock, Video } from 'lucide-react-native';

export default function DownloadsScreen() {
  const [list, setList] = useState([]);
  const isFocused = useIsFocused(); // <--- Hook to detect screen focus

  const loadDownloads = async () => {
    try {
      const data = await AsyncStorage.getItem('recent_downloads');
      if (data) {
        setList(JSON.parse(data));
      } else {
        setList([]);
      }
    } catch (err) {
      console.error("Error loading downloads:", err);
    }
  };

  // Run loadDownloads every time the screen becomes visible
  useEffect(() => {
    if (isFocused) {
      loadDownloads();
    }
  }, [isFocused]);

  const handlePlay = (path) => {
    if (!path) return Alert.alert("Error", "Invalid file path");
    
    Linking.openURL(path).catch((err) => {
      console.log("Link Error:", err);
      Alert.alert("Error", "Could not play video. The file might have been moved or deleted.");
    });
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

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.info}>
              <Text style={styles.videoTitle} numberOfLines={1}>
                {item.title || "TikTok Video"}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  info: { flex: 1 },
  videoTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  date: { fontSize: 12, color: '#999', marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { textAlign: 'center', marginTop: 10, color: '#999', fontSize: 16 }
});