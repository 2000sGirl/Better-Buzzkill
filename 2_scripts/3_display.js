// PRESENTATION LAYER: Handles DOM updates and user interface display logic

// Helper function to prevent HTML injection and rendering errors
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, function(tag) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag;
    });
}

// Tab Switching Logic
function switchTab(tab) {
    const tabCommenter = document.getElementById('tab-commenter');
    const tabOp = document.getElementById('tab-op');
    const viewCommenter = document.getElementById('view-commenter-container');
    const viewOp = document.getElementById('view-op-container');

    if (!tabCommenter || !tabOp || !viewCommenter || !viewOp) return;

    if (tab === 'commenter') {
        tabCommenter.className = "px-3 py-1.5 rounded-lg transition-all bg-white text-gray-800 shadow-sm font-semibold";
        tabOp.className = "px-3 py-1.5 rounded-lg transition-all text-gray-500 hover:text-gray-800 relative font-semibold";
        viewCommenter.classList.remove('hidden');
        viewOp.classList.add('hidden');
    } else {
        tabOp.className = "px-3 py-1.5 rounded-lg transition-all bg-white text-gray-800 shadow-sm font-semibold relative";
        tabCommenter.className = "px-3 py-1.5 rounded-lg transition-all text-gray-500 hover:text-gray-800 font-semibold";
        viewOp.classList.remove('hidden');
        viewCommenter.classList.add('hidden');
    }
    renderViews();
}

// Render Public Comments List
function renderPublicComments() {
    const listElement = document.getElementById('public-comments-list');
    const countElement = document.getElementById('public-comment-count');
    
    if (!listElement || !countElement) return;

    countElement.textContent = publicComments.length;
    listElement.innerHTML = '';

    if (publicComments.length === 0) {
        listElement.innerHTML = `<p class="text-xs text-gray-400 italic">No comments yet. Be the first!</p>`;
        return;
    }

    publicComments.forEach(comment => {
        const item = document.createElement('div');
        item.className = "text-xs flex justify-between items-start space-x-2";
        item.innerHTML = `
            <div class="flex-1">
                <span class="font-bold text-gray-800 mr-1 border-b border-transparent hover:border-gray-400 cursor-pointer">${comment.user}</span>
                <span class="text-gray-700">${escapeHTML(comment.text)}</span>
                <span class="text-[10px] text-gray-400 ml-2">${comment.time}</span>
            </div>
            <button class="text-gray-300 hover:text-red-500 transition-colors text-[10px]"><i class="fa-regular fa-heart"></i></button>
        `;
        listElement.appendChild(item);
    });

    // Auto-scroll to bottom of comment list
    listElement.scrollTop = listElement.scrollHeight;
}

// Render OP Review Queue
function renderOPQueue() {
    const listElement = document.getElementById('op-review-list');
    const badgeCount = document.getElementById('badge-pending-count');
    const queueBadge = document.getElementById('op-queue-badge');

    if (!listElement || !badgeCount || !queueBadge) return;

    // Update badge counts
    if (pendingComments.length > 0) {
        badgeCount.textContent = pendingComments.length;
        badgeCount.classList.remove('hidden');
        queueBadge.textContent = `${pendingComments.length} Pending`;
    } else {
        badgeCount.classList.add('hidden');
        queueBadge.textContent = `0 Pending`;
    }

    listElement.innerHTML = '';

    if (pendingComments.length === 0) {
        listElement.innerHTML = `
            <div class="text-center py-10 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <i class="fa-solid fa-circle-check text-green-500 text-3xl mb-2"></i>
                <p class="text-xs font-bold text-gray-700">All clear!</p>
                <p class="text-[11px] text-gray-400 mt-1">No flagged comments currently awaiting review.</p>
            </div>
        `;
        return;
    }

    pendingComments.forEach((comment) => {
        const card = document.createElement('div');
        card.className = "bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col justify-between space-y-2 transition-all hover:border-purple-200";
        
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex items-center space-x-2">
                    <span class="w-6 h-6 rounded-full bg-red-100 text-red-600 font-bold text-[10px] flex items-center justify-center">
                        ${comment.user.charAt(0).toUpperCase()}
                    </span>
                    <span class="text-xs font-bold text-gray-800">${comment.user}</span>
                </div>
                <span class="bg-red-50 text-red-600 border border-red-100 text-[10px] px-2 py-0.5 rounded-full font-medium">
                    Flagged: "${comment.flaggedWord}"
                </span>
            </div>

            <p class="text-xs text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-100 italic">
                "${escapeHTML(comment.text)}"
            </p>

            <div class="flex space-x-2 pt-1">
                <button onclick="approveComment(${comment.id})" class="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1">
                    <i class="fa-solid fa-check"></i> Approve
                </button>
                <button onclick="rejectComment(${comment.id})" class="flex-1 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 text-xs font-bold py-1.5 px-3 rounded-lg border border-gray-200 transition-colors flex items-center justify-center gap-1">
                    <i class="fa-solid fa-xmark"></i> Reject
                </button>
            </div>
        `;
        listElement.appendChild(card);
    });
}

// Re-render all dynamic elements
function renderViews() {
    renderPublicComments();
    renderOPQueue();
}

// Evaporation visual effect when a toxic comment is submitted
function triggerEvaporationAnimation(text) {
    const listElement = document.getElementById('public-comments-list');
    const toast = document.getElementById('evaporation-toast');

    if (!listElement || !toast) return;

    // Temporary element showing comment evaporating
    const tempEvapNode = document.createElement('div');
    tempEvapNode.className = "text-xs text-gray-400 line-through animate-evaporate p-1 bg-red-50 rounded border border-red-100";
    tempEvapNode.textContent = text;

    listElement.appendChild(tempEvapNode);

    // Toast feedback
    toast.classList.remove('hidden');

    setTimeout(() => {
        tempEvapNode.remove();
    }, 1400);

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
