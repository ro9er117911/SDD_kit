const MermaidRenderer = require('../../utils/mermaid_renderer');
const { MERMAID_CONFIG } = require('./config');

/**
 * Wrapper for MermaidRenderer to handle diagram rendering
 */
class MermaidHandler {
    constructor(outputDir = MERMAID_CONFIG.outputDir) {
        this.renderer = new MermaidRenderer({
            outputDir: outputDir
        });
        this.diagrams = {};
    }

    /**
     * Render all Mermaid diagrams in content
     * @param {string} content - Markdown content with mermaid blocks
     * @param {string} fileKey - Key prefix for diagram identification (e.g., '00_meta.md')
     * @returns {Promise<Array>} Array of diagram objects with {startLine, imagePath}
     */
    async renderAll(content, fileKey) {
        try {
            const diagrams = await this.renderer.renderAll(content);

            // Store diagrams with file-specific keys
            diagrams.forEach((diagram) => {
                const key = `${fileKey}_${diagram.startLine}`;
                this.diagrams[key] = diagram.imagePath;
            });

            return diagrams;
        } catch (error) {
            console.error(`Failed to render diagrams for ${fileKey}:`, error);
            return [];
        }
    }

    /**
     * Get diagram path by key
     * @param {string} key - Diagram key (e.g., '00_meta.md_42')
     * @returns {string|null} Path to diagram image or null if not found
     */
    getDiagram(key) {
        return this.diagrams[key] || null;
    }

    /**
     * Get all diagrams
     * @returns {Object} Object with diagram keys and paths
     */
    getAllDiagrams() {
        return { ...this.diagrams };
    }

    /**
     * Check if a diagram exists for a given key
     * @param {string} key - Diagram key
     * @returns {boolean} True if diagram exists
     */
    hasDiagram(key) {
        return key in this.diagrams;
    }

    /**
     * Clear all cached diagrams
     */
    clear() {
        this.diagrams = {};
    }
}

module.exports = MermaidHandler;
