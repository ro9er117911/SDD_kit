const path = require('path');

// Directory Configuration
const BANK_PROFILE_DIR = path.join(process.cwd(), 'bank-profile');
const OUTPUT_DIR = path.join(BANK_PROFILE_DIR, 'export');

// Bank Profile Files (00-70)
const FILES = [
    '00_meta.md',
    '10_business.md',
    '20_process.md',
    '30_risk_control.md',
    '40_infosec.md',
    '50_compliance.md',
    '60_law.md',
    '70_nfr.md',
    '80_audit.md',
    '90_audit.md'
];

// PPTX Design Constants
const PPTX_DESIGN = {
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

// DOCX Design Constants
const DOCX_DESIGN = {
    fonts: {
        heading1: { size: 32, bold: true },
        heading2: { size: 28, bold: true },
        heading3: { size: 24, bold: true },
        normal: { size: 22 },
        small: { size: 20 }
    },
    spacing: {
        beforeHeading1: 480,
        afterHeading1: 240,
        beforeHeading2: 360,
        afterHeading2: 180,
        beforeHeading3: 240,
        afterHeading3: 120,
        paragraph: 240
    },
    colors: {
        primary: 'c41e3a',
        text: '2c2c2c'
    },
    mermaid: {
        maxWidth: 550,   // DOCX page width ~6 inches for A4
        maxHeight: 400,
        aspectRatioThreshold: 1.5
    }
};

// Mermaid Configuration
const MERMAID_CONFIG = {
    outputDir: path.join(process.cwd(), '.temp', 'mermaid'),
    cacheEnabled: true
};

// Content Filtering
const CONTENT_CONFIG = {
    docx: {
        maxParagraphLength: 150  // Filter paragraphs longer than this for medium version
    },
    pptx: {
        keyPointsForText: 4,           // Max key points for text sections (tighter to avoid slide sprawl)
        keyPointsForDiagram: 2,        // Max key points for diagram sections
        maxSlidesPerSection: 2,        // Hard cap on pages per section
        diagramSummaryMaxSlides: 1,    // Diagrams get at most one summary slide
        summaryTrimLength: 140         // Trim long bullets so summaries stay concise
    }
};

module.exports = {
    BANK_PROFILE_DIR,
    OUTPUT_DIR,
    FILES,
    PPTX_DESIGN,
    DOCX_DESIGN,
    MERMAID_CONFIG,
    CONTENT_CONFIG
};
