# Implementation Plan: Spec Bot - Slack/GitHub/GPT 整合的 SDD 需求對齊工具

**Branch**: `001-spec-bot-sdd-integration` | **Date**: 2025-11-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-spec-bot-sdd-integration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

本專案旨在開發一個自動化工具，透過 Slack、GitHub 與 GPT-4 的整合，實現 BRD (Business Requirements Document) 到 SDD (System Design Document) 的自動轉換。核心流程為：PM 在 Slack 上傳 BRD → Bot 在 Docker 容器中呼叫 GPT-4 生成 SDD → 在 GitHub 建立 PR → SA/Architect 審核 → 合併後自動產出多格式交付物。系統強調無狀態設計、沙箱隔離、測試驅動開發與完整可追溯性。

## Technical Context

**Language/Version**: Python 3.11
**Primary Dependencies**:
  - Slack: `slack-bolt` (官方 Bolt for Python SDK)
  - GitHub: `PyGithub` (GitHub REST API 客戶端)
  - OpenAI: `openai` (官方 Python SDK)
  - Docker: `docker-py` (容器管理)
  - Testing: `pytest`, `pytest-mock`, `pytest-httpserver`
  - Mermaid Validation: `@mermaid-js/mermaid-cli` (Node.js, 需 18+)
  - 日誌: `structlog` (結構化 JSON 日誌)

**Storage**:
  - GitHub Repository (唯一權威事實來源，儲存所有 SDD 產出)
  - 暫存檔案系統 (Docker 容器內，任務完成後自動銷毀)
  - 不使用持久化資料庫 (Bot 完全無狀態)

**Testing**:
  - `pytest` (整合測試與單元測試)
  - `pytest-mock` (模擬 Slack/GitHub/OpenAI API)
  - `pytest-httpserver` (模擬 webhook 接收)
  - Gherkin 語法驗收測試 (Given-When-Then)
  - 測試覆蓋率目標: ≥ 80%

**Target Platform**:
  - Linux 伺服器 (Docker 容器運行環境)
  - Docker 容器基礎映像: `python:3.11-slim`
  - 需安裝 Node.js 18+ (執行 mermaid-cli)

**Project Type**: 單一專案 (Backend service，無 Frontend UI)

**Performance Goals**:
  - Slack 初步回應延遲 < 5 秒
  - BRD → SDD 完整流程 < 3 分鐘 (P95)
  - GitHub PR 建立時間 < 30 秒
  - 並行處理上限: 5 個請求，佇列長度上限 10

**Constraints**:
  - BRD 檔案大小 ≤ 100 KB (對應 GPT-4 Turbo 的 65K tokens)
  - Docker 容器資源限制: CPU 2 核心，記憶體 4GB
  - Docker 容器執行逾時: 10 分鐘
  - 僅支援繁體中文 BRD 與 SDD (MVP 階段)
  - 網路存取白名單: Slack API, GitHub API, OpenAI API

**Scale/Scope**:
  - 初期使用者: 10-20 位 PM/SA/Architect
  - 預估每日處理 BRD 數量: 5-10 個
  - SDD 檔案結構: 5 個強制章節，至少 3 張 Mermaid 圖表
  - GitHub Repository: 單一 monorepo，所有 SDD 儲存於 `/specs/` 目錄

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 原則 I: 單一事實來源與狀態外部化
✅ **PASS** - 所有 SDD 產出儲存於 GitHub Repository，Bot 完全無狀態設計

### 原則 II: Bot 輕量沙箱原則
✅ **PASS** - 所有自動化操作在 Docker 容器中執行，容器使用 `python:3.11-slim`，任務完成後自動銷毀

### 原則 III: 測試驅動開發 (NON-NEGOTIABLE)
✅ **PASS** - 規格書已包含 Gherkin 格式驗收場景，測試覆蓋率目標 ≥ 80%

### 原則 IV: 整合測試與模擬環境
✅ **PASS** - 已規劃使用 `pytest-mock` 模擬 Slack/GitHub/OpenAI API，`pytest-httpserver` 模擬 webhook

