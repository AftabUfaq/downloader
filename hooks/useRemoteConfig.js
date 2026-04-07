// src/hooks/useRemoteConfig.js
import remoteConfig from '@react-native-firebase/remote-config';
import { useEffect } from 'react';

export const useRemoteConfig = () => { // Added 'export' here
  useEffect(() => {
    const setupConfig = async () => {
      try {
        await remoteConfig().setDefaults({
          is_ads_enabled: false,
          min_app_version: '1.0.0',
        });

        if (__DEV__) {
          await remoteConfig().setConfigSettings({
            minimumFetchIntervalMillis: 0,
          });
        }

        await remoteConfig().fetchAndActivate();
        console.log('Remote Config Ready. Ads Enabled:', remoteConfig().getValue('is_ads_enabled').asBoolean());
      } catch (error) {
        console.error('Remote Config failed to load', error);
      }
    };

    setupConfig();
  }, []);
};