# Bank Profile 文件生成器 - 模組化架構

## 概述

本系統已完成模組化重構，將原本單一的 `generate_docs.js` 拆分為獨立的模組和格式專用生成器，解決了「修復 PPTX 卻破壞 DOCX」的問題。

## 目錄結構

```
.specify/scripts/generate/
├── shared/                          # 共用模組
│   ├── config.js                   # 配置（設計常數、路徑）
│   ├── markdown-parser.js          # Markdown 解析（PPTX + DOCX）
│   ├── mermaid-handler.js          # Mermaid 圖表處理
│   └── file-utils.js               # 檔案讀取與解析
│
├── pptx/                            # PPTX 專用模組
│   ├── pptx-generator.js           # 主要生成邏輯
│   ├── pptx-helpers.js             # 輔助函數（投影片建立）
│   ├── pptx-layouts.js             # Mermaid 圖表佈局
│   └── content-simplifier.js       # 內容精簡（3-5 關鍵列點）
│
├── docx/                            # DOCX 專用模組
│   ├── docx-generator.js           # 主要生成邏輯
│   ├── docx-formatters.js          # Markdown 格式轉換
│   └── docx-image-handler.js       # 圖片處理（動態尺寸）
│
├── generate-pptx.js                 # PPTX 獨立入口
├── generate-docx.js                 # DOCX 獨立入口
├── generate-all.js                  # 組合生成（DOCX + PPTX）
├── generate-test-pptx.js            # PPTX 測試腳本
└── generate-test-docx.js            # DOCX 測試腳本（新增）
```

## 使用方式

### 1. 生成完整文件（DOCX + PPTX）

```bash
node .specify/scripts/generate/generate-all.js
```

**輸出:**
- `bank-profile/export/Bank_Profile_Full.docx`
- `bank-profile/export/Bank_Profile_Presentation.pptx`

### 2. 僅生成 PPTX

```bash
node .specify/scripts/generate/generate-pptx.js
```

**優點:** 快速測試投影片修改，不影響 DOCX 生成

### 3. 僅生成 DOCX

```bash
node .specify/scripts/generate/generate-docx.js
```

**優點:** 快速測試文件修改，不影響 PPTX 生成

### 4. 測試生成（使用 test/test_slide.md）

```bash
# 測試 PPTX
node .specify/scripts/generate/generate-test-pptx.js

# 測試 DOCX（新增）
node .specify/scripts/generate/generate-test-docx.js
```

**輸出:**
- `test/test_output.pptx`
- `test/test_output.docx`

## 關鍵特色

### 1. 完全隔離

- **PPTX 模組** 只影響投影片生成
- **DOCX 模組** 只影響文件生成
- **共用模組** 提供基礎功能（Markdown 解析、Mermaid 渲染）

**結果:** 修復 PPTX 不會破壞 DOCX，反之亦然

### 2. 智能內容精簡（PPTX）

**文字章節:** 自動選擇 3-5 個關鍵列點
**圖表章節:** 圖表 + 1-2 個摘要列點
**優先策略:** 保留有小標題（▸）的項目

```javascript
// 使用範例
const { selectKeyPoints } = require('./pptx/content-simplifier');

const items = [
  '• 項目 1',
  '▸ 重要小標題 A',
  '• 項目 2',
  '▸ 重要小標題 B',
  '• 項目 3'
];

const keyPoints = selectKeyPoints(items, 3);
// 結果: ['▸ 重要小標題 A', '▸ 重要小標題 B', '• 項目 1']
```

### 3. Markdown 格式完整支援（DOCX）

**支援格式:**
- `**粗體**` → **粗體**
- `*斜體*` → *斜體*
- `***粗斜體***` → ***粗斜體***
- `` `程式碼` `` → `程式碼`（Courier New 字型）

**實作:** `docx-formatters.js` 使用 `parseForDocx()` 將 Markdown 轉換為 `TextRun` 陣列

### 4. 動態圖片尺寸（DOCX + PPTX）

