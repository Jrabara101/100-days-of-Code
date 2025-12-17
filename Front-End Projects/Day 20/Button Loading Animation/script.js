// Get all buttons
const spinnerBtn = document.getElementById('spinnerBtn');
const pulseBtn = document.getElementById('pulseBtn');
const progressBtn = document.getElementById('progressBtn');
const rippleBtn = document.getElementById('rippleBtn');
const bounceBtn = document.getElementById('bounceBtn');

// Function to handle button loading state
function handleButtonClick(button, duration = 3000) {
    // Add loading class
    button.classList.add('loading');
    
    // Simulate async operation
    setTimeout(() => {
        // Remove loading class
        button.classList.remove('loading');
        
        // Optional: Add a success animation or feedback
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 200);
    }, duration);
}

// Event listeners for each button
spinnerBtn.addEventListener('click', () => {
    handleButtonClick(spinnerBtn, 3000);
});

pulseBtn.addEventListener('click', () => {
    handleButtonClick(pulseBtn, 3000);
});

progressBtn.addEventListener('click', () => {
    handleButtonClick(progressBtn, 3000);
});

rippleBtn.addEventListener('click', () => {
    handleButtonClick(rippleBtn, 3000);
});

bounceBtn.addEventListener('click', () => {
    handleButtonClick(bounceBtn, 3000);
});

