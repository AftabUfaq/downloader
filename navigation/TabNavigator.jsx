import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Crown, Library, Settings2Icon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext'; 

// Import the stack and screens
import HomeStack from './HomeStack'; 
import PremiumScreen from '../screens/PremiumScreen'; 
import DownloadsScreen from '../screens/DownloadsScreen';
import SettingsScreen from '../screens/SettingsScreens';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme(); // Access theme colors

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent, // Use theme accent (e.g., Pink/Purple/Blue)
        tabBarInactiveTintColor: colors.subText,
        tabBarShowLabel: true,
        tabBarStyle: { 
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: 8, 
          height: 65,
          elevation: 10,
          shadowOpacity: 0.1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;

          if (route.name === 'HomeTab') IconComponent = Home;
          else if (route.name === 'Premium') IconComponent = Crown; // Crown for Premium
          else if (route.name === 'Downloads') IconComponent = Library;
          else if (route.name === 'Settings') IconComponent = Settings2Icon;

          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {/* THE PILL INDICATOR */}
              {focused && (
                <View 
                  style={{
                    position: 'absolute',
                    width: 50,
                    height: 30,
                    borderRadius: 20,
                    backgroundColor: colors.accent,
                    opacity: 0.15, // Light transparent pill
                  }} 
                />
              )}
              <IconComponent size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStack} 
        options={{ tabBarLabel: t('tab_home') }} 
      />
      <Tab.Screen 
        name="Premium" 
        component={PremiumScreen} 
        options={{ tabBarLabel: t('tab_premium') }} // Ensure this key exists in your i18n files
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