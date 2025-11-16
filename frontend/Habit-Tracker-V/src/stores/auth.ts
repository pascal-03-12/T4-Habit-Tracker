// src/stores/auth.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// Definiert den Store für die Authentifizierung
export const useAuthStore = defineStore('auth', () => {
  // State: Das JWT-Token, 'null' bei "nicht angemeldet".
  const token = ref<string | null>(null);

  // Initialisierung: Versucht, die Session aus dem localStorage wiederherzustellen.
  const storedToken = localStorage.getItem('authToken');
  if (storedToken) {
    token.value = storedToken;
  }

  // Getter: Abgeleiteter Wert, der die meiste Logik für Guards/Komponenten kapselt.
  const isAuthenticated = computed(() => !!token.value);

  // Action: Speichert das Token im State und im localStorage.
  function login(newToken: string) {
    token.value = newToken;
    localStorage.setItem('authToken', newToken);
  }

  // Action: Entfernt das Token aus State und localStorage.
  function logout() {
    token.value = null;
    localStorage.removeItem('authToken');
  }

  // Öffentliches Interface des Stores
  return {
    token,
    isAuthenticated,
    login,
    logout,
  }
})