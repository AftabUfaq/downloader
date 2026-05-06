import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

// Screen Imports
import HomeScreen from '../screens/HomeScreen';
import InstagramScreen from '../screens/InstagramScreen';
import FacebookScreen from '../screens/FacebookScreen';
import TikTokScreen from '../screens/TikTokScreen';
import YouTubeScreen from '../screens/YouTubeScreen';
import TwitterScreen from '../screens/TwitterScreen';
import SnapchatScreen from '../screens/SnapchatScreen';
import PinterestScreen from '../screens/PinterestScreen';
import LinkedInScreen from '../screens/LinkedInScreen';

const Stack = createStackNavigator();

export default function HomeStack() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  // Helper to create platform-specific options
  const platformHeader = (titleKey, brandColor) => ({
    title: t(titleKey),
    headerStyle: {
      backgroundColor: brandColor,
      elevation: 0,
      shadowOpacity: 0,
    },
    headerTintColor: '#FFFFFF', // Force white text/icons for brand headers
    headerTitleStyle: {
      fontWeight: '900',
      fontSize: 20,
      color: '#FFFFFF',
    },
  });

  return (
    <Stack.Navigator 
      screenOptions={({ navigation }) => ({ 
        headerStyle: { 
          backgroundColor: colors.background,
          elevation: 0,               
          shadowOpacity: 0,           
          borderBottomWidth: 1,       
          borderBottomColor: colors.border,
        },
        headerTitleAlign: 'center', 
        headerTitleStyle: {
          fontWeight: '900',
          color: colors.accent,
          fontSize: 20,
        },
        headerLeft: () => (
          navigation.canGoBack() && (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ paddingHorizontal: 15 }}
            >
              <View style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}>
                {/* 
                   We use 'headerTintColor' from the screen options 
                   to dynamically color this icon 
                */}
                <ArrowLeft size={24} color={navigation.getState().index > 0 ? '#FFFFFF' : colors.text} />
              </View>
            </TouchableOpacity>
          )
        ),
        headerBackTitleVisible: false, 
        cardStyle: { backgroundColor: colors.background }
      })}
    >
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ title: 'SnappySave' }} 
      />

      <Stack.Screen 
        name="Instagram" 
        component={InstagramScreen} 
        options={platformHeader('ig_header', '#E1306C')} // Instagram Pink/Red
      />

      <Stack.Screen 
        name="Facebook" 
        component={FacebookScreen} 
        options={platformHeader('fb_header', '#1877F2')} // Facebook Blue
      />

      <Stack.Screen 
        name="TikTok" 
        component={TikTokScreen} 
        options={platformHeader('tt_header', '#000000')} // TikTok Black
      />

      <Stack.Screen 
        name="YouTube" 
        component={YouTubeScreen} 
        options={platformHeader('yt_header', '#FF0000')} // YouTube Red (as seen in Figma)
      />

      <Stack.Screen 
        name="Twitter" 
        component={TwitterScreen} 
        options={platformHeader('tw_header', '#1DA1F2')} // Twitter/X Blue
      />

      <Stack.Screen 
        name="Snapchat" 
        component={SnapchatScreen} 
        options={platformHeader('sc_header', '#ecec08')} // Snapchat Yellow (Note: May need black text)
      />

      <Stack.Screen 
        name="Pinterest" 
        component={PinterestScreen} 
        options={platformHeader('pin_header', '#BD081C')} // Pinterest Red
      />

      <Stack.Screen 
        name="LinkedIn" 
        component={LinkedInScreen} 
        options={platformHeader('li_header', '#0A66C2')} // LinkedIn Blue
      />
    </Stack.Navigator>
  );
}