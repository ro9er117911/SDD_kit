---
description: 將現有任務轉換為具有依賴順序的可執行 GitHub issues，基於可用的設計文件。
tools: ['github/github-mcp-server/issue_write']
---

## 使用者輸入

```text
$ARGUMENTS
```

您**必須**在繼續之前考慮使用者輸入（若非空白）。

## 概要

1. 從 repo 根目錄執行 `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` 並解析 FEATURE_DIR 和 AVAILABLE_DOCS 清單。所有路徑必須是絕對路徑。對於包含單引號的參數（如 "I'm Groot"），使用跳脫語法：例如 'I'\''m Groot'（或若可能使用雙引號："I'm Groot"）。

2. 從執行的腳本中，提取 **tasks** 的路徑。

3. 執行以下命令取得 Git remote：

```bash
git config --get remote.origin.url
```

**只有當 REMOTE 是 GITHUB URL 時才繼續下一步**

4. 對於清單中的每個任務，使用 GitHub MCP server 在與 Git remote 對應的 repository 中建立新的 issue。

**在任何情況下都不要在與 REMOTE URL 不符的 repositories 中建立 issues**
