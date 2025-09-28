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
  

  <!-- Informative Cards Section -->
    <section class="services-section">
      <h2>Our Services</h2>
      <div class="cards-container">
        <div class="service-card" v-for="service in services" :key="service.title">
          <img :src="service.icon" :alt="service.title + ' icon'" class="service-icon" />
          <h3>{{ service.title }}</h3>
          <p>{{ service.description }}</p>
        </div>
      </div>
    </section>

    <!-- Company Overview / About Section -->
    <section class="about-section">
      <h2>Why Choose Us?</h2>
      <p>
        At Timoria, we combine cutting-edge technology with deep industry knowledge
        to craft scalable, secure, and user-friendly software solutions.
        Whether you're a startup or an enterprise, we tailor our services to meet your unique needs.
      </p>
    </section>

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
          title: "Mobile Applications",
          description: "Custom iOS and Android apps with stunning UX and high performance.",
          icon: require("../assets/images/mobile-applications.png")
        },
        {
          title: "Web Applications",
          description: "Responsive, scalable web apps built with modern frameworks.",
          icon: require("../assets/images/web-applications.png")
        },
        {
          title: "Desktop Applications",
          description: "Cross-platform desktop software for Windows, macOS, and Linux.",
          icon: require("../assets/images/desktop-applications.png")
        },
        {
          title: "Consultation",
          description: "Expert advice to guide your digital transformation journey.",
          icon: require("../assets/images/mobile-applications.png")
        },
        {
          title: "AI Integration",
          description: "Smart automation and AI-powered solutions tailored to your business.",
          icon: require("../assets/images/ai-integrations.png")
        },
        {
          title: "Websites",
          description: "Modern, SEO-friendly websites to showcase your brand.",
          icon: require("../assets/images/websites.png")
        },
      ]
    }
  }
}
</script>

<style src="../assets/styles/main.css"></style>