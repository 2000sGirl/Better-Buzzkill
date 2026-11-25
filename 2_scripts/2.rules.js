// PROCESSING LAYER: Business rules and moderation analysis logic

/**
 * Checks whether a comment string contains toxic keywords or slang.
 * @param {string} text - The comment content to analyze.
 * @returns {object} Analysis result containing status and matched keyword.
 */
function analyzeComment(text) {
    const cleanText = text.toLowerCase();
    const wordsToCheck = [...toxicWordsList, ...customBlockedWords];
    for (let word of wordsToCheck) {
        // Word boundary check to prevent false positives inside safe words
        const safeWord = String(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${safeWord}\\b`, 'i');
        if (regex.test(cleanText)) {
            return { isToxic: true, word: word };
        }
    }
    return { isToxic: false, word: null };
}

/**
 * Evaluates the response from the API Ninjas Sentiment endpoint.
 * Flags NEGATIVE and WEAK_NEGATIVE comments for OP interception.
 * @param {object} apiResult - Response object from fetchSentimentFromApi.
 * @returns {object} Normalized sentiment decision.
 */
function evaluateSentimentResult(apiResult) {
    if (!apiResult || apiResult.skipped || apiResult.error) {
        return {
            isNegative: false,
            label: null,
            score: null,
            sentiment: null
        };
    }

    const score = typeof apiResult.score === 'number' && Number.isFinite(apiResult.score)
        ? apiResult.score
        : null;
    const sentiment = apiResult.sentiment
        ? String(apiResult.sentiment).trim().toUpperCase()
        : '';
    if (!sentiment && score === null) {
        return {
            isNegative: false,
            label: null,
            score: null,
            sentiment: null
        };
    }
    // API Ninjas exposes both a categorical label and a continuous score.
    // Treat either negative signal as grounds for review.
    const isNegative = sentiment === 'NEGATIVE'
        || sentiment === 'WEAK_NEGATIVE'
        || (score !== null && score < 0);
    const label = sentiment || (isNegative ? 'NEGATIVE' : 'NEUTRAL');

    return {
        isNegative: isNegative,
        label: label,
        score: score,
        sentiment: sentiment
    };
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
