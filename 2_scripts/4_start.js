// START & ACTIONS LAYER: Handles event listening and application startup

// Helper function to format current time for comments
function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Save API key entered by the OP in browser localStorage
function saveApiKeyFromUI() {
    const input = document.getElementById('api-key-input');
    if (!input) return;

    const value = input.value.trim();
    if (!value) return;

    saveApiKey(value);
    input.value = '';
    showApiStatusBanner('');
    renderApiKeyStatus();
}

// Clear saved API key from browser localStorage
function clearApiKeyFromUI() {
    const input = document.getElementById('api-key-input');
    if (input) input.value = '';

    clearApiKey();
    showApiStatusBanner('');
    renderApiKeyStatus();
}

// Save the OP's moderation preference in this browser
function setModerationMode(mode) {
    if (!['all_review', 'flagged_review', 'auto_block'].includes(mode)) return;

    moderationMode = mode;
    try {
        localStorage.setItem(MODERATION_MODE_STORAGE_KEY, mode);
    } catch (error) {
        console.warn('Could not save moderation setting:', error);
    }
}

// Add a custom word or phrase to the local moderation list
function addCustomBlockedWord() {
    const input = document.getElementById('custom-blocked-word-input');
    if (!input) return;

    const word = input.value.trim();
    if (!word) return;

    const alreadyExists = customBlockedWords.some(savedWord => savedWord.toLowerCase() === word.toLowerCase());
    if (!alreadyExists) {
        customBlockedWords.push(word);
        saveCustomBlockedWords();
    }

    input.value = '';
    renderCustomBlockedWords();
}

// Remove one custom word or phrase by its displayed list position
function removeCustomBlockedWord(index) {
    if (!Number.isInteger(index) || index < 0 || index >= customBlockedWords.length) return;

    customBlockedWords.splice(index, 1);
    saveCustomBlockedWords();
    renderCustomBlockedWords();
}

// Set whether custom word matches bypass the review queue
function setCustomWordsAutoBlock(shouldAutoBlock) {
    customBlockedWordsAutoBlock = Boolean(shouldAutoBlock);
    try {
        localStorage.setItem(CUSTOM_WORDS_AUTO_BLOCK_STORAGE_KEY, String(customBlockedWordsAutoBlock));
    } catch (error) {
        console.warn('Could not save custom word blocking setting:', error);
    }
}

// Toggle the post's like state
function togglePostLike() {
    postLiked = !postLiked;
    renderPostLike();
}

// Toggle a comment's like state
function toggleCommentLike(commentId) {
    const comment = publicComments.find(item => item.id === commentId);
    if (!comment) return;

    comment.liked = !comment.liked;
    renderPublicComments();
}

// Navigate to the comment area and focus its input
function goToCommentSection() {
    const input = document.getElementById('comment-input');
    if (!input) return;

    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus({ preventScroll: true });
}

// Submit Comment Handler
async function handleCommentSubmit(event) {
    event.preventDefault();
    const input = document.getElementById('comment-input');
    if (!input) return;
    const commentText = input.value.trim();

    if (!commentText) return;

    setSubmitLoading(true);
    showApiStatusBanner('');

    try {
        // 1. Check local keyword filter
        const localAnalysis = (typeof analyzeComment === 'function')
            ? analyzeComment(commentText)
            : { isToxic: false, word: null };
        const customWordAutoBlocked = localAnalysis.isCustom && customBlockedWordsAutoBlock;

        // 2. Check API Ninjas Sentiment if an API key is saved in localStorage
        const apiRawResult = customWordAutoBlocked
            ? { skipped: true }
            : (typeof fetchSentimentFromApi === 'function')
            ? await fetchSentimentFromApi(commentText)
            : { skipped: true };

        if (apiRawResult && apiRawResult.error) {
            showApiStatusBanner(apiRawResult.error);
        }

        const sentimentAnalysis = (typeof evaluateSentimentResult === 'function')
            ? evaluateSentimentResult(apiRawResult)
            : { isNegative: false, label: null };

        // Apply the OP's selected behavior after combining both flagging sources.
        const isFlagged = localAnalysis.isToxic || sentimentAnalysis.isNegative;
        const pendingByMode = !customWordAutoBlocked && (
            moderationMode === 'all_review'
            || (moderationMode === 'flagged_review' && isFlagged)
        );
        const blockedByMode = customWordAutoBlocked || (moderationMode === 'auto_block' && isFlagged);

        if (pendingByMode) {
            const pendingEntry = {
                id: Date.now(),
                user: "guest_user",
                text: commentText,
                flaggedWord: localAnalysis.word,
                sentimentLabel: sentimentAnalysis.isNegative ? sentimentAnalysis.label : null,
                time: getFormattedTime()
            };
            pendingComments.unshift(pendingEntry);

            const reasonText = isFlagged
                ? 'Buzz killed.'
                : 'Comment sent for review.';

            if (typeof triggerEvaporationAnimation === 'function') {
                triggerEvaporationAnimation(commentText, reasonText);
            }
        } else if (blockedByMode) {
            if (typeof triggerEvaporationAnimation === 'function') {
                triggerEvaporationAnimation(commentText, 'Buzz killed.');
            }
        } else {
            // Non-flagged comment: Post publicly immediately
            const publicEntry = {
                id: Date.now(),
                user: "guest_user",
                text: commentText,
                time: getFormattedTime()
            };
            publicComments.push(publicEntry);
        }

        input.value = '';
    } finally {
        setSubmitLoading(false);
        renderViews();
    }
}

// OP Action: Approve Pending Comment
function approveComment(commentId) {
    const index = pendingComments.findIndex(c => c.id === commentId);
    if (index !== -1) {
        const approvedComment = pendingComments.splice(index, 1)[0];
        publicComments.push({
            id: approvedComment.id,
            user: approvedComment.user,
            text: approvedComment.text,
            time: approvedComment.time
        });
        renderViews();
    }
}

// OP Action: Reject Pending Comment
function rejectComment(commentId) {
    const index = pendingComments.findIndex(c => c.id === commentId);
    if (index !== -1) {
        pendingComments.splice(index, 1);
        renderViews();
    }
}

// Initialize application on window load safely
window.onload = function() {
    if (typeof loadToxicWords === 'function') {
        loadToxicWords()
            .then(() => {
                renderViews();
            })
            .catch((err) => {
                console.warn("Could not fetch toxic_words.json, proceeding with default words.", err);
                renderViews();
            });
    } else {
        renderViews();
    }
};
