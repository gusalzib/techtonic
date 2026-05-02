import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia';
import './registerServiceWorker' 

// Create and mount app
const app = createApp(App)

// importing the tooltip directive 
import TooltipDirective from './directives/v-tooltip';

// this registers the tooltip directive globally instead of having to import it in every file/page
app.directive('tooltip', TooltipDirective);

// vue toastification library
import Toast, { POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css' // getting the required styles

// Import your language files
import en from './locales/en.json'
import ar from './locales/ar.json'
import sv from './locales/sv.json'

const savedLocale = localStorage.getItem('lang') || 'en'

// Create the i18n instance
const i18n = createI18n({
  legacy: true, // Because you use $t()
  locale: savedLocale,
  globalInjection: true,
  fallbackLocale: 'en',
  messages: {
    en,
    ar,
    sv
  }
})

export { i18n }



// Create and use Pinia store
const pinia = createPinia();
app.use(pinia);

app.use(i18n) // MUST come before mount
app.use(router)
app.use(Toast, {
  position: POSITION.BOTTOM_CENTER,
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
})
app.mount('#app')
