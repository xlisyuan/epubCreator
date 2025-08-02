import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue' // 首頁組件
import TxtToEpubConverter from '@/views/TxtToEpubConverter.vue' // TXT 轉 EPUB 組件

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
    // 未來可以新增更多路由
    // {
    //   path: '/text-epub-editor',
    //   name: 'TextEpubEditor',
    //   component: () => import('../views/TextEpubEditor.vue'), // lazy loading
    //   meta: { title: '文字 EPUB 編輯器' }
    // },
    // {
    //   path: '/image-epub-editor',
    //   name: 'ImageEpubEditor',
    //   component: () => import('../views/ImageEpubEditor.vue'), // lazy loading
    //   meta: { title: '圖片 EPUB 編輯器' }
    // },
    // {
    //   path: '/future-plans',
    //   name: 'FuturePlans',
    //   component: () => import('../views/FuturePlans.vue'), // lazy loading
    //   meta: { title: '未來計畫' }
    // }
]

const router = createRouter({
    history: createWebHistory(), // 使用 HTML5 History 模式
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
