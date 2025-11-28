const { CONTENT_CONFIG } = require('../shared/config');

const CHARS_PER_LINE = 80; // Rough estimate for line wrapping in PPTX

/**
 * Select key points from content items with intelligent selection
 * Priority: Items with subheadings (▸) are preferred
 * @param {Array} items - Array of content items
 * @param {number} maxItems - Maximum number of items to select
 * @returns {Array} Selected key points
 */
function selectKeyPoints(items, maxItems = CONTENT_CONFIG.pptx.keyPointsForText) {
    if (items.length <= maxItems) {
        return items; // If already under limit, return all
    }

    // Priority strategy: Prefer items with subheadings (▸)
    const withSubheading = items.filter(item => item.trim().startsWith('▸'));
    const withoutSubheading = items.filter(item => !item.trim().startsWith('▸'));

    let selected = [];

    if (withSubheading.length >= maxItems) {
        // If we have enough subheading items, use those
        selected = withSubheading.slice(0, maxItems);
    } else {
        // Otherwise, include all subheading items and fill with regular bullet points
        selected = [...withSubheading];
        const remaining = maxItems - selected.length;
        selected.push(...withoutSubheading.slice(0, remaining));
    }

    return selected;
}

/**
 * Roughly estimate how many lines a text item will take on a slide
 * @param {string} text
 * @returns {number}
 */
function estimateLines(text) {
    if (!text) return 1;
    return Math.ceil(text.length / CHARS_PER_LINE) || 1;
}

/**
 * Trim text to a target length and add ellipsis when needed
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
function trimText(text, maxLength) {
    if (!maxLength || text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Split content into pages based on line count
 * @param {Array} items - Array of content items
 * @param {number} maxLines - Maximum lines per page
 * @returns {Array} Array of pages (each page is an array of items)
 */
function splitContentIntoPages(items, maxLines) {
    const pages = [];
    let currentPage = [];
    let currentLines = 0;

    for (const item of items) {
        // Estimate lines (rough calculation: 80 chars per line)
        const itemLines = estimateLines(item);

        if (currentLines + itemLines > maxLines && currentPage.length > 0) {
            // Start new page
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

/**
 * Condense items so they stay within the allowed number of slides
 * @param {Array} items
 * @param {number} maxLinesPerSlide
 * @param {number} maxSlides
 * @param {number} trimLength
 * @returns {Array} Condensed items
 */
function limitSlides(items, maxLinesPerSlide, maxSlides, trimLength) {
    if (!items || items.length === 0) {
        return [];
    }

    const maxTotalLines = maxSlides * maxLinesPerSlide;
    const totalLines = list => list.reduce((sum, text) => sum + estimateLines(text), 0);

    // First pass: trim overly long bullets to reduce line count
    let result = items.map(item => trimText(item, trimLength));

    // Drop lower-priority tail items until we fit within the slide budget
    while (totalLines(result) > maxTotalLines && result.length > 1) {
        result = result.slice(0, result.length - 1);
    }

    // If there's still overflow with a single long item, trim more aggressively
    let dynamicTrim = trimLength;
    while (result.length === 1 && totalLines(result) > maxTotalLines && dynamicTrim > 40) {
        dynamicTrim = Math.max(40, Math.floor(dynamicTrim * 0.85));
        result = [trimText(result[0], dynamicTrim)];
    }

    return result;
}

module.exports = {
    selectKeyPoints,
    splitContentIntoPages,
    limitSlides
};
