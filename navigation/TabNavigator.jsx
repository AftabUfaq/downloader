import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MessageCircle, Library, Settings2Icon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next'; // 1. Import translation hook

// Import the stack instead of the single screen
import HomeStack from './HomeStack'; 
import WhatsappScreen from '../screens/WhatsappScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import SettingsScreen from '../screens/SettingsScreens';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { t } = useTranslation(); // 2. Initialize translation function

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FFE600', // Updated to SnappySave Yellow
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { paddingBottom: 5, height: 60 },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'HomeTab') return <Home size={size} color={color} />;
          if (route.name === 'WhatsApp') return <MessageCircle size={size} color={color} />;
          if (route.name === 'Downloads') return <Library size={size} color={color} />;
          if (route.name === 'Settings') return <Settings2Icon size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStack} 
        options={{ tabBarLabel: t('tab_home') }} // 3. Set translated labels
      />
      <Tab.Screen 
        name="WhatsApp" 
        component={WhatsappScreen} 
        options={{ tabBarLabel: t('tab_whatsapp') }} 
      />
      <Tab.Screen 
        name="Downloads" 
        component={DownloadsScreen} 
        options={{ tabBarLabel: t('tab_downloads') }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ tabBarLabel: t('tab_settings') }} 
      />
    </Tab.Navigator>
  );
}