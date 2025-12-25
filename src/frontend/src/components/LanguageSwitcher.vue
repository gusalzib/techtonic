<template>
  <select :value="locale" @change="changeLanguage($event.target.value)">
    <option value="en">English</option>
    <option value="ar">العربية</option>
    <option value="sv">Svenska</option>
  </select>
</template>

<script setup>
import { i18n } from '@/main'

const locale = i18n.global.locale

const changeLanguage = (lang) => {
  i18n.global.locale = lang
  localStorage.setItem('lang', lang)
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}
</script>