### 原則 V: 簡約與需求驅動 (YAGNI)
⚠️ **需監控** - 專案範圍已明確定義於 spec.md，但需確保實作階段不引入未列出的抽象層
- 使用官方 SDK (slack-bolt, PyGithub, openai) 而非自建 wrapper
- 避免過度設計的佇列系統 (使用簡單 FIFO 佇列即可)

### 原則 VI: 完整可追溯性與審計
✅ **PASS** - 已規劃使用 `structlog` 記錄結構化 JSON 日誌，包含 correlation_id 追蹤

### 原則 VII: 語意化版本與文件同步
✅ **PASS** - Commit 訊息遵循 Conventional Commits，PR 需審核後才能合併

### 原則 VIII: 零信任與權限最小化
✅ **PASS** - GitHub Token 使用 Fine-grained token，最小權限：contents:write, pull_requests:write, workflows:write, metadata:read
- 所有 API tokens 透過環境變數注入
- Docker 容器以非 root 使用者執行

### 原則 IX: AI 回應有據與防護
✅ **PASS** - GPT-4 生成的 Mermaid 圖表必須通過 `mermaid-cli` 語法驗證
- 需實作 Prompt Injection 防護 (sanitization + system prompt 限制)
- 錯誤時提供重試機制

### 原則 X: 原生整合優先
✅ **PASS** - 使用官方 SDK: slack-bolt, PyGithub, openai SDK

**整體評估**: ✅ 通過 - 無重大憲法違反，可進入 Phase 0 研究階段

## Project Structure

### Documentation (this feature)

```text
specs/001-spec-bot-sdd-integration/
├── spec.md              # 功能規格書 (已完成)
├── plan.md              # 本檔案 (/speckit.plan 指令輸出)
├── research.md          # Phase 0 輸出 (技術決策與最佳實踐研究)
├── data-model.md        # Phase 1 輸出 (實體關係圖與資料模型)
├── quickstart.md        # Phase 1 輸出 (開發環境設定指南)
├── contracts/           # Phase 1 輸出 (API 契約定義)
│   ├── slack_events.json       # Slack Event API 契約
│   ├── github_api.json         # GitHub REST API 契約
│   └── openai_prompts.yaml     # GPT-4 Prompt 模板
└── tasks.md             # Phase 2 輸出 (/speckit.tasks 指令 - 本指令不會建立)
```

### Source Code (repository root)

```text
spec-bot/                         # Bot 主程式目錄
├── src/
│   ├── models/                   # 資料模型 (BRD, SDD, Request 等)
│   │   ├── brd_document.py
│   │   ├── sdd_document.py
│   │   ├── requirement_request.py
│   │   └── error_log.py
│   ├── services/                 # 核心業務邏輯
│   │   ├── slack_handler.py      # Slack 事件處理
│   │   ├── brd_parser.py         # BRD 解析與驗證
│   │   ├── sdd_generator.py      # GPT-4 SDD 生成
│   │   ├── docker_runner.py      # Docker 容器管理
│   │   ├── github_client.py      # GitHub PR 與分支管理
│   │   ├── mermaid_validator.py  # Mermaid 圖表驗證
│   │   └── queue_manager.py      # FIFO 佇列管理
│   ├── integrations/             # 外部整合
│   │   ├── slack_bot.py          # Slack Bolt 應用程式
│   │   ├── github_wrapper.py     # PyGithub 封裝
│   │   └── openai_client.py      # OpenAI SDK 封裝
│   ├── utils/                    # 工具函式
│   │   ├── logger.py             # Structlog 日誌配置
│   │   ├── validators.py         # 輸入驗證
│   │   └── sanitizers.py         # Prompt Injection 防護
│   └── main.py                   # 應用程式入口點
├── tests/
│   ├── integration/              # 整合測試
│   │   ├── test_brd_to_sdd_flow.py
│   │   ├── test_slack_webhook.py
│   │   ├── test_github_pr_creation.py
│   │   └── test_docker_execution.py
│   ├── unit/                     # 單元測試
│   │   ├── test_brd_parser.py
│   │   ├── test_sdd_generator.py
│   │   ├── test_mermaid_validator.py
│   │   └── test_queue_manager.py
│   └── fixtures/                 # 測試資料
│       ├── sample_brd.md
│       ├── sample_sdd.md
│       └── mocked_api_responses.json
├── docker/
│   ├── Dockerfile                # Spec Bot 容器映像
│   └── sandbox-dockerfile        # 沙箱執行環境映像
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                # 測試與 linting
│   │   └── post-merge.yml        # 自動產生 PNG/PDF/DOCX
│   └── CODEOWNERS                # 審核者設定
├── requirements.txt              # Python 依賴
├── pytest.ini                    # Pytest 配置
└── README.md                     # 專案說明
```

