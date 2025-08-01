<template>
  <div class="epub-creator">
    <h1>我的線上 EPUB 編輯器</h1>
    <p>上傳你的 .txt 檔案，快速製作電子書！</p>
    <el-upload
      class="upload-area"
      drag
      :auto-upload="false"
      :on-change="handleFileUpload"
      :show-file-list="false"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        將檔案拖曳至此處或 <em>點擊上傳</em>
      </div>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// import { UploadFilled } from '@element-plus/icons-vue'; //已經被全域引入

// 儲存檔案內容的變數
const fileContent = ref<string>('');

const handleFileUpload = (file: any) => {
  if (!file.raw) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target && typeof e.target.result === 'string') {
      fileContent.value = e.target.result;
      console.log('檔案內容已讀取:', fileContent.value.substring(0, 100) + '...');
      // TODO: 在這裡呼叫章節處理函式
    }
  };
  reader.readAsText(file.raw, 'UTF-8');
};
</script>

<style>
.epub-creator {
  max-width: 800px;
  margin: 50px auto;
  padding: 20px;
  text-align: center;
  font-family: sans-serif;
}
.upload-area {
  margin-top: 30px;
  border-radius: 6px;
  transition: all 0.3s;
}
</style>