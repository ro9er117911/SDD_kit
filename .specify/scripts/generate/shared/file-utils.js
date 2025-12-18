const fs = require('fs');
const path = require('path');
const { BANK_PROFILE_DIR, FILES, OUTPUT_DIR } = require('./config');

/**
 * Parse Markdown file into sections with title, items, and Mermaid diagram references
 * @param {string} filePath - Path to markdown file
 * @param {string} fileName - Name of file for section titles
 * @param {Object} mermaidDiagrams - Object with diagram keys and paths
 * @returns {Array} Array of section objects
 */
function parseMarkdownFile(filePath, fileName, mermaidDiagrams = {}) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const sections = [];
    let currentSection = { title: fileName, items: [], mermaidImages: [] };
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
            const diagramKey = `${fileName}_${mermaidLineStart}`;
            if (mermaidDiagrams[diagramKey]) {
                currentSection.mermaidImages.push(mermaidDiagrams[diagramKey]);
            }
            continue;
        }
        if (inMermaidBlock) continue;

        // Skip main file title (# Title)
        if (line.startsWith('# ')) continue;

        // New section on ## header
        if (line.startsWith('## ')) {
            if (currentSection.items.length > 0 || currentSection.mermaidImages.length > 0 || currentSection.title !== fileName) {
                sections.push(currentSection);
            }
            currentSection = {
                title: line.replace('## ', ''),
                items: [],
                mermaidImages: []
            };
        }
        // Add content items - FIXED: Remove duplicate prefixes
        else if (line.startsWith('- ') || line.startsWith('* ')) {
            // Remove the original bullet and add bullet symbol directly
            const cleanText = line.replace(/^[-*]\s+/, '');
            currentSection.items.push('• ' + cleanText);
        }
        else if (/^\d+\.\s/.test(line)) {
            currentSection.items.push(line);
        }
        else if (line.startsWith('### ')) {
            // Remove ### and add arrow symbol directly
            const cleanText = line.replace(/^###\s+/, '');
            currentSection.items.push('▸ ' + cleanText);
        }
        // Regular text (skip tables and horizontal rules)
        else if (!line.startsWith('|') && !line.includes('---') && !line.startsWith('#')) {
            currentSection.items.push(line);
        }
    }

    // Push last section
    if (currentSection.items.length > 0 || currentSection.mermaidImages.length > 0) {
        sections.push(currentSection);
    }

    return sections;
}

/**
 * Read and parse all Bank Profile files
 * @param {Object} mermaidDiagrams - Object with diagram keys and paths
 * @returns {Array} Array of {fileName, sections} objects
 */
function readAllBankProfileFiles(mermaidDiagrams = {}) {
    const allFiles = [];

    for (const file of FILES) {
        const filePath = path.join(BANK_PROFILE_DIR, file);

        // Skip if file doesn't exist
        if (!fs.existsSync(filePath)) {
            console.log(`⚠ Skipping ${file} (not found)`);
            continue;
        }

        console.log(`Reading ${file}...`);
        const sections = parseMarkdownFile(filePath, file, mermaidDiagrams);

        allFiles.push({
            fileName: file,
            sections: sections
        });
    }

    return allFiles;
}

/**
 * Ensure output directory exists
 */
function ensureOutputDirectory() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`Created output directory: ${OUTPUT_DIR}`);
    }
}

/**
 * Check if Bank Profile directory exists
 * @returns {boolean} True if directory exists
 */
function bankProfileExists() {
    return fs.existsSync(BANK_PROFILE_DIR);
}

/**
 * Get list of existing Bank Profile files
 * @returns {Array} Array of file names that exist
 */
function getExistingFiles() {
    return FILES.filter(file => {
        return fs.existsSync(path.join(BANK_PROFILE_DIR, file));
    });
}

module.exports = {
    parseMarkdownFile,
    readAllBankProfileFiles,
    ensureOutputDirectory,
    bankProfileExists,
    getExistingFiles
};
