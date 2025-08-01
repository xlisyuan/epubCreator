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
import { v4 as uuidv4 } from 'uuid'
import chardet from 'chardet'
import { Converter } from 'opencc-js'
import JSZip from 'jszip'
import { UploadFilled } from '@element-plus/icons-vue'

// 儲存檔案內容的變數
const fileContent = ref<string>('')
// 儲存結構化章節資料（包含標題、處理後的 HTML 內容和 body 的 ID）
const chaptersData = ref<{ title: string; contentHtml: string; bodyId: string }[]>([])
const bookTitle = ref<string>('')
const author = ref<string>('')

/**
 * 簡繁轉換器實例
 */
const converter = Converter({ from: 'cn', to: 'twp' })

/**
 * 處理檔案上傳
 */
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
                text = convertToTraditional(text) // 轉換整個檔案內容為繁體

                const traditionalFileName = convertToTraditional(file.name) // 轉換檔案名稱為繁體

                fileContent.value = text
                setDefaultBookData(traditionalFileName, text.substring(0, 200)) // 使用轉換後的檔名和內容
                processChapters(fileContent.value) // 處理章節
            }
        }
        // 如果偵測失敗，預設使用 UTF-8
        textReader.readAsText(file.raw, detectedEncoding || 'UTF-8')
    }
    // 讀取為 ArrayBuffer，以便 chardet 函式庫進行偵測
    reader.readAsArrayBuffer(file.raw)
}

/**
 * 將簡體中文轉換為繁體中文
 */
