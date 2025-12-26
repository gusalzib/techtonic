<template>
  <div class="auth-form">
    <h2>{{ $t('home.signup') }}</h2>
    <input v-model="form.username" placeholder="Username" />
    <input v-model="form.email" type="email" placeholder="example@gmail.com" />
    <input v-model="form.password" type="password" id="signup_password" placeholder="Password" />
    <div class="show-password-box">
        <label>{{ $t('labels.ShowPassword') }}</label>
        <input id="checkbox" type="checkbox" v-on:click="toggle()">
    </div>
    <button @click="signup">{{ $t('home.signupBtn') }}</button>
    <p class="login-prompt">
      {{ $t('home.alreadyHaveAnAccount') }}
      <router-link to="/login">{{ $t('home.login') }}</router-link>
    </p>
  </div>
</template>

<script>
import { useToast } from 'vue-toastification';
import { API_BASE_URL } from '@/config/api';

export default {
  data() {
    return {
      form: { username: '', email: '', password: '' },
        error: '',
        message: '',
      url: `${API_BASE_URL}/users/signup`,
      toast: null,
    };
  },
  mounted() {
    this.toast = useToast();
  },
  methods: {
    async signup() {
      try {
        const res = await fetch(`${this.url}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form)
        });
        const data = await res.json();
          if (!res.ok) { 
            throw new Error(data.msg || 'Signup failed');
        }
          // no need to set this.message when we have toast notification
          //this.message = data.msg;
          localStorage.setItem('token', data.token);

          // show a notification on  sucessful signup
          this.toast && this.toast.success(this.$t('notification.signupSuccessful') || 'Signup successful');
        // Wait 2 seconds before redirecting
        setTimeout(() => {
            this.$router.push('/login'); // redirect after signup
        }, 2000);
        
      } catch (err) {
        /**
         * Removes the commented line below since it is redundant with the toast notification
         */
        //this.error = err.message;
        this.toast && this.toast.error(err.message || 'Signup failed');
      }
    },
    toggle() {
        // allow user to show the password in the password filed
        let temp = document.getElementById("signup_password")

        if (temp.type === "password") {
            temp.type = "text";

        } else {
            temp.type = "password";
        }
    }
  }
};
</script>
