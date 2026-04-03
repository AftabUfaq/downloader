import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Library, Video, Trash2, ChevronRight } from 'lucide-react-native';

const DownloadsScreen = () => {
  const [history, setHistory] = useState([]);

  // Refresh list whenever the user opens this tab
  useFocusEffect(
    useCallback(() => {
      loadDownloads();
    }, [])
  );

  const loadDownloads = async () => {
    try {
      const saved = await AsyncStorage.getItem('downloads');
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load history");
    }
  };

  const deleteItem = async (id) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    await AsyncStorage.setItem('downloads', JSON.stringify(updated));
  };

  const renderItem = ({ item }) => (
    <View style={styles.downloadCard}>
      <View style={styles.iconCircle}>
        <Video size={20} color="#6C63FF" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.videoTitle} numberOfLines={1}>{item.url}</Text>
        <Text style={styles.videoDate}>{item.date}</Text>
      </View>
      <TouchableOpacity onPress={() => deleteItem(item.id)}>
        <Trash2 size={20} color="#FF5252" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Library size={24} color="#1A1A1A" />
      </View>

      {history.length > 0 ? (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Library size={60} color="#DDD" strokeWidth={1} />
          <Text style={styles.title}>No Downloads Yet</Text>
          <Text style={styles.subtitle}>Downloaded videos will be listed here for quick access.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 20,
    backgroundColor: '#FFF'
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1A1A1A' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 15 },
  subtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },
  
  downloadCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0EFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  textContainer: { flex: 1 },
  videoTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  videoDate: { fontSize: 12, color: '#AAA', marginTop: 2 },
});

export default DownloadsScreen;