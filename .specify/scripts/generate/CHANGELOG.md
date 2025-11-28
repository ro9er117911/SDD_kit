# Bank Profile 文件生成優化記錄

## 更新日期：2025-11-20

## 重大更新總覽

本次更新修復了 PPTX/DOCX 生成的多個關鍵問題，並實作了智能內容精簡功能：

- ✅ **修復 PPTX 疊字問題**（換行/格式衝突）
- ✅ **修復 DOCX Markdown 格式未轉換**（星號直接顯示）
- ✅ **修復 DOCX Mermaid 圖片尺寸**（固定尺寸改為動態計算）
- ✅ **實作 PPTX 內容精簡**（3-5 關鍵列點，優先保留小標題）
- ✅ **實作 DOCX 中等版本**（過濾超過 150 字元的長段落）

---

## 問題修復詳情

### 1. PPTX 疊字問題 ✅

**問題描述**：投影片中的列點項目和小標題會出現重複的符號或文字內容。

**根本原因**：
1. `parseMarkdownText()` 函數的單星號 regex `/\*(.+?)\*/g` 會誤將列點符號 `* ` 當成斜體標記的開始
2. 導致列點內容被錯誤解析和重複處理

**解決方案**：
```javascript
// 1. 前置檢查：如果文字以 bullet 符號開頭，直接返回純文字
if (text.trim().startsWith('• ') || text.trim().startsWith('▸ ')) {
    return [{ text: text, options: {} }];
}

// 2. 改進單星號 regex：只匹配非空白字元後的星號
{ regex: /(?<=[^\s])\*([^\s*][^*]*?)\*/g, format: { italic: true }, priority: 3 }
```

**影響範圍**：
- `.specify/scripts/generate/generate_docs.js` (第 66-86 行)
- `.specify/scripts/generate/generate_test_pptx.js` (第 43-62 行)

---

### 2. DOCX Markdown 格式未轉換 ✅

**問題描述**：DOCX 文件中 `**粗體**`、`*斜體*`、`` `程式碼` `` 等 Markdown 格式會原樣顯示為星號和反引號，而非正確的格式樣式。

**根本原因**：
DOCX 生成完全沒有 Markdown 格式處理邏輯，所有文字都用 `new TextRun({ text: line })` 直接建立。

**解決方案**：
1. **新增 `parseMarkdownForDocx()` 函數**（第 385-487 行）
   ```javascript
   function parseMarkdownForDocx(text) {
       // 解析 Markdown 格式並返回 TextRun 陣列
       const patterns = [
           { regex: /`(.+?)`/g, format: 'code' },
           { regex: /\*\*\*(.+?)\*\*\*/g, format: 'bolditalic' },
           { regex: /\*\*(.+?)\*\*/g, format: 'bold' },
           { regex: /\*(.+?)\*/g, format: 'italic' },
           { regex: /_(.+?)_/g, format: 'italic' }
       ];
       // ... 解析邏輯並返回 TextRun[]
   }
   ```

2. **更新所有 DOCX 段落生成邏輯**（第 564-590 行）
   ```javascript
   // 列點項目
   const cleanText = line.replace(/^[-*]\s+/, '');
   const textRuns = parseMarkdownForDocx(cleanText);
   children.push(new Paragraph({
       children: textRuns,
       bullet: { level: 0 }
   }));

   // 一般段落
   const textRuns = parseMarkdownForDocx(line);
   children.push(new Paragraph({ children: textRuns }));
   ```

**影響範圍**：
- 新增函數：`parseMarkdownForDocx()` (第 385-487 行)
- 修改：列點處理 (第 564-571 行)
- 修改：編號列表處理 (第 572-579 行)
- 修改：一般段落處理 (第 582-590 行)

---

### 3. DOCX Mermaid 圖片尺寸固定 ✅

**問題描述**：所有 Mermaid 圖表在 DOCX 中都使用固定尺寸 600x400 點，導致不同縱橫比的圖表被拉伸或壓縮變形。

