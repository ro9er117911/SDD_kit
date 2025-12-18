const PptxGenJS = require('pptxgenjs');
const path = require('path');
const { OUTPUT_DIR, CONTENT_CONFIG, PPTX_DESIGN } = require('../shared/config');
const { createTitleSlide, createSectionSlide, createContentSlide } = require('./pptx-helpers');
const { createMermaidSlide } = require('./pptx-layouts');
const { selectKeyPoints, splitContentIntoPages, limitSlides } = require('./content-simplifier');

/**
 * Generate PPTX presentation from parsed Bank Profile data
 * @param {Array} filesData - Array of {fileName, sections} objects
 * @param {string} outputPath - Optional output path (defaults to OUTPUT_DIR)
 * @returns {Promise<string>} Path to generated PPTX file
 */
async function generatePptx(filesData, outputPath = null) {
    console.log('\n📊 生成 PPTX 簡報...');
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    const maxLinesPerSlide = PPTX_DESIGN.layout.maxLinesPerSlide;

    // Title slide
    createTitleSlide(pptx, 'Bank Profile', '銀行專案完整規格');

    // Process each file
    for (const { fileName, sections } of filesData) {
        console.log(`  處理檔案: ${fileName}`);

        // Render sections to slides with pagination and content simplification
        for (const section of sections) {
            if (section.items.length === 0 && section.mermaidImages.length === 0) continue;

            // Check if this section has diagrams
            const hasDiagram = section.mermaidImages && section.mermaidImages.length > 0;

            // Create section divider for major sections (not file-level)
            if (section.title !== fileName) {
                createSectionSlide(pptx, fileName, section.title);
            }

            // Add Mermaid diagrams if present
            if (hasDiagram) {
                for (const imagePath of section.mermaidImages) {
                    createMermaidSlide(pptx, fileName, section.title, imagePath);
                }
            }

            // Content simplification logic based on diagram presence
            if (hasDiagram) {
                // SIMPLIFIED: Diagrams + brief summary (1-2 key points)
                const summary = selectKeyPoints(section.items, CONTENT_CONFIG.pptx.keyPointsForDiagram);
                const condensedSummary = limitSlides(
                    summary,
                    maxLinesPerSlide,
                    CONTENT_CONFIG.pptx.diagramSummaryMaxSlides,
                    CONTENT_CONFIG.pptx.summaryTrimLength
                );

                if (condensedSummary.length > 0) {
                    // Create summary slide after diagram
                    const pages = splitContentIntoPages(condensedSummary, maxLinesPerSlide);
                    for (let i = 0; i < pages.length; i++) {
                        createContentSlide(
                            pptx,
                            fileName,
                            section.title + ' (摘要)',
                            pages[i],
                            i + 1,
                            pages.length
                        );
                    }
                }
            } else {
                // SIMPLIFIED: Text sections with 3-5 key points
                const contentToUse = selectKeyPoints(section.items, CONTENT_CONFIG.pptx.keyPointsForText);
                const condensedContent = limitSlides(
                    contentToUse,
                    maxLinesPerSlide,
                    CONTENT_CONFIG.pptx.maxSlidesPerSection,
                    CONTENT_CONFIG.pptx.summaryTrimLength
                );

                if (condensedContent.length > 0) {
                    // Split content into pages if needed
                    const pages = splitContentIntoPages(condensedContent, maxLinesPerSlide);

                    // Create content slides
                    for (let i = 0; i < pages.length; i++) {
                        const pageNum = i + 1;
                        const totalPages = pages.length;

                        createContentSlide(
                            pptx,
                            fileName,
                            section.title,
                            pages[i],
                            pageNum,
                            totalPages
                        );
                    }
                }
            }
        }
    }

    // Write file
    const finalOutputPath = outputPath || path.join(OUTPUT_DIR, 'Bank_Profile_Presentation.pptx');
    await pptx.writeFile({ fileName: finalOutputPath });
    console.log(`✓ PPTX 生成成功: ${finalOutputPath}`);

    return finalOutputPath;
}

module.exports = {
    generatePptx
};
