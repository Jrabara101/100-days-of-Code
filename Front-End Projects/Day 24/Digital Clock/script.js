class ClockApp {
    constructor() {
        // Elements
        this.hourHand = document.getElementById('hour-hand');
        this.minuteHand = document.getElementById('minute-hand');
        this.secondHand = document.getElementById('second-hand');
        this.digitalDisplay = document.getElementById('digital-time');
        this.themeButtons = document.querySelectorAll('.theme-btn');
        this.body = document.body;

        // State
        this.currentDate = new Date();

        // Initialize
        this.init();
    }

    init() {
        // Start Engine
        this.startClock();

        // Setup Themes
        this.setupThemes();

        // Initial Update
        this.update();
    }

    startClock() {
        // 100ms interval for high precision/smoothness
        setInterval(() => {
            this.currentDate = new Date();
            this.update();
        }, 100);
    }

    update() {
        const now = this.currentDate;

        // Get Time Components
        const seconds = now.getSeconds();
        const minutes = now.getMinutes();
        const hours = now.getHours();
        const milliseconds = now.getMilliseconds();

        // --- Analog Logic ---
        // Calculate degrees
        // Seconds: (seconds / 60) * 360
        // We add milliseconds for that extra "micro-movement" if we wanted smooth sweep,
        // but for mechanical "tick" with cubic-bezier, we stick to integer seconds usually.
        // However, user asked for "smooth motion" AND "cubic-bezier for mechanical feel".
        // A mechanical watch usually ticks 4-8 times a second or has a sweep.
        // Let's stick to the requested "cubic-bezier transition" which implies discrete steps that "bounce" or "sweep" to the next.
        // So we will just use the seconds integer. The CSS transition handles the animation between seconds.
        const secondsDegrees = ((seconds / 60) * 360);

        // Minutes: Standard rotation + slight offset based on seconds
        const minutesDegrees = ((minutes / 60) * 360) + ((seconds / 60) * 6);

        // Hours: Standard rotation + slight offset based on minutes
        const hoursDegrees = ((hours / 12) * 360) + ((minutes / 60) * 30);

        // Apply Transforms (adding 90deg offset is not needed if we designed hands to point up at 0deg in CSS, 
        // usually usage is top/bottom. In my CSS, hand is bottom: 50%, so it points UP. 0deg is UP. No offset needed.)
        this.secondHand.style.transform = `rotate(${secondsDegrees}deg)`;
        this.minuteHand.style.transform = `rotate(${minutesDegrees}deg)`;
        this.hourHand.style.transform = `rotate(${hoursDegrees}deg)`;

        // --- Digital Logic ---
        // Format with leading zeros
        const hDisplay = String(hours).padStart(2, '0');
        const mDisplay = String(minutes).padStart(2, '0');
        const sDisplay = String(seconds).padStart(2, '0');

        this.digitalDisplay.textContent = `${hDisplay}:${mDisplay}:${sDisplay}`;
    }

    setupThemes() {
        this.themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from buttons
                this.themeButtons.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                btn.classList.add('active');

                // Get theme name
                const theme = btn.getAttribute('data-theme');

                // Clear existing themes from body
                this.body.className = '';
                // Add new theme class
                this.body.classList.add(theme);
            });
        });
    }
}

// Instantiate
document.addEventListener('DOMContentLoaded', () => {
    const app = new ClockApp();
});
