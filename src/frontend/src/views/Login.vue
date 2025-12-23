<template>
  <div class="auth-form">
    <h2>{{ $t('home.login') }}</h2>
    <input v-model="form.email" placeholder="Email" type="email"/>
    <input v-model="form.password" type="password" placeholder="Password" />
    <button @click="login">{{ $t('home.login') }}</button>
    <!-- Commented out because they are not needed when we have toast notifications -->
    <!-- <p id="error">{{ error }}</p>
    <p id="success">{{ message }}</p> -->
  </div>
</template>

<script>
import { useUserStore } from '@/stores/userStore';
import { useToast } from 'vue-toastification';
import { API_BASE_URL } from '@/config/api';
export default {
  data() {
    return {
      form: { email: '', password: '' },
        error: '',
        message: '',
      url: `${API_BASE_URL}/users/login`,
      toast: null, // will be set in mounted()
    };
  },
  mounted() {
    this.toast = useToast();
  },
  methods: {
    async login() {
      try {
        const res = await fetch(`${this.url}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form)
        });
        const data = await res.json();
          if (!res.ok) throw new Error(data.msg || 'Login failed');

          /**
           * Removes the commented line below since it is redundant with the toast notification
           * The toast notification is localized and provides better user feedback in different languages
           */
          //this.message = data.msg;
        localStorage.setItem('token', data.token);
        
        const userStore = useUserStore();
        await userStore.checkUserStatus();

        this.toast && this.toast.success(this.$t('notification.loginSuccessful') || 'Login successful');
        // Wait 2 seconds before redirecting
        setTimeout(() => {
            this.$router.push('/'); // go to home
        }, 2000);
      } catch (err) {
        /**
         * Removes the commented line below since it is redundant with the toast notification
         */
        //this.error = err.message;
        this.toast && this.toast.error(err.message || 'Login failed');
        
      }
    }
  }
};
</script>
