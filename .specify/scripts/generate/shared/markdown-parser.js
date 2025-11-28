const { TextRun } = require('docx');

/**
 * Parse Markdown text for PPTX (returns array of text parts with formatting options)
 * CRITICAL FIX: Handles bullet points correctly to avoid duplication
 */
function parseForPptx(text) {
    if (text === undefined || text === null) {
        return [{ text: '', options: {} }];
    }

    // Preserve bullet/arrow prefix but still allow inline markdown parsing
    let prefix = '';
    let workingText = text;

    if (text.startsWith('• ') || text.startsWith('▸ ')) {
        prefix = text.slice(0, 2); // keep symbol plus following space
        workingText = text.slice(2);
    }

    const parts = [];
    let currentPos = 0;

    // Regex patterns for markdown with priority (higher index = higher priority)
    const patterns = [
        { regex: /`(.+?)`/g, format: { fontFace: 'Courier New' }, priority: 5 },
        { regex: /\*\*\*(.+?)\*\*\*/g, format: { bold: true, italic: true }, priority: 5 },
        { regex: /\*\*(.+?)\*\*/g, format: { bold: true }, priority: 4 },
        // Match single-asterisk italics but ignore bullet markers (which have a trailing space)
        { regex: /\*(?!\s)([^*]+?)\*/g, format: { italic: true }, priority: 3 },
        { regex: /_(.+?)_/g, format: { italic: true }, priority: 2 }
    ];

    // Find all matches across all patterns
    const allMatches = [];
    patterns.forEach(({ regex, format, priority }) => {
        let match;
        // Create a fresh regex for each pattern to reset lastIndex
        const r = new RegExp(regex.source, regex.flags);
        while ((match = r.exec(workingText)) !== null) {
            allMatches.push({
                start: match.index,
                end: match.index + match[0].length,
                innerText: match[1],
                fullMatch: match[0],
                format: format,
                priority: priority,
                length: match[0].length
            });
        }
    });

    // Sort by start position, then by priority (higher first), then by length (longer first)
    allMatches.sort((a, b) => {
        if (a.start !== b.start) return a.start - b.start;
        if (a.priority !== b.priority) return b.priority - a.priority;
        return b.length - a.length;
    });

    // Filter out overlapping matches - keep highest priority, longest match
    const matches = [];
    const used = new Set();

    for (const match of allMatches) {
        let hasOverlap = false;
        for (let i = match.start; i < match.end; i++) {
            if (used.has(i)) {
                hasOverlap = true;
                break;
            }
        }

        if (!hasOverlap) {
            matches.push(match);
            for (let i = match.start; i < match.end; i++) {
                used.add(i);
            }
        }
    }

    // Sort final matches by position for building output
    matches.sort((a, b) => a.start - b.start);

    // Build parts array
    matches.forEach(match => {
        // Add plain text before match
        if (currentPos < match.start) {
            const plainText = workingText.substring(currentPos, match.start);
            if (plainText) {
                parts.push({ text: plainText, options: {} });
            }
        }

        // Add formatted text
        parts.push({ text: match.innerText, options: match.format });
        currentPos = match.end;
    });

    // Add remaining plain text
    if (currentPos < workingText.length) {
        const remaining = workingText.substring(currentPos);
        if (remaining) {
            parts.push({ text: remaining, options: {} });
        }
    }

    const result = parts.length > 0 ? parts : [{ text: workingText, options: {} }];

    // Re-attach bullet/arrow prefix if present so rendered text keeps the marker
    if (prefix) {
        return [{ text: prefix, options: {} }, ...result];
    }

    return result;
}

/**
 * Parse Markdown text for DOCX (returns array of TextRun objects)
 * Handles **bold**, *italic*, ***bold+italic***, `code`
 */
function parseForDocx(text) {
    if (!text || text.trim().length === 0) {
        return [new TextRun({ text: '' })];
    }

    const patterns = [
        { regex: /`(.+?)`/g, format: 'code' },
        { regex: /\*\*\*(.+?)\*\*\*/g, format: 'bolditalic' },
        { regex: /\*\*(.+?)\*\*/g, format: 'bold' },
        { regex: /\*(.+?)\*/g, format: 'italic' },
        { regex: /_(.+?)_/g, format: 'italic' }
    ];

    // Find all matches
    const allMatches = [];
    patterns.forEach(({ regex, format }) => {
        let match;
        const r = new RegExp(regex.source, regex.flags);
        while ((match = r.exec(text)) !== null) {
            allMatches.push({
                start: match.index,
                end: match.index + match[0].length,
                innerText: match[1],
                format: format,
                length: match[0].length
            });
        }
    });

    // If no matches, return plain text
    if (allMatches.length === 0) {
        return [new TextRun({ text: text })];
    }

    // Sort by start position, then by length (longer first for nested patterns)
    allMatches.sort((a, b) => {
        if (a.start !== b.start) return a.start - b.start;
        return b.length - a.length;
    });

    // Filter out overlapping matches
    const matches = [];
    const used = new Set();

    for (const match of allMatches) {
        let hasOverlap = false;
        for (let i = match.start; i < match.end; i++) {
            if (used.has(i)) {
                hasOverlap = true;
                break;
            }
        }

        if (!hasOverlap) {
            matches.push(match);
            for (let i = match.start; i < match.end; i++) {
                used.add(i);
            }
        }
    }

    // Sort final matches by position
    matches.sort((a, b) => a.start - b.start);

    // Build TextRun array
    const textRuns = [];
    let currentPos = 0;

    matches.forEach(match => {
        // Add plain text before match
        if (currentPos < match.start) {
            const plainText = text.substring(currentPos, match.start);
            if (plainText) {
                textRuns.push({ text: plainText });
            }
        }

        // Add formatted text
        textRuns.push({
            text: match.innerText,
            format: match.format
        });

        currentPos = match.end;
    });

    // Add remaining plain text
    if (currentPos < text.length) {
        const remaining = text.substring(currentPos);
        if (remaining) {
            textRuns.push({ text: remaining });
        }
    }

    // Convert to TextRun objects
    return textRuns.map(part => {
        const options = { text: part.text };

        if (part.format === 'bold') {
            options.bold = true;
        } else if (part.format === 'italic') {
            options.italics = true;
        } else if (part.format === 'bolditalic') {
            options.bold = true;
            options.italics = true;
        } else if (part.format === 'code') {
            options.font = 'Courier New';
        }

        return new TextRun(options);
    });
}

module.exports = {
    parseForPptx,
    parseForDocx
};
