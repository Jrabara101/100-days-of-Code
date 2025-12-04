// DOM Elements
const minInput = document.getElementById('minInput');
const maxInput = document.getElementById('maxInput');
const countInput = document.getElementById('countInput');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const resetBtn = document.getElementById('resetBtn');
const resultDisplay = document.getElementById('resultDisplay');
const resultInfo = document.getElementById('resultInfo');
const notification = document.getElementById('notification');
const particleContainer = document.getElementById('particleContainer');
const totalGeneratedDisplay = document.getElementById('totalGenerated');
const lastCountDisplay = document.getElementById('lastCount');
const presetBtns = document.querySelectorAll('.preset-btn');
const loadingOverlay = document.getElementById('loadingOverlay');

// State
let generatedNumbers = [];
let totalGenerated = 0;

// Event Listeners
generateBtn.addEventListener('click', generateNumbers);
copyBtn.addEventListener('click', copyResults);
resetBtn.addEventListener('click', resetForm);
presetBtns.forEach(btn => btn.addEventListener('click', handlePreset));

// Input validation
minInput.addEventListener('change', validateInputs);
maxInput.addEventListener('change', validateInputs);
countInput.addEventListener('change', validateInputs);

// Enter key to generate
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !generateBtn.disabled) {
        generateNumbers();
    }
});

/**
 * Generate random numbers within specified range
 */
function generateNumbers() {
    // Validate inputs
    if (!validateInputs()) return;

    const min = parseInt(minInput.value);
    const max = parseInt(maxInput.value);
    const count = parseInt(countInput.value);

    // Show loading state
    generateBtn.disabled = true;
    loadingOverlay.classList.add('active');

    // Simulate slight delay for visual effect
    setTimeout(() => {
        try {
            generatedNumbers = [];

            // Generate random numbers
            for (let i = 0; i < count; i++) {
                const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
                generatedNumbers.push(randomNum);
            }

            // Display results
            displayResults();
            updateStats();
            createParticles();
            showNotification('✓ Numbers generated successfully!');

            totalGenerated++;
            totalGeneratedDisplay.textContent = totalGenerated;

        } catch (error) {
            console.error('Error generating numbers:', error);
            showNotification('Error generating numbers. Try again!');
        } finally {
            generateBtn.disabled = false;
            loadingOverlay.classList.remove('active');
        }
    }, 300);
}

/**
 * Validate input values
 */
function validateInputs() {
    const min = parseInt(minInput.value);
    const max = parseInt(maxInput.value);
    const count = parseInt(countInput.value);

    // Check if empty
    if (isNaN(min) || isNaN(max) || isNaN(count)) {
        showNotification('⚠️ Please fill all fields!');
        return false;
    }

    // Check if min < max
    if (min >= max) {
        showNotification('⚠️ Minimum must be less than Maximum!');
        minInput.style.borderColor = '#e74c3c';
        maxInput.style.borderColor = '#e74c3c';
        return false;
    } else {
        minInput.style.borderColor = '';
        maxInput.style.borderColor = '';
    }

    // Check count range
    if (count < 1 || count > 50) {
        showNotification('⚠️ Generate between 1 and 50 numbers!');
        countInput.style.borderColor = '#e74c3c';
        return false;
    } else {
        countInput.style.borderColor = '';
    }

    return true;
}

/**
 * Display generated numbers
 */
function displayResults() {
    resultDisplay.innerHTML = '';

    generatedNumbers.forEach((num, index) => {
        const numberBox = document.createElement('div');
        numberBox.className = 'number-box';
        numberBox.textContent = num;
        numberBox.style.animationDelay = `${index * 0.1}s`;
        resultDisplay.appendChild(numberBox);
    });

    lastCountDisplay.textContent = generatedNumbers.length;
}

/**
 * Update statistics
 */
function updateStats() {
    if (generatedNumbers.length === 0) return;

    const min = Math.min(...generatedNumbers);
    const max = Math.max(...generatedNumbers);
    const avg = (generatedNumbers.reduce((a, b) => a + b) / generatedNumbers.length).toFixed(2);

    resultInfo.innerHTML = `
        <div class="info-stat">
            <span class="info-label">Minimum</span>
            <span class="info-value">${min}</span>
        </div>
        <div class="info-stat">
            <span class="info-label">Maximum</span>
            <span class="info-value">${max}</span>
        </div>
        <div class="info-stat">
            <span class="info-label">Average</span>
            <span class="info-value">${avg}</span>
        </div>
    `;
}

/**
 * Copy results to clipboard
 */
function copyResults() {
    if (generatedNumbers.length === 0) {
        showNotification('⚠️ Generate numbers first!');
        return;
    }

    const textToCopy = generatedNumbers.join(', ');
    navigator.clipboard.writeText(textToCopy).then(() => {
        showNotification('✓ Copied to clipboard: ' + textToCopy);
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy to clipboard');
    });
}

/**
 * Reset form and results
 */
function resetForm() {
    minInput.value = 1;
    maxInput.value = 100;
    countInput.value = 1;
    generatedNumbers = [];
    resultDisplay.innerHTML = '<p class="result-placeholder">Click "Generate" to start</p>';
    resultInfo.innerHTML = '';
    minInput.style.borderColor = '';
    maxInput.style.borderColor = '';
    countInput.style.borderColor = '';
    showNotification('Form reset');
}

/**
 * Handle preset buttons
 */
function handlePreset(e) {
    const min = e.target.dataset.min;
    const max = e.target.dataset.max;

    minInput.value = min;
    maxInput.value = max;
    countInput.value = 1;

    showNotification(`Preset applied: ${min} - ${max}`);

    // Trigger generate after short delay
    setTimeout(() => {
        generateNumbers();
    }, 200);
}

/**
 * Show notification
 */
function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

/**
 * Create particle animation effect
 */
function createParticles() {
    // Clear previous particles
    particleContainer.innerHTML = '';

    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random size between 4-12px
        const size = Math.random() * 8 + 4;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';

        // Random position within container
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        particle.style.left = startX + '%';
        particle.style.top = startY + '%';

        // Random direction for particle movement
        const tx = (Math.random() - 0.5) * 200;
        const ty = Math.random() * -200 - 100;
        particle.style.setProperty('--tx', tx + 'px');

        // Create gradient background
        const hue = Math.random() * 60 + 200; // Purple to blue range
        particle.style.background = `hsl(${hue}, 70%, 60%)`;
        particle.style.borderRadius = '50%';

        // Animation
        particle.style.animation = `particleFloat ${Math.random() * 1 + 1.5}s ease-out forwards`;
        particle.style.animationDelay = `${Math.random() * 0.3}s`;

        particleContainer.appendChild(particle);
    }
}

/**
 * Initialize on page load
 */
window.addEventListener('load', () => {
    // Set default values
    minInput.value = 1;
    maxInput.value = 100;
    countInput.value = 1;

    // Show welcome notification
    showNotification('Welcome to Random Number Generator! 🎲');
});

/**
 * Utility: Get random number helper
 */
function getRandomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}