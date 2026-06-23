<template>
  <div class="login-page">
    <h1>Finance App</h1>
    <p>Увійдіть до свого облікового запису</p>
    <form @submit.prevent="login">
      <input type="text" v-model="name" placeholder="Введіть ім'я користувача" />
      <br/>
      <input type="password" v-model="password" placeholder="Введіть пароль" />
      <p v-if="error" style="color: red">{{ error }}</p>
      <div class="button-group">
        <button type="button" @click="$router.push('/register')">Зареєструватися</button>
        <button type="submit">Увійти</button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: "LoginPage",
  data() {
    return {
      name: '',
      password: '',
      error: null
    }
  },
  methods: {
    async login() {
      try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: this.name, password: this.password })
        });

        if (!response.ok) {
          const data = await response.json();
          this.error = data['message'];
          return;
        }

        const data = await response.json();
        console.log(data);
        localStorage.setItem('token', data.token); // Збереження токена у локальному сховищі
        this.$router.push('/');//
        this.error = null; // Очистка помилки після успішної авторизації
      } catch (error) {
        console.error(error);
        this.error = 'Помилка мережі';
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.button-group {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

button {
  padding: 10px 20px;
  margin: 0 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button[type="button"] {
  background-color: #ccc;
  color: #333;
}

button[type="submit"] {
  background-color: #333;
  color: #fff;
}
</style>