<template>
  <div class="auth-form">
    <h2>Sign Up</h2>
    <input v-model="form.username" placeholder="Username" />
    <input v-model="form.email" placeholder="Email" />
    <input v-model="form.password" type="password" placeholder="Password" />
    <button @click="signup">Sign Up</button>
    <p>{{ error }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: { username: '', email: '', password: '' },
        error: '',
      url: 'http://localhost:5000/api/auth/login'
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
        if (!res.ok) throw new Error(data.msg || 'Signup failed');
        localStorage.setItem('token', data.token);
        this.$router.push('/login'); // redirect after signup
      } catch (err) {
        this.error = err.message;
      }
    }
  }
};
</script>
