<template>
  <div class="legal-page">
    <section class="legal-hero">
      <h1>{{ $t('privacy.title') }}</h1>
      <p class="legal-subtitle">
        {{ $t('privacy.subtitle') }}
      </p>
    </section>

    <section class="legal-content">
      <article class="legal-section">
        <h2>{{ $t('privacy.section1.title') }}</h2>
        <p>{{ $t('privacy.section1.body1') }}</p>
        <p>{{ $t('privacy.section1.body2') }}</p>
      </article>

      <article class="legal-section">
        <h2>{{ $t('privacy.section2.title') }}</h2>
        <p>{{ $t('privacy.section2.body1') }}</p>
        <p>{{ $t('privacy.section2.body2') }}</p>
      </article>

      <article class="legal-section">
        <h2>{{ $t('privacy.section3.title') }}</h2>
        <p>{{ $t('privacy.section3.body1') }}</p>
        <p>{{ $t('privacy.section3.body2') }}</p>
      </article>

      <article class="legal-section">
        <h2>{{ $t('privacy.section4.title') }}</h2>
        <p>{{ $t('privacy.section4.body1') }}</p>
        <p>{{ $t('privacy.section4.body2') }}</p>
      </article>

      <article class="legal-section">
        <h2>{{ $t('privacy.section5.title') }}</h2>
        <p>{{ $t('privacy.section5.body1') }}</p>
        <p>{{ $t('privacy.section5.body2') }}</p>
      </article>
    </section>

    <footer class="legal-footer">
      <p>{{ $t('privacy.footer.note') }}</p>
      <p class="legal-updated">
        {{ $t('privacy.footer.lastUpdated') }}
      </p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'PrivacyPage',
};
</script>

<style scoped>

</style>
