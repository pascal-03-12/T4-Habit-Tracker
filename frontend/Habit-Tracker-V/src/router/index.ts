// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue' 
import { useAuthStore } from '@/stores/auth'
import DashboardView from '../views/DashboardView.vue' 

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/about', name: 'about', component: () => import('../views/AboutView.vue') },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      // der "Wächter" (Navigation Guard)
      meta: { requiresAuth: true } 
    }
  ]
})

// NEU: Der globale "Navigations-Wächter"
// Diese Funktion wird VOR JEDEM Seitenwechsel ausgeführt
router.beforeEach((to, from, next) => {
  // Prüfe, ob die Ziel-Seite "meta: { requiresAuth: true }" hat
  if (to.meta.requiresAuth) {

    // Wir müssen den Store *innerhalb* dieser Funktion initialisieren
    const authStore = useAuthStore() 

    if (authStore.isAuthenticated) {
      // Fall 1: Benutzer ist eingeloggt -> Alles gut, lade die Seite
      next()
    } else {
      // Fall 2: Benutzer ist NICHT eingeloggt -> Wirf ihn zur Login-Seite
      console.log("Zugriff verweigert. Leite zum Login weiter.");
      next('/login')
    }
  } else {
    // Fall 3: Die Seite erfordert keinen Login (z.B. Home, Login) -> Lade sie einfach
    next()
  }
})
export default router