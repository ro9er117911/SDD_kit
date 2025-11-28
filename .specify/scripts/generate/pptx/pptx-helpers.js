const { PPTX_DESIGN } = require('../shared/config');
const { parseForPptx } = require('../shared/markdown-parser');

/**
 * Create a title slide
 * @param {PptxGenJS} pptx - PPTX instance
 * @param {string} title - Main title
 * @param {string} subtitle - Subtitle
 * @returns {Slide} Created slide
 */
function createTitleSlide(pptx, title, subtitle = '') {
    const slide = pptx.addSlide();

    // Gradient background
    slide.background = {
        fill: PPTX_DESIGN.colors.primary
    };

    // Main title
    slide.addText(title, {
        x: 1,
        y: 1.8,
        w: 8,
        h: 1.2,
        fontSize: PPTX_DESIGN.fonts.title.size,
        bold: PPTX_DESIGN.fonts.title.bold,
        color: PPTX_DESIGN.colors.white,
        align: 'center',
        valign: 'middle'
    });

    // Subtitle
    if (subtitle) {
        slide.addText(subtitle, {
            x: 1,
            y: 3.2,
            w: 8,
            h: 0.6,
            fontSize: PPTX_DESIGN.fonts.subtitle.size,
            color: PPTX_DESIGN.colors.white,
            align: 'center',
            valign: 'middle'
        });
    }

    // Decorative line
    slide.addShape(pptx.ShapeType.rect, {
        x: 4,
        y: 3,
        w: 2,
        h: 0.05,
        fill: PPTX_DESIGN.colors.white
    });

    return slide;
}

/**
 * Create a section divider slide
 * @param {PptxGenJS} pptx - PPTX instance
 * @param {string} fileName - File name (breadcrumb)
 * @param {string} sectionTitle - Section title
 * @returns {Slide} Created slide
 */
function createSectionSlide(pptx, fileName, sectionTitle) {
    const slide = pptx.addSlide();

    // Gradient background (lighter than title slide)
    slide.background = { color: PPTX_DESIGN.colors.background };

    // Left accent bar
    slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 0.2,
        h: 5.625,
        fill: PPTX_DESIGN.colors.accent
    });

    // File name (breadcrumb)
    slide.addText(fileName, {
        x: 1,
        y: 1.5,
        w: 8,
        h: 0.4,
        fontSize: PPTX_DESIGN.fonts.small.size,
        color: PPTX_DESIGN.colors.textLight,
        align: 'center'
    });

    // Section title
    slide.addText(sectionTitle, {
        x: 1,
        y: 2.2,
        w: 8,
        h: 1,
        fontSize: PPTX_DESIGN.fonts.sectionTitle.size,
        bold: PPTX_DESIGN.fonts.sectionTitle.bold,
        color: PPTX_DESIGN.colors.primary,
        align: 'center',
        valign: 'middle'
    });

    // Decorative underline
    slide.addShape(pptx.ShapeType.rect, {
        x: 4,
        y: 3.3,
        w: 2,
        h: 0.08,
        fill: PPTX_DESIGN.colors.accent
    });

    return slide;
}

/**
 * Create a content slide with header
 * @param {PptxGenJS} pptx - PPTX instance
 * @param {string} fileName - File name (breadcrumb)
 * @param {string} sectionTitle - Section title
 * @param {Array} contentItems - Array of content strings
 * @param {number} pageNum - Current page number
 * @param {number} totalPages - Total number of pages
 * @returns {Slide} Created slide
 */
function createContentSlide(pptx, fileName, sectionTitle, contentItems, pageNum = null, totalPages = null) {
    const slide = pptx.addSlide();

    // White background
    slide.background = { color: PPTX_DESIGN.colors.white };

    // Top accent bar
    slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 10,
        h: 0.15,
        fill: PPTX_DESIGN.colors.accent
    });

    // File name (breadcrumb)
    slide.addText(fileName, {
        x: PPTX_DESIGN.layout.margin,
        y: 0.3,
        w: 5,
        h: 0.3,
        fontSize: PPTX_DESIGN.fonts.small.size,
        color: PPTX_DESIGN.colors.textLight,
        align: 'left'
    });

    // Section title
    const titleWithPage = totalPages > 1
        ? `${sectionTitle} (${pageNum}/${totalPages})`
        : sectionTitle;

    slide.addText(titleWithPage, {
        x: PPTX_DESIGN.layout.margin,
        y: 0.7,
        w: 9,
        h: 0.6,
        fontSize: 24,
        bold: true,
        color: PPTX_DESIGN.colors.primary,
        align: 'left',
        valign: 'middle'
    });

    // Decorative underline
    slide.addShape(pptx.ShapeType.rect, {
        x: PPTX_DESIGN.layout.margin,
        y: 1.3,
        w: 1.5,
        h: 0.05,
        fill: PPTX_DESIGN.colors.accent
    });

    // Content text with markdown formatting
    if (contentItems && contentItems.length > 0) {
        let yOffset = PPTX_DESIGN.layout.contentY;

        contentItems.forEach((item) => {
            // Parse markdown formatting
            const textParts = parseForPptx(item);

            // Add text with formatting
            slide.addText(textParts, {
                x: PPTX_DESIGN.layout.margin + 0.3,
                y: yOffset,
                w: PPTX_DESIGN.layout.contentWidth,
                fontSize: PPTX_DESIGN.fonts.content.size,
                color: PPTX_DESIGN.colors.text,
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
            color: PPTX_DESIGN.colors.textLight,
            align: 'right'
        });
    }

    return slide;
}

module.exports = {
    createTitleSlide,
    createSectionSlide,
    createContentSlide
};
