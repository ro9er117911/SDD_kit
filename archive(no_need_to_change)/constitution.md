<!--
SYNC IMPACT REPORT
- Version change: (none) -> 1.0.0
- Added Sections:
  - 安全與合規 (Security & Compliance)
  - AI 與系統設計 (AI & System Design)
  - 開發紀律 (Development Discipline)
- Added Principles:
  - 原則一：零信任與權限最小化
  - 原則二：資料落地與分類
  - 原則三：完整可監査日誌
  - 原則四：強制依賴管理與掃描
  - 原則五：AI 回應可追溯與有界
  - 原則六：原生整合優先
  - 原則七：模組化與 API 驅動
  - 原則八：測試驅動與場景驗收
  - 原則九：避免過度工程
  - 原則十：文件語言強制性
- Templates requiring updates:
  - ✅ updated: .specify/templates/plan-template.md
- Follow-up TODOs:
  - TODO(RATIFICATION_DATE): 專案初始批准日期未知
-->
# 個人工作助理專案 憲法

## 第一部分：安全與合規 (Security & Compliance)

### 原則一：零信任與權限最小化 (Zero Trust & Least Privilege)
任何功能都不得隱含信任。所有對 Microsoft 365 資源（Outlook, Teams, SharePoint）的存取，都必須通過 Microsoft Entra ID (原 Azure AD) 進行使用者身份驗證與授權。應用程式本身僅被授予完成單一任務所需的最小權限 (e.g., 使用 Graph API 的 Mail.ReadBasic, Calendars.Read)，並嚴格遵守使用者的權限範圍。所有權限申請必須文件化並通過資安審查。

### 原則二：資料落地與分類 (Data Residency & Classification)
任何涉及個人可識別資訊 (PII) 或內部敏感資料的處理，其運算與儲存必須在台灣境內的雲端或地端設施完成。所有處理的資料（如郵件內文、會議記錄）都必須被預設為「機敏資料」等級進行處理，並遵循銀行的資料保護政策。

### 原則三：完整可監査日誌 (Comprehensive Audit Trails)
所有關鍵操作，包括：使用者請求、AI Agent 決策路徑 (LangGraph state)、對外部 API 的呼叫、資料存取行為，都必須留下詳細且不可竄改的日誌紀錄。日誌需整合至銀行中央 SIEM 系統，並確保 LangSmith 中的追蹤紀錄符合內部稽核要求。

### 原則四：強制依賴管理與掃描 (Mandatory Dependency Management & Scanning)
所有專案的外部依賴套件（包括 Python libraries）必須在 requirements.txt 或 pyproject.toml 中明確鎖定版本。每次提交程式碼前，必須通過自動化的弱點掃描工具（如 Snyk, Dependabot）檢測，禁止使用任何存在已知中高風險漏洞的套件。

## 第二部分：AI 與系統設計 (AI & System Design)

### 原則五：AI 回應可追溯與有界 (Traceable & Grounded AI Responses)
AI Agent 的所有產出（特別是「疑難求解」功能）必須「有據可循」。對於基於內部文件的問答，回應必須明確引用其來源（SharePoint 文件名與段落）。嚴格採用 RAG (Retrieval-Augmented Generation) 模式，禁止模型在無內部資料依據下進行「幻覺」式回答。

### 原則六：原生整合優先 (Native Integration First)
優先使用 Microsoft 提供的原生 API 與服務（如 Microsoft Graph API, Teams Bot Framework, Power Automate）進行系統整合。僅在原生功能無法滿足安全、稽核或性能要求時，才考慮引入額外抽象層。此舉旨在降低複雜性並最大化利用現有生態系的安全性。

### 原則七：模組化與 API 驅動 (Modular & API-Driven)
核心業務邏輯（如：會議摘要演算法、需求對齊分析器）應封裝成獨立、可重複使用的模組。模組之間、以及模組與外部系統（如 Teams Bot）之間，必須通過定義清晰的內部 API Contract 進行通訊，以利於獨立測試與維護。

## 第三部分：開發紀律 (Development Discipline)

### 原則八：測試驅動與場景驗收 (Test-Driven & Scenario-Based Acceptance)
所有新功能都必須先撰寫整合測試與驗收測試。測試案例需使用 Gherkin 語法 (Given-When-Then) 描述真實業務場景，確保開發成果直接對應到規格文件 (spec.md) 中的驗收準則。資安相關的測試（如權限繞過、Prompt Injection）應被視為最高優先級。

### 原則九：避免過度工程 (YAGNI - You Ain't Gonna Need It)
嚴格遵循 spec.md 的範圍進行開發，禁止為「未來可能」的需求預先建構複雜的解決方案。專案初期應聚焦在最有價值的核心功能上（如：會議總結），快速交付並收集回饋。

### 原則十：文件語言強制性 (Mandatory Documentation Language)
所有專案產出文件，包括 spec.md, plan.md, tasks.md，以及程式碼中的註解、Commit ，必須使用繁體中文 (zh-tw) 撰寫。

## Governance (治理)
本憲法是專案的最高指導原則，其效力高於所有其他實踐。任何修訂都必須經過正式文件記錄、團隊審批，並制定遷移計畫。所有程式碼提交與審查 (PRs/Reviews) 都必須驗證其是否符合憲法原則。任何複雜性或對原則的偏離都必須有充分的理由並被明確記錄。

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): 專案初始批准日期未知 | **Last Amended**: 2025-10-16