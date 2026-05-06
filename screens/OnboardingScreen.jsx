import React, { useMemo } from 'react';
import { StyleSheet, View, Text, StatusBar } from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { Download, Link as LinkIcon, Camera, Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext'; // 1. Import Theme hook

export default function OnboardingScreen({ onDone, navigation }) {
  const { t } = useTranslation();
  
  // 2. Extract theme data
  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDarkMode), [colors, isDarkMode]);

  // 3. Slides (Keeping specific brand background colors for impact)
  const slides = [
    { 
      key: 'one', 
      title: t('onboarding_1_title'), 
      text: t('onboarding_1_text'), 
      icon: LinkIcon, 
      backgroundColor: isDarkMode ? '#312E81' : '#6C63FF' // Slightly deeper indigo for dark mode
    },
    { 
      key: 'two', 
      title: t('onboarding_2_title'), 
      text: t('onboarding_2_text'), 
      icon: Download, 
      backgroundColor: isDarkMode ? '#1F2937' : '#3F3D56' // Deeper charcoal for dark mode
    },
    { 
      key: 'three', 
      title: t('onboarding_3_title'), 
      text: t('onboarding_3_text'), 
      icon: Camera, 
      backgroundColor: isDarkMode ? '#881337' : '#FF6584' // Deeper rose for dark mode
    },
  ];

  const handleDone = () => {
    if (onDone) onDone();
    navigation.replace('MainApp');
  };

  const renderItem = ({ item }) => (
    <SafeAreaView style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
      {/* 4. Force status bar to light-content because onboarding backgrounds are dark/vibrant */}
      <StatusBar barStyle="light-content" backgroundColor={item.backgroundColor} />
      
      <View style={styles.iconContainer}>
        <item.icon size={120} color="#fff" strokeWidth={1.5} />
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideText}>{item.text}</Text>
    </SafeAreaView>
  );

  const renderDoneButton = () => (
    <View style={styles.doneButton}>
      <Check color="#000" size={24} strokeWidth={3} />
    </View>
  );

  const renderNextButton = () => (
    <View style={styles.nextButton}>
      <Text style={styles.nextText}>{t('next')}</Text> 
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

// 5. Dynamic Stylesheet
const getStyles = (colors, isDarkMode) => StyleSheet.create({
  slide: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 40 
  },
  iconContainer: {
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  slideTitle: { 
    fontSize: 28, 
    color: '#fff', // Keep white for contrast against vibrant backgrounds
    fontWeight: 'bold', 
    marginTop: 20, 
    textAlign: 'center' 
  },
  slideText: { 
    fontSize: 18, 
    color: 'rgba(255, 255, 255, 0.9)', 
    textAlign: 'center', 
    marginTop: 15, 
    lineHeight: 26 
  },
  dot: { 
    backgroundColor: 'rgba(255, 255, 255, .3)', 
    width: 10 
  },
  activeDot: { 
    backgroundColor: '#FFE600', // Branded Yellow
    width: 30 
  },
  doneButton: { 
    width: 50, 
    height: 50, 
    backgroundColor: '#FFE600', // Branded Yellow
    borderRadius: 25, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5
  },
  nextButton: { 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  nextText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600' 
  }
});