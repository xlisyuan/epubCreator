import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
// defineConfig 現在接收一個回呼函式，它會提供 'command' 和 'mode' 參數
export default defineConfig(({ command }) => {
    return {
        plugins: [vue(), vueDevTools()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        // ✨ 修正：根據 command 條件式設定 base 路徑 ✨
        // 如果是 'build' 命令 (npm run build)，設定為 GitHub Pages 的子路徑
        // 如果是 'serve' 命令 (npm run dev)，則保持為根路徑 '/'
        base: command === 'build' ? '/epubCreator/simple-epub-creator/' : '/',
    }
})
