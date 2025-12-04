// DOM Elements
const quoteText = document.getElementById('quoteText');
const quoteAuthor = document.getElementById('quoteAuthor');
const newQuoteBtn = document.getElementById('newQuoteBtn');
const copyBtn = document.getElementById('copyBtn');
const shareBtn = document.getElementById('shareBtn');
const spinner = document.getElementById('spinner');
const notification = document.getElementById('notification');
const quoteCountDisplay = document.getElementById('quoteCount');
const categoryDisplay = document.getElementById('categoryDisplay');
const categoryBtns = document.querySelectorAll('.category-btn');

// State
let currentQuote = null;
let quoteCount = 0;
let currentCategory = 'all';
let isLoading = false;
let useStaticQuotes = false;

// API Configuration with CORS proxies
const API_URLS = [
    { url: 'https://api.quotable.io/random', useCors: false },
    { url: 'https://quotable.io/api/random', useCors: false },
    { url: 'https://cors-anywhere.herokuapp.com/https://api.quotable.io/random', useCors: true }
];

const CATEGORY_MAP = {
    'all': '',
    'inspirational': 'Inspirational',
    'wisdom': 'Wisdom',
    'motivational': 'Motivational',
    'success': 'Success',
    'life': 'Life'
};

// Static Fallback Quotes (in case API fails)
const STATIC_QUOTES = {
    'all': [
        { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'Motivational' },
        { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs', category: 'Motivational' },
        { text: 'Life is what happens when you\'re busy making other plans.', author: 'John Lennon', category: 'Life' },
        { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt', category: 'Inspirational' },
        { text: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle', category: 'Wisdom' },
        { text: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins', category: 'Motivational' },
        { text: 'Success is not final, failure is not fatal.', author: 'Winston Churchill', category: 'Success' },
        { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt', category: 'Inspirational' },
        { text: 'The only limit to our realization of tomorrow is our doubts of today.', author: 'Franklin D. Roosevelt', category: 'Motivational' },
        { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt', category: 'Wisdom' },
        { text: 'Fears are nothing more than a state of mind.', author: 'Napoleon Hill', category: 'Wisdom' },
        { text: 'Your limitation—it\'s only your imagination.', author: 'Unknown', category: 'Motivational' }
    ],
    'inspirational': [
        { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt', category: 'Inspirational' },
        { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt', category: 'Inspirational' },
        { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius', category: 'Inspirational' },
        { text: 'Everything you want is on the other side of fear.', author: 'George Addair', category: 'Inspirational' }
    ],
    'wisdom': [
        { text: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle', category: 'Wisdom' },
        { text: 'The only true wisdom is in knowing you know nothing.', author: 'Socrates', category: 'Wisdom' },
        { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt', category: 'Wisdom' },
        { text: 'Fears are nothing more than a state of mind.', author: 'Napoleon Hill', category: 'Wisdom' }
    ],
    'motivational': [
        { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'Motivational' },
        { text: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins', category: 'Motivational' },
        { text: 'The only limit to our realization of tomorrow is our doubts of today.', author: 'Franklin D. Roosevelt', category: 'Motivational' },
        { text: 'Your limitation—it\'s only your imagination.', author: 'Unknown', category: 'Motivational' }
    ],
    'success': [
        { text: 'Success is not final, failure is not fatal.', author: 'Winston Churchill', category: 'Success' },
        { text: 'Success usually comes to those who are too busy to be looking for it.', author: 'Henry David Thoreau', category: 'Success' },
        { text: 'Success is walking from failure to failure with no loss of enthusiasm.', author: 'Winston Churchill', category: 'Success' }
    ],
    'life': [
        { text: 'Life is what happens when you\'re busy making other plans.', author: 'John Lennon', category: 'Life' },
        { text: 'The purpose of our lives is to be happy.', author: 'Dalai Lama', category: 'Life' },
        { text: 'Get busy living or get busy dying.', author: 'Stephen King', category: 'Life' }
    ]
};

// Event Listeners
newQuoteBtn.addEventListener('click', getNewQuote);
copyBtn.addEventListener('click', copyToClipboard);
shareBtn.addEventListener('click', shareQuote);
categoryBtns.forEach(btn => {
    btn.addEventListener('click', handleCategoryChange);
});

// Fetch Quote from API with fallback
async function getNewQuote() {
    if (isLoading) return;

    isLoading = true;
    newQuoteBtn.disabled = true;
    copyBtn.disabled = true;
    shareBtn.disabled = true;
    spinner.classList.add('show');

    try {
        // Try to fetch from API
        let quote = await fetchFromAPI();
        
        // If API fails, use static quotes
        if (!quote) {
            console.log('Using static quotes as fallback');
            useStaticQuotes = true;
            quote = getRandomStaticQuote();
            showNotification('📚 Using offline quotes');
        } else {
            useStaticQuotes = false;
        }

        currentQuote = quote;
        displayQuote(currentQuote);
        quoteCount++;
        updateStats();

    } catch (error) {
        console.error('Error in getNewQuote:', error);
        
        // Fallback to static quotes
        try {
            const quote = getRandomStaticQuote();
            currentQuote = quote;
            displayQuote(currentQuote);
            quoteCount++;
            updateStats();
            showNotification('📚 Using offline quotes');
            useStaticQuotes = true;
        } catch (fallbackError) {
            showNotification('⚠️ Error loading quotes. Try again!');
        }
    } finally {
        isLoading = false;
        newQuoteBtn.disabled = false;
        copyBtn.disabled = false;
        shareBtn.disabled = false;
        spinner.classList.remove('show');
    }
}

// Fetch from API with improved error handling
async function fetchFromAPI() {
    for (let apiConfig of API_URLS) {
        try {
            let url = apiConfig.url;
            
            // Add category filter for tag-based endpoints
            if (currentCategory !== 'all' && !url.includes('cors')) {
                url += `?tags=${CATEGORY_MAP[currentCategory]}`;
            }

            console.log(`Attempting to fetch from: ${url}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

            const response = await fetch(url, {
                signal: controller.signal,
                method: 'GET',
                mode: 'cors',
                cache: 'no-store',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            clearTimeout(timeoutId);

            // Check if response is ok
            if (!response.ok) {
                console.warn(`HTTP ${response.status}: ${response.statusText}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Parse JSON
            const data = await response.json();
            console.log('API Response:', data);

            // Validate response - handle both single quote and array responses
            let quoteData = data;
            if (Array.isArray(data)) {
                if (data.length === 0) throw new Error('Empty quotes array');
                quoteData = data[0];
            }

            if (!quoteData.content && !quoteData.text) {
                throw new Error('No content in response');
            }

            const quoteText = quoteData.content || quoteData.text;
            const quoteAuthor = quoteData.author || 'Unknown';

            // Clean author name
            let cleanAuthor = quoteAuthor;
            if (typeof cleanAuthor === 'string') {
                cleanAuthor = cleanAuthor.replace(', type.fit', '').replace(/,\s*type\.fit\s*$/, '').trim();
            }

            // Get category
            let category = 'General';
            if (quoteData.tags && Array.isArray(quoteData.tags) && quoteData.tags.length > 0) {
                category = quoteData.tags[0].charAt(0).toUpperCase() + quoteData.tags[0].slice(1);
            }

            const result = {
                text: quoteText,
                author: cleanAuthor,
                category: category
            };

            console.log('Quote fetched successfully:', result);
            return result;

        } catch (error) {
            console.warn(`API attempt failed:`, error.message);
            // Continue to next API
            continue;
        }
    }

    // All APIs failed
    console.warn('All API attempts failed, falling back to static quotes');
    return null;
}

// Get Random Quote from Static Array
function getRandomStaticQuote() {
    let quotes;
    
    if (currentCategory === 'all') {
        quotes = STATIC_QUOTES['all'];
    } else {
        quotes = STATIC_QUOTES[currentCategory] || STATIC_QUOTES['all'];
    }

    if (!quotes || quotes.length === 0) {
        quotes = STATIC_QUOTES['all'];
    }

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    console.log('Using static quote:', randomQuote);
    return randomQuote;
}

// Display Quote
function displayQuote(quote) {
    quoteText.textContent = `"${quote.text}"`;
    quoteAuthor.textContent = `— ${quote.author}`;
    categoryDisplay.textContent = quote.category;
}

// Copy Quote to Clipboard
function copyToClipboard() {
    if (!currentQuote) return;

    const textToCopy = `"${currentQuote.text}" — ${currentQuote.author}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        showNotification('✓ Quote copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy quote.');
    });
}

// Share Quote
function shareQuote() {
    if (!currentQuote) return;

    const textToShare = `"${currentQuote.text}" — ${currentQuote.author}`;

    // Check if Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: 'Quote Generator',
            text: textToShare
        }).catch(err => console.error('Error sharing:', err));
    } else {
        // Fallback: Copy to clipboard and show notification
        navigator.clipboard.writeText(textToShare);
        showNotification('✓ Quote copied! Share it manually.');
    }
}

// Handle Category Change
function handleCategoryChange(e) {
    const category = e.target.dataset.category;
    
    // Update active button
    categoryBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    // Update category and fetch new quote
    currentCategory = category;
    getNewQuote();
}

// Update Statistics
function updateStats() {
    quoteCountDisplay.textContent = quoteCount;
}

// Show Notification
function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Initialize on page load
window.addEventListener('load', () => {
    getNewQuote();
});

// Keyboard shortcut: Press Space to get new quote
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isLoading && e.target === document.body) {
        e.preventDefault();
        getNewQuote();
    }
});