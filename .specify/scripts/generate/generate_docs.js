const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
const PptxGenJS = require('pptxgenjs');

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

// --- DOCX Generation ---

async function generateDocx() {
    console.log('Generating DOCX...');
    const sections = [];

    for (const file of FILES) {
        const content = readFile(file);
        if (!content) continue;

        const lines = content.split('\n');
        const children = [];

        for (let line of lines) {
            line = line.trim();
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
            } else if (line.startsWith('#### ')) {
                children.push(new Paragraph({
                    text: line.replace('#### ', ''),
                    heading: HeadingLevel.HEADING_4,
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
                    bullet: { level: 0 } // Simplified to bullet for now
                }));
            } else if (line.startsWith('|')) {
                // Simple table handling - just render as text for now to avoid complex parsing in this quick script
                // Or better, skip if it's a separator line
                if (line.includes('---')) continue;
                children.push(new Paragraph({
                    children: [new TextRun({ text: line, font: "Courier New", size: 20 })]
                }));
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
    console.log('DOCX generated: Bank_Profile_Full.docx');
}

// --- PPTX Generation ---

async function generatePptx() {
    console.log('Generating PPTX...');
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    // Title Slide
    let slide = pptx.addSlide();
    slide.addText('Bank Profile Project Overview', { x: 1, y: 1, w: '80%', h: 1, fontSize: 36, align: 'center' });
    slide.addText('Generated from SDD Bank Profile (00-70)', { x: 1, y: 2.5, w: '80%', h: 1, fontSize: 18, align: 'center', color: '666666' });

    for (const file of FILES) {
        const content = readFile(file);
        if (!content) continue;

        const lines = content.split('\n');
        let currentTitle = file;
        let currentContent = [];

        // Create a slide for the file title
        let fileSlide = pptx.addSlide();
        fileSlide.addText(file, { x: 0.5, y: 0.5, w: '90%', h: 0.8, fontSize: 32, color: '003366', bold: true });
        
        let yPos = 1.5;
        
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            if (line.startsWith('|') || line.includes('---')) continue; // Skip tables and separators for PPTX simplicity

            if (line.startsWith('# ')) {
                 // Main title already handled
            } else if (line.startsWith('## ')) {
                // New slide for major sections
                if (currentContent.length > 0) {
                     // Flush previous content to slide
                     // (Simplified: just creating new slides for headers)
                }
                let sectionSlide = pptx.addSlide();
                sectionSlide.addText(file, { x: 0.5, y: 0.2, w: '90%', h: 0.5, fontSize: 14, color: '999999' });
                sectionSlide.addText(line.replace('## ', ''), { x: 0.5, y: 0.8, w: '90%', h: 0.6, fontSize: 28, color: '003366', bold: true });
                yPos = 1.6;
                currentContent = []; // Reset content tracker (not really used in this simple loop but good for logic)
            } else if (line.startsWith('### ')) {
                 // Subheader
                 // If we are on a slide, add subheader
                 // We need to keep track of "current slide" object, but PptxGenJS adds slides sequentially.
                 // For simplicity in this script, we'll just add text to the "last" slide added, assuming it's the section slide.
                 // But we can't easily get "last slide".
                 // Let's just add a text box.
                 // NOTE: This is a very basic converter.
            } else {
                // Content text
                // We can't easily append to the "current slide" without the object reference.
                // Let's refactor slightly to keep reference.
            }
        }
        
        // REFACTORING PPTX LOOP FOR BETTER SLIDE HANDLING
        // Re-parsing file for PPTX structure
        const sections = [];
        let currentSection = { title: file, items: [] };
        
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            if (line.startsWith('# ')) continue; // Skip file title
            
            if (line.startsWith('## ')) {
                sections.push(currentSection);
                currentSection = { title: line.replace('## ', ''), items: [] };
            } else if (line.startsWith('- ') || line.startsWith('* ')) {
                currentSection.items.push(line.replace(/^[-*] /, '• '));
            } else if (/^\d+\.\s/.test(line)) {
                currentSection.items.push(line);
            } else if (line.length > 0 && !line.startsWith('|') && !line.includes('---') && !line.startsWith('#')) {
                 if (line.length < 100) { // Only short lines as bullet points equivalent
                    currentSection.items.push(line);
                 }
            }
        }
        sections.push(currentSection);

        // Render sections to slides
        for (const section of sections) {
            if (section.items.length === 0 && section.title === file) continue; // Skip empty initial

            let s = pptx.addSlide();
            s.addText(file, { x: 0.5, y: 0.2, w: '90%', h: 0.4, fontSize: 12, color: '888888' });
            s.addText(section.title, { x: 0.5, y: 0.7, w: '90%', h: 0.6, fontSize: 24, color: '003366', bold: true });
            
            let contentText = section.items.slice(0, 12).join('\n'); // Limit items per slide
            if (contentText) {
                s.addText(contentText, { x: 0.8, y: 1.5, w: '85%', h: 5.0, fontSize: 16, color: '333333', lineSpacing: 28 });
            }
        }
    }

    await pptx.writeFile({ fileName: path.join(OUTPUT_DIR, 'Bank_Profile_Presentation.pptx') });
    console.log('PPTX generated: Bank_Profile_Presentation.pptx');
}

// Run
(async () => {
    try {
        await generateDocx();
        await generatePptx();
        console.log('All documents generated successfully.');
    } catch (error) {
        console.error('Error generating documents:', error);
    }
})();
