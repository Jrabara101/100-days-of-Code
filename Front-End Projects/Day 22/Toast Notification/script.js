// Toast Notification Class
class ToastNotification {
    constructor(container) {
        this.container = container;
    }

    show(title, message, options = {}) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        const toastId = `toast-${Date.now()}`;
        toast.id = toastId;

        // Create content
        const content = document.createElement('div');
        content.className = 'toast-content';
        
        const titleEl = document.createElement('div');
        titleEl.className = 'toast-title';
        titleEl.textContent = title;
        
        const messageEl = document.createElement('div');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;
        
        content.appendChild(titleEl);
        content.appendChild(messageEl);

        // Create actions
        const actions = document.createElement('div');
        actions.className = 'toast-actions';

        // Undo button
        if (options.showUndo !== false) {
            const undoBtn = this.createActionButton('undo', () => {
                if (options.onUndo) {
                    options.onUndo();
                }
                this.hide(toast);
            });
            actions.appendChild(undoBtn);
        }

        // Close button
        const closeBtn = this.createActionButton('close', () => {
            this.hide(toast);
        });
        actions.appendChild(closeBtn);

        // Assemble toast
        toast.appendChild(content);
        toast.appendChild(actions);

        // Add to container
        this.container.appendChild(toast);

        // Auto-hide after duration (default 5 seconds)
        const duration = options.duration || 5000;
        if (duration > 0) {
            setTimeout(() => {
                this.hide(toast);
            }, duration);
        }

        return toastId;
    }

    createActionButton(type, onClick) {
        const button = document.createElement('button');
        button.className = 'toast-btn';
        button.setAttribute('aria-label', type === 'undo' ? 'Undo' : 'Close');
        
        // Create tooltip
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = type === 'undo' ? 'Undo' : 'Close';
        button.appendChild(tooltip);

        // Create icon SVG
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('viewBox', '0 0 24 24');
        
        if (type === 'undo') {
            // Undo icon (curved arrow pointing left)
            const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path1.setAttribute('d', 'M3 7v6h6');
            const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path2.setAttribute('d', 'M21 17a9 9 0 1 1-9-9c2.5 0 4.5 1 6 2.5L21 13');
            icon.appendChild(path1);
            icon.appendChild(path2);
        } else {
            // Close icon (X)
            const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line1.setAttribute('x1', '18');
            line1.setAttribute('y1', '6');
            line1.setAttribute('x2', '6');
            line1.setAttribute('y2', '18');
            const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line2.setAttribute('x1', '6');
            line2.setAttribute('y1', '6');
            line2.setAttribute('x2', '18');
            line2.setAttribute('y2', '18');
            icon.appendChild(line1);
            icon.appendChild(line2);
        }
        
        button.appendChild(icon);
        button.addEventListener('click', onClick);
        
        return button;
    }

    hide(toast) {
        if (typeof toast === 'string') {
            toast = document.getElementById(toast);
        }
        
        if (toast) {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    hideAll() {
        const toasts = this.container.querySelectorAll('.toast');
        toasts.forEach(toast => this.hide(toast));
    }
}

// Initialize Toast Notification
const toastContainer = document.getElementById('toast-container');
const toast = new ToastNotification(toastContainer);

// Demo button functionality
const showToastBtn = document.getElementById('show-toast-btn');
showToastBtn.addEventListener('click', () => {
    toast.show(
        'Page deleted',
        'Lorem ipsum dolor sit amet.',
        {
            showUndo: true,
            duration: 5000,
            onUndo: () => {
                console.log('Undo action triggered');
                // You can add custom undo logic here
                alert('Page restored!');
            }
        }
    );
});

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToastNotification;
}



