<script setup lang="ts">
import { ref, onMounted } from 'vue';

const backendMessage = ref('Lade Daten vom Backend...');

onMounted(async () => {
  try {
    // Dieser 'fetch' geht zu deinem Deno-Backend auf Port 8000
    const response = await fetch('http://localhost:8000/api/test');

    if (!response.ok) {
      throw new Error(`HTTP-Fehler! Status: ${response.status}`);
    }

    const data = await response.json();
    // Hier wird die Nachricht "Hallo vom Deno-Backend!" gespeichert
    backendMessage.value = data.message; 

  } catch (error) {
    console.error('Fehler beim Abrufen der Daten:', error);
    backendMessage.value = 'Fehler: Backend konnte nicht erreicht werden.';
  }
});
</script>

<template>
  <main>
  </main>
  <p style="font-family: monospace; background-color: #eee; padding: 10px; color: #333;">
  {{ backendMessage }}
</p>
</template>