**DOCX:**
- 寬圖（比例 > 1.5）：以寬度 550pt 為準
- 高圖（比例 ≤ 1.5）：以高度 400pt 為準

**PPTX:**
- 超寬（比例 > 1.6）：最大寬度，垂直水平雙向置中
- 中寬（1.2 < 比例 ≤ 1.6）：最大寬度，緊貼標題下方
- 垂直/方形（比例 ≤ 1.2）：最大高度，水平置中

### 5. DOCX 中等版本（過濾長段落）

```javascript
// docx-formatters.js
function createParagraph(text) {
    // 自動過濾超過 150 字元的段落
    if (text.length >= 150 || text.trim().length === 0) {
        return null;
    }
    // ... 建立段落
}
```

**結果:** DOCX 作為 PPTX 的補充，保留主要結構和列點，略過冗長說明

## 模組功能說明

### shared/config.js

**用途:** 集中管理所有配置

**匯出:**
- `BANK_PROFILE_DIR` - Bank Profile 檔案目錄
- `OUTPUT_DIR` - 輸出目錄
- `FILES` - Bank Profile 檔案清單（00-90）
- `PPTX_DESIGN` - PPTX 設計常數（顏色、字型、佈局）
- `DOCX_DESIGN` - DOCX 設計常數（字型、間距、Mermaid 尺寸）
- `MERMAID_CONFIG` - Mermaid 渲染器配置
- `CONTENT_CONFIG` - 內容過濾配置（PPTX 關鍵點數量、DOCX 段落長度）

### shared/markdown-parser.js

**用途:** 解析 Markdown 格式為各格式專用結構

**函數:**

#### `parseForPptx(text)`
- 返回: `[{ text, options }]` 陣列
- 用途: PPTX 格式（支援 `bold`, `italic`, `fontFace`）
- **修復:** 前置檢查避免列點符號衝突

#### `parseForDocx(text)`
- 返回: `TextRun[]` 陣列
- 用途: DOCX 格式（使用 `docx` 庫的 `TextRun`）
- **修復:** 完整支援 `**bold**`, `*italic*`, `` `code` ``

### shared/mermaid-handler.js

**用途:** 包裝 MermaidRenderer 並管理圖表快取

**類別:** `MermaidHandler`

**方法:**
- `renderAll(content, fileKey)` - 渲染所有圖表
- `getDiagram(key)` - 取得圖表路徑
- `getAllDiagrams()` - 取得所有圖表
- `hasDiagram(key)` - 檢查圖表是否存在
- `clear()` - 清除快取

### shared/file-utils.js

**用途:** 檔案讀取與 Markdown 解析

**函數:**
- `parseMarkdownFile(filePath, fileName, mermaidDiagrams)` - 解析單一檔案
- `readAllBankProfileFiles(mermaidDiagrams)` - 讀取所有 Bank Profile 檔案
- `ensureOutputDirectory()` - 確保輸出目錄存在
- `bankProfileExists()` - 檢查 Bank Profile 目錄是否存在
- `getExistingFiles()` - 取得已存在的檔案清單

### pptx/content-simplifier.js

**用途:** PPTX 內容精簡邏輯

**函數:**

#### `selectKeyPoints(items, maxItems)`
- 智能選擇關鍵列點
- 優先保留有小標題（▸）的項目
- 不足時用一般列點（•）補足

#### `splitContentIntoPages(items, maxLines)`
- 將內容分頁（每頁最多 `maxLines` 行）
- 自動計算項目行數（每 80 字元 = 1 行）

### pptx/pptx-helpers.js

**用途:** PPTX 投影片建立輔助函數

**函數:**
- `createTitleSlide(pptx, title, subtitle)` - 建立標題投影片
- `createSectionSlide(pptx, fileName, sectionTitle)` - 建立章節分隔投影片
- `createContentSlide(pptx, fileName, sectionTitle, contentItems, pageNum, totalPages)` - 建立內容投影片

### pptx/pptx-layouts.js

**用途:** Mermaid 圖表智能佈局

**函數:**

