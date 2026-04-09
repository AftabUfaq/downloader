import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from 'react-native-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useRemoteConfig } from './hooks/useRemoteConfig';

// Import your new screens
import LanguageScreen from './screens/LanguageScreen';
import SecondaryLanguageScreen from './screens/SecondaryLanguageScreen'
import PermissionsScreen from './screens/PermissionsScreen'
import OnboardingScreen from './screens/OnboardingScreen';
import TabNavigator from './navigation/TabNavigator';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen'

const Stack = createStackNavigator();

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  useRemoteConfig();

  useEffect(() => {
    // Hide splash after a delay
    const timer = setTimeout(() => {
      SplashScreen.hide();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* 1. Language Selection */}
          <Stack.Screen name="Language" component={LanguageScreen} />
          
          {/* 2. Secondary Language Selection */}
          <Stack.Screen name="SecondaryLanguage" component={SecondaryLanguageScreen} />
          
          {/* 3. Permissions Request */}
          <Stack.Screen name="Permissions" component={PermissionsScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />

          {/* 4. Your existing Onboarding */}
          <Stack.Screen name="Onboarding">
            {(props : any) => (
              <OnboardingScreen {...props} onDone={() => setIsAppReady(true)} />
            )}
          </Stack.Screen>

          {/* 5. Main App (Tab Navigator) */}
          <Stack.Screen name="MainApp" component={TabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}