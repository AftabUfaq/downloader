import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import ar from './ar.json';
import hi from './hi.json';
import ur from './ur.json';
import id from './id.json';
import pt from './pt.json';
import zhCN from './zh-CN.json';
import ru from './ru.json';
import ko from './ko.json';
import it from './it.json';
import ja from './ja.json';
import de from './de.json';
import tr from './tr.json';


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
      id: { translation: id },
      pt: { translation: pt },
      'zh-CN': { translation: zhCN },
      ru: { translation: ru },
      ko: { translation: ko },
      it: { translation: it },
      ja: { translation: ja },
      de: { translation: de },
      tr: { translation: tr },

    },
    lng: 'en',
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: { escapeValue: false }
  });

export default i18n;