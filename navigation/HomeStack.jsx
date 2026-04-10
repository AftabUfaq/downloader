import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

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
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  return (
    <Stack.Navigator 
      screenOptions={({ navigation }) => ({ 
        headerStyle: { 
          backgroundColor: '#F5F5F5',
          elevation: 0,               
          shadowOpacity: 0,           
          borderBottomWidth: 1,       
          borderBottomColor: '#EEE',
        },
        headerTitleAlign: 'center', 
        headerTitleStyle: {
          fontWeight: '900',
          color: '#FF1212',           
          fontSize: 20,
        },
        // FIX FOR THE ASSET ERROR: Custom Back Button using Lucide
        headerLeft: () => (
          navigation.canGoBack() && (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ paddingHorizontal: 15 }}
            >
              <View style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}>
                <ArrowLeft size={24} color="#FF1212" />
              </View>
            </TouchableOpacity>
          )
        ),
        headerBackTitleVisible: false, 
      })}
    >
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ title: 'SnappySave' }} // App name usually stays same
      />
      <Stack.Screen 
        name="Instagram" 
        component={InstagramScreen} 
        options={{ title: t('ig_header') }} 
      />
      <Stack.Screen 
        name="Facebook" 
        component={FacebookScreen} 
        options={{ title: t('fb_header') }} 
      />
      <Stack.Screen 
        name="TikTok" 
        component={TikTokScreen} 
        options={{ title: t('tt_header') }} 
      />
      <Stack.Screen 
        name="YouTube" 
        component={YouTubeScreen} 
        options={{ title: t('yt_header') }} 
      />
      <Stack.Screen 
        name="Twitter" 
        component={TwitterScreen} 
        options={{ title: t('tw_header') }} 
      />
      <Stack.Screen 
        name="Snapchat" 
        component={SnapchatScreen} 
        options={{ title: t('sc_header') }} 
      />
      <Stack.Screen 
        name="Pinterest" 
        component={PinterestScreen} 
        options={{ title: t('pin_header') }} 
      />
      <Stack.Screen 
        name="LinkedIn" 
        component={LinkedInScreen} 
        options={{ title: t('li_header') }} 
      />
    </Stack.Navigator>
  );
}