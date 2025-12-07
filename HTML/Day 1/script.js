// Wait for the DOM to fully load before running the script
document.addEventListener('DOMContentLoaded', function() {
    console.log("Website loaded successfully!");

    // Select the special offer element
    const offerSection = document.getElementById('special-offer');

    if (offerSection) {
        // Add a click event to the offer
        offerSection.addEventListener('click', function() {
            alert("Promo Code: WEBDEV2025\nUse this code to claim your 15% discount!");
            
            // Optional: Change background color after clicking
            this.style.backgroundColor = "#fffae6";
            this.style.border = "2px solid #ffcc00";
        });
    }
});
