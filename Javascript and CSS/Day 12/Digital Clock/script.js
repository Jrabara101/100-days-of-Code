// Function to update the clock and date display
function updateClock() {
    // 1. Create a new Date object to get the current time and date
    const now = new Date();

    // --- TIME CALCULATION ---

    // Get hours, minutes, and seconds
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    // Convert to 12-hour format and determine AM/PM
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // The hour '0' should be '12'

    // Add leading zero to minutes and seconds if they are less than 10
    // This is done using a ternary operator for conciseness
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    hours = hours < 10 ? '0' + hours : hours; // Also add leading zero to hours

    // Format the time string
    const timeString = `${hours}:${minutes}:${seconds} ${ampm}`;

    // --- DATE CALCULATION ---

    // Get day, month, and year
    const day = now.getDate();
    const month = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const year = now.getFullYear();

    // Format the date string
    const dateString = `${month < 10 ? '0' + month : month} / ${day < 10 ? '0' + day : day} / ${year}`;

    // --- UPDATE THE DOM ---

    // Update the HTML elements with the new time and date
    document.getElementById('time-display').textContent = timeString;
    document.getElementById('date-display').textContent = dateString;
}

// 2. Initial call to display the time immediately when the page loads
updateClock();

// 3. Use setInterval() to call the updateClock function every 1000 milliseconds (1 second)
// This is what makes the clock tick in real-time.
setInterval(updateClock, 1000);