#!/usr/bin/env node

/**
 * Test DOCX Generator
 * Uses test/test_slide.md for validation
 */

const path = require('path');
const MermaidHandler = require('./shared/mermaid-handler');
const { parseMarkdownFile } = require('./shared/file-utils');
const { generateDocx } = require('./docx/docx-generator');

const TEST_FILE = path.join(process.cwd(), 'test', 'test_slide.md');
const OUTPUT_DIR = path.join(process.cwd(), 'test');

async function main() {
    console.log('═══════════════════════════════════════');
    console.log('   Test DOCX Generator');
    console.log('═══════════════════════════════════════\n');

    const fs = require('fs');

    // Check if test file exists
    if (!fs.existsSync(TEST_FILE)) {
        console.error(`❌ 測試檔案不存在: ${TEST_FILE}`);
        process.exit(1);
    }

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    try {
        // Initialize Mermaid renderer
        console.log('📊 初始化 Mermaid 渲染器...');
        const mermaidHandler = new MermaidHandler(path.join(process.cwd(), '.temp', 'mermaid'));

        // Render Mermaid diagrams
        console.log('\n🎨 渲染 Mermaid 圖表...');
        const content = fs.readFileSync(TEST_FILE, 'utf-8');
        await mermaidHandler.renderAll(content, 'test_slide.md');

        const mermaidDiagrams = mermaidHandler.getAllDiagrams();
        console.log(`  ✓ 已渲染 ${Object.keys(mermaidDiagrams).length} 個圖表\n`);

        // Parse test file
        console.log('📖 讀取測試檔案...');
        const sections = parseMarkdownFile(TEST_FILE, 'test_slide.md', mermaidDiagrams);

        const filesData = [
            {
                fileName: 'test_slide.md',
                sections: sections
            }
        ];

        // Generate DOCX (pass the test directory as baseDir)
        const outputPath = path.join(OUTPUT_DIR, 'test_output.docx');
        const baseDir = path.join(process.cwd(), 'test');
        await generateDocx(filesData, mermaidDiagrams, outputPath, baseDir);

        console.log('\n═══════════════════════════════════════');
        console.log('✅ 測試 DOCX 生成完成!');
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
