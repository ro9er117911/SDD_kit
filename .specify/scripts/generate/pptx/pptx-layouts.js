const sizeOf = require('image-size');
const { PPTX_DESIGN } = require('../shared/config');

/**
 * Add Mermaid diagram to slide with intelligent layout based on aspect ratio
 * @param {Slide} slide - PPTX slide
 * @param {string} imagePath - Path to diagram image
 * @param {string} title - Slide title
 * @param {PptxGenJS} pptx - PPTX instance for shape types
 * @returns {Object} Layout information {width, height, x, y, aspectRatio}
 */
function addMermaidDiagram(slide, imagePath, title, pptx) {
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

        return {
            width: displayWidth,
            height: displayHeight,
            x: x,
            y: y,
            aspectRatio: imageAspectRatio
        };
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
        return null;
    }
}

/**
 * Create Mermaid diagram slide with title
 * @param {PptxGenJS} pptx - PPTX instance
 * @param {string} fileName - File name (breadcrumb)
 * @param {string} sectionTitle - Section title
 * @param {string} imagePath - Path to diagram image
 * @returns {Slide} Created slide
 */
function createMermaidSlide(pptx, fileName, sectionTitle, imagePath) {
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

    // Title - larger and positioned at top left
    slide.addText(sectionTitle, {
        x: PPTX_DESIGN.layout.margin,
        y: 0.4,
        w: 9,
        h: 0.7,
        fontSize: 28,
        bold: true,
        color: PPTX_DESIGN.colors.primary,
        align: 'left',
        valign: 'middle'
    });

    // Add Mermaid diagram with intelligent layout
    addMermaidDiagram(slide, imagePath, sectionTitle, pptx);

    return slide;
}

module.exports = {
    addMermaidDiagram,
    createMermaidSlide
};
