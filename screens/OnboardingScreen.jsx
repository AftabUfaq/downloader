import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { Download, Link as LinkIcon, Camera, Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const slides = [
  { 
    key: 'one', 
    title: 'Copy Link', 
    text: 'Find the video you want and copy the link from your favorite social app.', 
    icon: LinkIcon, 
    backgroundColor: '#6C63FF' 
  },
  { 
    key: 'two', 
    title: 'Paste & Fetch', 
    text: 'Open Snappy Save, paste the link, and we will fetch the media for you.', 
    icon: Download, 
    backgroundColor: '#3F3D56' 
  },
  { 
    key: 'three', 
    title: 'Save to Gallery', 
    text: 'Download in high quality and save it directly to your device library.', 
    icon: Camera, 
    backgroundColor: '#FF6584' 
  },
];

export default function OnboardingScreen({ onDone, navigation }) {
  
  // This function handles the logic when the "Done" button is pressed
  const handleDone = () => {
    // 1. Trigger the state change in App.tsx
    if (onDone) {
      onDone();
    }
    
    // 2. Navigate to the Main App (Tab Navigator)
    // We use .replace() so the user can't swipe back to onboarding
    navigation.replace('MainApp');
  };

  const renderItem = ({ item }) => (
    <SafeAreaView style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
      <View style={styles.iconContainer}>
        <item.icon size={120} color="#fff" strokeWidth={1.5} />
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideText}>{item.text}</Text>
    </SafeAreaView>
  );

  // Custom button renderers for a better look
  const renderDoneButton = () => (
    <View style={styles.doneButton}>
      <Check color="#000" size={24} strokeWidth={3} />
    </View>
  );

  const renderNextButton = () => (
    <View style={styles.nextButton}>
      <Text style={styles.nextText}>Next</Text>
    </View>
  );

  return (
    <AppIntroSlider 
      renderItem={renderItem} 
      data={slides} 
      onDone={handleDone}
      renderDoneButton={renderDoneButton}
      renderNextButton={renderNextButton}
      dotStyle={styles.dot}
      activeDotStyle={styles.activeDot}
    />
  );
}

const styles = StyleSheet.create({
  slide: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 40 
  },
  iconContainer: {
    marginBottom: 40,
    // Add a slight shadow to the icon for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  slideTitle: { 
    fontSize: 28, 
    color: '#fff', 
    fontWeight: 'bold', 
    marginTop: 20,
    textAlign: 'center'
  },
  slideText: { 
    fontSize: 18, 
    color: 'rgba(255, 255, 255, 0.8)', 
    textAlign: 'center', 
    marginTop: 15,
    lineHeight: 26
  },
  dot: {
    backgroundColor: 'rgba(255, 255, 255, .3)',
    width: 10,
  },
  activeDot: {
    backgroundColor: '#FFE600', // Matches your Snappy Save theme
    width: 30,
  },
  doneButton: {
    width: 50,
    height: 50,
    backgroundColor: '#FFE600',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  }
});