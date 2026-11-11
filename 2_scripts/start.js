// START & ACTIONS LAYER: Handles event listening and application startup

// Helper function to format current time for comments
function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Submit Comment Handler
function handleCommentSubmit(event) {
    event.preventDefault();
    const input = document.getElementById('comment-input');
    if (!input) return;
    const commentText = input.value.trim();

    if (!commentText) return;

    // Analyze text using rules layer
    const analysis = (typeof analyzeComment === 'function') 
        ? analyzeComment(commentText) 
        : { isToxic: false };

    if (analysis.isToxic) {
        // Intercept toxic comment: Add to OP pending queue silently from commenter POV
        const pendingEntry = {
            id: Date.now(),
            user: "guest_user",
            text: commentText,
            flaggedWord: analysis.word,
            time: getFormattedTime()
        };
        pendingComments.unshift(pendingEntry);

        // Show Evaporation Effect for commenter
        if (typeof triggerEvaporationAnimation === 'function') {
            triggerEvaporationAnimation(commentText);
        }
    } else {
        // Positive/neutral comment: Post publicly immediately
        const publicEntry = {
            id: Date.now(),
            user: "guest_user",
            text: commentText,
            time: getFormattedTime()
        };
        publicComments.push(publicEntry);
    }

    input.value = '';
    renderViews();
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
