/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import MobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

MobileAds()
  .setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.MA,
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
  })
  .then(() => MobileAds().initialize())
  .then(adapterStatuses => {
    console.log('Ads initialized', adapterStatuses);
  })
  .catch(err => {
    console.log('Ads init error', err);
  });
AppRegistry.registerComponent(appName, () => App);
