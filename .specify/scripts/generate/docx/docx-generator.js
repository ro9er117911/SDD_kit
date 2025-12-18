const { Document, Packer, Paragraph, AlignmentType, TextRun } = require('docx');
const fs = require('fs');
const path = require('path');
const { OUTPUT_DIR, DOCX_DESIGN } = require('../shared/config');
const { createHeading, createBullet, createNumberedList, createParagraph, createSpacer } = require('./docx-formatters');
const { createMermaidImage } = require('./docx-image-handler');

/**
 * Parse Markdown file into DOCX sections
 * @param {string} filePath - Path to markdown file
 * @param {string} fileName - Name of file
 * @param {Object} mermaidDiagrams - Object with diagram keys and paths
 * @returns {Array} Array of DOCX paragraph/section elements
 */
function parseFileToDocx(filePath, fileName, mermaidDiagrams = {}) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const children = [];
    let inMermaidBlock = false;
    let mermaidLineStart = -1;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line && !inMermaidBlock) continue;

        // Detect Mermaid blocks
        if (line.startsWith('```mermaid')) {
            inMermaidBlock = true;
            mermaidLineStart = i;
            continue;
        }
        if (inMermaidBlock && line.startsWith('```')) {
            inMermaidBlock = false;
            // Insert Mermaid image if available
            const diagramKey = `${fileName}_${mermaidLineStart}`;
            if (mermaidDiagrams[diagramKey]) {
                const imageParagraph = createMermaidImage(mermaidDiagrams[diagramKey]);
                if (imageParagraph) {
                    children.push(imageParagraph);
                }
            }
            continue;
        }
        if (inMermaidBlock) continue;

        // Main title (# Title)
        if (line.startsWith('# ')) {
            const title = line.replace('# ', '');
            children.push(createHeading(title, 1));
        }
        // Section header (## Section)
        else if (line.startsWith('## ')) {
            const section = line.replace('## ', '');
            children.push(createSpacer());
            children.push(createHeading(section, 2));
        }
        // Subsection header (### Subsection)
        else if (line.startsWith('### ')) {
            const subsection = line.replace('### ', '');
            children.push(createHeading(subsection, 3));
        }
        // Bullet points (- item or * item)
        else if (line.startsWith('- ') || line.startsWith('* ')) {
            const cleanText = line.replace(/^[-*]\s+/, '');
            children.push(createBullet(cleanText, 0));
        }
        // Numbered list (1. item)
        else if (/^\d+\.\s/.test(line)) {
            const cleanText = line.replace(/^\d+\.\s/, '');
            children.push(createNumberedList(cleanText, 0));
        }
        // Regular paragraphs (skip tables and horizontal rules)
        else if (!line.startsWith('|') && !line.includes('---')) {
            const paragraph = createParagraph(line);
            if (paragraph) {
                children.push(paragraph);
            }
            // Long paragraphs (>150 chars) are automatically filtered by createParagraph()
        }
    }

    return children;
}

/**
 * Generate DOCX document from parsed Bank Profile data
 * @param {Array} filesData - Array of {fileName, sections} objects (not used directly, we re-parse)
 * @param {Object} mermaidDiagrams - Object with diagram keys and paths
 * @param {string} outputPath - Optional output path (defaults to OUTPUT_DIR)
 * @param {string} baseDir - Optional base directory for files (defaults to BANK_PROFILE_DIR)
 * @returns {Promise<string>} Path to generated DOCX file
 */
async function generateDocx(filesData, mermaidDiagrams = {}, outputPath = null, baseDir = null) {
    console.log('\n📄 生成 DOCX 文件...');

    const allChildren = [];

    // Title page
    allChildren.push(
        new Paragraph({
            text: 'Bank Profile',
            heading: 'Heading1',
            alignment: AlignmentType.CENTER,
            spacing: {
                before: 2000,
                after: 1000
            },
            run: {
                size: 48,
                bold: true,
                color: DOCX_DESIGN.colors.primary
            }
        })
    );

    allChildren.push(
        new Paragraph({
            text: '銀行專案完整規格文件',
            alignment: AlignmentType.CENTER,
            spacing: {
                after: 2000
            },
            run: {
                size: 28,
                color: DOCX_DESIGN.colors.text
            }
        })
    );

    // Process each file
    const actualBaseDir = baseDir || require('../shared/config').BANK_PROFILE_DIR;

    for (const { fileName } of filesData) {
        console.log(`  處理檔案: ${fileName}`);

        const filePath = path.join(actualBaseDir, fileName);

        // Skip if file doesn't exist
        if (!fs.existsSync(filePath)) {
            console.log(`  ⚠ 跳過 ${fileName} (檔案不存在)`);
            continue;
        }

        // Parse file and add to document
        const fileChildren = parseFileToDocx(filePath, fileName, mermaidDiagrams);
        allChildren.push(...fileChildren);

        // Add page break after each file (except last)
        allChildren.push(
            new Paragraph({
                text: '',
                pageBreakBefore: true
            })
        );
    }

    // Create document
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: allChildren
            }
        ],
        numbering: {
            config: [
                {
                    reference: 'default-numbering',
                    levels: [
                        {
                            level: 0,
                            format: 'decimal',
                            text: '%1.',
                            alignment: AlignmentType.LEFT
                        }
                    ]
                }
            ]
        }
    });

    // Write file
    const finalOutputPath = outputPath || path.join(OUTPUT_DIR, 'Bank_Profile_Full.docx');
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(finalOutputPath, buffer);
    console.log(`✓ DOCX 生成成功: ${finalOutputPath}`);

    return finalOutputPath;
}

module.exports = {
    generateDocx
};
