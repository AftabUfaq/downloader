import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { AppOpenAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__ ? TestIds.APP_OPEN : 'ca-app-pub-7435562362672599/XXXXXXXXXX';

const appOpenAd = AppOpenAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

export const useAppOpenAd = () => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // 1. Load the ad initially
    appOpenAd.load();

    // 2. Listen for App State changes (Background -> Foreground)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (appOpenAd.loaded) {
          appOpenAd.show();
        } else {
          appOpenAd.load(); // Reload if it wasn't ready
        }
      }
      appState.current = nextAppState;
    });

    // 3. Reload ad after it's closed so it's ready for the next time
    const unsubscribeClosed = appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
      appOpenAd.load();
    });

    return () => {
      subscription.remove();
      unsubscribeClosed();
    };
  }, []);
};