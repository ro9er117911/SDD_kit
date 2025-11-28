const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');
const { parseForPptx } = require('./shared/markdown-parser');
const MermaidRenderer = require('../utils/mermaid_renderer');
const sizeOf = require('image-size');

// Configuration
const TEST_FILE = path.join(process.cwd(), 'test', 'test_slide.md');
const OUTPUT_DIR = path.join(process.cwd(), 'test');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

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
        contentY: 1.4,
        maxLinesPerSlide: 9,
        lineHeight: 0.35
    }
};

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
        y: 1.3,
        w: 1.5,
        h: 0.05,
        fill: DESIGN.colors.accent
    });

    // Content text with markdown formatting
    if (contentItems && contentItems.length > 0) {
        let yOffset = DESIGN.layout.contentY;

        contentItems.forEach((item, index) => {
            // Parse markdown formatting
            const textParts = parseForPptx(item);

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

// Global variable for Mermaid diagrams
let mermaidDiagrams = {};

// --- PPTX Generation ---

async function generateTestPptx() {
    console.log('\n生成測試 PPTX...');
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    // Read test file
    const content = fs.readFileSync(TEST_FILE, 'utf-8');
    const lines = content.split('\n');

    // Parse file into sections
    const sections = [];
    let currentSection = { title: 'test_slide.md', items: [], mermaidImages: [] };
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
            const diagramKey = `test_slide.md_${mermaidLineStart}`;
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
            if (currentSection.items.length > 0 || currentSection.mermaidImages.length > 0 || currentSection.title !== 'test_slide.md') {
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
            if (line.length < 150) {
                currentSection.items.push(line);
            }
        }
    }

    // Push last section
    if (currentSection.items.length > 0 || currentSection.mermaidImages.length > 0) {
        sections.push(currentSection);
    }

    // Render sections to slides
    for (const section of sections) {
        if (section.items.length === 0 && section.mermaidImages.length === 0) continue;

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

                // Title - larger and positioned at top left
                slide.addText(section.title, {
                    x: DESIGN.layout.margin,
                    y: 0.4,
                    w: 9,
                    h: 0.7,
                    fontSize: 28,
                    bold: true,
                    color: DESIGN.colors.primary,
                    align: 'left',
                    valign: 'middle'
                });

                // Add Mermaid diagram image with intelligent layout
                try {
                    const dimensions = sizeOf(imagePath);
                    const imageAspectRatio = dimensions.width / dimensions.height;

                    // Define layout parameters
                    const titleHeight = 1.2; // Space reserved for title
                    const slideWidth = 10;
                    const slideHeight = 5.625;
                    const margin = 0.3;

                    // Available space for diagram
                    const availableWidth = slideWidth - (2 * margin);
                    const availableHeight = slideHeight - titleHeight - margin;

                    let displayWidth, displayHeight, x, y;

                    // Intelligent layout based on aspect ratio
                    if (imageAspectRatio > 1.6) {
                        // Wide images (e.g., sequence diagrams, very wide flowcharts)
                        // Use maximum width, center both horizontally and vertically
                        displayWidth = availableWidth;
                        displayHeight = displayWidth / imageAspectRatio;

                        // Ensure it fits vertically
                        if (displayHeight > availableHeight) {
                            displayHeight = availableHeight;
                            displayWidth = displayHeight * imageAspectRatio;
                        }

                        x = (slideWidth - displayWidth) / 2;
                        y = titleHeight + (availableHeight - displayHeight) / 2;
                    } else if (imageAspectRatio > 1.2) {
                        // Moderately wide images (e.g., horizontal flowcharts)
                        // Use maximum width, position closer to title
                        displayWidth = availableWidth;
                        displayHeight = displayWidth / imageAspectRatio;

                        // Ensure it fits vertically
                        if (displayHeight > availableHeight) {
                            displayHeight = availableHeight;
                            displayWidth = displayHeight * imageAspectRatio;
                        }

                        x = (slideWidth - displayWidth) / 2;
                        y = titleHeight + 0.3; // Closer to title
                    } else {
                        // Vertical or square images (e.g., TD flowcharts)
                        // Use available height, align with title height, center horizontally
                        displayHeight = availableHeight;
                        displayWidth = displayHeight * imageAspectRatio;

                        // Ensure it fits horizontally
                        if (displayWidth > availableWidth) {
                            displayWidth = availableWidth;
                            displayHeight = displayWidth / imageAspectRatio;
                        }

                        x = (slideWidth - displayWidth) / 2;
                        y = titleHeight + 0.2; // Align with title bottom
                    }

                    slide.addImage({
                        path: imagePath,
                        x: x,
                        y: y,
                        w: displayWidth,
                        h: displayHeight
                    });

                    console.log(`  圖表尺寸: ${dimensions.width}x${dimensions.height} (比例: ${imageAspectRatio.toFixed(2)}) → ${displayWidth.toFixed(2)}"x${displayHeight.toFixed(2)}"`);
                } catch (error) {
                    console.error(`Failed to get dimensions for ${imagePath}:`, error);
                    // Fallback to centered layout
                    slide.addImage({
                        path: imagePath,
                        x: 1,
                        y: 1.5,
                        w: 8,
                        h: 3.5
                    });
                }
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
                'test_slide.md',
                section.title,
                pages[i],
                pageNum,
                totalPages
            );
        }
    }

    await pptx.writeFile({ fileName: path.join(OUTPUT_DIR, 'test_output.pptx') });
    console.log('✓ 測試 PPTX 生成成功: test/test_output.pptx');
}


// Run
(async () => {
    try {
        // Initialize Mermaid renderer
        console.log('\n📊 初始化 Mermaid 渲染器...');
        const mermaidRenderer = new MermaidRenderer({
            outputDir: path.join(process.cwd(), '.temp', 'mermaid')
        });

        // Read and render Mermaid diagrams
        const content = fs.readFileSync(TEST_FILE, 'utf-8');
        const diagrams = await mermaidRenderer.renderAll(content);
        diagrams.forEach((diagram, index) => {
            const key = `test_slide.md_${diagram.startLine}`;
            mermaidDiagrams[key] = diagram.imagePath;
        });

        // Generate presentation
        await generateTestPptx();

        console.log('\n✅ 測試文件生成成功');
    } catch (error) {
        console.error('\n❌ 錯誤:', error);
    }
})();
