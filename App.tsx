import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar, Platform } from 'react-native'; // Added Platform
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from 'react-native-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- NEW IMPORT ---
import mobileAds from 'react-native-google-mobile-ads';
import { useAppOpenAd } from './hooks/useAppOpenAd';

import './localization/i18n'; 
import { useRemoteConfig } from './hooks/useRemoteConfig';
import { ThemeProvider } from './context/ThemeContext';

import LanguageScreen from './screens/LanguageScreen';
import SecondaryLanguageScreen from './screens/SecondaryLanguageScreen';
import PermissionsScreen from './screens/PermissionsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import TabNavigator from './navigation/TabNavigator';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import i18next from 'i18next';

const Stack = createStackNavigator();

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  useAppOpenAd();

  useRemoteConfig();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // --- ADMOB INITIALIZATION ---
        // It's best to initialize as early as possible
        const adapterStatuses = await mobileAds().initialize();
        console.log('Ads Initialized:', adapterStatuses);

        // 2. LOAD SAVED LANGUAGE
        const savedLanguage = await AsyncStorage.getItem('user-language');
        if (savedLanguage) {
          await i18next.changeLanguage(savedLanguage);
        }

        // 3. CHECK IF ONBOARDING WAS DONE
        const hasFinishedOnboarding = await AsyncStorage.getItem('hasFinishedOnboarding');
        if (hasFinishedOnboarding === 'true') {
          setIsAppReady(true);
        }

      } catch (error) {
        console.log('Init Error:', error);
      } finally {
        const timer = setTimeout(() => {
          SplashScreen.hide();
        }, 3000);
      }
    };

    initializeApp();
  }, []);

  return (
   <ThemeProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        
      // Inside App.tsx Stack.Navigator
<Stack.Navigator 

  initialRouteName={!isAppReady ? "Language" : "MainApp"} 
  screenOptions={{ headerShown: false }}
>
  <Stack.Screen name="Language" component={LanguageScreen} />
  <Stack.Screen name="SecondaryLanguage" component={SecondaryLanguageScreen} />
  <Stack.Screen name="Permissions" component={PermissionsScreen} />
  
  <Stack.Screen name="Onboarding">
    {(props: any) => (
      <OnboardingScreen 
        {...props} 
        onDone={async () => {
          await AsyncStorage.setItem('hasFinishedOnboarding', 'true');
          // Navigate to MainApp instead of just setting state if needed
          props.navigation.replace("MainApp");
        }} 
      />
    )}
  </Stack.Screen>

  {/* IMPORTANT: Ensure this name "MainApp" matches your navigation.reset call */}
  <Stack.Screen name="MainApp" component={TabNavigator} />
  <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
</Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
    </ThemeProvider>
  );
}