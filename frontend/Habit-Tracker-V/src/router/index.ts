import { createRouter, createWebHistory } from 'vue-router'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue' 
import DashboardView from '../views/DashboardView.vue' 
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { 
      path: '/', 
      name: 'home', 
      redirect: '/dashboard' 
    },
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
  const authStore = useAuthStore() 

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router