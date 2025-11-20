const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } = require('docx');
const PptxGenJS = require('pptxgenjs');
const MermaidRenderer = require('../utils/mermaid_renderer');

// Configuration
const BANK_PROFILE_DIR = path.join(process.cwd(), 'bank-profile');
const OUTPUT_DIR = path.join(process.cwd(), 'bank-profile', 'export');
const FILES = [
    '00_meta.md',
    '10_business.md',
    '20_process.md',
    '30_risk_control.md',
    '40_infosec.md',
    '50_compliance.md',
    '60_audit.md',
    '70_nfr.md'
];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper to read file content
function readFile(filename) {
    const filePath = path.join(BANK_PROFILE_DIR, filename);
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
    }
    return null;
}

// Global variable for Mermaid diagrams
let mermaidDiagrams = {};

// --- PPTX Design Constants ---

const DESIGN = {
    colors: {
        primary: 'c41e3a',      // Professional red
        accent: '8b0000',        // Dark red accent  
        background: 'ffffff',    // White background
        text: '2c2c2c',          // Dark gray text
        textLight: '666666',     // Medium gray
        white: 'ffffff'
    },
    fonts: {
        title: { size: 36, bold: true },
        sectionTitle: { size: 28, bold: true },
        subtitle: { size: 18, bold: false },
        content: { size: 16, bold: false },
        small: { size: 12, bold: false }
    },
    layout: {
        margin: 0.5,
        contentWidth: 8.5,
        contentY: 1.4,           // Reduced from 1.8 to fix spacing
        maxLinesPerSlide: 9,
        lineHeight: 0.35
    }
};

// Helper: Parse markdown formatting in text
function parseMarkdownText(text) {
    const parts = [];
    let currentPos = 0;

    // Regex patterns for markdown with priority (higher index = higher priority)
    const patterns = [
        { regex: /`(.+?)`/g, format: { fontFace: 'Courier New' }, priority: 5 },
        { regex: /_(.+?)_/g, format: { italic: true }, priority: 2 },
        { regex: /\*(.+?)\*/g, format: { italic: true }, priority: 3 },
        { regex: /\*\*(.+?)\*\*/g, format: { bold: true }, priority: 4 },
        { regex: /\*\*\*(.+?)\*\*\*/g, format: { bold: true, italic: true }, priority: 5 }
    ];

    // Find all matches across all patterns
    const allMatches = [];
    patterns.forEach(({ regex, format, priority }) => {
        let match;
        // Create a fresh regex for each pattern to reset lastIndex
        const r = new RegExp(regex.source, regex.flags);
        while ((match = r.exec(text)) !== null) {
            allMatches.push({
                start: match.index,
                end: match.index + match[0].length,
                innerText: match[1],
                fullMatch: match[0],
                format: format,
                priority: priority,
                length: match[0].length
            });
        }
    });

    // If no matches, return plain text
    if (allMatches.length === 0) {
        return [{ text: text, options: {} }];
    }

    // Sort by start position, then by priority (higher first), then by length (longer first)
    allMatches.sort((a, b) => {
        if (a.start !== b.start) return a.start - b.start;
        if (a.priority !== b.priority) return b.priority - a.priority;
        return b.length - a.length;
    });

    // Filter out overlapping matches - keep highest priority, longest match
    const matches = [];
    const used = new Set();

    for (const match of allMatches) {
        let hasOverlap = false;
        for (let i = match.start; i < match.end; i++) {
            if (used.has(i)) {
                hasOverlap = true;
                break;
            }
        }

        if (!hasOverlap) {
            matches.push(match);
            for (let i = match.start; i < match.end; i++) {
                used.add(i);
            }
        }
    }

    // Sort final matches by position for building output
    matches.sort((a, b) => a.start - b.start);

    // Build parts array
    matches.forEach(match => {
        // Add plain text before match
        if (currentPos < match.start) {
            const plainText = text.substring(currentPos, match.start);
            if (plainText) {
                parts.push({ text: plainText, options: {} });
            }
        }

        // Add formatted text
        parts.push({ text: match.innerText, options: match.format });
        currentPos = match.end;
    });

    // Add remaining plain text
    if (currentPos < text.length) {
        const remaining = text.substring(currentPos);
        if (remaining) {
            parts.push({ text: remaining, options: {} });
        }
    }

    return parts.length > 0 ? parts : [{ text: text, options: {} }];
}

