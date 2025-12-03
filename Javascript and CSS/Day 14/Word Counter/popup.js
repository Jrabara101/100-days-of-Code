document.addEventListener('DOMContentLoaded', async () => {
    
    const messageEl = document.getElementById('message');
    const statusEl = document.getElementById('status');

    try {
        // 1. Get the active tab
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // 2. Inject script immediately
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: getSelectionOrBody, // Updated function name
        }, (results) => {
            
            if (chrome.runtime.lastError) {
                messageEl.innerText = "Cannot read this page.";
                return;
            }

            if (results && results[0]) {
                const resultData = results[0].result;
                updateStats(resultData.text, resultData.isSelection);
                
                // Turn status dot green
                statusEl.classList.add('active');
            }
        });
    } catch (err) {
        messageEl.innerText = "Error connecting to page.";
    }
});

// --- Function running inside the web page ---
function getSelectionOrBody() {
    const selection = window.getSelection().toString();
    
    // Logic: If text is highlighted, use that. 
    // If NOT, we return an empty string (or you could return document.body.innerText to count the whole page)
    if (selection.length > 0) {
        return { text: selection, isSelection: true };
    } else {
        return { text: "", isSelection: false };
    }
}

// --- Function running inside the popup ---
function updateStats(text, isSelection) {
    // Regex matches words (handles multiple spaces/newlines correctly)
    const wordCount = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
    const charCount = text.length;

    document.getElementById("wordCount").innerText = wordCount;
    document.getElementById("charCount").innerText = charCount;

    const messageEl = document.getElementById("message");

    if (wordCount === 0) {
        messageEl.innerText = "Highlight text to count.";
    } else {
        messageEl.innerText = isSelection ? "Counting selection..." : "Counting page...";
    }
}