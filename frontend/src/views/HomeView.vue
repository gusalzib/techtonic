<template>
  <div class="home-container">
    <div class="content">
      <h1 class="title">{{ $t('home.title') }}</h1>
      <p class="subtitle">{{ $t('home.subtitle') }}</p>
      <a href="#/timoria" class="btn">{{ $t('home.button') }}</a>
    </div>
    <div class="IN-PAGE-logo">
      <img src="../assets/icon.png" alt="Timoria Logo" />
    </div>
  </div>
  
</template>

<script>
// @ is an alias to /src

export default {
  name: 'HomeView',
  components: {
    
  }
}
</script>

<style src="../assets/styles/main.css"></style>