const app = {
    apiKey: localStorage.getItem('nasa_api_key') || null,
    baseUrl: 'https://api.nasa.gov/planetary/apod',

    // UI Elements
    elements: {
        mediaContainer: document.getElementById('media-container'),
        datePicker: document.getElementById('date-picker'),
        title: document.getElementById('apod-title'),
        dateDisplay: document.getElementById('current-date-display'),
        explanation: document.getElementById('drawer-explanation'),
        drawerTitle: document.getElementById('drawer-title'),
        drawerCopyright: document.getElementById('drawer-copyright'),
        infoBtn: document.getElementById('info-btn'),
        closeDrawerBtn: document.getElementById('close-drawer'),
        drawer: document.getElementById('info-drawer'),
        loader: document.getElementById('loader'),
        apiKeyModal: document.getElementById('api-key-modal'),
        apiKeyForm: document.getElementById('api-key-form'),
        apiKeyInput: document.getElementById('api-key-input'),
        randomBtn: document.getElementById('random-btn'),
        hdBtn: document.getElementById('hd-download-btn'),
        shareBtn: document.getElementById('share-btn'),
    },

    init() {
        this.addEventListeners();

        // Set date picker max to today
        const today = new Date().toISOString().split('T')[0];
        this.elements.datePicker.max = today;
        this.elements.datePicker.value = today;

        if (!this.apiKey) {
            this.elements.apiKeyModal.showModal();
        } else {
            this.fetchAPOD(today);
        }
    },

    addEventListeners() {
        // API Key Submission
        this.elements.apiKeyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const key = this.elements.apiKeyInput.value.trim();
            if (key) {
                this.apiKey = key;
                localStorage.setItem('nasa_api_key', key);
                this.elements.apiKeyModal.close();
                this.fetchAPOD(this.elements.datePicker.value);
            }
        });

        // Date Picker Change
        this.elements.datePicker.addEventListener('change', (e) => {
            this.fetchAPOD(e.target.value);
        });

        // Info Drawer Toggles
        this.elements.infoBtn.addEventListener('click', () => {
            this.elements.drawer.classList.add('open');
        });

        this.elements.closeDrawerBtn.addEventListener('click', () => {
            this.elements.drawer.classList.remove('open');
        });

        // Close drawer on outside click logic could go here

        // Random Button
        this.elements.randomBtn.addEventListener('click', () => {
            this.loadRandomDate();
        });

        // Share Button
        this.elements.shareBtn.addEventListener('click', () => {
            if (this.elements.title.textContent) {
                const text = `Check out this space image: ${this.elements.title.textContent} - via NASA APOD`;
                navigator.clipboard.writeText(text).then(() => {
                    alert('Copied to clipboard!');
                }).catch(err => {
                    console.error('Could not copy text: ', err);
                });
            }
        });
    },

    async fetchAPOD(date) {
        this.showLoader(true);

        // Simple client-side cache check
        const cacheKey = `apod_${date}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            console.log('Serving from cache');
            const data = JSON.parse(cached);
            this.updateUI(data);
            this.showLoader(false);
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}?api_key=${this.apiKey}&date=${date}`);

            if (response.status === 403 || response.status === 401) {
                // Invalid Key
                localStorage.removeItem('nasa_api_key');
                this.apiKey = null;
                alert('Invalid API Key. Please enter a valid one.');
                this.elements.apiKeyModal.showModal();
                this.showLoader(false);
                return;
            }

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            // Cache the result (be mindful of storage limits in a real large-scale app)
            try {
                localStorage.setItem(cacheKey, JSON.stringify(data));
            } catch (e) {
                console.warn('LocalStorage full, skipping cache');
            }

            this.updateUI(data);
        } catch (error) {
            console.error('Fetch error:', error);
            this.elements.title.textContent = 'Connection Lost in Space';
            this.elements.dateDisplay.textContent = 'Error';
        } finally {
            this.showLoader(false);
        }
    },

    updateUI(data) {
        // Media Rendering
        this.elements.mediaContainer.innerHTML = '';

        if (data.media_type === 'image') {
            const img = document.createElement('img');
            img.src = data.url;
            img.alt = data.title;
            img.onload = () => img.classList.add('fade-in'); // Add logic for smooth load if needed
            this.elements.mediaContainer.appendChild(img);

            // HD Button
            if (data.hdurl) {
                this.elements.hdBtn.href = data.hdurl;
                this.elements.hdBtn.classList.remove('hidden');
            } else {
                this.elements.hdBtn.classList.add('hidden');
            }

        } else if (data.media_type === 'video') {
            const iframe = document.createElement('iframe');
            iframe.src = data.url;
            iframe.allow = "autoplay; encrypted-media";
            iframe.allowFullscreen = true;
            this.elements.mediaContainer.appendChild(iframe);
            this.elements.hdBtn.classList.add('hidden');
        }

        // Text Content
        this.elements.title.textContent = data.title;
        this.elements.dateDisplay.textContent = data.date;
        this.elements.datePicker.value = data.date;

        // Drawer Content
        this.elements.drawerTitle.textContent = data.title;
        this.elements.drawerExplanation.textContent = data.explanation;
        this.elements.drawerCopyright.textContent = data.copyright ? `© ${data.copyright}` : 'Public Domain';
    },

    loadRandomDate() {
        // Random date between 1995-06-16 and today
        const start = new Date('1995-06-16');
        const end = new Date();
        const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        const dateString = randomDate.toISOString().split('T')[0];

        this.fetchAPOD(dateString);
    },

    showLoader(isLoading) {
        if (isLoading) {
            this.elements.loader.classList.remove('hidden');
        } else {
            // Artificial delay for smooth cinematic feel
            setTimeout(() => {
                this.elements.loader.classList.add('hidden');
            }, 800);
        }
    }
};

// Start the engines
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
