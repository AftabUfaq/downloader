import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SAF from 'react-native-saf-x';
import { Download, Video as VideoIcon, RefreshCw } from 'lucide-react-native';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";

const STORAGE_KEY = '@whatsapp_uri';

const WhatsappScreen = () => {
  const [statuses, setStatuses] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkExistingPermission();
  }, []);

  const checkExistingPermission = async () => {
    try {
      const savedUri = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedUri) {
        const isGranted = await SAF.hasPermission(savedUri);
        if (isGranted) {
          setHasAccess(true);
          loadFiles(savedUri);
        }
      }
    } catch (e) {
      console.log("Check permission error", e);
    }
  };

  const grantAccess = async () => {
    Alert.alert(
      "Important Step",
      "On the next screen:\n1. Navigate to: Android > media > com.whatsapp > WhatsApp > Media > .Statuses\n2. Click 'USE THIS FOLDER'.\n\n(If you don't see .Statuses, click the 3-dots in top right and 'Show hidden files')",
      [
        {
          text: "OK, I'm Ready",
          onPress: async () => {
            try {
              const result = await SAF.openDocumentTree(true);
              if (result) {
                const uri = typeof result === 'string' ? result : result.uri;
                await AsyncStorage.setItem(STORAGE_KEY, uri);
                setHasAccess(true);
                loadFiles(uri);
              }
            } catch (e) {
              console.log("Picker cancelled", e);
            }
          }
        }
      ]
    );
  };

  const loadFiles = async (selectedUri) => {
    setLoading(true);
    try {
      const uri = selectedUri || await AsyncStorage.getItem(STORAGE_KEY);
      if (!uri) return;

      let allItems = await SAF.listFiles(uri);
      
      // DEEP SEARCH: If user picked root instead of .Statuses, we try to find it
      const mediaDir = allItems.find(i => i.name === 'Media');
      if (mediaDir) {
        const mediaContent = await SAF.listFiles(mediaDir.uri);
        const statusDir = mediaContent.find(i => i.name === '.Statuses');
        if (statusDir) {
          allItems = await SAF.listFiles(statusDir.uri);
        }
      }

      const mediaFiles = allItems.filter(f => 
        f.name.toLowerCase().endsWith('.jpg') || 
        f.name.toLowerCase().endsWith('.mp4') ||
        f.name.toLowerCase().endsWith('.jpeg')
      );

      setStatuses(mediaFiles);
    } catch (err) {
      console.error("Load Error", err);
    } finally {
      setLoading(false);
    }
  };

  const saveToGallery = async (file) => {
    try {
      // 1. Create a safe filename and destination in public Downloads
      const extension = file.name.split('.').pop();
      const destName = `Status_${Date.now()}.${extension}`;
      const destinationPath = `${SAF.Directories.Downloads}/${destName}`;

      // 2. Copy the file from WhatsApp's private URI to Public Storage
      await SAF.copyFile(file.uri, destinationPath);
      
      // 3. Register with Android Gallery
      await CameraRoll.saveAsset(destinationPath, { type: 'auto', album: 'SnappySave' });
      
      Alert.alert("Success", "Status saved to Gallery!");
    } catch (err) {
      console.error("Save Error", err);
      Alert.alert("Error", "Failed to save status. Ensure you have viewed it in WhatsApp first.");
    }
  };

  const renderItem = ({ item }) => {
    const isVideo = item.name.toLowerCase().endsWith('.mp4');
    return (
      <View style={styles.item}>
        {isVideo ? (
          <View style={[styles.img, styles.videoPlaceholder]}>
            <VideoIcon size={40} color="#6C63FF" />
            <Text style={styles.videoLabel}>VIDEO</Text>
          </View>
        ) : (
          <Image 
            source={{ uri: item.uri }} 
            style={styles.img} 
            resizeMode="cover" 
          />
        )}
        <TouchableOpacity style={styles.dlBtn} onPress={() => saveToGallery(item)}>
          <Download size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Status Saver</Text>
        {hasAccess && (
          <TouchableOpacity onPress={() => loadFiles()}>
            <RefreshCw size={24} color="#6C63FF" />
          </TouchableOpacity>
        )}
      </View>

      {!hasAccess ? (
        <View style={styles.centered}>
          <Text style={styles.title}>Access Required</Text>
          <Text style={styles.desc}>To show statuses, we need permission to read the WhatsApp media folder.</Text>
          <TouchableOpacity style={styles.btn} onPress={grantAccess}>
            <Text style={styles.btnText}>Setup Access</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      ) : (
        <FlatList
          data={statuses}
          numColumns={2}
          keyExtractor={(item) => item.uri}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 5 }}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.desc}>No statuses found. Open WhatsApp and watch some statuses first!</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: '#fff' 
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1A1A1A' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  desc: { textAlign: 'center', color: '#666', marginBottom: 25, lineHeight: 20 },
  btn: { backgroundColor: '#25D366', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  item: { flex: 1, margin: 8, height: 240, borderRadius: 15, overflow: 'hidden', backgroundColor: '#eee', elevation: 3 },
  img: { width: '100%', height: '100%' },
  videoPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8E7FF' },
  videoLabel: { marginTop: 8, fontSize: 12, fontWeight: 'bold', color: '#6C63FF' },
  dlBtn: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#25D366', padding: 12, borderRadius: 25 },
});

export default WhatsappScreen;