// Helper: Split content into pages
function splitContentIntoPages(items, maxLines = DESIGN.layout.maxLinesPerSlide) {
    const pages = [];
    let currentPage = [];
    let currentLines = 0;

    for (const item of items) {
        const itemLines = Math.ceil(item.length / 80) || 1;

        if (currentLines + itemLines > maxLines && currentPage.length > 0) {
            pages.push(currentPage);
            currentPage = [item];
            currentLines = itemLines;
        } else {
            currentPage.push(item);
            currentLines += itemLines;
        }
    }

    if (currentPage.length > 0) {
        pages.push(currentPage);
    }

    return pages;
}

// Helper: Create title slide
function createTitleSlide(pptx, mainTitle, subtitle) {
    const slide = pptx.addSlide();

    // Red background
    slide.background = { color: DESIGN.colors.primary };

    // Decorative accent bar
    slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 2.8,
        w: 10,
        h: 0.15,
        fill: DESIGN.colors.accent
    });

    // Main title
    slide.addText(mainTitle, {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 1.2,
        fontSize: DESIGN.fonts.title.size,
        bold: DESIGN.fonts.title.bold,
        color: DESIGN.colors.white,
        align: 'center',
        valign: 'middle'
    });

    // Subtitle
    slide.addText(subtitle, {
        x: 0.5,
        y: 3.2,
        w: 9,
        h: 0.8,
        fontSize: DESIGN.fonts.subtitle.size,
        color: DESIGN.colors.background,
        align: 'center',
        valign: 'middle'
    });

    return slide;
}

// Helper: Create section divider slide
function createSectionSlide(pptx, fileName, sectionTitle) {
    const slide = pptx.addSlide();

    // Left accent block
    slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 3.5,
        h: 5.625,
        fill: DESIGN.colors.primary
    });

    // Section title on accent block
    slide.addText(sectionTitle, {
        x: 0.3,
        y: 2.2,
        w: 3,
        h: 1.5,
        fontSize: DESIGN.fonts.sectionTitle.size,
        bold: DESIGN.fonts.sectionTitle.bold,
        color: DESIGN.colors.white,
        align: 'left',
        valign: 'middle',
        breakLine: true
    });

    // File reference
    slide.addText(fileName, {
        x: 4,
        y: 0.5,
        w: 5.5,
        h: 0.4,
        fontSize: DESIGN.fonts.small.size,
        color: DESIGN.colors.textLight,
        align: 'left'
    });

    // Decorative accent line
    slide.addShape(pptx.ShapeType.rect, {
        x: 4,
        y: 1,
        w: 0.1,
        h: 3.5,
        fill: DESIGN.colors.accent
    });

    return slide;
}

// Helper: Create content slide with header
function createContentSlide(pptx, fileName, sectionTitle, contentItems, pageNum = null, totalPages = null) {
    const slide = pptx.addSlide();

    // White background
    slide.background = { color: DESIGN.colors.white };

    // Top accent bar
    slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 10,
        h: 0.15,
        fill: DESIGN.colors.accent
    });

    // File name (breadcrumb)
    slide.addText(fileName, {
        x: DESIGN.layout.margin,
        y: 0.3,
        w: 5,
        h: 0.3,
        fontSize: DESIGN.fonts.small.size,
        color: DESIGN.colors.textLight,
        align: 'left'
    });

    // Section title
    const titleWithPage = totalPages > 1
        ? `${sectionTitle} (${pageNum}/${totalPages})`
        : sectionTitle;

    slide.addText(titleWithPage, {
        x: DESIGN.layout.margin,
        y: 0.7,
        w: 9,
        h: 0.6,
        fontSize: 24,
        bold: true,
        color: DESIGN.colors.primary,
        align: 'left',
        valign: 'middle'
    });

    // Decorative underline
    slide.addShape(pptx.ShapeType.rect, {
        x: DESIGN.layout.margin,
        y: 1.3,  // Reduced from 1.5
        w: 1.5,
        h: 0.05,
        fill: DESIGN.colors.accent
    });

    // Content text with markdown formatting
    if (contentItems && contentItems.length > 0) {
        let yOffset = DESIGN.layout.contentY;

        contentItems.forEach((item, index) => {
            // Parse markdown formatting
            const textParts = parseMarkdownText(item);

            // Add text with formatting
            slide.addText(textParts, {
                x: DESIGN.layout.margin + 0.3,
                y: yOffset,
                w: DESIGN.layout.contentWidth,
                fontSize: DESIGN.fonts.content.size,
                color: DESIGN.colors.text,
                align: 'left',
                valign: 'top'
            });

            // Calculate height for next item
            const itemLines = Math.ceil(item.length / 80) || 1;
            yOffset += itemLines * 0.28;
        });
    }

    // Footer with page number indicator
    if (totalPages > 1) {
        slide.addText(`${pageNum} / ${totalPages}`, {
            x: 8.5,
            y: 5.1,
            w: 1,
            h: 0.3,
            fontSize: 10,
            color: DESIGN.colors.textLight,
            align: 'right'
        });
    }

    return slide;
}

