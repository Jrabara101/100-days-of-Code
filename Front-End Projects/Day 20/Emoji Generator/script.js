// Ranges of valid emoji unicode code points
// This prevents generating empty boxes or invalid characters
const emojiRanges = [
    [0x1F600, 0x1F64F], // Emoticons
    [0x1F300, 0x1F5FF], // Misc Symbols and Pictographs
    [0x1F680, 0x1F6FF], // Transport and Map
    [0x1F900, 0x1F9FF], // Supplemental Symbols and Pictographs
    [0x1F1E0, 0x1F1FF], // Flags
    [0x2600, 0x26FF],   // Misc Symbols
    [0x2700, 0x27BF],   // Dingbats
    [0x1F910, 0x1F96B], // Hand gestures, faces, food (part of supplemental)
];

const display = document.getElementById('emojiDisplay');
const codeDisplay = document.getElementById('emojiCode');
const toast = document.getElementById('toast');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEmoji() {
    // Pick a random range
    const range = emojiRanges[Math.floor(Math.random() * emojiRanges.length)];
    // Pick a random code point within that range
    const codePoint = getRandomInt(range[0], range[1]);
    
    // Convert to string
    let emoji;
    try {
        emoji = String.fromCodePoint(codePoint);
    } catch (e) {
        // Fallback in case of invalid code point (rare)
        emoji = '🎲'; 
    }

    // Update DOM with animation reset
    display.style.animation = 'none';
    display.offsetHeight; /* trigger reflow */
    display.style.animation = 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    
    display.textContent = emoji;
    
    // Format unicode string nicely (e.g., U+1F600)
    codeDisplay.textContent = 'U+' + codePoint.toString(16).toUpperCase();
}

function copyEmoji() {
    const currentEmoji = display.textContent;
    
    // Use Clipboard API
    if (navigator.clipboard) {
        navigator.clipboard.writeText(currentEmoji).then(showToast).catch(err => {
            // Fallback for older browsers or if permission denied
            fallbackCopy(currentEmoji);
        });
    } else {
        fallbackCopy(currentEmoji);
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showToast();
    } catch (err) {
        console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
}

function showToast() {
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// Add click listener to the emoji itself for quick copy
display.addEventListener('click', copyEmoji);

// Generate one on load
window.onload = generateEmoji;

