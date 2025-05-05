<template>
  <div class="auth-form">
    <h2>{{ $t('home.login') }}</h2>
    <input v-model="form.email" placeholder="Email" type="email"/>
    <input v-model="form.password" type="password" placeholder="Password" />
    <button @click="login">{{ $t('home.login') }}</button>
    <p id="error">{{ error }}</p>
    <p id="success">{{ message }}</p>
  </div>
</template>

<script>
import { useUserStore } from '@/stores/userStore';

export default {
  data() {
    return {
      form: { email: '', password: '' },
        error: '',
        message: '',
      url: 'http://localhost:5000/api/users/login'
    };
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

          this.message = data.msg;
        localStorage.setItem('token', data.token);
        
        const userStore = useUserStore();
        await userStore.checkUserStatus();

        // Wait 1 seconds before redirecting
        setTimeout(() => {
            this.$router.push('/'); // go to home
        }, 1000);
      } catch (err) {
        this.error = err.message;
      }
    }
  }
};
</script>
