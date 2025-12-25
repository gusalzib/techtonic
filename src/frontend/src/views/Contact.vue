<template>
  <section class="contact-page">
    <h1>{{ $t("contact.title") }}</h1>

    <form class="contact-form" @submit.prevent="submit">
      <input class="contact-form-input"
        v-model="form.name"
        type="text"
        :placeholder="$t('contact.name')"
        required
      />

      <input class="contact-form-input"
        v-model="form.email"
        type="email"
        :placeholder="$t('contact.email')"
        required
      />

      <textarea class="contact-form-input-textarea"
        v-model="form.message"
        :placeholder="$t('contact.message')"
        required
      ></textarea>

      <button class="contact-send-btn" type="submit" :disabled="loading">
        {{ loading ? $t("contact.sending") : $t("buttons.send") }}
      </button>


    </form>
  </section>
</template>

<script>
import { API_BASE_URL } from '@/config/api';
import { useToast } from 'vue-toastification';

export default {
  data() {
    return {
      loading: false,
      success: false,
      form: {
        name: "",
        email: "",
        message: "",
        },
        url: `${API_BASE_URL}/contact`,
        toast: null,
      
    };
    },
    mounted() {
        this.toast = useToast();
    },
  methods: {
    async submit() {
      this.loading = true;
      this.success = false;

      const res = await fetch(this.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.form),
      });

      this.loading = false;

      if (res.ok) {
        this.form = { name: "", email: "", message: "" };
        this.success = true;
        this.toast && this.toast.success(this.$t('notification.emailSentSuccessfully') || 'Email sent Successfully. Thanks for contacting us! \n We will answer your inquiry as soon as possible');
      }
    },
  },
};
</script>
