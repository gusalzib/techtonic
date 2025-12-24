<template>
  <section class="service-detail">
    <!-- Hero -->
    <div class="service-hero">
      <h1>{{ text.title }}</h1>
      <p class="subtitle">{{ text.longDescription }}</p>
    </div>

    <hr>

    <!-- Offerings -->
    <div class="service-section">
      <h2>{{ $t("service.what-we-offer") }}</h2>
      <ul>
        <li v-for="(item, i) in text.offerings" :key="i">
          {{ item }}
        </li>
      </ul>
    </div>

    <hr>
    
    <!-- Benefits -->
    <div class="service-section alt">
      <h2>{{ $t("service.benefits") }}</h2>
      <div class="benefits-grid">
        <div
          class="benefit-card"
          v-for="(benefit, i) in text.benefits"
          :key="i"
        >
          {{ benefit }}
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="service-cta">
      <h3>{{ $t("service.ctaTitle") }}</h3>
      <p>{{ $t("service.ctaText") }}</p>
      <router-link to="/contact" class="cta-button">
        {{ $t("service.contactUs") }}
      </router-link>
    </div>
  </section>
</template>

<script>
export default {
  computed: {
    serviceKey() {
      return this.$route.params.service;
    },
    text() {
      return this.$tm(`our-services.${this.serviceKey}`);
    }
  }
};
</script>
<style>


</style>
