<template>
    <div class="home-page">
        <h1>線上 EPUB 編輯器</h1>
        <p>選擇想要使用的功能：</p>
        <div class="home-buttons">
            <el-button type="primary" @click="goToTxtToEpub"> 簡易 TXT 快速生成 EPUB </el-button>
            <el-button type="info" disabled> 製作文字為主 EPUB (內容 A - 規劃中) </el-button>
            <el-button type="info" disabled> 製作圖片為主 EPUB (內容 B - 規劃中) </el-button>
            <el-button type="info" disabled> 未來計畫 (預覽) </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToTxtToEpub = () => {
    router.push('/txt-to-epub')
}
</script>

<style scoped>
.home-page {
    max-width: 800px;
    margin: 50px auto;
    padding: 20px;
    text-align: center;
    font-family: sans-serif;
}
.home-buttons {
    display: flex;
    flex-direction: column;
    gap: 15px; /* 按鈕之間的垂直間距 */
    margin-top: 30px;
}
.home-buttons .el-button {
    width: 100%;
}
</style>