**Structure Decision**: 採用單一專案結構 (Option 1)，因為本專案為純後端服務，無前端 UI。所有核心邏輯集中於 `spec-bot/src/` 目錄，測試檔案與程式碼目錄結構對應，便於維護。

## Complexity Tracking

**本專案無憲法違反項目** - 所有設計決策符合憲法原則，無需額外複雜性引入。

---

## Phase 0: 研究與技術決策（已完成）

**產出檔案**: [research.md](./research.md)

**完成日期**: 2025-11-13

**研究範圍**:
1. ✅ Slack 整合技術選型 → 決策: Bolt for Python
2. ✅ GitHub 整合技術選型 → 決策: PyGithub
3. ✅ OpenAI GPT-4 整合 → 決策: OpenAI SDK + GPT-4 Turbo
4. ✅ Docker 容器安全與資源管理 → 決策: docker-py + python:3.11-slim
5. ✅ Mermaid 圖表驗證 → 決策: @mermaid-js/mermaid-cli
6. ✅ 結構化日誌與錯誤追蹤 → 決策: structlog + JSON 格式
7. ✅ FIFO 佇列實作 → 決策: Python queue.Queue
8. ✅ Prompt Injection 防護策略 → 決策: 三層防護（Sanitization + System Prompt + 輸出驗證）
9. ✅ GitHub Actions Post-Merge 自動化 → 決策: pandoc + mermaid-cli
10. ✅ 測試策略與模擬環境 → 決策: pytest + pytest-mock + pytest-httpserver

**關鍵發現**:
- 所有技術選型遵循「原生整合優先」原則（憲法原則 X）
- 無需引入 Redis、RabbitMQ 等外部依賴，符合 YAGNI 原則
- 測試策略涵蓋單元測試、整合測試、驗收測試三層級

---

## Phase 1: 設計與契約（已完成）

**產出檔案**:
- [data-model.md](./data-model.md) - 實體關係圖與資料模型
- [contracts/slack-events.json](./contracts/slack-events.json) - Slack Event API 契約
- [contracts/github-api.json](./contracts/github-api.json) - GitHub REST API 契約
- [quickstart.md](./quickstart.md) - 開發環境快速設定指南

**完成日期**: 2025-11-13

**設計要點**:

### 1. 資料模型
- **核心實體**: RequirementRequest, BRDDocument, SDDDocument, GitHubPR, ErrorLog, GitHubRelease
- **關聯設計**: 使用 correlation_id 串聯所有實體，支援完整追蹤
- **無狀態設計**: 所有持久化狀態儲存於 GitHub，Bot 本身無狀態

### 2. API 契約
- **Slack Event API**: 定義 file_shared、app_mention 事件格式與驗證規則
- **GitHub REST API**: 定義分支建立、PR 建立、檔案提交的請求/回應格式
- **契約驗證**: 所有契約使用 JSON Schema 定義，支援自動化驗證

### 3. 開發環境
- **前置需求**: Python 3.11, Node.js 18+, Docker 20.10+
- **Secrets 管理**: 所有 API tokens 透過 .env 檔案管理（不提交至 Git）
- **測試流程**: TDD 流程（紅燈 → 綠燈 → 重構）

