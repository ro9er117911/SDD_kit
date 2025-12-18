# SDD Kit 環境設定指南

本指南將協助您建立 SDD Kit 的開發環境。請根據您的需求選擇合適的 AI 助手方案。

## 📋 目錄

1. [前置需求](#1-前置需求)
2. [選擇你的開發方案](#2-選擇你的開發方案)
3. [方案 A: IDE 環境 (Antigravity / Copilot)](#3-方案-a-ide-環境-antigravity--copilot)
4. [方案 B: 純 CLI 環境 (Gemini / Claude)](#4-方案-b-純-cli-環境-gemini--claude)
5. [專案初始化](#5-專案初始化)
6. [驗證安裝](#6-驗證安裝)

---

## 1. 前置需求

無論選擇哪種方案，請先確認安裝以下基礎軟體：

*   **Node.js (LTS 版本)**
    *   **用途**: 執行前端工具與 CLI。
    *   **下載**: [nodejs.org](https://nodejs.org/)
    *   **驗證**: `node -v` (應為 v18 或以上)

*   **Python (3.8+)**
    *   **用途**: 執行文檔生成腳本 (PPTX/DOCX)。
    *   **下載**: [python.org](https://www.python.org/)
    *   **驗證**: `python --version`

*   **Git**
    *   **下載**: [git-scm.com](https://git-scm.com/)
    *   **驗證**: `git --version`

---

## 2. 選擇你的開發方案

請根據您的偏好與預算選擇一種方案：

| 特性 | **方案 A: IDE 環境 (推薦)** | **方案 B: 純 CLI 環境** |
| :--- | :--- | :--- |
| **適合對象** | 喜歡在 VS Code 內完成所有工作，不想頻繁切換視窗的開發者。 | 習慣使用終端機 (Terminal) 指令，或需要自動化腳本整合的開發者。 |
| **主要優勢** | 與程式碼編輯器深度整合，可直接讀取檔案上下文，體驗流暢。 | 輕量、快速，可透過 Pipe (`|`) 串接指令，自動化能力強。 |
| **免費選項 (推薦)** | **Antigravity** (Google) | **Gemini CLI** (Google) |
| **付費選項** | **GitHub Copilot** | **Claude Code** (Anthropic) |

### 💡 我們的推薦 (免費方案)
- **首選**: **Antigravity** (IDE) —— 提供大量最新的模型 (Gemini 3, Claude 4.5 Sonnet,Opus 等) 且完全免費，整合度高。
- **次選**: **Gemini CLI** (CLI) —— 如果您偏好終端機操作且不需要太多模型選擇，這是一個輕量的免費選擇 (需留意 API 額度)。

---

## 3. 方案 A: IDE 環境 (Antigravity / Copilot)

### 3.1 Antigravity (免費推薦 🌟)

Antigravity 是 Google 推出的新一代 AI 程式碼助手，支援多種頂尖模型。

**安裝步驟**:
1.  前往官網下載並安裝 VS Code 擴充套件：
    🔗 **[antigravity.google](https://antigravity.google/)**
2.  安裝完成後，在 VS Code 左側欄點擊 Antigravity 圖示。
3.  使用 Google 帳號登入。
4.  **設定完成！** 您現在可以在 VS Code 中直接使用 `@agent` 指令操作 SDD Kit。

**使用範例**:
在 Antigravity 對話視窗輸入：
```
@speckit.meta 請幫我建立一個新專案，名稱為 "HR-System"
```

### 3.2 GitHub Copilot (付費)

如果您已有 GitHub Copilot 訂閱：

1.  在 VS Code 擴充套件市場搜尋並安裝 **GitHub Copilot** 與 **GitHub Copilot Chat**。
2.  登入 GitHub 帳號並授權。
3.  確認 `.github/copilot-instructions.md` 檔案存在，以載入專案特定的指令集。

**使用範例**:
在 Copilot Chat 輸入：
```
@workspace /speckit.meta 幫我建立 HR 系統專案
```

---

## 4. 方案 B: 純 CLI 環境 (Gemini / Claude)

### 4.1 Gemini CLI (免費)

Google 官方的終端機工具，適合腳本自動化。

**安裝步驟**:
1.  **安裝 CLI**:
    ```bash
    npm install -g @google/gemini-cli
    ```
2.  **取得 API Key**:
    *   前往 [Google AI Studio](https://aistudio.google.com/) 申請 API Key。
3.  **設定環境變數**:
    ```bash
    # macOS/Linux
    echo 'export GEMINI_API_KEY="您的API_KEY"' >> ~/.zshrc
    source ~/.zshrc
    ```
4.  **驗證**:
    ```bash
    gemini "Hello"
    ```

**限制**: 免費版 API 有每分鐘請求次數限制。

### 4.2 Claude Code (付費)

Anthropic 提供的進階 CLI 工具。

**安裝步驟**:
1.  需具備 Claude Pro 或 API 帳號。
2.  安裝 `claude-code` (參照 Anthropic 官方文件)。
3.  使用 `/slash` 指令操作 SDD Kit。

---

## 5. 專案初始化

設定好 AI 助手後，請下載並初始化專案：

```bash
# 1. Clone 專案
git clone https://github.com/ro9er117911/SDD_kit my-project
cd my-project

# 2. 初始化 (清理範例資料)
chmod +x init.sh
./init.sh
```

---

## 6. 驗證安裝

讓我們建立一個測試專案來驗證環境。

**如果您使用 Antigravity (IDE)**:
1.  開啟 VS Code 的 Antigravity 面板。
2.  輸入: `幫我執行 /speckit.meta 建立一個名為 "Test-Project" 的財務報表專案`。
3.  檢查是否成功生成 `project/meta/00_meta.md`。

**如果您使用 Gemini CLI (CLI)**:
1.  在終端機輸入:
    ```bash
    gemini "請根據 SDD 規則，幫我建立一個名為 'Test-Project' 的財務報表專案的 meta 文件"
    ```

---

**恭喜！您的開發環境已準備就緒。**
