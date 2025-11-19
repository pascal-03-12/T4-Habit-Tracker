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
      meta: { requiresAuth: true } 
    }
  ]
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {

    const authStore = useAuthStore() 

    if (authStore.isAuthenticated) {
      next()
    } else {
      console.log("Zugriff verweigert. Leite zum Login weiter.");
      next('/login')
    }
  } else {
    next()
  }
})
export default router