---

## Phase 1 後憲法檢查（最終評估）

*重新評估設計決策是否符合所有憲法原則*

### 原則 I: 單一事實來源與狀態外部化
✅ **PASS（再次確認）**
- 資料模型設計明確定義所有狀態儲存於 GitHub
- Bot 無本地資料庫或持久化檔案系統
- Correlation ID 機制確保完整追蹤

### 原則 II: Bot 輕量沙箱原則
✅ **PASS（再次確認）**
- Docker 容器配置已定義（sandbox-dockerfile）
- 容器生命週期：啟動 → 執行單一任務 → 銷毀
- 網路存取白名單已明確（Slack/GitHub/OpenAI API）

### 原則 III: 測試驅動開發
✅ **PASS（再次確認）**
- 測試策略已定義三層級（單元/整合/驗收）
- Gherkin 場景已覆蓋所有使用者故事（spec.md）
- quickstart.md 包含 TDD 工作流程指引

### 原則 IV: 整合測試與模擬環境
✅ **PASS（再次確認）**
- pytest-mock, pytest-httpserver 已納入依賴
- 測試覆蓋率目標明確（≥ 80%）
- 模擬策略已定義（研究文件第 10 節）

### 原則 V: 簡約與需求驅動（YAGNI）
✅ **PASS（提升評級）**
- **Phase 0 研究確認**: 無引入不必要的抽象層
- **佇列系統**: 使用標準函式庫 queue.Queue，拒絕 Redis/RabbitMQ
- **SDK 選擇**: 全部使用官方 SDK，無自建 wrapper
- **評估**: 從「需監控」提升為「通過」

### 原則 VI: 完整可追溯性與審計
✅ **PASS（再次確認）**
- structlog 配置已定義（JSON 格式 + correlation_id）
- 錯誤處理策略已定義（分類重試機制）
- 日誌欄位已明確（timestamp, error_type, correlation_id 等）

### 原則 VII: 語意化版本與文件同步
✅ **PASS（再次確認）**
- Commit 訊息規範已定義（Conventional Commits）
- PR 審核流程已定義（quickstart.md 第 9.2 節）

### 原則 VIII: 零信任與權限最小化
✅ **PASS（再次確認）**
- GitHub Token 權限已明確列出（contents:write, pull_requests:write, workflows:write, metadata:read）
- .env 管理策略已定義（不提交至 Git）
- Docker 容器安全配置已定義（非 root 使用者、cap_drop ALL）

### 原則 IX: AI 回應有據與防護
✅ **PASS（再次確認）**
- Prompt Injection 三層防護已定義（研究文件第 8 節）
- Mermaid 驗證機制已定義（mermaid-cli 語法檢查）
- GPT-4 System Prompt 已設計（防止角色篡改）

### 原則 X: 原生整合優先
✅ **PASS（再次確認）**
- 所有依賴均為官方 SDK（slack-bolt, PyGithub, openai）
- 無引入第三方中介平台（如 Zapier）

**最終評估**: ✅✅ **全數通過** - 所有憲法原則完全符合，設計決策已充分驗證，無風險項目

---

## 下一步：進入任務分解階段

本實作計畫（plan.md）已完成，包含：

✅ Phase 0: 技術研究與決策（research.md）
✅ Phase 1: 設計與契約（data-model.md, contracts/, quickstart.md）
✅ 憲法檢查：Phase 0 前與 Phase 1 後雙重驗證
✅ Agent 上下文更新（CLAUDE.md）

**接下來請執行**:

```bash
/speckit.tasks
```

此指令將根據 spec.md 與 plan.md，產生詳細的實作任務清單（tasks.md），包含：
- 任務依賴順序（TDD 優先）
- 每個任務的驗收標準
- 預估工時與優先級

**Branch**: `001-spec-bot-sdd-integration`
**Ready for**: Task generation and implementation planning
