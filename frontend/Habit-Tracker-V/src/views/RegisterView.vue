<script setup lang="ts">
import { ref } from 'vue';

const email = ref('');
const password = ref('');

const message = ref('');

const handleRegister = async () => {
  try {
    message.value = 'Registrierung wird durchgeführt...';

    const response = await fetch('http://localhost:8000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      message.value = `Fehler: ${data.message}`;
    } else {
      message.value = `Erfolg: ${data.message}`;
      email.value = '';
      password.value = '';
    }

  } catch (error) {
    console.error('Registrierungsfehler:', error);
    message.value = 'Fehler: Verbindung zum Server fehlgeschlagen.';
  }
};
</script>

<template>
  <main class="register-page">
    <h2>Registrierung</h2>
    <p>Erstelle ein neues Konto.</p>

    <form @submit.prevent="handleRegister">
      <div>
        <label for="email">E-Mail:</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div>
        <label for="password">Passwort (min. 6 Zeichen):</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit">Konto erstellen</button>
    </form>

    <div v-if="message" class="message">
      <p>{{ message }}</p>
    </div>
  </main>
</template>

<style scoped>
.register-page {
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