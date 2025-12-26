<template>
  <div class="auth-form">
    <h2>{{ $t('home.login') }}</h2>
    <input v-model="form.email" placeholder="Email" type="email"/>
    <input v-model="form.password" type="password" id="login_password" placeholder="Password" />
    <div class="show-password-box">
        <label>{{ $t('labels.ShowPassword') }}</label>
        <input id="checkbox" type="checkbox" v-on:click="toggle()">
    </div>
    
    <button @click="login">{{ $t('home.login') }}</button>

    <p class="signup-prompt">
      {{ $t('home.noAccount') }}
      <router-link to="/signup">{{ $t('home.signup') }}</router-link>
    </p>
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
    },
    toggle() {
        // allow user to show the password in the password filed
        let temp = document.getElementById("login_password")

        if (temp.type === "password") {
            temp.type = "text";

        } else {
            temp.type = "password";
        }
    }
  }
};
</script>
