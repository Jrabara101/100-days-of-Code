/* ============================================
   POPUP BOX DESIGN - MODAL DIALOGS
   JavaScript functionality for modals
   ============================================ */

// Get all modal elements
const modalOverlay = document.getElementById('modalOverlay');
const infoModal = document.getElementById('infoModal');
const confirmModal = document.getElementById('confirmModal');
const formModal = document.getElementById('formModal');
const customModal = document.getElementById('customModal');
const zIndexDemoModal = document.getElementById('zIndexDemoModal');

// Get all trigger buttons
const infoModalBtn = document.getElementById('infoModalBtn');
const confirmModalBtn = document.getElementById('confirmModalBtn');
const formModalBtn = document.getElementById('formModalBtn');
const customModalBtn = document.getElementById('customModalBtn');
const zIndexDemoBtn = document.getElementById('zIndexDemoBtn');

// Modal Management Functions

/**
 * Opens a modal dialog
 * @param {HTMLElement} modal - The modal element to open
 */
function openModal(modal) {
    // Show overlay first (lower z-index)
    modalOverlay.classList.add('active');
    
    // Show modal (higher z-index)
    modal.classList.add('active');
    
    // Prevent body scroll when modal is open
    document.body.classList.add('body-no-scroll');
    
    // Focus the first focusable element in modal for accessibility
    const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
        firstFocusable.focus();
    }
}

/**
 * Closes a modal dialog
 * @param {HTMLElement} modal - The modal element to close
 */
function closeModal(modal) {
    // Hide modal first
    modal.classList.remove('active');
    
    // Hide overlay after a short delay for smooth transition
    setTimeout(() => {
        modalOverlay.classList.remove('active');
    }, 200);
    
    // Re-enable body scroll
    document.body.classList.remove('body-no-scroll');
}

/**
 * Closes all open modals
 */
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (modal.classList.contains('active')) {
            closeModal(modal);
        }
    });
}

// Event Listeners for Opening Modals
infoModalBtn.addEventListener('click', () => {
    openModal(infoModal);
});

confirmModalBtn.addEventListener('click', () => {
    openModal(confirmModal);
});

formModalBtn.addEventListener('click', () => {
    openModal(formModal);
});

customModalBtn.addEventListener('click', () => {
    openModal(customModal);
});

zIndexDemoBtn.addEventListener('click', () => {
    openModal(zIndexDemoModal);
});

// Close modal when clicking the overlay (backdrop)
modalOverlay.addEventListener('click', (e) => {
    // Only close if clicking directly on overlay, not on modal content
    if (e.target === modalOverlay) {
        closeAllModals();
    }
});

// Close modal when clicking close button (×)
document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        closeModal(modal);
    });
});

// Close modal when clicking cancel buttons
document.querySelectorAll('.modal-cancel').forEach(cancelBtn => {
    cancelBtn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        closeModal(modal);
    });
});

// Handle confirmation modal actions
const confirmModalConfirmBtn = confirmModal.querySelector('.modal-confirm');
confirmModalConfirmBtn.addEventListener('click', () => {
    alert('Action confirmed!');
    closeModal(confirmModal);
});

// Handle form submission
const formSubmitBtn = formModal.querySelector('.modal-submit');
const contactForm = document.getElementById('contactForm');

formSubmitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Check form validity
    if (contactForm.checkValidity()) {
        // Get form data
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message')
        };
        
        // In a real application, you would send this data to a server
        console.log('Form submitted:', data);
        alert(`Thank you, ${data.name}! Your message has been submitted.`);
        
        // Reset form and close modal
        contactForm.reset();
        closeModal(formModal);
    } else {
        // Show browser's native validation messages
        contactForm.reportValidity();
    }
});

// Handle "OK" buttons that just close the modal
document.querySelectorAll('.modal-ok').forEach(okBtn => {
    okBtn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        closeModal(modal);
    });
});

// Close modal with ESC key
document.addEventListener('keydown', (e) => {
    // Check if ESC key is pressed
    if (e.key === 'Escape' || e.keyCode === 27) {
        closeAllModals();
    }
});

// Prevent modal from closing when clicking inside modal content
document.querySelectorAll('.modal-content').forEach(content => {
    content.addEventListener('click', (e) => {
        // Stop event propagation to prevent closing when clicking inside modal
        e.stopPropagation();
    });
});

/* ============================================
   EDUCATIONAL NOTES
   ============================================

   Z-INDEX EXPLANATION:
   - z-index only works on positioned elements (relative, absolute, fixed, sticky)
   - Higher z-index values appear on top of lower values
   - In this project:
     * Page content: z-index: auto (default, effectively 0)
     * Modal overlay: z-index: 1000 (covers page content)
     * Modal dialogs: z-index: 1001 (appears above overlay)

   POSITIONING EXPLANATION:
   - position: fixed - Positions relative to viewport, stays fixed when scrolling
   - position: absolute - Positions relative to nearest positioned ancestor
   - position: relative - Positions relative to normal position in flow
   - position: static - Default, normal document flow

   MODAL BEST PRACTICES:
   1. Use fixed positioning for overlay and modal
   2. Use high z-index values to ensure modals appear on top
   3. Prevent body scroll when modal is open
   4. Allow closing with ESC key for accessibility
   5. Close on backdrop click for better UX
   6. Trap focus within modal for keyboard navigation
   7. Add smooth transitions for better user experience

   ============================================ */

