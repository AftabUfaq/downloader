import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from 'react-native-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. IMPORT i18n CONFIG (Must be at the top)
import './localization/i18n'; 



import { useRemoteConfig } from './hooks/useRemoteConfig';

// Import your screens
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

  useRemoteConfig();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 2. LOAD SAVED LANGUAGE
        const savedLanguage = await AsyncStorage.getItem('user-language');
        if (savedLanguage) {
          await i18next.changeLanguage(savedLanguage);
        }

        // 3. CHECK IF ONBOARDING WAS DONE (Optional but recommended)
        const hasFinishedOnboarding = await AsyncStorage.getItem('hasFinishedOnboarding');
        if (hasFinishedOnboarding === 'true') {
          setIsAppReady(true);
        }

      } catch (error) {
        console.log('Init Error:', error);
      } finally {
        // Hide splash after logic is done
        const timer = setTimeout(() => {
          SplashScreen.hide();
        }, 3000);
      }
    };

    initializeApp();
  }, []);

return (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      <Stack.Navigator 
        // If app isn't ready, start at Language. If it is, start at MainApp.
        initialRouteName={!isAppReady ? "Language" : "MainApp"}
        screenOptions={{ headerShown: false }}
      >
        {/* All screens are now defined, so navigate('SecondaryLanguage') will always work */}
        <Stack.Screen name="Language" component={LanguageScreen} />
        <Stack.Screen name="SecondaryLanguage" component={SecondaryLanguageScreen} />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
        
        <Stack.Screen name="Onboarding">
          {(props: any) => (
            <OnboardingScreen 
              {...props} 
              onDone={async () => {
                await AsyncStorage.setItem('hasFinishedOnboarding', 'true');
                setIsAppReady(true);
              }} 
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="MainApp" component={TabNavigator} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  </GestureHandlerRootView>
);
}