**根本原因**：
DOCX 生成使用固定的 `width: 600, height: 400`，沒有根據實際圖片尺寸動態計算。

**解決方案**：
```javascript
// 使用 sizeOf() 讀取實際尺寸
const dimensions = sizeOf(mermaidDiagrams[diagramKey]);
const aspectRatio = dimensions.width / dimensions.height;

// DOCX 頁面可用寬度約 550 點（A4 的 6 英吋）
const maxWidth = 550;
const maxHeight = 400;

let width, height;
if (aspectRatio > 1.5) {
    // 橫向圖：以寬度為準
    width = maxWidth;
    height = width / aspectRatio;
} else {
    // 垂直圖：以高度為準
    height = maxHeight;
    width = height * aspectRatio;
}
```

**影響範圍**：
- `.specify/scripts/generate/generate_docs.js` (第 515-551 行)

---

### 4. DOCX 中等版本（過濾長段落）✅

**問題描述**：DOCX 文件過於冗長，包含許多詳細說明段落。

**目標定位**：DOCX 作為「補充 PPT 的中等版本」，保留主要結構和列點，略過過長段落。

**解決方案**：
```javascript
// 一般段落處理時加入長度過濾
if (line.length < 150 && line.trim().length > 0) {
    const textRuns = parseMarkdownForDocx(line);
    children.push(new Paragraph({ children: textRuns }));
}
// 超過 150 字元的段落會被自動忽略
```

**影響範圍**：
- `.specify/scripts/generate/generate_docs.js` (第 585 行)

---

## 新功能實作

### 5. PPTX 內容精簡（智能關鍵列點選擇）✅

**功能描述**：投影片自動精簡內容，依據章節類型選擇適當數量的關鍵列點。

**設計原則**：
- **有 Mermaid 圖表的章節**：圖表 + 1-2 個關鍵摘要列點
- **純文字章節**：3-5 個關鍵列點
- **選擇策略**：優先保留有小標題（`▸`）的項目

**實作細節**：

1. **新增 `selectKeyPoints()` 函數**（第 627-650 行）
   ```javascript
   function selectKeyPoints(items, maxItems = 5) {
       // Priority strategy: Prefer items with subheadings (▸)
       const withSubheading = items.filter(item => item.trim().startsWith('▸'));
       const withoutSubheading = items.filter(item => !item.trim().startsWith('▸'));

       if (withSubheading.length >= maxItems) {
           // Use subheading items only
           return withSubheading.slice(0, maxItems);
       } else {
           // Mix: all subheadings + regular bullets to fill
           return [...withSubheading, ...withoutSubheading.slice(0, maxItems - withSubheading.length)];
       }
   }
   ```

2. **更新 PPTX 章節處理邏輯**（第 746-916 行）
   ```javascript
   for (const section of sections) {
       const hasDiagram = section.mermaidImages && section.mermaidImages.length > 0;

       if (hasDiagram) {
           // Diagrams + brief summary (1-2 key points)
           const summary = selectKeyPoints(section.items, 2);
           // Create summary slide after diagram
       } else {
           // Text sections with 3-5 key points
           const keyPoints = selectKeyPoints(section.items, 5);
           // Create content slides
       }
   }
   ```

**影響範圍**：
- 新增函數：`selectKeyPoints()` (第 627-650 行)
- 修改：章節渲染邏輯 (第 746-916 行)

**使用範例**：

原始內容（10 個列點）：
```
• 項目 1
• 項目 2
▸ 重要小標題 A
• 項目 3
• 項目 4
▸ 重要小標題 B
• 項目 5
• 項目 6
• 項目 7
• 項目 8
```

精簡後（5 個關鍵列點）：
```
▸ 重要小標題 A
▸ 重要小標題 B
• 項目 1
• 項目 2
• 項目 3
```

---

## Mermaid 圖表佈局優化（延續之前的實作）

### 智能佈局系統

PPTX 根據圖表縱橫比自動選擇最佳佈局：

