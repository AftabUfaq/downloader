import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MessageCircle, Library, Settings2Icon } from 'lucide-react-native';

// Import the stack instead of the single screen
import HomeStack from './HomeStack'; 
import WhatsappScreen from '../screens/WhatsappScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import SettingsScreen from '../screens/SettingsScreens';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { paddingBottom: 5, height: 60 },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'HomeTab') return <Home size={size} color={color} />; // Name matches below
          if (route.name === 'WhatsApp') return <MessageCircle size={size} color={color} />;
          if (route.name === 'Downloads') return <Library size={size} color={color} />;
          if (route.name === 'Settings') return <Settings2Icon size={size} color={color} />;
        },
      })}
    >
      {/* Change name to HomeTab and component to HomeStack */}
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="WhatsApp" component={WhatsappScreen} />
      <Tab.Screen name="Downloads" component={DownloadsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}