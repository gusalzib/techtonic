<template>
  <div class="home-container">
    <div class="content">
      <h1 class="title">{{ $t('home.title') }}</h1>
      <p class="subtitle">{{ $t('home.subtitle') }}</p>
      <a href="/timoria" class="btn">{{ $t('home.button') }}</a>
    </div>
    <div class="IN-PAGE-logo">
      <img src="../assets/icon.png" alt="Timoria Logo" />
    </div>
  </div>
  

  <!-- Informative Cards Section -->
    <section class="services-section">
      <h2>{{ $t('home.our-services') }}</h2>
      <div class="cards-container">
        <router-link v-for="service in services" :key="service.key" :to="`/services/${service.key}`" class="service-card">
          <img :src="service.icon" :alt="$t(`our-services.${service.key}.title`)" class="service-icon" />
          <!-- getting the service title and desc from the locales files -->
          <h3>{{ $t(`our-services.${service.key}.title`) }}</h3>
          <p>{{ $t(`our-services.${service.key}.description`) }}</p>
        </router-link>
      </div>
    </section>

    <!-- Company Overview / About Section -->
    <section class="about-section">
      <h2>{{ $t('homeAboutSection.title') }}</h2>
      <p>
        {{ $t('homeAboutSection.description') }}
      </p>
    </section>
      <p class="about-copyright">
        {{ $t('about.footer.copyright') }}
      </p>
</template>

<script>
// @ is an alias to /src

export default {
  name: 'HomeView',
  components: {
    
  },
  data() {
    return {
      services: [
        {
          key: "mobile-applications",
          icon: require("../assets/images/mobile-applications.png")
        },
        {
          key: "web-applications",
          icon: require("../assets/images/web-applications.png")
        },
        {
          key: "desktop-applications",
          icon: require("../assets/images/desktop-applications.png")
        },
        {
          key: "consultation",
          icon: require("../assets/images/mobile-applications.png")
        },
        {
          key: "ai-integration",
          icon: require("../assets/images/ai-integrations.png")
        },
        {
          key: "websites",
          icon: require("../assets/images/websites.png")
        },
      ]
    }
  }
}
</script>

<style src="../assets/styles/main.css"></style>