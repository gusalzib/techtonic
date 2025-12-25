// src/i18n.js
import { createI18n } from 'vue-i18n'

// Import your language files
import en from './locales/en.json'
import ar from './locales/ar.json'
import sv from './locales/sv.json'

const savedLocale = localStorage.getItem('lang') || 'en'

const i18n = createI18n({
  legacy: true, 
  globalInjection: true, // Allows usage of $t globally
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    ar,
    sv
  }
})

export default i18n