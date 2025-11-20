const fs = require('fs');
const path = require('path');
const https = require('https');
const { createHash } = require('crypto');
const zlib = require('zlib');

/**
 * MermaidRenderer - Converts Mermaid diagrams to images
 * Uses mermaid.ink online service (no local dependencies required)
 */
class MermaidRenderer {
    constructor(options = {}) {
        this.outputDir = options.outputDir || path.join(process.cwd(), '.temp', 'mermaid');
        this.imageFormat = options.imageFormat || 'png'; // png or svg
        this.baseUrl = 'https://mermaid.ink/img/';

        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Extract Mermaid code blocks from markdown content
     * @param {string} markdown - Markdown content
     * @returns {Array} Array of { code, startLine, endLine }
     */
    extractMermaidBlocks(markdown) {
        const blocks = [];
        const lines = markdown.split('\n');
        let inMermaidBlock = false;
        let currentBlock = [];
        let startLine = -1;

        lines.forEach((line, index) => {
            if (line.trim().startsWith('```mermaid')) {
                inMermaidBlock = true;
                startLine = index;
                currentBlock = [];
            } else if (inMermaidBlock && line.trim().startsWith('```')) {
                inMermaidBlock = false;
                blocks.push({
                    code: currentBlock.join('\n'),
                    startLine: startLine,
                    endLine: index
                });
            } else if (inMermaidBlock) {
                currentBlock.push(line);
            }
        });

        return blocks;
    }

    /**
     * Generate a unique filename for a mermaid diagram
     * @param {string} mermaidCode - Mermaid diagram code
     * @returns {string} Filename
     */
    generateFilename(mermaidCode) {
        const hash = createHash('md5').update(mermaidCode).digest('hex').substring(0, 8);
        return `mermaid_${hash}.${this.imageFormat}`;
    }

    /**
     * Normalize Mermaid syntax - convert full-width punctuation to ASCII
     * @param {string} mermaidCode - Original Mermaid diagram code
     * @returns {string} Normalized code
     */
    normalizeMermaidSyntax(mermaidCode) {
        let normalized = mermaidCode;

        // Common Chinese input full-width characters -> ASCII replacements
        const replacements = [
            [/—>/g, '-->'],              // Long dash arrow
            [/——>/g, '==>'],             // Double long dash arrow  
            [/\(/g, '('],                // Full-width left paren
            [/\)/g, ')'],                // Full-width right paren
            [/:/g, ':'],                 // Full-width colon
            [/\[/g, '['],                // Full-width left bracket
            [/\]/g, ']'],                // Full-width right bracket
            [/\{/g, '{'],                // Full-width left brace
            [/\}/g, '}'],                // Full-width right brace
            [/,/g, ','],                // Full-width comma
            [/;/g, ';']                 // Full-width semicolon
        ];

        replacements.forEach(([pattern, replacement]) => {
            normalized = normalized.replace(pattern, replacement);
        });

        // Note: HTML entity escaping is NOT needed with JSON.stringify + pako
        // normalized = normalized.replace(/&/g, '&amp;');

        return normalized;
    }

    /**
     * Encode mermaid code to base64 for mermaid.ink using pako compression
     * @param {string} mermaidCode - Mermaid diagram code
     * @returns {string} Pako compressed and base64 encoded string
     */
    encodeMermaidCode(mermaidCode) {
        // Create JSON object as expected by mermaid.ink
        const data = JSON.stringify({
            code: mermaidCode,
            mermaid: { theme: 'default' }
        });

        // Deflate using zlib (equivalent to pako)
        const deflated = zlib.deflateSync(data, { level: 9 });

        // Convert to URL-safe Base64
        return 'pako:' + deflated.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    downloadImage(url, outputPath) {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(outputPath);

            // Handle file write errors
            file.on('error', (err) => {
                fs.unlink(outputPath, () => { });
                reject(new Error(`File write error: ${err.message}`));
            });

            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    // Close the file stream and delete the empty file
                    file.close(() => {
                        fs.unlink(outputPath, () => { });
                    });
                    reject(new Error(`Failed to download: ${response.statusCode}`));
                    return;
                }

                response.pipe(file);

                file.on('finish', () => {
                    file.close(() => {
                        resolve(outputPath);
                    });
                });
            }).on('error', (err) => {
                file.close(() => {
                    fs.unlink(outputPath, () => { });
                });
                reject(err);
            });
        });
    }

    /**
     * Render a single Mermaid diagram to image
     * @param {string} mermaidCode - Mermaid diagram code
     * @param {string} outputFilename - Optional custom filename
     * @returns {Promise<string>} Path to rendered image
     */
    async renderToImage(mermaidCode, outputFilename = null) {
        try {
            // Normalize syntax first (fix full-width punctuation)
            const normalizedCode = this.normalizeMermaidSyntax(mermaidCode);

            // Generate filename
            const filename = outputFilename || this.generateFilename(normalizedCode);
            const outputPath = path.join(this.outputDir, filename);

            // Check if already exists and is valid
            if (fs.existsSync(outputPath)) {
                const stats = fs.statSync(outputPath);
                if (stats.size > 0) {
                    console.log(`  ↻ Using cached: ${filename}`);
                    return outputPath;
                } else {
                    console.log(`  ⚠ Cached file is empty, re-rendering: ${filename}`);
                    fs.unlinkSync(outputPath);
                }
            }

            // Encode and create URL
            const encoded = this.encodeMermaidCode(normalizedCode);
            const imageUrl = `${this.baseUrl}${encoded}`;

            // Download image
            console.log(`  ⬇ Rendering: ${filename}`);
            console.log(`  DEBUG - Code first 150 chars:`, normalizedCode.substring(0, 150));
            console.log(`  DEBUG - URL:`, imageUrl.substring(0, 100) + '...');
            await this.downloadImage(imageUrl, outputPath);

            // Validate downloaded file
            const stats = fs.statSync(outputPath);
            if (stats.size === 0) {
                throw new Error(`Downloaded image is empty (0 bytes). Mermaid syntax may be invalid.`);
            }

            console.log(`  ✓ Saved: ${outputPath} (${stats.size} bytes)`);
            return outputPath;
        } catch (error) {
            console.error(`  ✗ Failed to render Mermaid diagram: ${error.message}`);
            console.error(`  Code snippet: ${mermaidCode.substring(0, 100)}...`);
            throw error;
        }
    }

    /**
     * Render all Mermaid diagrams in markdown content
     * @param {string} markdown - Markdown content
     * @returns {Promise<Array>} Array of { code, imagePath, startLine, endLine }
     */
    async renderAll(markdown) {
        const blocks = this.extractMermaidBlocks(markdown);

        if (blocks.length === 0) {
            return [];
        }

        console.log(`\n📊 Found ${blocks.length} Mermaid diagram(s)`);

        const results = [];
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            try {
                const imagePath = await this.renderToImage(block.code, `diagram_${i + 1}.${this.imageFormat}`);
                results.push({
                    code: block.code,
                    imagePath: imagePath,
                    startLine: block.startLine,
                    endLine: block.endLine
                });
            } catch (error) {
                console.error(`Failed to render diagram ${i + 1}:`, error.message);
                results.push({
                    code: block.code,
                    imagePath: null,
                    startLine: block.startLine,
                    endLine: block.endLine,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Clean up temporary mermaid images
     */
    cleanup() {
        if (fs.existsSync(this.outputDir)) {
            fs.rmSync(this.outputDir, { recursive: true, force: true });
            console.log(`\n🧹 Cleaned up temporary Mermaid images`);
        }
    }
}

module.exports = MermaidRenderer;
