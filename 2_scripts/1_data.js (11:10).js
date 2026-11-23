// DATA LAYER: Stores application data and handles loading information from files

// Fallback toxic words list in case JSON load fails
let toxicWordsList = [
    "attention-seeking", "attention-seeker", "delete this", "do better",
    "fell off", "give up", "go away", "hard watch", "looks cheap",
    "nobody asked", "not it", "please no", "shut up", "skill issue",
    "so fake", "stop posting", "touch grass", "try harder", "waste of time",
    "who asked", "why post this", "annoying", "awful", "bizarre", "boring",
    "bot", "bozo", "cancel", "cheap", "clickbait", "clown", "clueless",
    "corny", "cringe", "cringey", "cringing", "delulu", "desperate",
    "disaster", "disgusting", "dumb", "embarrassing", "embarrassment",
    "fail", "failure", "fake", "flop", "fraud", "garbage", "gross", "hate",
    "hideous", "horrible", "ick", "idiot", "insecure", "irrelevant", "lame",
    "lazy", "loser", "mediocre", "mid", "npc", "obnoxious", "overrated",
    "parasocial", "pathetic", "phony", "pickme", "pointless", "pressed",
    "promo", "ratio", "salty", "scam", "scammer", "spam", "stupid", "tacky",
    "terrible", "toxic", "trash", "tryhard", "ugly", "unattractive",
    "unfollow", "useless", "wack", "washed", "worthless", "yikes"
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

// Publicly visible comments store
let publicComments = [
    { id: 1, user: "jordan_k", text: "Love this look! 🔥", time: "1h ago" },
    { id: 2, user: "creative_mind", text: "Super clean aesthetic!", time: "45m ago" }
];

// Intercepted pending comments queue for OP review
let pendingComments = [];