// --- DOCX Generation ---

async function generateDocx() {
    console.log('\nGenerating DOCX...');
    const sections = [];

    for (const file of FILES) {
        const content = readFile(file);
        if (!content) continue;

        const lines = content.split('\n');
        const children = [];
        let inMermaidBlock = false;
        let mermaidLineStart = -1;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            // Detect Mermaid blocks
            if (line.startsWith('```mermaid')) {
                inMermaidBlock = true;
                mermaidLineStart = i;
                continue;
            }
            if (inMermaidBlock && line.startsWith('```')) {
                inMermaidBlock = false;
                // Insert Mermaid image if available
                const diagramKey = `${file}_${mermaidLineStart}`;
                if (mermaidDiagrams[diagramKey]) {
                    try {
                        const imageBuffer = fs.readFileSync(mermaidDiagrams[diagramKey]);
                        children.push(new Paragraph({
                            children: [
                                new ImageRun({
                                    data: imageBuffer,
                                    transformation: {
                                        width: 600,
                                        height: 400
                                    }
                                })
                            ]
                        }));
                    } catch (err) {
                        console.error(`Failed to insert image: ${err.message}`);
                    }
                }
                continue;
            }
            if (inMermaidBlock) {
                continue; // Skip mermaid code lines
            }

            if (!line) {
                children.push(new Paragraph({ text: "" }));
                continue;
            }

            if (line.startsWith('# ')) {
                children.push(new Paragraph({
                    text: line.replace('# ', ''),
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 }
                }));
            } else if (line.startsWith('## ')) {
                children.push(new Paragraph({
                    text: line.replace('## ', ''),
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 300, after: 150 }
                }));
            } else if (line.startsWith('### ')) {
                children.push(new Paragraph({
                    text: line.replace('### ', ''),
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 }
                }));
            } else if (line.startsWith('- ') || line.startsWith('* ')) {
                children.push(new Paragraph({
                    text: line.replace(/^[-*] /, ''),
                    bullet: { level: 0 }
                }));
            } else if (/^\d+\.\s/.test(line)) {
                children.push(new Paragraph({
                    text: line.replace(/^\d+\.\s/, ''),
                    bullet: { level: 0 }
                }));
            } else if (line.startsWith('|') && line.includes('---')) {
                continue; // Skip table separators
            } else {
                children.push(new Paragraph({
                    children: [new TextRun({ text: line })]
                }));
            }
        }

        sections.push({
            properties: {},
            children: children
        });
    }

    const doc = new Document({
        sections: sections
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'Bank_Profile_Full.docx'), buffer);
    console.log('✓ DOCX generated: Bank_Profile_Full.docx');
}

// --- PPTX Generation ---

