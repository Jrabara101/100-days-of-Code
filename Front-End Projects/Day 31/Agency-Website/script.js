// Simple interactivity for demonstration
document.addEventListener('DOMContentLoaded', function() {
    // Favorite property toggle
    const favoriteButtons = document.querySelectorAll('.property-card svg');
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('text-red-500');
            this.classList.toggle('text-gray-300');
        });
    });
    
    // Property card click
    const propertyCards = document.querySelectorAll('.property-card');
    propertyCards.forEach(card => {
        card.addEventListener('click', function() {
            alert('You clicked on a property! This would navigate to the property details page.');
        });
    });
});