#### `addMermaidDiagram(slide, imagePath, title, pptx)`
- 使用 `image-size` 讀取實際尺寸
- 根據縱橫比自動選擇佈局模式
- 返回: `{width, height, x, y, aspectRatio}`

#### `createMermaidSlide(pptx, fileName, sectionTitle, imagePath)`
- 建立 Mermaid 圖表投影片
- 標題 28pt，左對齊，位於頂部

### pptx/pptx-generator.js

**用途:** PPTX 主要生成邏輯

**函數:**

#### `generatePptx(filesData, outputPath)`
- 接收已解析的檔案資料
- 整合所有 PPTX 模組
- 實作內容精簡策略（有圖表 vs 純文字）
- 輸出 `.pptx` 檔案

### docx/docx-formatters.js

**用途:** DOCX 段落格式化

**函數:**
- `createHeading(text, level)` - 建立標題段落（H1, H2, H3）
- `createBullet(text, level)` - 建立列點段落（支援 Markdown）
- `createNumberedList(text, level)` - 建立編號列表（支援 Markdown）
- `createParagraph(text)` - 建立一般段落（自動過濾長段落 >150 字元）
- `createSpacer()` - 建立空白段落

### docx/docx-image-handler.js

**用途:** DOCX 圖片處理

**函數:**

#### `createMermaidImage(imagePath)`
- 使用 `image-size` 讀取實際尺寸
- 根據縱橫比動態計算寬高
- 返回: `Paragraph` 包含 `ImageRun`

#### `imageExists(imagePath)`
- 檢查圖片檔案是否存在

#### `getImageDimensions(imagePath)`
- 返回: `{width, height, aspectRatio}`

### docx/docx-generator.js

**用途:** DOCX 主要生成邏輯

**函數:**

#### `parseFileToDocx(filePath, fileName, mermaidDiagrams)`
- 解析 Markdown 檔案為 DOCX 段落陣列
- 處理標題、列點、編號列表、Mermaid 圖表
- 過濾長段落（>150 字元）

#### `generateDocx(filesData, mermaidDiagrams, outputPath, baseDir)`
- 接收已解析的檔案資料
- 整合所有 DOCX 模組
- 輸出 `.docx` 檔案

## 修復記錄

### 已修復問題

#### 1. PPTX 疊字問題 ✅
**根本原因:** 列點符號 `* ` 被 `/\*(.+?)\*/g` 誤判為斜體標記

**解決方案:**
```javascript
// markdown-parser.js - parseForPptx()
if (text.trim().startsWith('• ') || text.trim().startsWith('▸ ')) {
    return [{ text: text, options: {} }];
}

// 改進 regex 使用 lookbehind
{ regex: /(?<=[^\s])\*([^\s*][^*]*?)\*/g, format: { italic: true }, priority: 3 }
```

#### 2. DOCX Markdown 格式未轉換 ✅
**根本原因:** DOCX 生成沒有 Markdown 解析邏輯

**解決方案:**
- 新增 `parseForDocx()` 函數（`markdown-parser.js`）
- 更新所有段落生成使用此解析器（`docx-formatters.js`）

#### 3. DOCX Mermaid 圖片固定尺寸 ✅
**根本原因:** 硬編碼 `{ width: 600, height: 400 }`

**解決方案:**
```javascript
// docx-image-handler.js
const dimensions = sizeOf(imagePath);
const aspectRatio = dimensions.width / dimensions.height;

if (aspectRatio > 1.5) {
    width = 550;
    height = width / aspectRatio;
} else {
    height = 400;
    width = height * aspectRatio;
}
```

#### 4. PPTX Mermaid 圖表尺寸不當 ✅
**根本原因:** 固定尺寸 8x4 英吋，未考慮縱橫比

**解決方案:**
- 三層佈局系統（`pptx-layouts.js`）
- 超寬（>1.6）、中寬（1.2-1.6）、垂直/方形（≤1.2）

