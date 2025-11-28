#!/usr/bin/env bash

# init.sh - SDD Kit 初始化腳本
# 使用方式: ./init.sh [--name "Project Name"] [--keep-examples] [--help]

set -e

# 顏色輸出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 參數解析
PROJECT_NAME=""
KEEP_EXAMPLES=false
REMOVE_GIT=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --name)
            PROJECT_NAME="$2"
            shift 2
            ;;
        --keep-examples)
            KEEP_EXAMPLES=true
            shift
            ;;
        --no-git-reset)
            REMOVE_GIT=false
            shift
            ;;
        --help|-h)
            echo "SDD Kit 初始化腳本"
            echo ""
            echo "使用方式: ./init.sh [選項]"
            echo ""
            echo "選項:"
            echo "  --name <名稱>      設定專案名稱"
            echo "  --keep-examples    保留範例專案"
            echo "  --no-git-reset     不重設 git repository"
            echo "  --help, -h         顯示此說明"
            echo ""
            echo "範例:"
            echo "  ./init.sh --name \"My Project\""
            echo "  ./init.sh --keep-examples"
            exit 0
            ;;
        *)
            echo "未知選項: $1"
            echo "使用 --help 查看說明"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🚀 初始化 SDD Kit...${NC}"
echo ""

# 1. 移除原始 git 歷史（若指定）
if [ "$REMOVE_GIT" = true ]; then
    echo -e "${YELLOW}📦 移除原始 git 歷史...${NC}"
    rm -rf .git
    git init
    echo -e "${GREEN}✓ 已初始化新的 git repository${NC}"
fi

# 2. 建立目錄結構
echo -e "${YELLOW}📁 建立專案目錄...${NC}"
mkdir -p project
mkdir -p specs
mkdir -p .temp
echo -e "${GREEN}✓ 已建立 project/, specs/, .temp/ 目錄${NC}"

# 3. 移除範例（若指定）
if [ "$KEEP_EXAMPLES" = false ]; then
    echo -e "${YELLOW}🗑️  移除範例專案與測試資料...${NC}"
    rm -rf examples/ 2>/dev/null || true
    rm -rf draft/ 2>/dev/null || true
    rm -rf workspace/ 2>/dev/null || true
    rm -rf work-logs/ 2>/dev/null || true
    rm -rf test/ 2>/dev/null || true
    rm -rf bank-profile/ 2>/dev/null || true
    rm -rf ForGithubCopilot_original/ 2>/dev/null || true
    # 清空 project/ 和 specs/ 中的範例資料
    rm -rf project/* 2>/dev/null || true
    rm -rf specs/* 2>/dev/null || true
    echo -e "${GREEN}✓ 已清理範例資料${NC}"
else
    echo -e "${YELLOW}ℹ️  保留範例專案（使用 --keep-examples）${NC}"
fi

# 4. 設定腳本執行權限
echo -e "${YELLOW}🔧 設定腳本執行權限...${NC}"
chmod +x .specify/scripts/bash/*.sh 2>/dev/null || true
echo -e "${GREEN}✓ 已設定腳本執行權限${NC}"

# 5. 安裝 Node.js 依賴（若需要）
if [ -f "package.json" ]; then
    echo -e "${YELLOW}📦 檢查 Node.js 依賴...${NC}"
    if command -v npm &> /dev/null; then
        echo "安裝依賴（用於 PPTX/DOCX 生成）..."
        npm install --silent
        echo -e "${GREEN}✓ 已安裝 Node.js 依賴${NC}"
    else
        echo -e "${YELLOW}⚠️  未找到 npm，跳過依賴安裝${NC}"
        echo "   如需使用文檔生成功能，請安裝 Node.js"
    fi
fi

# 6. 清理臨時檔案
echo -e "${YELLOW}🧹 清理臨時檔案...${NC}"
rm -rf .temp/* 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
echo -e "${GREEN}✓ 已清理臨時檔案${NC}"

# 7. 顯示成功訊息與下一步
echo ""
echo -e "${GREEN}✅ SDD Kit 初始化完成！${NC}"
echo ""
echo -e "${BLUE}📋 下一步：${NC}"
echo ""
echo "  ${YELLOW}1. 建立第一個專案：${NC}"
echo "     ./.specify/scripts/bash/create-new-project.sh \"專案描述\" --project-name \"PROJECT-NAME\""
echo ""
echo "  ${YELLOW}2. 或建立功能規格：${NC}"
echo "     ./.specify/scripts/bash/create-new-feature.sh \"功能描述\""
echo ""
echo "  ${YELLOW}3. 查看文檔：${NC}"
echo "     - README.md - 專案概述與快速開始"
echo "     - docs/SETUP_GUIDE.md - 詳細設定指南"
echo "     - docs/ARCHITECTURE.md - 系統架構說明"
echo ""
echo "  ${YELLOW}4. 使用 AI 助手：${NC}"
echo "     Claude:          /speckit.meta"
echo "     GitHub Copilot:  @agent speckit.meta"
echo ""
echo -e "${GREEN}🎉 開始使用 SDD Kit 進行規格驅動開發！${NC}"
echo ""

# 8. 若有設定專案名稱，記錄到檔案
if [ -n "$PROJECT_NAME" ]; then
    echo "PROJECT_NAME=\"$PROJECT_NAME\"" > .sdd-kit-config
    echo -e "${GREEN}✓ 專案名稱已設定為: $PROJECT_NAME${NC}"
fi
