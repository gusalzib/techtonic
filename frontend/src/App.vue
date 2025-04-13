<template>
  <header class="nav-header">
    <div class="nav-container">
      <div class="logo">
        <router-link to="/">Timoria</router-link>
      </div>

      <!-- Burger icon -->
      <div class="burger" @click="toggleMenu">
        <span :class="{ open: menuOpen }"></span>
        <span :class="{ open: menuOpen }"></span>
        <span :class="{ open: menuOpen }"></span>
      </div>

      <!-- Navigation links -->
      <nav :class="['nav-links', { open: menuOpen }]">
        <router-link to="/about">{{ $t('nav.about') }}</router-link>
        <router-link to="/timoria">{{ $t('nav.timoria') }}</router-link>
        <LanguageSwitcher />
        <ThemeToggle />
      </nav>
    </div>
  </header>
  <router-view />
</template>
<script>
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'


export default {
  name: 'App',
  components: {
    LanguageSwitcher,
    ThemeToggle
    
   },
  data() {
    return {
      menuOpen: false
    }
  },
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen
    }
  }
}
</script>

<style src="./assets/styles/main.css"></style>
