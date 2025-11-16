<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router'; // NEU: Um weiterzuleiten
import { useAuthStore } from '@/stores/auth'; // NEU: Unser Pinia-Store

// Formular-Daten
const email = ref('');
const password = ref('');
const message = ref('');

// Helfer-Funktionen
const authStore = useAuthStore();
const router = useRouter(); // Hol dir den Router

const handleLogin = async () => {
  try {
    message.value = 'Login wird durchgeführt...';

    const response = await fetch('http://localhost:8000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      message.value = `Fehler: ${data.message}`; // z.B. "Anmeldedaten ungültig"
    } else {
      // ERFOLG!
      message.value = `Erfolg: ${data.message}`;

      // 1. Speichere das Token im Pinia-Store
      authStore.login(data.token);

      // 2. Leite den Benutzer zur Startseite weiter
      router.push('/'); 
    }

  } catch (error) {
    console.error('Login-Fehler:', error);
    message.value = 'Fehler: Verbindung zum Server fehlgeschlagen.';
  }
};
</script>

<template>
  <main class="login-page">
    <h2>Login</h2>
    <p>Melde dich mit deinem Konto an.</p>

    <form @submit.prevent="handleLogin">
      <div>
        <label for="email">E-Mail:</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div>
        <label for="password">Passwort:</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit">Login</button>
    </form>

    <div v-if="message" class="message">
      <p>{{ message }}</p>
    </div>
  </main>
</template>

<style scoped>
/* Styles von RegisterView kopiert, damit es gleich aussieht */
.login-page {
  max-width: 400px;
  margin: 0 auto;
  padding: 1rem;
}
form div {
  margin-bottom: 1rem;
}
label {
  display: block;
  margin-bottom: 0.25rem;
}
input {
  width: 100%;
  padding: 0.5rem;
  box-sizing: border-box;
}
.message {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #ccc;
  background-color: #f4f4f4;
  color: #333;
}
</style>