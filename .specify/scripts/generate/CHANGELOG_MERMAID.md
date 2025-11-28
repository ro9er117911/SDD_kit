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

## ⚠️ 使用限制

**不允許使用的圖表類型：**
- ❌ **User Journey (旅程圖)** - 不支援此圖表類型

**允許使用的圖表類型：**
- ✅ Flowchart (流程圖) - graph TD / graph LR
- ✅ Sequence Diagram (序列圖)
- ✅ Class Diagram (類別圖)
- ✅ State Diagram (狀態圖)
- ✅ Entity Relationship Diagram (實體關係圖)
- ✅ Gantt Chart (甘特圖)

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

**問題**：列點項目和小標題會出現重複的符號（例如：`• • 文字` 或 `▸ ▸ 標題`）

**原因**：在處理 Markdown 語法時，保留了原始符號（`-`, `*`, `###`）又添加了新的顯示符號

**解決方案**：
```javascript
// 修復前
currentSection.items.push(line.replace(/^[-*] /, '• '));

// 修復後
const cleanText = line.replace(/^[-*]\s+/, '');  // 完全移除原始符號
currentSection.items.push('• ' + cleanText);      // 只添加顯示符號
```

### 2. Mermaid 圖表尺寸智能佈局 ✅

**問題**：
- 不同類型的 Mermaid 圖表使用固定尺寸，導致：
  - 旅程圖（Journey）過小且有過多留白
  - 序列圖被壓縮變形
  - 垂直流程圖未充分利用空間

**解決方案**：實作基於縱橫比的智能佈局系統

#### 佈局邏輯

投影片可用空間：
- 總寬度：10" (16:9 格式)
- 總高度：5.625"
- 標題保留：1.2"
- 邊距：0.3"
- 可用區域：9.4" x 4.125"

#### 三種佈局模式

**模式 1：超寬圖表（縱橫比 > 1.6）**
- 適用：序列圖、超寬流程圖
- 策略：使用最大寬度，垂直水平雙向置中
- 範例：650x347 px (1.87) → 7.73" x 4.13"

```javascript
if (imageAspectRatio > 1.6) {
    displayWidth = availableWidth;  // 9.4"
    displayHeight = displayWidth / imageAspectRatio;
    x = (slideWidth - displayWidth) / 2;  // 水平置中
    y = titleHeight + (availableHeight - displayHeight) / 2;  // 垂直置中
}
```

**模式 2：中等寬圖表（1.2 < 縱橫比 ≤ 1.6）**
- 適用：橫向流程圖 (graph LR)
- 策略：使用最大寬度，緊貼標題下方
- 範例：中等寬度圖表會自動適應高度限制

```javascript
else if (imageAspectRatio > 1.2) {
    displayWidth = availableWidth;  // 9.4"
    displayHeight = displayWidth / imageAspectRatio;

    // 如果超出高度限制，以高度為準重新計算
    if (displayHeight > availableHeight) {
        displayHeight = availableHeight;  // 4.125"
        displayWidth = displayHeight * imageAspectRatio;
    }

    x = (slideWidth - displayWidth) / 2;  // 水平置中
    y = titleHeight + 0.3;  // 緊貼標題
}
```

**模式 3：垂直/方形圖表（縱橫比 ≤ 1.2）**
- 適用：TD 流程圖、狀態圖
- 策略：使用最大高度，與標題對齊
- 範例：270x511 px (0.53) → 2.18" x 4.13"

```javascript
else {
    displayHeight = availableHeight;  // 4.125"
    displayWidth = displayHeight * imageAspectRatio;
    x = (slideWidth - displayWidth) / 2;  // 水平置中
    y = titleHeight + 0.2;  // 對齊標題底部
}
```

### 3. 標題樣式優化 ✅

**改進**：
- 字體大小：24pt → 28pt
- 對齊方式：置中 → 左對齊
- 位置：更靠近頂部（y: 0.7 → 0.4）

## 技術實作

### 依賴套件
- `image-size`：讀取圖片實際尺寸
- `sizeOf(imagePath)`：返回 `{ width, height }` 像素值

### 縱橫比計算
```javascript
const dimensions = sizeOf(imagePath);
const imageAspectRatio = dimensions.width / dimensions.height;
```

### 錯誤處理
如果無法讀取圖片尺寸，回退到固定大小：
```javascript
catch (error) {
    console.error(`Failed to get dimensions for ${imagePath}:`, error);
    slide.addImage({
        path: imagePath,
        x: 1,
        y: 1.5,
        w: 8,
        h: 3.5
    });
}
```

## 測試結果

測試檔案：`test/test_slide.md`

生成結果：`test/test_output.pptx`

### 測試案例

1. **垂直流程圖** (graph TD)
   - 原始：270x511 px (0.53)
   - 投影片：2.18" x 4.13"
   - ✅ 使用最大高度，水平置中

2. **序列圖** (sequenceDiagram)
   - 原始：650x347 px (1.87)
   - 投影片：7.73" x 4.13"
   - ✅ 使用最大寬度，垂直水平雙向置中

3. **橫向流程圖** (graph LR)
   - ✅ 使用最大寬度，自動適應高度，水平置中

## 影響檔案

- `.specify/scripts/generate/generate_docs.js` - 主要文件生成器
- `.specify/scripts/generate/generate_test_pptx.js` - 測試腳本
- `test/test_slide.md` - 測試資料（繁體中文）

## 未來改進建議

1. 允許通過設定檔自訂佈局參數：
   - 標題高度
   - 邊距大小
   - 縱橫比閾值

2. 支援手動縮放因子覆寫（在 Markdown 中指定）

3. 為特定圖表類型添加更精細的佈局控制：
   - Gantt 圖（通常很寬）
   - 類別圖（通常很高）
   - 實體關係圖（ER Diagram）