async function generatePptx() {
    console.log('\nGenerating PPTX with professional design...');
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    // Configure presentation properties
    pptx.author = 'SDD Bank Profile Generator';
    pptx.company = 'Bank Profile Project';
    pptx.subject = 'Bank Profile Documentation';
    pptx.title = 'Bank Profile Presentation';

    // Create title slide
    createTitleSlide(
        pptx,
        'Bank Profile Project Overview',
        '系統設計文件 | System Design Document'
    );

    // Process each file
    for (const file of FILES) {
        const content = readFile(file);
        if (!content) continue;

        const lines = content.split('\n');

        // Parse file into sections
        const sections = [];
        let currentSection = { title: file, items: [], mermaidImages: [] };
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
                const diagramKey = `${file}_${mermaidLineStart}`;
                if (mermaidDiagrams[diagramKey]) {
                    currentSection.mermaidImages.push(mermaidDiagrams[diagramKey]);
                }
                continue;
            }
            if (inMermaidBlock) continue;

            // Skip main file title
            if (line.startsWith('# ')) continue;

            // New section on ## header
            if (line.startsWith('## ')) {
                if (currentSection.items.length > 0 || currentSection.mermaidImages.length > 0 || currentSection.title !== file) {
                    sections.push(currentSection);
                }
                currentSection = {
                    title: line.replace('## ', ''),
                    items: [],
                    mermaidImages: []
                };
            }
            // Add content items
            else if (line.startsWith('- ') || line.startsWith('* ')) {
                currentSection.items.push(line.replace(/^[-*] /, '• '));
            }
            else if (/^\d+\.\s/.test(line)) {
                currentSection.items.push(line);
            }
            else if (line.startsWith('### ')) {
                currentSection.items.push('\n' + line.replace('### ', '▸ '));
            }
            // Regular text (skip tables and horizontal rules)
            else if (!line.startsWith('|') && !line.includes('---') && !line.startsWith('#')) {
                if (line.length < 150) {
                    currentSection.items.push(line);
                }
            }
        }

        // Push last section
        if (currentSection.items.length > 0 || currentSection.mermaidImages.length > 0) {
            sections.push(currentSection);
        }

        // Render sections to slides with pagination
        for (const section of sections) {
            if (section.items.length === 0 && section.mermaidImages.length === 0) continue;

            // Create section divider for major sections (not file-level)
            if (section.title !== file) {
                createSectionSlide(pptx, file, section.title);
            }

            // Add Mermaid diagrams if present
            if (section.mermaidImages && section.mermaidImages.length > 0) {
                for (const imagePath of section.mermaidImages) {
                    const slide = pptx.addSlide();

                    // White background
                    slide.background = { color: DESIGN.colors.white };

                    // Top accent bar
                    slide.addShape(pptx.ShapeType.rect, {
                        x: 0,
                        y: 0,
                        w: 10,
                        h: 0.15,
                        fill: DESIGN.colors.accent
                    });

                    // Title
                    slide.addText(section.title, {
                        x: DESIGN.layout.margin,
                        y: 0.7,
                        w: 9,
                        h: 0.6,
                        fontSize: 24,
                        bold: true,
                        color: DESIGN.colors.primary,
                        align: 'center'
                    });

                    // Add Mermaid diagram image
                    slide.addImage({
                        path: imagePath,
                        x: 1,
                        y: 1.5,
                        w: 8,
                        h: 4
                    });
                }
            }

            // Split content into pages if needed
            const pages = splitContentIntoPages(section.items, DESIGN.layout.maxLinesPerSlide);

            // Create content slides
            for (let i = 0; i < pages.length; i++) {
                const pageNum = i + 1;
                const totalPages = pages.length;

                createContentSlide(
                    pptx,
                    file,
                    section.title,
                    pages[i],
                    pageNum,
                    totalPages
                );
            }
        }
    }

    await pptx.writeFile({ fileName: path.join(OUTPUT_DIR, 'Bank_Profile_Presentation.pptx') });
    console.log('✓ PPTX generated successfully: Bank_Profile_Presentation.pptx');
    console.log('  - Red/white color scheme');
    console.log('  - Markdown formatting (bold/italic)');
    console.log('  - Auto-pagination for long content');
    console.log('  - Mermaid diagrams included');
}

// Run
(async () => {
    try {
        // Initialize Mermaid renderer
        console.log('\n📊 Initializing Mermaid Renderer...');
        const mermaidRenderer = new MermaidRenderer({
            outputDir: path.join(process.cwd(), '.temp', 'mermaid')
        });

        // Pre-render all Mermaid diagrams
        for (const file of FILES) {
            const content = readFile(file);
            if (!content) continue;

            const diagrams = await mermaidRenderer.renderAll(content);
            diagrams.forEach((diagram, index) => {
                const key = `${file}_${diagram.startLine}`;
                mermaidDiagrams[key] = diagram.imagePath;
            });
        }

        // Generate documents
        await generateDocx();
        await generatePptx();

        console.log('\n✅ All documents generated successfully.');

        // Optional: Clean up Mermaid temp files
        // Uncomment if you want to remove temp images after generation
        // mermaidRenderer.cleanup();
    } catch (error) {
        console.error('\n❌ Error generating documents:', error);
    }
})();
