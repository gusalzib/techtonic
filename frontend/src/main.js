import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createI18n } from 'vue-i18n'

// Import your language files
import en from './locales/en.json'
import ar from './locales/ar.json'
import sv from './locales/sv.json'

const savedLocale = localStorage.getItem('lang') || 'en'

// Create the i18n instance
const i18n = createI18n({
  legacy: true, // Because you use $t()
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    ar,
    sv
  }
})

export { i18n }

// Create and mount app
const app = createApp(App)
app.use(i18n) // MUST come before mount
app.use(router)
app.mount('#app')
