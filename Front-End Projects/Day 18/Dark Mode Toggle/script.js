// ============================================
// DARK MODE TOGGLE - JavaScript
// ============================================

// Get DOM elements
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// ============================================
// THEME MANAGEMENT FUNCTIONS
// ============================================

/**
 * Get the current theme from localStorage or system preference
 */
function getInitialTheme() {
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        return savedTheme;
    }
    
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
}

/**
 * Set the theme on the HTML element
 */
function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update button aria-label for accessibility
    const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    themeToggle.setAttribute('aria-label', label);
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    setTheme(newTheme);
    
    // Add a subtle animation effect
    animateThemeChange();
}

/**
 * Animate the theme change
 */
function animateThemeChange() {
    // Add a class for animation
    html.classList.add('theme-transitioning');
    
    // Remove the class after transition completes
    setTimeout(() => {
        html.classList.remove('theme-transitioning');
    }, 300);
}

// ============================================
// EVENT LISTENERS
// ============================================

// Toggle theme on button click
themeToggle.addEventListener('click', toggleTheme);

// Listen for system theme changes (optional)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only update if user hasn't set a preference
    if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

// ============================================
// KEYBOARD SUPPORT
// ============================================

// Toggle theme with keyboard shortcut (Ctrl/Cmd + Shift + D)
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleTheme();
    }
});

// ============================================
// INITIALIZATION
// ============================================

// Set initial theme on page load
(function initTheme() {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    
    // Prevent flash of unstyled content
    html.style.visibility = 'visible';
})();

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get current theme
 */
function getCurrentTheme() {
    return html.getAttribute('data-theme') || 'light';
}

/**
 * Check if dark mode is active
 */
function isDarkMode() {
    return getCurrentTheme() === 'dark';
}

// Export functions for use in console (for debugging)
window.themeUtils = {
    toggle: toggleTheme,
    getCurrent: getCurrentTheme,
    isDark: isDarkMode,
    set: setTheme
};

// ============================================
// CONSOLE LOG (for learning purposes)
// ============================================

console.log('%c🌙 Dark Mode Toggle', 'color: #6366f1; font-size: 16px; font-weight: bold;');
console.log('%cTry these commands:', 'color: #6b7280; font-size: 12px;');
console.log('  themeUtils.toggle() - Toggle theme');
console.log('  themeUtils.getCurrent() - Get current theme');
console.log('  themeUtils.isDark() - Check if dark mode');
console.log('  themeUtils.set("dark") - Set theme directly');

