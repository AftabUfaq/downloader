// src/hooks/useRemoteConfig.js
import { useState, useEffect } from 'react';
import remoteConfig from '@react-native-firebase/remote-config';

export const useRemoteConfig = () => {
  const [isAdsEnabled, setIsAdsEnabled] = useState(false); // State to hold the button toggle

  useEffect(() => {
    const setupConfig = async () => {
      try {
        await remoteConfig().setDefaults({
          is_ads_enabled: false,
        });

        await remoteConfig().fetchAndActivate();
        
        // Get the value and update the state
        const value = remoteConfig().getValue('is_ads_enabled').asBoolean();
        setIsAdsEnabled(value);
      } catch (error) {
        console.error('Remote Config failed', error);
      }
    };

    setupConfig();
  }, []);

  return isAdsEnabled; // Return the boolean
};