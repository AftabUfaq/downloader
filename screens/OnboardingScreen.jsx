import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { Download, Link as LinkIcon, Camera } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const slides = [
  { key: 'one', title: 'Copy Link', text: 'Grab the link.', icon: LinkIcon, backgroundColor: '#6C63FF' },
  { key: 'two', title: 'Paste', text: 'Fetch the video.', icon: Download, backgroundColor: '#3F3D56' },
  { key: 'three', title: 'Save', text: 'To your gallery.', icon: Camera, backgroundColor: '#FF6584' },
];

export default function OnboardingScreen({ onDone }) {
  const renderItem = ({ item }) => (
    <SafeAreaView style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
      <item.icon size={100} color="#fff" />
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideText}>{item.text}</Text>
    </SafeAreaView>
  );

  return <AppIntroSlider renderItem={renderItem} data={slides} onDone={onDone} />;
}

const styles = StyleSheet.create({
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  slideTitle: { fontSize: 24, color: '#fff', fontWeight: 'bold', marginTop: 20 },
  slideText: { fontSize: 16, color: '#fff', textAlign: 'center', marginTop: 10 }
});