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
        <router-link to="/timoria" v-show="isLoggedIn">{{ $t('nav.timoria') }}</router-link>
        <router-link to="/statistics" v-show="isLoggedIn">{{ $t('nav.statistics') }}</router-link>
        <router-link to="/account" v-show="isLoggedIn">{{ $t('nav.profile') }}</router-link>
        <router-link v-show="!isLoggedIn" to="/signup">{{ $t('nav.signup') }}</router-link>
        <router-link v-show="!isLoggedIn" to="/login">{{ $t('nav.login') }}</router-link>
        <button v-show="isLoggedIn" @click="logout">{{ $t('nav.logout') }}</button>
        <LanguageSwitcher />
        <ThemeToggle />
      </nav>
    </div>
  </header>
  <!-- This is a Vue Router placeholder.
   It dynamically renders whichever page component matches the current route
    (e.g. Timoria.vue, Stats.vue, etc.). -->
  <router-view />

  <!-- 
  This is our global confirmation modal component (the one we created in ConfirmHost.vue).

  By placing it here, inside the root app template (App.vue), it’s always mounted and can appear over any page.

  It listens to the shared reactive confirmState, so when you call confirm({...}) from anywhere, 
  it shows up on top of the current route.
  -->
  <ConfirmHost />

</template>
<script>
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useUserStore } from './stores/userStore'
import ConfirmHost from './views/ConfirmHost.vue';

export default {
  name: 'App',
  components: {
    LanguageSwitcher,
    ThemeToggle,
    ConfirmHost
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
