---
description: 顯示當前專案上下文與可用路徑
---

## 使用者輸入

```text
$ARGUMENTS
```

## 目標

顯示當前專案上下文，包括專案目錄、編號及所有相關檔案路徑。

## 執行步驟

### 1. 載入共用函數

載入 common.sh 函式庫以存取專案管理函數：

```bash
source ./.specify/scripts/bash/common.sh
```

### 2. 取得專案路徑

執行 `get_project_paths()` 取得所有專案相關路徑：

```bash
get_project_paths
```

這將輸出：
```
PROJECT_ROOT='/path/to/project'
CURRENT_PROJECT='###-PROJECTNAME'
PROJECT_DIR='/path/to/project/###-PROJECTNAME'
PROJECT_META='/path/to/project/###-PROJECTNAME/meta/00_meta.md'
PROJECT_BUSINESS='/path/to/project/###-PROJECTNAME/business/10_business.md'
PROJECT_PROCESS='/path/to/project/###-PROJECTNAME/process/'
PROJECT_INFOSEC='/path/to/project/###-PROJECTNAME/infosec/70_infosec.md'
PROJECT_LAW='/path/to/project/###-PROJECTNAME/law/60_law.md'
PROJECT_AUDIT='/path/to/project/###-PROJECTNAME/audit/90_audit.md'
PROJECT_NFR='/path/to/project/###-PROJECTNAME/nfr/80_nfr.md'
PROJECT_EXPORT='/path/to/project/###-PROJECTNAME/export/'
```

### 3. 顯示專案狀態

以使用者友善的方式格式化並顯示專案上下文：

**當前專案**：`###-PROJECTNAME`

**專案目錄**：`/path/to/project/###-PROJECTNAME`

**Bank Profile 文檔**：
- Meta：`meta/00_meta.md` (✓/✗)
- Business：`business/10_business.md` (✓/✗)
- Process：`process/20-50_*.md` (✓/✗)
- Law：`law/60_law.md` (✓/✗)
- InfoSec：`infosec/70_infosec.md` (✓/✗)
- NFR：`nfr/80_nfr.md` (✓/✗)
- Audit：`audit/90_audit.md` (✓/✗)

**匯出目錄**：`export/`（若有檔案則列出）

### 4. 建議下一步行動

依據哪些文件已存在，建議下一步：

- 若無文件：「開始使用 `/speckit.meta` 建立專案元資料」
- 若僅 meta 存在：「繼續使用 `/speckit.business` 建立業務需求」
- 若 business 存在：「執行 `/speckit.process` 建立流程圖」
- 若所有 Bank Profile 文檔都存在：「執行 `/speckit.review` 驗證完整性」

## 範例

```bash
@agent project.context
# 顯示當前專案（例如：001-AI-GOV-XPLAIN）及檔案狀態

@agent project.context
# 若設定 PROJECT_CONTEXT 環境變數，使用該變數
# 否則自動偵測最新專案
```

## 錯誤處理

- 若 `project/` 目錄中沒有專案，顯示訊息：「找不到專案。請使用 `@agent project.create` 建立一個」
- 若 `PROJECT_CONTEXT` 環境變數指向不存在的目錄，發出警告並回退到最新專案

## 上下文

$ARGUMENTS
