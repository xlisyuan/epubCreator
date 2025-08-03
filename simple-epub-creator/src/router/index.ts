import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue' // 首頁組件
import TxtToEpubConverter from '@/views/TxtToEpubConverter.vue' // TXT 轉 EPUB 組件

// 根據環境動態獲取 base 路徑
// import.meta.env.BASE_URL 會在 Vite build 時自動替換為 vite.config.ts 中的 base 值
// 在開發環境 (npm run dev) 時，import.meta.env.BASE_URL 會是 '/'
// 在生產/預覽環境 (npm run build / npm run preview) 時，會是 '/epubCreator/simple-epub-creator/'
const BASE_URL = import.meta.env.BASE_URL

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home,
        meta: {
            title: '線上 EPUB 編輯器', // 頁面標題
        },
    },
    {
        path: '/txt-to-epub',
        name: 'TxtToEpubConverter',
        component: TxtToEpubConverter,
        meta: {
            title: '簡易 TXT 生成 EPUB',
        },
    },
    // 未來功能頁面
    // {
    //   path: '/text-epub-editor',
    //   name: 'TextEpubEditor',
    //   component: () => import('@/views/TextEpubEditor.vue'), // lazy loading
    //   meta: { title: '文字 EPUB 編輯器' }
    // },
    // {
    //   path: '/image-epub-editor',
    //   name: 'ImageEpubEditor',
    //   component: () => import('@/views/ImageEpubEditor.vue'), // lazy loading
    //   meta: { title: '圖片 EPUB 編輯器' }
    // },
    // {
    //   path: '/future-plans',
    //   name: 'FuturePlans',
    //   component: () => import('@/views/FuturePlans.vue'), // lazy loading
    //   meta: { title: '未來計畫' }
    // }
]

const router = createRouter({
    history: createWebHistory(BASE_URL), // ✨ 將 BASE_URL 傳遞給 createWebHistory ✨
    routes,
})

// 導航守衛：更新頁面標題
router.beforeEach((to, from, next) => {
    if (to.meta.title) {
        document.title = to.meta.title as string
    }
    next()
})

export default router
