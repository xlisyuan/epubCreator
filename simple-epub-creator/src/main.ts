import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 引入 Element Plus 的所有圖示
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// 將 Element Plus 註冊到 Vue 應用程式中
app.use(ElementPlus)

// 註冊所有 Element Plus 的圖示
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.mount('#app')
