<template>
  <div class="auth-form">
    <h2>{{ $t('home.signup') }}</h2>
    <input v-model="form.username" placeholder="Username" />
    <input v-model="form.email" type="email" placeholder="example@gmail.com" />
    <input v-model="form.password" type="password" placeholder="Password" />
    <button @click="signup">{{ $t('home.signupBtn') }}</button>
    <!-- Commented out because they are not needed when we have toast notifications -->
    <!-- <p id="error">{{ error }}</p>
    <p id="success">{{ message }}</p> -->
  </div>
</template>

<script>
import { useToast } from 'vue-toastification'

export default {
  data() {
    return {
      form: { username: '', email: '', password: '' },
        error: '',
        message: '',
      url: 'http://localhost:5000/api/users/signup',
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
    }
  }
};
</script>
