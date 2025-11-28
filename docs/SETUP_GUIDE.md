# 設定指南 - SDD MVP Kit

本指南專為新團隊成員設計，提供從零開始設定本專案的完整步驟。

## 前置需求

### 必要軟體

1. **Git** (2.30+)
   - 下載：https://git-scm.com/
   - 驗證：`git --version`

2. **VS Code** (推薦) 或其他編輯器
   - 下載：https://code.visualstudio.com/

3. **GitHub帳號**
   - 註冊：https://github.com/

### 選擇性軟體（根據AI助手選擇）

- **Claude Desktop** (如果使用 Claude)
- **GitHub Copilot** (如果使用 VS Code)
  - VS Code擴充套件：GitHub Copilot + GitHub Copilot Chat

## 環境設定

### 1. Git 配置

```bash
# 設定使用者資訊
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 確認設定
git config --list | grep user
```

### 2. SSH 金鑰設定（推薦）

```bash
# 產生 SSH 金鑰
ssh-keygen -t ed25519 -C "your.email@example.com"

# 啟動 ssh-agent
eval "$(ssh-agent -s)"

# 加入 SSH 金鑰
ssh-add ~/.ssh/id_ed25519

# 複製公鑰到剪貼簿（Mac）
pbcopy < ~/.ssh/id_ed25519.pub

# 或顯示公鑰
cat ~/.ssh/id_ed25519.pub
```

**將公鑰加入 GitHub**：
1. 前往 GitHub → Settings → SSH and GPG keys
2. 點擊 "New SSH key"
3. 貼上公鑰，儲存

### 3. Clone Repository

```bash
# 使用 SSH（推薦）
git clone git@github.com:YOUR_ORG/SDD_MVP_KIT.git

# 或使用 HTTPS
git clone https://github.com/YOUR_ORG/SDD_MVP_KIT.git

# 進入專案目錄
cd SDD_MVP_KIT

# 確認腳本執行權限
chmod +x .specify/scripts/bash/*.sh
```

## GitHub Copilot 設定

### 1. 安裝 VS Code 擴充套件

1. 開啟 VS Code
2. 前往 Extensions (Cmd+Shift+X)
3. 搜尋並安裝：
   - **GitHub Copilot**
   - **GitHub Copilot Chat**

### 2. 登入 GitHub Copilot

1. 點擊右下角的 GitHub Copilot 圖示
2. 登入 GitHub 帳號
3. 授權 Copilot 存取

### 3. 驗證 Copilot Instructions

Copilot 會自動讀取 `.github/copilot-instructions.md`，提供專案特定的指示。

**測試方法**：
1. 開啟 Copilot Chat (Cmd+Shift+I)
2. 輸入：`@workspace what is this project about?`
3. Copilot 應該會參考 `copilot-instructions.md` 回答

### 4. 使用 Copilot Agents

在 Copilot Chat 中使用 agents：

```
@agent project.create "測試專案" --project-name "TEST"
@agent project.context
@agent speckit.meta
```

## Claude 設定（選擇性）

如果使用 Claude Desktop：

1. 確保專案目錄在 Claude 的工作區中
2. 使用 slash 命令：
   ```
   /speckit.meta
   /speckit.business
   ```

## 第一個專案範例

### Step 1: 建立新專案

```bash
# 方法 A: 使用 bash 腳本
./.specify/scripts/bash/create-new-project.sh "測試專案" --project-name "TEST"

# 方法 B: 使用 GitHub Copilot
@agent project.create "測試專案" --project-name "TEST"
```

**預期輸出**：
```
PROJECT_DIR_NAME: 001-TEST
PROJECT_DIR: /path/to/project/001-TEST
PROJECT_NUM: 001
META_FILE: /path/to/project/001-TEST/meta/00_meta.md

Project directory structure created:
  001-TEST/
    ├── API/
    ├── audit/
    ├── business/
    ├── infosec/
    ├── law/
    ├── meta/
    │   └── 00_meta.md
    ├── nfr/
    ├── process/
    └── export/
```

### Step 2: 查看專案上下文

```bash
# 使用 bash
source ./.specify/scripts/bash/common.sh
get_project_paths

# 或使用 Copilot
@agent project.context
```

### Step 3: 填寫 Bank Profile 文檔

依序執行 Bank Profile 各階段：

```bash
# Claude 方式
/speckit.meta
/speckit.business
/speckit.process
/speckit.law
/speckit.infosec
/speckit.audit
/speckit.review

# GitHub Copilot 方式
@agent speckit.meta
@agent speckit.business
@agent speckit.process
@agent speckit.law
@agent speckit.infosec
@agent speckit.audit
@agent speckit.review
```

### Step 4: 查看生成的文檔

```bash
# 查看專案目錄
ls -la project/001-TEST/

# 或在 VS Code 中開啟
code project/001-TEST/
```

**應該會看到**：
- `meta/00_meta.md` - 專案元資料
- `business/10_business.md` - 業務需求
- `process/20_system_flow.md` 等 - 流程與架構圖
- `law/60_law.md` - 法規遵循
- `infosec/70_infosec.md` - 資訊安全
- `audit/90_audit.md` - 稽核文檔
- `nfr/80_nfr.md` - 非功能需求

## 常見問題

### Q: 如何切換專案？

A: 設定 `PROJECT_CONTEXT` 環境變數：

```bash
export PROJECT_CONTEXT="001-TEST"
```

或在新的 shell session 中，腳本會自動選擇最新的專案。

### Q: 如何查看所有專案？

A: 查看 `project/` 目錄：

```bash
ls -la project/
```

### Q: 專案與功能的差別？

A:
- **專案** (`project/###-NAME/`): Bank Profile 文檔，專案層級需求分析
- **功能** (`specs/###-feature/`): SDD 功能規格，IT開發階段

**流程**：先建立專案 → 完成 Bank Profile → 提取專案約束 → 建立功能 → SDD 開發

### Q: 如何匯出 PPTX/DOCX？

A: 使用生成腳本（需要 Python 環境）：

```bash
# 安裝依賴
pip install python-pptx python-docx

# 執行生成腳本（TODO: 完成腳本）
# ./specify/scripts/generate/export-to-pptx.py
```

### Q: GitHub Copilot 沒有讀取 copilot-instructions.md？

A: 確認：
1. `.github/copilot-instructions.md` 檔案存在
2. 在 VS Code 中重新載入視窗 (Cmd+Shift+P → "Reload Window")
3. 使用 `@workspace` 查詢測試

### Q: 如何貢獻或修改模板？

A: 模板位於 `.specify/templates/`：

1. 修改模板檔案
2. 測試：建立新專案查看效果
3. 提交 PR

### Q: 出現權限錯誤？

A: 確保腳本有執行權限：

```bash
chmod +x .specify/scripts/bash/*.sh
```

## 下一步

1. **完成第一個專案**：依照 Bank Profile 流程完成所有階段
2. **閱讀架構文檔**：[ARCHITECTURE.md](ARCHITECTURE.md) 了解系統設計
3. **查看範例**：`bank-profile/` 目錄有完整的範例專案
4. **進入 SDD 開發**：執行 `/speckit.constitution` 後開始功能開發

## 支援

- **專案文檔**：[README.md](../README.md)
- **架構說明**：[ARCHITECTURE.md](ARCHITECTURE.md)
- **實施計劃**：查看原始開發文檔（.gemini/antigravity/brain/）

---

**歡迎使用 SDD Kit！讓AI協助您完成規格驅動開發。**

