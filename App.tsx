// 1. THIS MUST BE THE VERY FIRST IMPORT
import 'react-native-gesture-handler'; 

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import SplashScreen from 'react-native-splash-screen';
// 2. Import the Root View
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import OnboardingScreen from './screens/OnboardingScreen';
import TabNavigator from './navigation/TabNavigator';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => { SplashScreen.hide(); }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // 3. Wrap EVERYTHING in GestureHandlerRootView
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {showOnboarding ? (
        <OnboardingScreen onDone={() => setShowOnboarding(false)} />
      ) : (
        <NavigationContainer>
          <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
          <TabNavigator />
        </NavigationContainer>
      )}
    </GestureHandlerRootView>
  );
}