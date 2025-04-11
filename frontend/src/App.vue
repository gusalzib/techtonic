<template>
  <nav>
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link> | 
    <router-link to="/timoria">Timoria</router-link>

    <!-- Add language switcher here -->
    <LanguageSwitcher />
  </nav>

  <router-view />
</template>

<script>
import LanguageSwitcher from '@/components/LanguageSwitcher.vue' // adjust if it's somewhere else

export default {
  name: 'App',
  components: {
    LanguageSwitcher
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
