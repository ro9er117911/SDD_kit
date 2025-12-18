const { Paragraph, HeadingLevel, AlignmentType } = require('docx');
const { DOCX_DESIGN, CONTENT_CONFIG } = require('../shared/config');
const { parseForDocx } = require('../shared/markdown-parser');

/**
 * Create heading paragraph
 * @param {string} text - Heading text
 * @param {number} level - Heading level (1, 2, or 3)
 * @returns {Paragraph} Heading paragraph
 */
function createHeading(text, level = 1) {
    const headingMap = {
        1: {
            level: HeadingLevel.HEADING_1,
            size: DOCX_DESIGN.fonts.heading1.size,
            bold: DOCX_DESIGN.fonts.heading1.bold,
            spacingBefore: DOCX_DESIGN.spacing.beforeHeading1,
            spacingAfter: DOCX_DESIGN.spacing.afterHeading1
        },
        2: {
            level: HeadingLevel.HEADING_2,
            size: DOCX_DESIGN.fonts.heading2.size,
            bold: DOCX_DESIGN.fonts.heading2.bold,
            spacingBefore: DOCX_DESIGN.spacing.beforeHeading2,
            spacingAfter: DOCX_DESIGN.spacing.afterHeading2
        },
        3: {
            level: HeadingLevel.HEADING_3,
            size: DOCX_DESIGN.fonts.heading3.size,
            bold: DOCX_DESIGN.fonts.heading3.bold,
            spacingBefore: DOCX_DESIGN.spacing.beforeHeading3,
            spacingAfter: DOCX_DESIGN.spacing.afterHeading3
        }
    };

    const config = headingMap[level] || headingMap[1];

    return new Paragraph({
        text: text,
        heading: config.level,
        spacing: {
            before: config.spacingBefore,
            after: config.spacingAfter
        },
        run: {
            size: config.size,
            bold: config.bold,
            color: DOCX_DESIGN.colors.primary
        }
    });
}

/**
 * Create bullet point paragraph with Markdown support
 * @param {string} text - Bullet text
 * @param {number} level - Indentation level (0, 1, 2)
 * @returns {Paragraph} Bullet paragraph
 */
function createBullet(text, level = 0) {
    // Remove bullet prefix if present
    const cleanText = text.replace(/^[-*•▸]\s+/, '');
    const textRuns = parseForDocx(cleanText);

    return new Paragraph({
        children: textRuns,
        bullet: { level: level },
        spacing: {
            before: 120,
            after: 120
        }
    });
}

/**
 * Create numbered list paragraph with Markdown support
 * @param {string} text - List item text
 * @param {number} level - Indentation level (0, 1, 2)
 * @returns {Paragraph} Numbered paragraph
 */
function createNumberedList(text, level = 0) {
    // Remove number prefix if present
    const cleanText = text.replace(/^\d+\.\s+/, '');
    const textRuns = parseForDocx(cleanText);

    return new Paragraph({
        children: textRuns,
        numbering: {
            reference: 'default-numbering',
            level: level
        },
        spacing: {
            before: 120,
            after: 120
        }
    });
}

/**
 * Create normal paragraph with Markdown support and length filtering
 * @param {string} text - Paragraph text
 * @returns {Paragraph|null} Normal paragraph or null if filtered out
 */
function createParagraph(text) {
    // Filter out long paragraphs (>150 chars) for medium version
    if (text.length >= CONTENT_CONFIG.docx.maxParagraphLength || text.trim().length === 0) {
        return null;
    }

    const textRuns = parseForDocx(text);

    return new Paragraph({
        children: textRuns,
        spacing: {
            before: DOCX_DESIGN.spacing.paragraph,
            after: DOCX_DESIGN.spacing.paragraph
        }
    });
}

/**
 * Create empty paragraph for spacing
 * @returns {Paragraph} Empty paragraph
 */
function createSpacer() {
    return new Paragraph({
        text: '',
        spacing: {
            before: 200,
            after: 200
        }
    });
}

module.exports = {
    createHeading,
    createBullet,
    createNumberedList,
    createParagraph,
    createSpacer
};
