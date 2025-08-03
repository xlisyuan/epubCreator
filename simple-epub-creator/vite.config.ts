import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
// defineConfig 現在接收一個回呼函式，它會提供 'command' 和 'mode' 參數
export default defineConfig(({ mode }) => {
    // 使用 mode 參數
    const isProduction = mode === 'production' // 判斷是否為生產模式 (build 或 preview)
    return {
        plugins: [vue(), vueDevTools()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        // 如果為生產模式，設定為 GitHub Pages 的子路徑，否則為根路徑 '/' ✨
        base: isProduction ? '/epubCreator/simple-epub-creator/' : '/',
    }
})
