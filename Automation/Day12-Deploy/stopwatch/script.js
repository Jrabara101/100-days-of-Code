// --- STATE VARIABLES ---
// totalMilliseconds: Tracks the total time elapsed in milliseconds.
let totalMilliseconds = 0; 
// intervalId: Stores the ID returned by setInterval, used to stop the timer.
let intervalId = null;     
// isRunning: Boolean flag to track the current state of the stopwatch.
let isRunning = false;     

// DOM elements
const display = document.getElementById('display');
const startStopBtn = document.getElementById('startStopBtn');

// --- HELPER FUNCTION ---
// Converts milliseconds into a formatted time string (HH:MM:SS)
function formatTime(ms) {
    // 1. Calculate the total number of seconds
    let totalSeconds = Math.floor(ms / 1000);

    // 2. Calculate hours, minutes, and seconds
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600; // Remaining seconds after hours are accounted for
    
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;

    // 3. Use padStart(2, '0') to ensure two digits (e.g., 5 becomes 05)
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

// --- CORE FUNCTION: UPDATE TIMER ---
function updateTimer() {
    // Increment the total time by 1000 milliseconds (1 second)
    totalMilliseconds += 1000;
    
    // Update the display element with the new formatted time
    display.textContent = formatTime(totalMilliseconds);
}

// --- CONTROL FUNCTIONS ---

/**
 * Toggles between Start and Stop states.
 */
function startStop() {
    if (isRunning) {
        // --- STOP ACTION ---
        // 1. Clear the interval to stop the timer from running.
        clearInterval(intervalId);
        // 2. Update the state flag.
        isRunning = false;
        // 3. Update the button appearance/text.
        startStopBtn.textContent = 'Start';
        startStopBtn.classList.remove('stop'); // Remove red background
    } else {
        // --- START ACTION ---
        // 1. Use setInterval to call updateTimer every 1000ms (1 second).
        //    Store the ID to allow us to stop it later.
        intervalId = setInterval(updateTimer, 1000);
        // 2. Update the state flag.
        isRunning = true;
        // 3. Update the button appearance/text.
        startStopBtn.textContent = 'Stop';
        startStopBtn.classList.add('stop'); // Add red background
    }
}

/**
 * Resets the stopwatch to 00:00:00.
 */
function resetTimer() {
    // 1. Ensure the timer is stopped first (good practice).
    clearInterval(intervalId);
    
    // 2. Reset all state variables.
    totalMilliseconds = 0;
    isRunning = false;
    
    // 3. Update the display and the Start/Stop button.
    display.textContent = '00:00:00';
    startStopBtn.textContent = 'Start';
    startStopBtn.classList.remove('stop');
    intervalId = null; // Clear the stored ID
}