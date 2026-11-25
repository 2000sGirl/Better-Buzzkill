// DATA LAYER: Stores application data and handles loading information from files and APIs

const API_KEY_STORAGE_NAME = 'buzzkill_api_ninjas_key';
const MODERATION_MODE_STORAGE_KEY = 'buzzkill_moderation_mode';
const CUSTOM_BLOCKED_WORDS_STORAGE_KEY = 'buzzkill_custom_blocked_words';
const SENTIMENT_API_URL = 'https://api.api-ninjas.com/v1/sentiment';
const DEFAULT_MODERATION_MODE = 'flagged_review';

function getSavedModerationMode() {
    try {
        const savedMode = localStorage.getItem(MODERATION_MODE_STORAGE_KEY);
        return ['all_review', 'flagged_review', 'auto_block'].includes(savedMode)
            ? savedMode
            : DEFAULT_MODERATION_MODE;
    } catch (error) {
        return DEFAULT_MODERATION_MODE;
    }
}

let moderationMode = getSavedModerationMode();

function getSavedCustomBlockedWords() {
    try {
        const savedWords = JSON.parse(localStorage.getItem(CUSTOM_BLOCKED_WORDS_STORAGE_KEY) || '[]');
        if (!Array.isArray(savedWords)) return [];
        return savedWords
            .filter(word => typeof word === 'string')
            .map(word => word.trim())
            .filter(Boolean);
    } catch (error) {
        return [];
    }
}

let customBlockedWords = getSavedCustomBlockedWords();

function saveCustomBlockedWords() {
    try {
        localStorage.setItem(CUSTOM_BLOCKED_WORDS_STORAGE_KEY, JSON.stringify(customBlockedWords));
    } catch (error) {
        console.warn('Could not save custom blocked words:', error);
    }
}

// Fallback toxic words list in case JSON load fails
let toxicWordsList = [
    "attention-seeking", "attention-seeker", "delete this", "do better",
    "fell off", "give up", "go away", "hard watch", "looks cheap",
    "nobody asked", "not it", "please no", "shut up", "skill issue",
    "so fake", "stop posting", "touch grass", "try harder", "waste of time",
    "who asked", "why post this", "zio", "annoying", "awful", "bizarre", "boring",
    "bot", "bozo", "cancel", "cheap", "clickbait", "clown", "clueless",
    "corny", "cringe", "cringey", "cringing", "delulu", "desperate",
    "disaster", "disgusting", "dumb", "embarrassing", "embarrassment",
    "fail", "failure", "fake", "flop", "fraud", "garbage", "gross", "hate",
    "hideous", "horrible", "ick", "idiot", "insecure", "irrelevant", "lame",
    "lazy", "loser", "mediocre", "mid", "npc", "obnoxious", "overrated",
    "parasocial", "pathetic", "phony", "pickme", "pointless", "pressed",
    "promo", "ratio", "salty", "scam", "scammer", "spam", "stupid", "tacky",
    "terrible", "toxic", "trash", "tryhard", "ugly", "unattractive",
    "unfollow", "useless", "wack", "washed", "worthless", "yikes",
    "beaner", "camel jockey", "chink", "christ killer", "cripple", "dyke",
    "fag", "faggot", "gook", "half-breed", "hebe", "jap", "kike",
    "mongoloid", "nigga", "nigger", "paki", "polack", "raghead", "redskin",
    "retard", "retarded", "sheeny", "shemale", "slope", "spaz", "spic",
    "towelhead", "tranny", "wetback", "zipperhead"
];

// Load toxic words list from JSON file with no-store cache
function loadToxicWords() {
    return fetch('1_data/toxic_words.json', { cache: 'no-store' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Could not load JSON data');
            }
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                toxicWordsList = data;
            }
        })
        .catch(error => {
            console.warn('Using fallback toxic words list:', error);
        });
}

// Browser-only API key helpers (never stored in GitHub repo)
function getSavedApiKey() {
    return localStorage.getItem(API_KEY_STORAGE_NAME) || '';
}

function saveApiKey(key) {
    localStorage.setItem(API_KEY_STORAGE_NAME, key.trim());
}

function clearApiKey() {
    localStorage.removeItem(API_KEY_STORAGE_NAME);
}

// Fetch sentiment analysis from API Ninjas using the user's saved browser key
async function fetchSentimentFromApi(text) {
    const apiKey = getSavedApiKey();
    if (!apiKey) {
        return { skipped: true };
    }

    const requestUrl = `${SENTIMENT_API_URL}?text=${encodeURIComponent(text)}`;

    try {
        const response = await fetch(requestUrl, {
            method: 'GET',
            headers: {
                'X-Api-Key': apiKey
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            return { error: `API returned status ${response.status}. Check your API key in OP View.` };
        }

        const data = await response.json();
        return {
            score: data.score,
            sentiment: data.sentiment
        };
    } catch (error) {
        console.warn('Sentiment API request failed:', error);
        return { error: 'Could not reach the Sentiment API. Local filter is still active.' };
    }
}

// Publicly visible comments store
let postLiked = false;
let publicComments = [
    { id: 1, user: "jordan_k", text: "Love this look! 🔥", time: "1h ago" },
    { id: 2, user: "creative_mind", text: "Super clean aesthetic!", time: "45m ago" }
];

// Intercepted pending comments queue for OP review
let pendingComments = [];
