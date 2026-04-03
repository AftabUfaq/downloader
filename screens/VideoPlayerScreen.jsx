import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import Video from 'react-native-video';

const VideoPlayerScreen = ({ route, navigation }) => {
  const { videoUrl } = route.params;

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: videoUrl }} 
        style={styles.fullScreenVideo}
        controls={true}           // Shows play/pause/seek bar
        resizeMode="contain"
        onBack={() => navigation.goBack()}
      />
      
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: '#fff' }}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  fullScreenVideo: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 5
  }
});

export default VideoPlayerScreen;