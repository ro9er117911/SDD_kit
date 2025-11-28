const fs = require('fs');
const sizeOf = require('image-size');
const { Paragraph, ImageRun } = require('docx');
const { DOCX_DESIGN } = require('../shared/config');

/**
 * Create image paragraph with dynamic sizing based on aspect ratio
 * @param {string} imagePath - Path to image file
 * @returns {Paragraph|null} Paragraph with image or null if failed
 */
function createMermaidImage(imagePath) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);

        // FIXED: Dynamic image sizing based on aspect ratio
        const dimensions = sizeOf(imagePath);
        const aspectRatio = dimensions.width / dimensions.height;

        const maxWidth = DOCX_DESIGN.mermaid.maxWidth;
        const maxHeight = DOCX_DESIGN.mermaid.maxHeight;
        const threshold = DOCX_DESIGN.mermaid.aspectRatioThreshold;

        let width, height;

        if (aspectRatio > threshold) {
            // Horizontal images: fit to width
            width = maxWidth;
            height = width / aspectRatio;
        } else {
            // Vertical or square images: fit to height
            height = maxHeight;
            width = height * aspectRatio;
        }

        return new Paragraph({
            children: [
                new ImageRun({
                    data: imageBuffer,
                    transformation: { width, height }
                })
            ],
            spacing: {
                before: 240,
                after: 240
            }
        });
    } catch (err) {
        console.error(`Failed to insert image ${imagePath}:`, err.message);
        return null;
    }
}

/**
 * Check if image file exists and is readable
 * @param {string} imagePath - Path to image file
 * @returns {boolean} True if image exists
 */
function imageExists(imagePath) {
    try {
        return fs.existsSync(imagePath);
    } catch (err) {
        return false;
    }
}

/**
 * Get image dimensions
 * @param {string} imagePath - Path to image file
 * @returns {Object|null} {width, height, aspectRatio} or null if failed
 */
function getImageDimensions(imagePath) {
    try {
        const dimensions = sizeOf(imagePath);
        return {
            width: dimensions.width,
            height: dimensions.height,
            aspectRatio: dimensions.width / dimensions.height
        };
    } catch (err) {
        console.error(`Failed to get dimensions for ${imagePath}:`, err.message);
        return null;
    }
}

module.exports = {
    createMermaidImage,
    imageExists,
    getImageDimensions
};