#### 5. PPTX 內容過於冗長 ✅
**解決方案:**
- `selectKeyPoints()` 智能選擇（`content-simplifier.js`）
- 有圖表：1-2 個摘要點
- 純文字：3-5 個關鍵點

#### 6. DOCX 內容過於冗長 ✅
**解決方案:**
- `createParagraph()` 自動過濾 >150 字元段落
- DOCX 作為中等版本，補充 PPTX

## 測試驗證

### 測試檔案
- **輸入:** `test/test_slide.md`（繁體中文）
- **輸出:**
  - `test/test_output.pptx`
  - `test/test_output.docx`

### 驗證項目

#### PPTX
- ✅ 無疊字問題
- ✅ 內容精簡（3-5 關鍵列點）
- ✅ Mermaid 圖表尺寸正確（縱橫比保持）
- ✅ 標題 28pt 左對齊
- ✅ 優先保留小標題（▸）

#### DOCX
- ✅ Markdown 格式正確（**粗體**、*斜體*、`` `程式碼` ``）
- ✅ Mermaid 圖片尺寸適當（動態計算）
- ✅ 過濾長段落（>150 字元）
- ✅ 列點和編號列表正確

#### 組合生成
- ✅ DOCX + PPTX 同時生成成功
- ✅ 無相互干擾
- ✅ 共用 Mermaid 渲染結果

## 設計原則

### 1. 單一職責原則
- 每個模組只負責一個特定功能
- PPTX 模組不依賴 DOCX 模組，反之亦然

### 2. 依賴倒置原則
- 高階模組（generator）依賴低階模組（shared）
- 共用邏輯抽取到 shared 目錄

### 3. 開放封閉原則
- 易於擴展（新增格式專用模組）
- 不需修改共用模組

### 4. 接口隔離原則
- 每個入口點（generate-pptx, generate-docx, generate-all）提供明確接口
- 測試腳本可獨立運行

## 向後相容性

### 原始腳本
- `generate_docs.js` 保留作為參考
- 建議使用 `generate-all.js` 替代

### 輸出位置
- 與原始腳本相同
- `bank-profile/export/Bank_Profile_Full.docx`
- `bank-profile/export/Bank_Profile_Presentation.pptx`

## 未來改進建議

### 1. 配置檔案化
- 允許使用者自訂關鍵點數量
- 允許使用者自訂段落長度閾值
- 允許使用者自訂顏色方案

### 2. 增量渲染
- 只渲染修改過的 Mermaid 圖表
- 使用檔案時間戳記判斷

### 3. 平行化生成
- DOCX 和 PPTX 可平行生成
- 使用 `Promise.all([generateDocx(), generatePptx()])`

### 4. 錯誤處理增強
- 詳細的錯誤訊息
- 部分失敗時繼續生成其他檔案

### 5. 格式擴展
- 支援 PDF 輸出（使用 `puppeteer` 或 `pdf-lib`）
- 支援 Markdown 輸出（便於版本控制）

## 技術依賴

### 必要套件
- `docx` - Word 文件生成
- `pptxgenjs` - PowerPoint 生成
- `image-size` - 圖片尺寸偵測
- 自訂 `MermaidRenderer` - Mermaid 圖表渲染

### 安裝指令
```bash
npm install docx pptxgenjs image-size
```

## 問題排除

### Mermaid 圖表未顯示
```bash
# 清除快取重新生成
rm -rf .temp/mermaid
node .specify/scripts/generate/generate-all.js
```

### 模組載入失敗
```bash
# 確認目錄結構
ls -R .specify/scripts/generate/

# 應該看到 shared/, pptx/, docx/ 目錄
```

### 字型或樣式問題
- 確認系統已安裝必要字型
- 修改 `shared/config.js` 中的 `PPTX_DESIGN` 或 `DOCX_DESIGN`

## 更新日誌

詳見:
- `CHANGELOG.md` - 完整修復記錄
- `CHANGELOG_MERMAID.md` - Mermaid 佈局優化記錄

## 聯絡資訊

如有問題或建議，請建立 Issue 或聯絡開發團隊。
