// PROCESSING LAYER: Business rules and moderation analysis logic

/**
 * Checks whether a comment string contains toxic keywords or slang.
 * @param {string} text - The comment content to analyze.
 * @returns {object} Analysis result containing status and matched keyword.
 */
function analyzeComment(text) {
    const cleanText = text.toLowerCase();
    for (let word of toxicWordsList) {
        // Word boundary check to prevent false positives inside safe words
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(cleanText)) {
            return { isToxic: true, word: word };
        }
    }
    return { isToxic: false, word: null };
}

/**
 * Formats relative timestamps for comments
 */
function getFormattedTime() {
    return "Just now";
}

/**
 * Helper to prevent HTML injection attacks
 */
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
