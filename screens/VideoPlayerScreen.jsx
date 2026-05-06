import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, StatusBar } from 'react-native';
import Video from 'react-native-video';
import { useTheme } from '../context/ThemeContext'; // 1. Import Theme hook

const VideoPlayerScreen = ({ route, navigation }) => {
  const { videoUrl } = route.params;

  // 2. Extract theme data
  const { colors, isDarkMode } = useTheme();
  // Using useMemo to keep styles optimized during re-renders
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {/* 3. Force dark StatusBar for video playback regardless of theme */}
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <Video
        source={{ uri: videoUrl }} 
        style={styles.fullScreenVideo}
        controls={true}           // Shows play/pause/seek bar
        resizeMode="contain"
        onBack={() => navigation.goBack()}
        onError={(e) => console.log("Video Error: ", e)}
      />
      
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

// 4. Dynamic Stylesheet
const getStyles = (colors) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' // Kept black for cinematic feel
  },
  fullScreenVideo: {
    position: 'absolute',
    top: 0, 
    left: 0, 
    bottom: 0, 
    right: 0,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  backButtonText: { 
    color: '#fff',
    fontWeight: 'bold' 
  }
});

export default VideoPlayerScreen;