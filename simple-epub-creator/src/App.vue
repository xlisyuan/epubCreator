<template>
    <div id="app">
        <!-- 路由視圖將在這裡渲染對應的組件 -->
        <router-view></router-view>
    </div>
</template>

<script setup lang="ts">
// 不需要額外的 script setup 內容，因為導航和頁面內容由 router-view 處理
</script>

<style>
/* 全域樣式，例如 body 的基本字體、背景色等 */
body {
    margin: 0;
    padding: 0;
    background-color: #f4f7f6; /* 輕微的背景色 */
    color: #333;
}
#app {
    /* 可以放一些應用程式級別的樣式，例如最大寬度或置中 */
}
</style>
