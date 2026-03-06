import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';

const savedLang = typeof window !== 'undefined'
  ? localStorage.getItem('vulca-lang') || navigator.language.split('-')[0]
  : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
    ja: { translation: ja },
  },
  lng: ['en', 'zh', 'ja'].includes(savedLang) ? savedLang : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('vulca-lang', lng);
});

export default i18n;
