import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const isProduction = mode === 'production'
    return {
        plugins: [vue(), vueDevTools()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        // 如果為生產模式，base 路徑應為你的儲存庫名稱 '/epubCreator/'
        // 因為 dist 內容會被推送到 gh-pages 分支的根目錄
        // 最終網址會是 https://xlisyuan.github.io/epubCreator/
        base: isProduction ? '/epubCreator/' : '/',
    }
})
