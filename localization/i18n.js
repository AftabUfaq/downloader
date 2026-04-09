import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import ar from './ar.json';
import hi from './hi.json';
import ur from './ur.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      ar: { translation: ar },
      hi: { translation: hi },
      ur: { translation: ur },
    },
    lng: 'en', 
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: { escapeValue: false }
  });

export default i18n;