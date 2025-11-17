<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
// Lade den Pinia Store
import { useAuthStore } from '@/stores/auth'

// Erstelle eine Instanz des Stores
const authStore = useAuthStore()

// Eine Funktion, die den Logout im Store aufruft
const handleLogout = () => {
  authStore.logout()
}
</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>

        <template v-if="!authStore.isAuthenticated">
          <RouterLink to="/register">Registrierung</RouterLink>
          <RouterLink to="/login">Login</RouterLink>
        </template>

        <template v-else>
          <RouterLink to="/dashboard">Dashboard</RouterLink>
          <a href="#" @click.prevent="handleLogout">Logout</a>
        </template>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

/* Styles für Desktop (aus der Vue-Vorlage) */
@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;
    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>