# SDD Kit 環境設定指南

本指南將協助您建立 SDD Kit 的開發環境。我們推薦使用 **Gemini CLI** 作為您的主要 AI 助手，因為它提供強大的免費方案且安裝簡便。

## 📋 目錄

1. [前置需求](#1-前置需求)
2. [AI 助手設定 (Gemini CLI)](#2-ai-助手設定-gemini-cli)
3. [專案環境設定](#3-專案環境設定)
4. [驗證安裝](#4-驗證安裝)
5. [進階選項 (付費方案)](#5-進階選項-付費方案)

---

## 1. 前置需求

在開始之前，請確認您的電腦已安裝以下基礎軟體。

### 1.1 程式語言環境
本專案的工具鏈依賴 Node.js 與 Python。

*   **Node.js (LTS 版本)**
    *   **用途**: 執行 Gemini CLI 及其他前端工具。
    *   **下載**: [nodejs.org](https://nodejs.org/)
    *   **驗證**: `node -v` (應為 v18 或以上)

*   **Python (3.8+)**
    *   **用途**: 執行文檔生成腳本 (PPTX/DOCX)。
    *   **下載**: [python.org](https://www.python.org/)
    *   **驗證**: `python --version`

### 1.2 編輯器與版本控制

*   **Visual Studio Code (VS Code)**
    *   **下載**: [code.visualstudio.com](https://code.visualstudio.com/)
    *   **推薦擴充套件**:
        *   Markdown All in One
        *   Mermaid Markdown Syntax (用於預覽流程圖)

*   **Git**
    *   **下載**: [git-scm.com](https://git-scm.com/)
    *   **驗證**: `git --version`

---

## 2. AI 助手設定 (Gemini CLI)

Gemini CLI 是 Google 官方提供的終端機 AI 工具，可以直接在命令列中協助您生成 SDD 規格。

### 步驟 2.1: 安裝 Gemini CLI
打開您的終端機 (Terminal) 並執行：

```bash
npm install -g @google/gemini-cli
```

### 步驟 2.2: 取得 API Key
Gemini 提供免費的 API 配額給開發者使用。

1.  前往 [Google AI Studio](https://aistudio.google.com/)。
2.  登入您的 Google 帳號。
3.  點擊 **"Get API key"** -> **"Create API key"**。
4.  複製產生的 API Key。

### 步驟 2.3: 設定環境變數
為了讓 Gemini CLI 能夠存取 API，您需要設定環境變數。

**macOS / Linux (Zsh/Bash):**

執行以下指令 (請將 `YOUR_API_KEY` 替換為實際的金鑰)：

```bash
# 加入環境變數到設定檔 (zsh)
echo 'export GEMINI_API_KEY="YOUR_API_KEY"' >> ~/.zshrc

# 重新載入設定
source ~/.zshrc
```

### 步驟 2.4: 測試 Gemini
輸入以下指令測試是否成功：

```bash
gemini "Hello, setup check!"
```
如果看到 AI 的回應，表示設定成功！

---

## 3. 專案環境設定

### 步驟 3.1: 下載專案 (Clone)

```bash
# 選擇一個工作目錄
cd ~/Documents

# Clone 專案
git clone https://github.com/YOUR_ORG/SDD_KIT.git my-sdd-project

# 進入目錄
cd my-sdd-project
```

### 步驟 3.2: 初始化專案
執行初始化腳本以準備環境並清理範例資料：

```bash
# 賦予腳本執行權限
chmod +x init.sh .specify/scripts/bash/*.sh

# 執行初始化
./init.sh
```

---

## 4. 驗證安裝

讓我們嘗試建立第一個測試專案來確認一切運作正常。

### 4.1 建立專案資料夾
使用內建腳本建立一個名為 "SetupTest" 的專案：

```bash
./.specify/scripts/bash/create-new-project.sh "環境測試專案" --project-name "SETUP-TEST"
```
這將在 `project/` 目錄下產生 `001-SETUP-TEST` 資料夾。

### 4.2 使用 Gemini 填寫文檔
這是 SDD Kit 的核心工作流。我們將使用 Gemini 讀取提示詞 (Prompt) 並生成文檔。

**範例：生成 Meta 資料**

1.  複製 Meta 階段的提示詞 (這是一個模擬操作，實際 Prompt 位於 `.github/prompts/` 或 `.claude/commands/`)。
2.  假設我們將提示詞傳送給 Gemini：

```bash
# 讀取專案模板並請 Gemini 填寫 (範例指令)
# 在實際工作中，您可以直接複製 Prompt 到 Gemini CLI 交互模式

gemini chat
> "請幫我根據專案 'SETUP-TEST' 的名稱，填寫 meta/00_meta.md 的草稿內容"
```

如果 Gemini 能成功回應並協助您撰寫內容，您的環境就完全準備好了。

---

## 5. 進階選項 (付費方案)

如果您擁有付費的 AI 服務，也可以整合使用：

### GitHub Copilot (推薦 VS Code 用戶)
1.  安裝 **GitHub Copilot** 與 **Copilot Chat** 擴充套件。
2.  使用 `@agent` 指令 (如 `@agent project.create`) 直接在 VS Code 中操作。
3.  主要優勢：與編譯器高度整合，無需切換視窗。

### Claude Code / Claude Desktop
1.  如果您有 Claude Pro 訂閱或 API 配額。
2.  可以使用 `claude-code` 或 Claude Desktop App。
3.  支援 `/slash` 指令 (如 `/speckit.meta`)。

---

## 常見問題 (FAQ)

**Q: `npm command not found`?**
A: 請確認您已安裝 Node.js。重新啟動終端機後再試。

**Q: Gemini 回應 "Quota exceeded"?**
A: 免費版 API 有速率限制 (每分鐘約 60 次請求)。請稍待片刻再試，或檢查 Google AI Studio 的配額使用量。

**Q: 如何更新 SDD Kit?**
A: 執行 `git pull` 即可取得最新版本的模板與腳本。
