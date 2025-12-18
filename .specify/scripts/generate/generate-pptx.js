#!/usr/bin/env node

/**
 * Independent PPTX Generator
 * Generates PowerPoint presentation from Bank Profile files
 */

const path = require('path');
const MermaidHandler = require('./shared/mermaid-handler');
const { readAllBankProfileFiles, ensureOutputDirectory, bankProfileExists } = require('./shared/file-utils');
const { generatePptx } = require('./pptx/pptx-generator');
const { BANK_PROFILE_DIR, FILES } = require('./shared/config');

async function main() {
    console.log('═══════════════════════════════════════');
    console.log('   Bank Profile PPTX Generator');
    console.log('═══════════════════════════════════════\n');

    // Check if Bank Profile directory exists
    if (!bankProfileExists()) {
        console.error(`❌ Bank Profile 目錄不存在: ${BANK_PROFILE_DIR}`);
        console.error('   請先建立 Bank Profile 檔案');
        process.exit(1);
    }

    // Ensure output directory exists
    ensureOutputDirectory();

    try {
        // Initialize Mermaid renderer
        console.log('📊 初始化 Mermaid 渲染器...');
        const mermaidHandler = new MermaidHandler();

        // Render all Mermaid diagrams
        console.log('\n🎨 渲染 Mermaid 圖表...');
        const fs = require('fs');
        for (const file of FILES) {
            const filePath = path.join(BANK_PROFILE_DIR, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                await mermaidHandler.renderAll(content, file);
            }
        }

        const mermaidDiagrams = mermaidHandler.getAllDiagrams();
        console.log(`  ✓ 已渲染 ${Object.keys(mermaidDiagrams).length} 個圖表\n`);

        // Read and parse files
        console.log('📖 讀取 Bank Profile 檔案...');
        const filesData = readAllBankProfileFiles(mermaidDiagrams);

        if (filesData.length === 0) {
            console.error('❌ 沒有找到任何 Bank Profile 檔案');
            process.exit(1);
        }

        // Generate PPTX
        const outputPath = await generatePptx(filesData);

        console.log('\n═══════════════════════════════════════');
        console.log('✅ PPTX 生成完成!');
        console.log(`   輸出檔案: ${outputPath}`);
        console.log('═══════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ 錯誤:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { main };
