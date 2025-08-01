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

    <el-card v-if="fileContent" class="info-card">
      <h2>書籍資訊</h2>
      <el-form label-width="100px">
        <el-form-item label="書名">
          <el-input v-model="bookTitle"></el-input>
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="author"></el-input>
        </el-form-item>
      </el-form>
      <el-button type="primary" @click="generateEpub" :disabled="!bookTitle || !author">
        生成 EPUB
      </el-button>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// import { UploadFilled } from '@element-plus/icons-vue'; //已經被全域引入

// 儲存檔案內容的變數
const fileContent = ref<string>('');
const chapters = ref<string[]>([]);
const bookTitle = ref<string>('');
const author = ref<string>('');

const handleFileUpload = (file: any) => {
  if (!file.raw) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target && typeof e.target.result === 'string') {
      fileContent.value = e.target.result;
      // 呼叫章節處理函式
      processChapters(fileContent.value);
    }
  };
  reader.readAsText(file.raw, 'UTF-8');
};

// 新增的章節處理函式
const processChapters = (content: string) => {
  // 簡單的章節切割邏輯：以「第一章」或「第1章」為分隔
  const chapterRegex = /(第[零一二三四五六七八九十百千萬\d]+[章回])/g;
  const parts = content.split(chapterRegex);

  // 重新組合章節標題和內容
  const combinedChapters: string[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    if (parts[i + 1]) {
      combinedChapters.push(parts[i] + parts[i + 1].trim());
    }
  }
  chapters.value = combinedChapters;
  console.log('切割後的章節數:', chapters.value.length);
};

// TODO: 在這裡編寫 generateEpub 函式
const generateEpub = () => {
  console.log('準備生成 EPUB...');
  // 這裡就是步驟三的實作
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
.info-card {
  margin-top: 30px;
  text-align: left;
}
.el-button {
  width: 100%;
  margin-top: 20px;
}
</style>