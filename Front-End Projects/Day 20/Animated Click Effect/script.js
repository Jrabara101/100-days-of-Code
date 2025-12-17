// Configuration
const duration = 600; // Animation duration in ms (match CSS)
const display = document.getElementById('coord-display');
const posX = document.getElementById('pos-x');
const posY = document.getElementById('pos-y');

// Listen for clicks on the entire document
document.addEventListener('click', function(e) {
    createRipple(e);
    updateCoordinates(e);
});

// Also support touch for mobile
document.addEventListener('touchstart', function(e) {
    // Use the first touch point
    const touch = e.touches[0];
    createRipple(touch);
    updateCoordinates(touch);
});

function updateCoordinates(e) {
    posX.innerText = Math.round(e.clientX);
    posY.innerText = Math.round(e.clientY);
    
    // Subtle "bump" animation for the coordinate box
    display.classList.remove('scale-105');
    // Trigger reflow to restart animation
    void display.offsetWidth; 
    display.classList.add('scale-105');
    setTimeout(() => display.classList.remove('scale-105'), 100);
}

function createRipple(e) {
    // 1. Create the element
    const ripple = document.createElement('div');
    ripple.classList.add('ripple');

    // 2. Randomize color (optional fun touch)
    const colors = ['blue', 'purple', 'pink'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    ripple.classList.add(randomColor);

    // 3. Set size
    // We want the ripple to be large enough to look good
    const size = 100; 
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;

    // 4. Position the element
    // We subtract half the size to center the ripple on the cursor
    const x = e.clientX - (size / 2);
    const y = e.clientY - (size / 2);
    
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    // 5. Add to DOM
    document.body.appendChild(ripple);

    // 6. Cleanup
    // Remove the element after the animation finishes so the DOM doesn't get clogged
    setTimeout(() => {
        ripple.remove();
    }, duration);
}

