<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// --- Store und Funktionen ---
const authStore = useAuthStore()
const handleLogout = () => {
  authStore.logout()
}
</script>

<template>
  <header>
    <div class="wrapper">
      <div class="logo-area">
        <span class="app-title">HabitTracker</span>
      </div>

      <nav>
        <template v-if="!authStore.isAuthenticated">
          <RouterLink to="/login">Login</RouterLink>
          <RouterLink to="/register" class="btn-primary">Registrieren</RouterLink>
        </template>

        <template v-else>
          <span class="user-greeting">Hallo!</span>
          <a href="#" @click.prevent="handleLogout" class="logout-link">Logout ↪</a>
        </template>
      </nav>
    </div>
  </header>
  <main class="main-container">
    <RouterView/>
  </main>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: #121212;
  color: #eee;
  font-family: 'Inter', sans-serif;
  min-width: 320px;
  min-height: 100vh;
}

#app {
  max-width: 100%;
  margin: 0;
  padding: 0;
  display: block;
  font-weight: normal;
}
</style>

<style scoped>
header {
  width: 100%;
  background-color: #181818;
  border-bottom: 1px solid #333;
  padding: 1rem 0;
  margin-bottom: 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.wrapper {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  font-weight: bold;
  font-size: 1.3rem;
  color: #4caf50; 
  letter-spacing: -0.5px;
}

nav {
  display: flex;
  align-items: center;
  gap: 20px;
}

nav a {
  text-decoration: none;
  color: #aaa;
  font-size: 0.95rem;
  transition: color 0.2s;
}

nav a:hover {
  color: white;
}

.logout-link {
  color: #e57373;
  border: 1px solid #e57373;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.logout-link:hover {
  background-color: #e57373;
  color: white;
}

.user-greeting {
  color: #666;
  font-size: 0.9rem;
  margin-right: 5px;
}

@media (max-width: 600px) {
  .user-greeting { display: none; }
  .wrapper { flex-direction: column; gap: 10px; }
}

.main-container {
  max-width: 900px; 
  margin: 0 auto;   
  padding: 0 1rem;  
  width: 100%;
}
</style>