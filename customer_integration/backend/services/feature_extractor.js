/**
 * Feature Extraction Service
 * Extracts security-relevant features from SQL queries
 * JavaScript implementation matching Python version
 */

class FeatureExtractor {
    constructor() {
        this.featureNames = [
            'length', 'union_count', 'select_count', 'insert_count', 
            'update_count', 'delete_count', 'drop_count', 'exec_count',
            'execute_count', 'concat_count', 'cast_count', 'char_count',
            'comment_dashes', 'comment_slash_star', 'single_quote', 
            'double_quote', 'semicolon', 'equals', 'or_keyword', 
            'and_keyword', 'sleep_count', 'benchmark_count', 'waitfor_count',
            'information_schema', 'version_func', 'database_func', 
            'user_func', 'has_hex'
        ];
    }

    /**
     * Count occurrences of substring in string (case-insensitive)
     */
    countOccurrences(str, substr) {
        if (!str || !substr) return 0;
        const regex = new RegExp(substr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        return (str.match(regex) || []).length;
    }

    /**
     * Extract features from SQL query
     */
    extract(query) {
        if (!query || typeof query !== 'string') {
            query = '';
        }

        const queryLower = query.toLowerCase();

        const features = {
            length: query.length,
            union_count: this.countOccurrences(queryLower, 'union'),
            select_count: this.countOccurrences(queryLower, 'select'),
            insert_count: this.countOccurrences(queryLower, 'insert'),
            update_count: this.countOccurrences(queryLower, 'update'),
            delete_count: this.countOccurrences(queryLower, 'delete'),
            drop_count: this.countOccurrences(queryLower, 'drop'),
            exec_count: this.countOccurrences(queryLower, 'exec'),
            execute_count: this.countOccurrences(queryLower, 'execute'),
            concat_count: this.countOccurrences(queryLower, 'concat'),
            cast_count: this.countOccurrences(queryLower, 'cast'),
            char_count: this.countOccurrences(queryLower, 'char'),
            comment_dashes: (query.match(/--/g) || []).length,
            comment_slash_star: (query.match(/\/\*/g) || []).length,
            single_quote: (query.match(/'/g) || []).length,
            double_quote: (query.match(/"/g) || []).length,
            semicolon: (query.match(/;/g) || []).length,
            equals: (query.match(/=/g) || []).length,
            or_keyword: this.countOccurrences(queryLower, ' or '),
            and_keyword: this.countOccurrences(queryLower, ' and '),
            sleep_count: this.countOccurrences(queryLower, 'sleep'),
            benchmark_count: this.countOccurrences(queryLower, 'benchmark'),
            waitfor_count: this.countOccurrences(queryLower, 'waitfor'),
            information_schema: queryLower.includes('information_schema') ? 1 : 0,
            version_func: (queryLower.includes('version()') || queryLower.includes('@@version')) ? 1 : 0,
            database_func: queryLower.includes('database()') ? 1 : 0,
            user_func: queryLower.includes('user()') ? 1 : 0,
            has_hex: queryLower.includes('0x') ? 1 : 0,
        };

        return features;
    }

    /**
     * Extract features as array for ML model
     */
    extractAsArray(query) {
        const features = this.extract(query);
        return this.featureNames.map(name => parseFloat(features[name]) || 0);
    }

    /**
     * Get list of feature names
     */
    getFeatureNames() {
        return [...this.featureNames];
    }
}

module.exports = FeatureExtractor;

