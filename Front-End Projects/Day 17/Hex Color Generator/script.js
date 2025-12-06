// DOM Elements
const colorBox = document.getElementById('colorBox');
const hexCode = document.getElementById('hexCode');
const copyBtn = document.getElementById('copyBtn');
const generateBtn = document.getElementById('generateBtn');
const hexInput = document.getElementById('hexInput');
const applyBtn = document.getElementById('applyBtn');
const colorHistory = document.getElementById('colorHistory');

// Store recent colors (max 12)
let recentColors = JSON.parse(localStorage.getItem('hexColorHistory')) || [];

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Generate initial random color
    generateRandomColor();
    
    // Load recent colors from localStorage
    if (recentColors.length > 0) {
        renderColorHistory();
    } else {
        showEmptyHistory();
    }
});

// Generate random hex color
function generateRandomColor() {
    const hex = generateHex();
    updateColorDisplay(hex);
    addToHistory(hex);
}

// Generate random hex code
function generateHex() {
    const hex = '#' + Math.floor(Math.random() * 16777215)
        .toString(16)
        .toUpperCase()
        .padStart(6, '0');
    return hex;
}

// Update color display
function updateColorDisplay(hex) {
    colorBox.style.background = hex;
    hexCode.textContent = hex;
    hexInput.value = hex;
    document.body.style.setProperty('--current-color', hex);
}

// Copy hex code to clipboard
copyBtn.addEventListener('click', async () => {
    const hex = hexCode.textContent;
    
    try {
        await navigator.clipboard.writeText(hex);
        showCopySuccess();
    } catch (err) {
        // Fallback for older browsers
        copyToClipboardFallback(hex);
    }
});

// Fallback copy method
function copyToClipboardFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showCopySuccess();
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    }
    
    document.body.removeChild(textarea);
}

// Show copy success feedback
function showCopySuccess() {
    const copyText = copyBtn.querySelector('.copy-text');
    const copiedText = copyBtn.querySelector('.copied-text');
    
    copyText.style.display = 'none';
    copiedText.style.display = 'block';
    copyBtn.classList.add('copied');
    
    setTimeout(() => {
        copyText.style.display = 'block';
        copiedText.style.display = 'none';
        copyBtn.classList.remove('copied');
    }, 2000);
}

// Generate button click
generateBtn.addEventListener('click', () => {
    generateRandomColor();
    animateColorBox();
});

// Animate color box on generate
function animateColorBox() {
    colorBox.style.transform = 'scale(0.95)';
    setTimeout(() => {
        colorBox.style.transform = 'scale(1)';
    }, 200);
}

// Manual hex input
hexInput.addEventListener('input', (e) => {
    let value = e.target.value;
    
    // Auto-add # if user types without it
    if (value.length > 0 && value[0] !== '#') {
        value = '#' + value;
        e.target.value = value;
    }
    
    // Convert to uppercase
    if (value !== value.toUpperCase()) {
        e.target.value = value.toUpperCase();
    }
    
    // Validate hex format in real-time
    validateHexInput(value);
});

// Validate hex input
function validateHexInput(value) {
    const hexPattern = /^#[0-9A-Fa-f]{0,6}$/;
    const errorMsg = document.querySelector('.error-message');
    
    if (value.length > 0 && !hexPattern.test(value)) {
        showError('Invalid hex format. Use # followed by 6 hexadecimal characters.');
        return false;
    }
    
    if (value.length === 7 && !isValidHex(value)) {
        showError('Invalid hex color code.');
        return false;
    }
    
    hideError();
    return true;
}

// Check if hex is valid color
function isValidHex(hex) {
    return /^#[0-9A-Fa-f]{6}$/i.test(hex);
}

// Show error message
function showError(message) {
    let errorMsg = document.querySelector('.error-message');
    
    if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        document.querySelector('.manual-input').appendChild(errorMsg);
    }
    
    errorMsg.textContent = message;
    errorMsg.classList.add('show');
}

// Hide error message
function hideError() {
    const errorMsg = document.querySelector('.error-message');
    if (errorMsg) {
        errorMsg.classList.remove('show');
    }
}

// Apply button click
applyBtn.addEventListener('click', () => {
    const hex = hexInput.value.trim();
    
    if (!hex) {
        showError('Please enter a hex color code.');
        return;
    }
    
    if (!isValidHex(hex)) {
        showError('Invalid hex color code. Format: #RRGGBB (e.g., #FF5733)');
        return;
    }
    
    const normalizedHex = hex.toUpperCase();
    updateColorDisplay(normalizedHex);
    addToHistory(normalizedHex);
    hideError();
});

// Enter key to apply
hexInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        applyBtn.click();
    }
});

// Add color to history
function addToHistory(hex) {
    // Remove if already exists
    recentColors = recentColors.filter(color => color !== hex);
    
    // Add to beginning
    recentColors.unshift(hex);
    
    // Keep only last 12 colors
    if (recentColors.length > 12) {
        recentColors = recentColors.slice(0, 12);
    }
    
    // Save to localStorage
    localStorage.setItem('hexColorHistory', JSON.stringify(recentColors));
    
    // Render history
    renderColorHistory();
}

// Render color history
function renderColorHistory() {
    if (recentColors.length === 0) {
        showEmptyHistory();
        return;
    }
    
    colorHistory.innerHTML = '';
    
    recentColors.forEach(hex => {
        const colorItem = document.createElement('div');
        colorItem.className = 'color-item';
        colorItem.style.background = hex;
        colorItem.setAttribute('data-hex', hex);
        colorItem.setAttribute('aria-label', `Color ${hex}`);
        colorItem.setAttribute('title', hex);
        
        colorItem.addEventListener('click', () => {
            updateColorDisplay(hex);
            addToHistory(hex);
        });
        
        colorHistory.appendChild(colorItem);
    });
}

// Show empty history message
function showEmptyHistory() {
    colorHistory.innerHTML = '<div class="empty-history">No recent colors yet. Generate some colors to see them here!</div>';
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space bar to generate (when not typing in input)
    if (e.code === 'Space' && document.activeElement !== hexInput) {
        e.preventDefault();
        generateBtn.click();
    }
    
    // Ctrl/Cmd + C to copy (when not typing in input)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && document.activeElement !== hexInput) {
        copyBtn.click();
    }
});

