// DATA LAYER: Stores application data and handles loading information from files

// Fallback toxic words list in case JSON load fails
let toxicWordsList = [
    "hate", "ugly", "stupid", "dumb", "idiot", "loser", 
    "mid", "flop", "trash", "npc", "ratio", "cringe", "gross",
    "horrible", "awful", "cancel"
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
