let isLiked = false;
let likes = 12;

function toggleLike() {
    isLiked = !isLiked;
    const btn = document.getElementById('like-btn');
    
    if (isLiked) {
        likes++;
        btn.classList.add('liked');
        btn.innerHTML = `❤️ <span id="like-count">${likes}</span>`;
    } else {
        likes--;
        btn.classList.remove('liked');
        btn.innerHTML = `🤍 <span id="like-count">${likes}</span>`;
    }
}

function shareArticle() {
    const shareBtn = document.getElementById('share-btn');
    const originalText = shareBtn.innerHTML;
    
    navigator.clipboard.writeText(window.location.href).then(() => {
        shareBtn.innerHTML = `✅ Copied!`;
        setTimeout(() => {
            shareBtn.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        shareBtn.innerHTML = `❌ Failed`;
        setTimeout(() => {
            shareBtn.innerHTML = originalText;
        }, 2000);
    });
}

function readMore(event) {
    event.preventDefault();
    const excerpt = document.getElementById('excerpt-text');
    const link = document.getElementById('read-more-link');
    
    if (excerpt.classList.contains('expanded')) {
        excerpt.classList.remove('expanded');
        excerpt.innerText = "How to clear the clutter and focus on what truly matters in your daily workflow.";
        link.innerHTML = "Read Article &rarr;";
    } else {
        excerpt.classList.add('expanded');
        excerpt.innerText = "How to clear the clutter and focus on what truly matters in your daily workflow. A minimalist workspace helps reduce distractions, improve cognitive focus, and foster a peaceful environment where creativity can thrive. Start by removing items you haven't used in the past week.";
        link.innerHTML = "Read Less &larr;";
    }
}
