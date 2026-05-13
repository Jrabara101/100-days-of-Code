/**
 * Calculates the age in years, months, and days based on the date of birth.
 */
function calculateAge() {
    // Get the date of birth input element
    const birthDateInput = document.getElementById('birthDate');
    const resultElement = document.getElementById('result');

    // Get the value (as a string in 'YYYY-MM-DD' format)
    const dobString = birthDateInput.value;

    if (!dobString) {
        resultElement.innerHTML = "Please select your date of birth.";
        return;
    }

    // Convert the string to a Date object
    const birthDate = new Date(dobString);
    const currentDate = new Date();

    // 1. Basic Validation: Ensure the birth date is not in the future
    if (birthDate > currentDate) {
        resultElement.innerHTML = "Date of birth cannot be in the future.";
        return;
    }

    // --- Age Calculation Logic ---

    // Get year, month, and day components for both dates
    let year1 = currentDate.getFullYear();
    let month1 = currentDate.getMonth() + 1; // Month is 0-indexed, so add 1
    let day1 = currentDate.getDate();

    let year2 = birthDate.getFullYear();
    let month2 = birthDate.getMonth() + 1;
    let day2 = birthDate.getDate();

    let calculatedYears = year1 - year2;
    let calculatedMonths = month1 - month2;
    let calculatedDays = day1 - day2;

    // 2. Adjust for Months: If the current month is earlier than the birth month
    if (calculatedMonths < 0) {
        calculatedYears--; // Subtract a year
        calculatedMonths += 12; // Add 12 months
    }

    // 3. Adjust for Days: If the current day is earlier than the birth day
    if (calculatedDays < 0) {
        // Subtract a month
        calculatedMonths--;

        // Find the number of days in the *previous* month (the one we just passed)
        // Date(year, monthIndex, 0) gives the last day of the *previous* month
        let daysInPreviousMonth = new Date(year1, month1 - 1, 0).getDate();
        
        // Add the days of the previous month to the negative calculatedDays
        calculatedDays += daysInPreviousMonth;

        // Final check if subtracting a month put us in a negative month count
        if (calculatedMonths < 0) {
            calculatedMonths = 11; // Set months to December (11)
            calculatedYears--;     // Subtract another year
        }
    }

    // --- Display the Result ---

    let output = `<p>Your age is:</p>`;
    output += `<strong>${calculatedYears}</strong> years, `;
    output += `<strong>${calculatedMonths}</strong> months, and `;
    output += `<strong>${calculatedDays}</strong> days.`;

    resultElement.innerHTML = output;
}