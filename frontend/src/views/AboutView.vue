<template>
  <div class="about-page">
    <!-- Hero section -->
    <section class="about-hero">
      <h1>{{ $t('about.title') }}</h1>
      <p class="about-subtitle">
        {{ $t('about.subtitle') }}
      </p>
    </section>

    <!-- Highlight cards -->
    <section class="about-highlights">
      <div class="about-card">
        <h2>{{ $t('about.highlight1.title') }}</h2>
        <p>{{ $t('about.highlight1.body') }}</p>
      </div>
      <div class="about-card">
        <h2>{{ $t('about.highlight2.title') }}</h2>
        <p>{{ $t('about.highlight2.body') }}</p>
      </div>
      <div class="about-card">
        <h2>{{ $t('about.highlight3.title') }}</h2>
        <p>{{ $t('about.highlight3.body') }}</p>
      </div>
    </section>

    <!-- Main content sections -->
    <section class="about-content">
      <article class="about-section">
        <h3>{{ $t('about.section1.title') }}</h3>
        <p>{{ $t('about.section1.body1') }}</p>
        <p>{{ $t('about.section1.body2') }}</p>
      </article>

      <article class="about-section">
        <h3>{{ $t('about.section2.title') }}</h3>
        <p>{{ $t('about.section2.body1') }}</p>
        <p>{{ $t('about.section2.body2') }}</p>
      </article>

      <article class="about-section">
        <h3>{{ $t('about.section3.title') }}</h3>
        <p>{{ $t('about.section3.body1') }}</p>
        <p>{{ $t('about.section3.body2') }}</p>
      </article>

      <article class="about-section">
        <h3>{{ $t('about.section4.title') }}</h3>
        <p>{{ $t('about.section4.body1') }}</p>
        <p>{{ $t('about.section4.body2') }}</p>
      </article>

      <article class="about-section">
        <h3>{{ $t('about.section5.title') }}</h3>
        <p>{{ $t('about.section5.body1') }}</p>
        <p>{{ $t('about.section5.body2') }}</p>
      </article>
    </section>

    <!-- Footer / meta -->
    <footer class="about-footer">
      <p>{{ $t('about.footer.madeWith') }}</p>
      <p class="about-version">
        {{ $t('about.footer.version') }}
      </p>
      <div class="about-links">
        <a href="/privacy" class="about-link">{{ $t('about.footer.privacy') }}</a>
        <span class="divider">·</span>
        <a href="/license" class="about-link">{{ $t('about.footer.license') }}</a>
      </div>
      <p class="about-copyright">
        {{ $t('about.footer.copyright') }}
      </p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'AboutPage',
};
</script>

<style scoped>

</style>
