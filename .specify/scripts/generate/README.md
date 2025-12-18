# Bank Profile 文件生成器

## 概述

此腳本將 Bank Profile (00-70) Markdown 文件轉換為專業的 DOCX 和 PPTX 格式。

## 使用方式

```bash
# 生成完整文件（DOCX + PPTX）
node .specify/scripts/generate/generate_docs.js

# 測試生成（使用測試文件）
node .specify/scripts/generate/generate_test_pptx.js
```

## 輸出位置

- **完整文件**: `bank-profile/export/`
  - `Bank_Profile_Full.docx`
  - `Bank_Profile_Presentation.pptx`

- **測試文件**: `test/`
  - `test_output.pptx`

## 支援的 Mermaid 圖表

### ✅ 允許使用

- **Flowchart** (流程圖) - `graph TD` / `graph LR`
- **Sequence Diagram** (序列圖) - `sequenceDiagram`
- **Class Diagram** (類別圖) - `classDiagram`
- **State Diagram** (狀態圖) - `stateDiagram`
- **Entity Relationship** (實體關係圖) - `erDiagram`
- **Gantt Chart** (甘特圖) - `gantt`

### ❌ 不允許使用

- **User Journey** (旅程圖) - `journey`

## PPTX 設計特色

### 色彩方案
- 主色：專業紅 (#c41e3a)
- 強調色：深紅 (#8b0000)
- 背景：白色 (#ffffff)
- 文字：深灰 (#2c2c2c)

### Mermaid 圖表佈局

系統會根據圖表的縱橫比自動選擇最佳佈局：

**超寬圖表（比例 > 1.6）**
- 適用：序列圖、超寬流程圖
- 佈局：使用最大寬度，垂直水平雙向置中
- 範例：650x347 px (1.87) → 7.73" x 4.13"

**中等寬圖表（1.2 < 比例 ≤ 1.6）**
- 適用：橫向流程圖 (graph LR)
- 佈局：使用最大寬度，緊貼標題下方
- 範例：784x99 px (7.92) → 9.40" x 1.19"

**垂直/方形圖表（比例 ≤ 1.2）**
- 適用：垂直流程圖 (graph TD)
- 佈局：使用最大高度，水平置中
- 範例：270x511 px (0.53) → 2.18" x 4.13"

### Markdown 格式支援

- **粗體**: `**文字**` 或 `***文字***`
- **斜體**: `*文字*` 或 `_文字_`
- **程式碼**: `` `文字` ``
- **列點**: `- 項目` 或 `* 項目`
- **編號**: `1. 項目`
- **標題**: `# H1`, `## H2`, `### H3`

## 技術細節

### 依賴套件

- `docx` - Word 文件生成
- `pptxgenjs` - PowerPoint 生成
- `image-size` - 圖片尺寸偵測
- 自訂 `MermaidRenderer` - Mermaid 圖表渲染

### 分頁邏輯

- 每頁最多 9 行內容
- 自動計算項目行數（每 80 字元 = 1 行）
- 長內容自動分頁並標示頁碼

### Mermaid 渲染

- 使用 mermaid.ink API 渲染圖表
- 快取機制：已渲染的圖表會被快取以加速後續生成
- 快取位置：`.temp/mermaid/`

## 問題排除

### Mermaid 圖表未顯示

```bash
# 清除快取重新生成
rm -rf .temp/mermaid
node .specify/scripts/generate/generate_docs.js
```

### 字體或樣式問題

確認系統已安裝必要字體，或修改 `DESIGN.fonts` 設定。

### 文字重複問題

已修復：列點和小標題不會再重複前綴符號。

## 更新記錄

詳見 [CHANGELOG_MERMAID.md](./CHANGELOG_MERMAID.md)
