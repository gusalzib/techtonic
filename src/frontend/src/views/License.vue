<template>
  <div class="legal-page">
    <section class="legal-hero">
      <h1>{{ $t('license.title') }}</h1>
      <p class="legal-subtitle">
        {{ $t('license.subtitle') }}
      </p>
    </section>

    <section class="legal-content">
      <article class="legal-section">
        <h2>{{ $t('license.section1.title') }}</h2>
        <p>{{ $t('license.section1.body1') }}</p>
        <p>{{ $t('license.section1.body2') }}</p>
      </article>

      <article class="legal-section">
        <h2>{{ $t('license.section2.title') }}</h2>
        <p>{{ $t('license.section2.body1') }}</p>
        <p>{{ $t('license.section2.body2') }}</p>
      </article>

      <article class="legal-section">
        <h2>{{ $t('license.section3.title') }}</h2>
        <p>{{ $t('license.section3.body1') }}</p>
        <p>{{ $t('license.section3.body2') }}</p>
      </article>

      <article class="legal-section">
        <h2>{{ $t('license.section4.title') }}</h2>
        <p>{{ $t('license.section4.body1') }}</p>
        <p>{{ $t('license.section4.body2') }}</p>
      </article>
    </section>

    <footer class="legal-footer">
      <p>{{ $t('license.footer.note') }}</p>
      <p class="legal-updated">
        {{ $t('license.footer.lastUpdated') }}
      </p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'LicensePage',
};
</script>

<style scoped>
/* Reuse same styles as Privacy */

</style>