const convertToTraditional = (content: string) => {
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

/**
 * 輔助函式：使用正規表達式取得匹配文字
 */
const getMatch = (text: string, regexStr: string): string | null => {
    const regex = new RegExp(regexStr, 'i')
    const match = text.match(regex)
    if (!match) return null
    // 取得最後一組捕捉群組（避免多組括號時取錯）
    const lastGroup = match[match.length - 1]
    // 去除全半形空白、冒號、連字號等符號
    return lastGroup.replace(/[:：\s\u3000\-－_]+/g, '').trim() // 增加 trim() 確保沒有多餘空白
}

/**
 * 章節切割與內容處理
 * 返回包含標題、HTML 內容和 body ID 的物件陣列
 */
const processChapters = (text: string) => {
    // 使用正規表達式尋找章節標題
    const chapterRegex =
        /(^第[零一二三四五六七八九十百千萬\d]+章.*|^[一二三四五六七八九十百千萬\d]+、.*|^[0-9]+\..*)/gm
    const matchedParts = text.split(chapterRegex)

    const tempChaptersData: { title: string; contentHtml: string; bodyId: string }[] = []
    if (matchedParts.length > 1) {
        // 第一個元素通常是序言或空白，先忽略
        for (let i = 1; i < matchedParts.length; i += 2) {
            const chapterTitleRaw = matchedParts[i].trim() // 乾淨的章節標題
            const chapterContentRaw = matchedParts[i + 1] ? matchedParts[i + 1].trim() : '' // 章節內容
            const chapterFileIndex = (i - 1) / 2 + 1 // 計算章節檔案的 1-based 索引
            const bodyId = `body_chapter${chapterFileIndex}` // 為 body 標籤生成 ID

            // 為 <h1> 標籤添加一個唯一的 id
            const contentHtml = `<h1 id="chapter${chapterFileIndex}_start">${chapterTitleRaw}</h1>\n${chapterContentRaw
                .split('\n')
                .map((line) => `<p>${line.trim()}</p>`)
                .join('\n')}`

            tempChaptersData.push({
                title: chapterTitleRaw, // 儲存乾淨的標題用於目錄
                contentHtml: contentHtml, // 儲存完整的 HTML 內容用於章節檔案
                bodyId: bodyId, // 儲存 body 的 ID
            })
        }
    } else {
        // 如果沒有章節標題，將整個檔案視為單一章節
        const bodyId = `body_main`
        tempChaptersData.push({
            title: bookTitle.value || '正文', // 使用書名或預設標題
            contentHtml: `<p>${text.replace(/\n\s*\n/g, '</p>\n<p>')}</p>`,
            bodyId: bodyId,
        })
    }

    chaptersData.value = tempChaptersData // 更新 chaptersData
    console.log('切割後的章節數:', chaptersData.value.length)
}

/**
 * 生成 EPUB 檔案
 */
const generateEpub = async () => {
    if (!bookTitle.value || !author.value || chaptersData.value.length === 0) {
        console.error('請填寫書名和作者，並上傳檔案。') // 改用 console.error
        return
    }

    const zip = new JSZip()

    // 1. mimetype (EPUB 必需)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

    // 2. META-INF/container.xml (EPUB 必需)
    const metaInf = zip.folder('META-INF')
    if (!metaInf) {
        console.error('無法建立 META-INF 資料夾。') // 改用 console.error
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
        console.error('無法建立 OEBPS 資料夾。') // 改用 console.error
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
    chaptersData.value.forEach((chapter, index) => {
        const chapterId = `chapter-${index + 1}`
        const chapterFilename = `${chapterId}.xhtml`

        // 為 <body> 標籤添加 ID
        const xhtmlContent = `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-TW">
<head>
    <title>${chapter.title}</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body id="${chapter.bodyId}"> <!-- 添加 body ID -->
    ${chapter.contentHtml}
</body>
</html>`

        OEBPS.file(chapterFilename, xhtmlContent)
        manifestItems.push(
            `<item id="${chapterId}" href="${chapterFilename}" media-type="application/xhtml+xml"/>`,
        )
        spineItems.push(`<itemref idref="${chapterId}"/>`)
    })

    // 6. content.opf (書籍資訊與檔案清單)
    // 新增 nav.xhtml 的 manifest item
    const manifestWithNav = `${manifestItems}\n<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`

    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">urn:uuid:${uuidv4()}</dc:identifier>
    <dc:title>${bookTitle.value}</dc:title>
    <dc:creator>${author.value}</dc:creator>
    <dc:language>zh-TW</dc:language>
  </metadata>
  <manifest>
    ${manifestWithNav}
    <item id="style" href="style.css" media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="nav" /> <!-- 將 nav 放在 spine 的最前面 -->
    ${spineItems.join('\n    ')}
  </spine>
</package>`

    if (OEBPS) {
        OEBPS.file('content.opf', contentOpf)
    }

    // 7. 生成 nav.xhtml 檔案
    const navContent = generateNavFile(chaptersData.value) // 傳遞結構化的章節資料
    if (OEBPS) {
        OEBPS.file('nav.xhtml', navContent)
    }

    // 8. 打包成 EPUB
    zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE', // 這是預設的壓縮方式
        compressionOptions: {
            level: 9, // 最高壓縮率
        },
    }).then((content) => {
        const a = document.createElement('a')
        document.body.appendChild(a)
        a.href = URL.createObjectURL(content)
        a.download = `${bookTitle.value}.epub`
        a.click()
        document.body.removeChild(a)
        console.log('EPUB 生成成功，開始下載！') // 改用 console.log
    })
}

/**
 * 生成 nav.xhtml 目錄檔案
 */
const generateNavFile = (chapters: { title: string; contentHtml: string; bodyId: string }[]) => {
    const chapterLinks = chapters
        .map((chapter, index) => {
            const chapterTitleForNav = chapter.title || `第 ${index + 1} 章`
            // 連結到 body 的 ID
            return `<li id="toc-chapter${index + 1}"><a href="chapter${index + 1}.xhtml#${chapter.bodyId}">${chapterTitleForNav}</a></li>`
        })
        .join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="zh-TW" lang="zh-TW">
  <head>
    <title>${bookTitle.value} - 目錄</title>
	<meta charset="utf-8" />
    <link rel="stylesheet" type="text/css" href="style.css" />
  </head>
  <body>
    <nav epub:type="toc" id="toc">
      <h1>目錄</h1>
      <ol>
        ${chapterLinks}
      </ol>
    </nav>
  </body>
</html>`
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
