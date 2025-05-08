<template>
  <header class="nav-header">
    <div class="nav-container">
      <div class="logo">
        <img src="/favicon.ico" alt="">
        <router-link to="/">Techtonic</router-link>
      </div>

      <!-- Burger icon -->
      <div class="burger" @click="toggleMenu">
        <span :class="{ open: menuOpen }"></span>
        <span :class="{ open: menuOpen }"></span>
        <span :class="{ open: menuOpen }"></span>
      </div>

      <!-- Use v-show if hiding/showing frequently: For performance, if you're toggling often and want to keep the DOM element, use v-show instead of v-if. -->
       
      <!-- Navigation links -->
      <nav :class="['nav-links', { open: menuOpen }]">
        <router-link to="/">{{ $t('nav.home') }}</router-link>
        <router-link to="/about">{{ $t('nav.about') }}</router-link>
        <router-link to="/timoria">{{ $t('nav.blog') }}</router-link>
        <router-link to="/timoria">{{ $t('nav.timoria') }}</router-link>
        <router-link to="/statistics">{{ $t('nav.statistics') }}</router-link>
        <router-link v-show="!isLoggedIn" to="/signup">{{ $t('nav.signup') }}</router-link>
        <router-link v-show="!isLoggedIn" to="/login">{{ $t('nav.login') }}</router-link>
        <button v-show="isLoggedIn" @click="logout">Logout</button>
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
import { useUserStore } from './stores/userStore'

export default {
  name: 'App',
  components: {
    LanguageSwitcher,
    ThemeToggle
  },
  data() {
    return {
      menuOpen: false,
      url: 'http://localhost:5000/api/users',
    }
  },
  computed: {
    userStore() {
      return useUserStore();
    },
    isLoggedIn() {
      return this.userStore.isLoggedIn;
    },
    isAdmin() {
      return this.userStore.isAdmin;
    },
    isRegular() {
      return this.userStore.isRegular;
    },
    isPaid() {
      return this.userStore.isPaid;
    },
    username() {
      return this.userStore.username;
    }
  },
  mounted() {
    this.userStore.checkUserStatus();
  },
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
    },
    logout() {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      fetch(`${this.url}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then(() => {
        this.userStore.logout();
        this.$router.push('/login');
      }).catch(err => {
        console.error('Logout failed', err);
      });
    }
  }
}
</script>


<style src="./assets/styles/main.css"></style>
