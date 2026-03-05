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
        <!-- <router-link to="/timoria">{{ $t('nav.blog') }}</router-link> -->
        <router-link to="/timoria" v-show="isLoggedIn">{{ $t('nav.timoria') }}</router-link>
        <router-link to="/statistics" v-show="isLoggedIn">{{ $t('nav.statistics') }}</router-link>
        <router-link to="/weekly-planner" v-show="isLoggedIn">{{ $t('nav.weekly-planner') }}</router-link>
        <router-link to="/budget" v-show="isLoggedIn && isAdmin">{{ $t('nav.budget') }}</router-link>
        <router-link to="/account" v-show="isLoggedIn">{{ $t('nav.profile') }}</router-link>
        <router-link to="/leaderboard" v-show="isLoggedIn">{{ $t('nav.leaderboard') }}</router-link>
        <router-link to="/contact" v-show="isLoggedIn">{{ $t('nav.contact') }}</router-link>
        <router-link v-show="!isLoggedIn" to="/signup">{{ $t('nav.signup') }}</router-link>
        <router-link v-show="!isLoggedIn" to="/login">{{ $t('nav.login') }}</router-link>
        <button class="standard-btn" v-show="isLoggedIn" @click="logout">{{ $t('nav.logout') }}</button>
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
import { API_BASE_URL } from '@/config/api';

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
      
      url: `${API_BASE_URL}/users`,

    // This variable acts as a "storage container" for the browser's 
    // installation event. We initialize it as null because the event 
    // hasn't happened yet when the app loads.
      deferredPrompt: null,
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

    // The browser fires 'beforeinstallprompt' if the app meets PWA criteria
    window.addEventListener('beforeinstallprompt', (e) => {
      // 1. We stop the browser from showing its own default, ugly install bar
      e.preventDefault();

      // 2. We "stash" the event object into our local data. 
      // This object contains the 'prompt()' method we need later.
      this.deferredPrompt = e; // Save the event so it can be triggered later
    });
  },
  methods: {

    async installApp() {
      // Safety check: if the browser hasn't fired the event yet, 
      // or the app is already installed, do nothing.
      if (!this.deferredPrompt) return;

      // 1. Show the official browser installation dialog 
      // (This is the "Do you want to install this app?" pop-up)
      this.deferredPrompt.prompt();

      // 2. Wait for the user to make a choice (Accept or Dismiss)
      // We use 'await' because 'userChoice' is a Promise.
      const { outcome } = await this.deferredPrompt.userChoice;

      // 3. Logic based on user decision
      if (outcome === 'accepted') {

        // Clear the saved event because it can only be used once.
        // This also hides your custom install button if you used v-if.
        this.deferredPrompt = null;
      }
    },
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
