// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // ✅ 이거 추가되어 있어야 해
import { registerPlugins } from '@/plugins'

const app = createApp(App)
registerPlugins(app)

app.use(router) // ✅ 라우터 등록 필수
app.mount('#app')