**超寬圖表（比例 > 1.6）**
- 適用：序列圖、超寬流程圖
- 佈局：使用最大寬度，垂直水平雙向置中

**中等寬圖表（1.2 < 比例 ≤ 1.6）**
- 適用：橫向流程圖 (graph LR)
- 佈局：使用最大寬度，緊貼標題下方

**垂直/方形圖表（比例 ≤ 1.2）**
- 適用：垂直流程圖 (graph TD)
- 佈局：使用最大高度，水平置中

### 標題優化
- 字體：24pt → 28pt
- 對齊：置中 → 左對齊
- 位置：更靠近頂部（y: 0.7 → 0.4）

---

## 使用限制

### 不允許使用的圖表類型
- ❌ **User Journey (旅程圖)** - 不支援此圖表類型

### 允許使用的圖表類型
- ✅ Flowchart (流程圖) - `graph TD` / `graph LR`
- ✅ Sequence Diagram (序列圖)
- ✅ Class Diagram (類別圖)
- ✅ State Diagram (狀態圖)
- ✅ Entity Relationship Diagram (實體關係圖)
- ✅ Gantt Chart (甘特圖)

---

## 測試結果

### 測試策略
採用兩階段測試策略：
1. **階段 1**：測試檔案快速驗證（`test/test_slide.md`）
2. **階段 2**：完整 Bank Profile 檔案生成驗證

### 測試檔案
- **測試輸入**：`test/test_slide.md`（繁體中文）
- **測試輸出**：`test/test_output.pptx`

### 驗證項目
- ✅ PPTX 無疊字問題
- ✅ PPTX 內容精簡（3-5 關鍵列點）
- ✅ PPTX 圖表尺寸正確（根據縱橫比動態調整）
- ✅ DOCX Markdown 格式正確（**粗體**、*斜體*、`` `程式碼` ``）
- ✅ DOCX Mermaid 圖片尺寸適當（動態計算）
- ✅ DOCX 過濾長段落（>150 字元）

---

## 影響檔案清單

### 主要檔案
1. **`.specify/scripts/generate/generate_docs.js`** - 主要生成腳本
   - 新增：`parseMarkdownForDocx()` (第 385-487 行)
   - 新增：`selectKeyPoints()` (第 627-650 行)
   - 修改：`parseMarkdownText()` (第 66-86 行)
   - 修改：DOCX 段落生成 (第 564-590 行)
   - 修改：DOCX Mermaid 圖片 (第 515-551 行)
   - 修改：PPTX 章節處理 (第 746-916 行)

2. **`.specify/scripts/generate/generate_test_pptx.js`** - 測試腳本
   - 修改：`parseMarkdownText()` (第 43-62 行)

3. **`test/test_slide.md`** - 測試資料
   - 更新為繁體中文
   - 包含三種 Mermaid 圖表測試案例

4. **`.specify/scripts/generate/CHANGELOG.md`** - 本文件（新增）

---

## 未來改進建議

1. **PPTX 精簡可配置化**
   - 允許使用者自訂每種章節類型的列點數量
   - 支援通過設定檔或命令列參數調整

2. **DOCX 段落長度閾值可調整**
   - 目前固定為 150 字元
   - 可改為設定檔參數

3. **智能摘要生成**
   - 目前只是簡單選擇前幾個列點
   - 未來可考慮使用 AI 生成更精準的摘要

4. **更多 Mermaid 圖表類型支援**
   - 考慮支援更多圖表類型的特殊佈局優化
   - 例如：Gantt 圖（通常很寬）、類別圖（通常很高）

---

## 執行指令

```bash
# 生成完整文件（DOCX + PPTX）
node .specify/scripts/generate/generate_docs.js

# 測試生成（使用測試文件）
node .specify/scripts/generate/generate_test_pptx.js
```

## 輸出位置

- **完整文件**：`bank-profile/export/`
  - `Bank_Profile_Full.docx`
  - `Bank_Profile_Presentation.pptx`

- **測試文件**：`test/`
  - `test_output.pptx`
