import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const router = useRouter() 

  const storedToken = localStorage.getItem('authToken');
  if (storedToken) {
    token.value = storedToken;
  }

  // GETTERS
  const isAuthenticated = computed(() => !!token.value) 

  // ACTIONS
  function login(newToken: string) {
    token.value = newToken
    localStorage.setItem('authToken', newToken) 
  }

  function logout() {
    token.value = null
    localStorage.removeItem('authToken')

    // Nach dem Logout zur Login-Seite weiterleiten
    router.push('/login') 
    console.log("Erfolgreich ausgeloggt.");
  }

  return { token, login, logout, isAuthenticated }

}) 