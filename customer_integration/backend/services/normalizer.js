/**
 * Query Normalizer Service
 * Standardizes SQL queries by removing obfuscation techniques
 * JavaScript implementation matching Python version
 */

class QueryNormalizer {
    constructor() {
        this.commentPatterns = [
            { pattern: /--.*$/gm, replacement: '' },  // Single line comments
            { pattern: /\/\*.*?\*\//gs, replacement: '' },  // Multi-line comments
            { pattern: /#.*$/gm, replacement: '' },  // MySQL comments
        ];
    }

    /**
     * URL decode helper
     */
    urlDecode(str) {
        try {
            return decodeURIComponent(str);
        } catch (e) {
            return str;
        }
    }

    /**
     * Normalize SQL query by:
     * 1. URL decoding
     * 2. Removing comments
     * 3. Normalizing whitespace
     * 4. Converting to lowercase
     */
    normalize(query) {
        if (!query || typeof query !== 'string') {
            return '';
        }

        // URL decode (handle multiple encoding)
        let normalized = query;
        for (let i = 0; i < 3; i++) {  // Handle triple encoding
            const decoded = this.urlDecode(normalized);
            if (decoded === normalized) {
                break;
            }
            normalized = decoded;
        }

        // Remove comments
        for (const { pattern, replacement } of this.commentPatterns) {
            normalized = normalized.replace(pattern, replacement);
        }

        // Normalize whitespace
        normalized = normalized.replace(/\s+/g, ' ');

        // Strip leading/trailing whitespace
        normalized = normalized.trim();

        // Convert to lowercase for consistency
        normalized = normalized.toLowerCase();

        return normalized;
    }

    /**
     * Remove common obfuscation techniques
     */
    removeObfuscation(query) {
        if (!query || typeof query !== 'string') {
            return '';
        }

        // Remove null bytes
        let cleaned = query.replace(/\x00/g, '');

        // Remove excessive whitespace variations
        cleaned = cleaned.replace(/[\t\n\r\f\v]+/g, ' ');

        return cleaned;
    }
}

module.exports = QueryNormalizer;

