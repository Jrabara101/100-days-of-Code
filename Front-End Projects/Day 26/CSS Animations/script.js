document.addEventListener('DOMContentLoaded', () => {

    // 1. Progress Ring Logic
    const progressRange = document.getElementById('progress-range');
    const ring = document.querySelector('.progress-ring');
    const progressText = document.getElementById('progress-value');

    function updateProgress(value) {
        // Update CSS variable for the gradient
        ring.style.setProperty('--percent', value);
        // Update the text attribute for display
        ring.setAttribute('data-value', `${value}%`);
        progressText.textContent = `${value}%`;
    }

    if (progressRange) {
        progressRange.addEventListener('input', (e) => {
            updateProgress(e.target.value);
        });
    }

    // 2. Modal Logic
    const modal = document.getElementById('glass-modal');
    const openBtn = document.getElementById('open-modal-btn');
    const closeBtns = document.querySelectorAll('.close-btn, .close-modal-action');

    if (modal && openBtn) {
        openBtn.addEventListener('click', () => {
            modal.showModal();
        });

        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Add closing animation logic if desired, but native close() is instant.
                // For a smooth exit, we'd add a class, wait for animationend, then close().
                modal.close();
            });
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            const rect = modal.getBoundingClientRect();
            const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                rect.left <= e.clientX && e.clientX <= rect.left + rect.width);

            if (!isInDialog) {
                modal.close();
            }
        });
    }

    // 3. Credit Card Auto-Formatting (Optional Polish)
    const ccInput = document.getElementById('cc-input');
    if (ccInput) {
        ccInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            value = value.substring(0, 16); // Limit to 16 digits

            // Add spaces every 4 digits
            const parts = [];
            for (let i = 0; i < value.length; i += 4) {
                parts.push(value.substring(i, i + 4));
            }

            e.target.value = parts.join(' ');
        });
    }
});
