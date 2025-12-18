---
description: 建立新的編號專案目錄及完整結構
---

## 使用者輸入

```text
$ARGUMENTS
```

## 目標

建立一個新的專案目錄，具備自動編號（001, 002 等）和完整的子目錄結構，用於 Bank Profile 文檔管理。

## 執行步驟

### 1. 解析參數

預期格式：`<專案描述> [--project-name <名稱>] [--number N]`

- `專案描述`：專案的描述
- `--project-name`：選填，自訂專案名稱（將轉換為大寫-連字號格式）
- `--number`：選填，手動指定專案編號（若未指定，則從現有專案自動遞增）

### 2. 執行 create-new-project.sh

從 repository 根目錄執行 bash 腳本：

```bash
./.specify/scripts/bash/create-new-project.sh "$ARGUMENTS"
```

此腳本將會：
- 決定下一個可用的專案編號（或使用 --number 指定的編號）
- 建立專案目錄：`project/###-PROJECTNAME/`
- 建立子目錄結構：
  - `API/` - API 規格文件
  - `audit/` - 稽核文檔 (90_audit.md)
  - `business/` - 業務需求 (10_business.md)
  - `infosec/` - 資訊安全 (70_infosec.md)
  - `law/` - 法規遵循 (60_law.md)
  - `meta/` - 專案元資料 (00_meta.md)
  - `nfr/` - 非功能需求 (80_nfr.md)
  - `process/` - 流程圖 (20-50_*.md)
  - `export/` - 匯出的 PPTX/DOCX 檔案
- 從 `.specify/templates/00_meta-template.md` 複製模板到 `meta/00_meta.md`
- 設定 `PROJECT_CONTEXT` 環境變數

### 3. 確認成功

顯示已建立的專案結構與路徑：

```
PROJECT_DIR_NAME: ###-PROJECTNAME
PROJECT_DIR: /絕對路徑/to/project/###-PROJECTNAME
PROJECT_NUM: ###
META_FILE: /絕對路徑/to/project/###-PROJECTNAME/meta/00_meta.md
```

### 4. 下一步指引

提供使用者下一步建議：

1. 切換到專案目錄
2. 開始 Bank Profile 第 1 階段：Meta
3. 使用 `/speckit.meta` 或 `@agent speckit.meta` 填寫 `meta/00_meta.md`

## 範例

```bash
# 自動編號專案
@agent project.create "AI GOV XPLAIN 專案" --project-name "AI-GOV-XPLAIN"
# 輸出: project/001-AI-GOV-XPLAIN/

# 手動指定編號專案
@agent project.create "法人財報預警模型" --project-name "FINWARN" --number 5
# 輸出: project/005-FINWARN/

# 從描述自動生成名稱
@agent project.create "測試專案 Test Project"
# 輸出: project/001-TEST-PROJECT/
```

## 錯誤處理

- 若專案目錄已存在，回傳錯誤
- 若無法判斷 repository 根目錄，回傳錯誤
- 若腳本執行失敗，顯示錯誤訊息並建議手動建立

## 上下文

$ARGUMENTS
