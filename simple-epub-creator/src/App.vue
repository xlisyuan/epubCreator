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
            <div class="el-upload__text">將檔案拖曳至此處或 <em>點擊上傳</em></div>
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
import { ref } from 'vue'
import chardet from 'chardet'
import { Converter } from 'opencc-js'
import JSZip from 'jszip' // 引入 JSZip

// 儲存檔案內容的變數
const fileContent = ref<string>('')
const chapters = ref<string[]>([])
const bookTitle = ref<string>('')
const author = ref<string>('')

/**
 * 轉換成繁體
 */
const converter = Converter({ from: 'cn', to: 'twp' })

const handleFileUpload = (file: any) => {
    if (!file.raw) return

    const reader = new FileReader()
    reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer

        // 偵測檔案編碼
        const detectedEncoding = chardet.detect(new Uint8Array(buffer))

        const textReader = new FileReader()
        textReader.onload = (textEvent) => {
            if (textEvent.target && typeof textEvent.target.result === 'string') {
                let text = textEvent.target.result
                text = convertToTraditional(text)

                const traditionalFileName = convertToTraditional(file.name)

                fileContent.value = text
                // console.log('檔案內容已讀取:', fileContent.value.substring(0, 100) + '...');
                setDefaultBookData(traditionalFileName, text.substring(0, 200))
                processChapters(fileContent.value)
            }
        }
        // 如果偵測失敗，預設使用 UTF-8
        textReader.readAsText(file.raw, detectedEncoding || 'UTF-8')
    }
    // 讀取為 ArrayBuffer，以便 chardet 函式庫進行偵測
    reader.readAsArrayBuffer(file.raw)
}

const convertToTraditional = (content: string) => {
    console.log('正在將簡體中文轉換為繁體中文...')
    return converter(content)
}

/**
 * 自動偵測預設書名與作者
 */
const setDefaultBookData = (fileName: string, firstParagraph: string) => {
    const titleMatch =
        getMatch(firstParagraph, `(書名|題名|標題|名稱|題目)[\\s:：　]*([^\\n]+)`) || // 關鍵字後文字
        getMatch(firstParagraph, `《\\s*(.*?)\\s*》`) || // 書名號中間文字
        getMatch(fileName, `《\\s*(.*?)\\s*》`) || // 檔名的書名號
        getMatch(fileName, `([\\s\\S]*?)(?=作者|by)`) || // 檔名裡作者前文字當標題
        fileName.split(`.`)[0] // 最後用檔名

    const authorMatch =
        getMatch(firstParagraph, `(作者|by)[:：\\s\\u3000\\-－]*([^\\r\\n]+)`) || // 內文作者
        getMatch(fileName, `(作者|by)[:：\\s\\u3000\\-－]*([^\\.]+)`) // 檔名作者

    // 對重要的書名和作者進行二次確認和轉換。
    bookTitle.value = convertToTraditional(titleMatch || '未知')
    author.value = convertToTraditional(authorMatch || '未知')

    console.log('自動偵測到 書名:', bookTitle.value, '作者:', author.value)
}

const getMatch = (text: string, regexStr: string): string | null => {
    const regex = new RegExp(regexStr, 'i')
    const match = text.match(regex)
    if (!match) return null
    // 取得最後一組捕捉群組（避免多組括號時取錯）
    const lastGroup = match[match.length - 1]
    // 去除全半形空白、冒號、連字號等符號
    return lastGroup.replace(/[:：\s\u3000\-－_]+/g, '')
}

const processChapters = (content: string) => {
    // 簡單的章節切割邏輯：以「第一章」或「第1章」為分隔
    const chapterRegex = /(第[零一二三四五六七八九十百千萬\d]+[章回])/g
    const parts = content.split(chapterRegex)

    // 重新組合章節標題和內容
    const combinedChapters: string[] = []
    for (let i = 1; i < parts.length; i += 2) {
        if (parts[i + 1]) {
            combinedChapters.push(parts[i] + parts[i + 1].trim())
        }
    }
    chapters.value = combinedChapters
    console.log('切割後的章節數:', chapters.value.length)
}

const generateEpub = async () => {
    if (!bookTitle.value || !author.value || chapters.value.length === 0) {
        alert('請填寫書名和作者，並上傳檔案。')
        return
    }

    const zip = new JSZip()

    // 1. mimetype (EPUB 必需)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

    // 2. META-INF/container.xml (EPUB 必需)
    const metaInf = zip.folder('META-INF')
    if (!metaInf) {
        alert('無法建立 META-INF 資料夾。')
        return
    }
    metaInf.file(
        'container.xml',
        `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
    )

    // 3. OEBPS 目錄
    const OEBPS = zip.folder('OEBPS')
    if (!OEBPS) {
        alert('無法建立 OEBPS 資料夾。')
        return
    }

    // 4. style.css (你設計的預設樣式)
    const defaultCss = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif; line-height: 1.8; margin: 0; padding: 1.5em; }
    h1 { font-size: 1.8em; text-align: center; margin-bottom: 2em; }
    p { text-indent: 2em; margin-bottom: 1em; }
  `
    OEBPS.file('style.css', defaultCss)

    // 5. 產生每個章節的 XHTML 檔案
    const manifestItems: string[] = []
    const spineItems: string[] = []
    chapters.value.forEach((chapterContent, index) => {
        const chapterId = `chapter-${index + 1}`
        const chapterTitle = `第${index + 1}章`
        const chapterFilename = `${chapterId}.xhtml`

        const xhtmlContent = `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-TW">
<head>
    <title>${chapterTitle}</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
    <h1>${chapterTitle}</h1>
    ${chapterContent
        .split('\n')
        .map((line) => `<p>${line.trim()}</p>`)
        .join('\n')}
</body>
</html>`

        OEBPS.file(chapterFilename, xhtmlContent)
        manifestItems.push(
            `<item id="${chapterId}" href="${chapterFilename}" media-type="application/xhtml+xml"/>`,
        )
        spineItems.push(`<itemref idref="${chapterId}"/>`)
    })

    // 6. content.opf (書籍資訊與檔案清單)
    const opfContent = `<?xml version="1.0" encoding="utf-8"?>
<package version="3.0" unique-identifier="pub-id" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${bookTitle.value}</dc:title>
    <dc:creator>${author.value}</dc:creator>
    <dc:language>zh-TW</dc:language>
  </metadata>
  <manifest>
    <item id="style" href="style.css" media-type="text/css"/>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine>
    ${spineItems.join('\n    ')}
  </spine>
</package>`
    OEBPS.file('content.opf', opfContent)

    // 7. 打包成 EPUB
    zip.generateAsync({ type: 'blob' }).then((content) => {
        const a = document.createElement('a')
        document.body.appendChild(a)
        a.href = URL.createObjectURL(content)
        a.download = `${bookTitle.value}.epub`
        a.click()
        document.body.removeChild(a)
        alert('EPUB 生成成功，開始下載！')
    })
}
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
