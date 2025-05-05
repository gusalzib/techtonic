<template>
  <div class="auth-form">
    <h2>{{ $t('home.signup') }}</h2>
    <input v-model="form.username" placeholder="Username" />
    <input v-model="form.email" type="email" placeholder="example@gmail.com" />
    <input v-model="form.password" type="password" placeholder="Password" />
    <button @click="signup">{{ $t('home.signupBtn') }}</button>
    <p id="error">{{ error }}</p>
    <p id="success">{{ message }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: { username: '', email: '', password: '' },
        error: '',
        message: '',
      url: 'http://localhost:5000/api/users/signup'
    };
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
          this.message = data.msg;
          localStorage.setItem('token', data.token);
        // Wait 1 seconds before redirecting
        setTimeout(() => {
            this.$router.push('/login'); // redirect after signup
        }, 1000);
        
      } catch (err) {
        this.error = err.message;
      }
    }
  }
};
</script>
