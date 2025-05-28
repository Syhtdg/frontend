// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // ✅ 이거 추가되어 있어야 해
import { registerPlugins } from '@/plugins'
import { createPinia } from 'pinia'

const app = createApp(App)
registerPlugins(app)

app.use(router) // ✅ 라우터 등록 필수
app.mount('#app')

// Pinia 플러그인 등록
app.use(createPinia())
app.use(router)
