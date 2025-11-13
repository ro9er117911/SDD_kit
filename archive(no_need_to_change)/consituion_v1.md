為 Spec Bot 專案建立技術憲法 (constitution.md)，定義以下不可變規則：

1. **架構原則**
   - 單一事實來源：GitHub Repository 為唯一權威版本
   - 輕量沙箱：所有自動化操作必須在 Docker 容器中執行
   - 無直接終端機存取：Bot 不得擁有主機系統權限
   - 狀態外部化：Bot 本身無狀態，所有狀態存於 GitHub

2. **安全約束**
   - 所有 secrets (API keys, tokens) 必須透過環境變數注入
   - Docker 容器必須在執行後自動銷毀
   - 網路存取限制：僅允許連線至 Slack API、OpenAI API、GitHub API
   - 命令白名單：僅允許 git、speckit.sh、文件操作指令

3. **品質標準**
   - 所有 Mermaid 圖表必須語法正確且可渲染
   - 文檔必須使用 CommonMark Markdown
   - API 回應時間：Bot 處理 < 5 秒，完整流程 < 3 分鐘
   - 錯誤處理：所有失敗必須記錄並通知 Slack

4. **協作規範**
   - 所有 SDD 產出必須經過 Pull Request 審核
   - Commit message 遵循 Conventional Commits (feat/fix/docs)
   - 分支命名：bot/spec-{timestamp}
   - PR 必須包含完整的變更說明與審核清單

5. **測試要求**
   - 單元測試覆蓋率 > 80%
   - 必須包含 Slack webhook 模擬測試
   - GPT API 呼叫必須有 mock 測試
   - GitHub API 操作必須有整合測試

6. **文件產出格式**
   - SDD 必須包含：系統概述、架構設計、資料模型、API 規格、部署方案
   - 所有圖表使用 Mermaid 語法
   - 章節編號遵循 1.x, 2.x 格式
   - 每個章節必須有清楚的標題與說明

請產出 constitution.md，明確列出上述規則，並在每條規則後說明「為何此規則不可妥協」。