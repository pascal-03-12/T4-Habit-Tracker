import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
// --- Vue App Initialisierung ---
const app = createApp(App)

// --- Plugins registrieren (Pinia & Vue Router) ---
app.use(createPinia())
app.use(router)

app.mount('#app')
