import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import SplashScreen from 'react-native-splash-screen';

import OnboardingScreen from './screens/OnboardingScreen';
import TabNavigator from './navigation/TabNavigator';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    // Hide splash after 2 seconds
    const timer = setTimeout(() => { SplashScreen.hide(); }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showOnboarding) {
    return <OnboardingScreen onDone={() => setShowOnboarding(false)} />;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <TabNavigator />
    </NavigationContainer>
  );
}