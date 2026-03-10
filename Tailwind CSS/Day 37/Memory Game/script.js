/**
 * Senior Logic: Game State Manager (Code Match Fun! Edition)
 */
class MemoryMatrix {
    constructor() {
        this.board = document.getElementById('game-board');
        this.moveDisplay = document.getElementById('move-counter');
        this.scoreDisplay = document.getElementById('score-counter');
        this.timerDisplay = document.getElementById('timer');
        this.assetPreloader = document.getElementById('asset-preloader');

        this.techStack = [
            'js', 'ts', 'react', 'vue', 'laravel',
            'php', 'java', 'python', 'html', 'css',
            'go', 'rust', 'cpp', 'ruby', 'swift'
        ];

        this.colors = ['bg-card-green', 'bg-card-yellow', 'bg-card-blue', 'bg-card-red'];
        this.shapes = ['star', 'triangle', 'square', 'circle'];

        this.cards = [...this.techStack, ...this.techStack];
        this.hasFlippedCard = false;
        this.lockBoard = false;
        this.firstCard = null;
        this.secondCard = null;

        this.moves = 0;
        this.matches = 0;
        this.score = 0;
        this.startTime = null;
        this.timerInterval = null;

        this.init();
    }

    async init() {
        await this.preloadAssets();
        this.setupBoard();
        this.addEventListeners();
    }

    async preloadAssets() {
        const promises = this.techStack.map(tech => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = `assets/${tech}.png`;
                img.onload = resolve;
                img.onerror = resolve;
                this.assetPreloader.appendChild(img);
            });
        });
        await Promise.all(promises);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    setupBoard() {
        this.board.innerHTML = '';
        const shuffled = this.shuffle(this.cards);

        shuffled.forEach(tech => {
            const card = this.createCardElement(tech);
            this.board.appendChild(card);
        });
    }

    createCardElement(tech) {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.framework = tech;
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');

        const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        const randomShape = this.shapes[Math.floor(Math.random() * this.shapes.length)];

        card.innerHTML = `
            <div class="card-face card-back ${randomColor}" data-shape="${randomShape}"></div>
            <div class="card-face card-front">
                <img src="assets/${tech}.png" alt="${tech} logo">
            </div>
        `;
        return card;
    }

    addEventListeners() {
        this.board.addEventListener('click', (e) => {
            const card = e.target.closest('.memory-card');
            if (card) this.flipCard(card);
        });

        this.board.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const card = e.target.closest('.memory-card');
                if (card) this.flipCard(card);
            }
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            window.location.reload();
        });
    }

    startTimer() {
        if (this.timerInterval) return;
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    flipCard(cardElement) {
        if (this.lockBoard) return;
        if (cardElement === this.firstCard) return;
        if (cardElement.dataset.state === 'matched') return;

        this.startTimer();
        cardElement.classList.add('is-flipped');

        if (!this.hasFlippedCard) {
            this.hasFlippedCard = true;
            this.firstCard = cardElement;
            return;
        }

        this.secondCard = cardElement;
        this.moves++;
        this.moveDisplay.textContent = this.moves;
        this.checkForMatch();
    }

    checkForMatch() {
        const isMatch = this.firstCard.dataset.framework === this.secondCard.dataset.framework;
        isMatch ? this.handleMatch() : this.handleMismatch();
    }

    handleMatch() {
        this.score += 10;
        this.scoreDisplay.textContent = this.score;
        this.scoreDisplay.classList.add('animate-combo-hit');
        setTimeout(() => this.scoreDisplay.classList.remove('animate-combo-hit'), 400);

        this.firstCard.dataset.state = 'matched';
        this.secondCard.dataset.state = 'matched';

        this.matches++;
        this.resetBoard();

        if (this.matches === this.techStack.length) {
            this.stopTimer();
            this.triggerVictory();
        }
    }

    handleMismatch() {
        this.lockBoard = true;
        setTimeout(() => {
            this.firstCard.classList.remove('is-flipped');
            this.secondCard.classList.remove('is-flipped');
            this.resetBoard();
        }, 1000);
    }

    resetBoard() {
        [this.hasFlippedCard, this.lockBoard] = [false, false];
        [this.firstCard, this.secondCard] = [null, null];
    }

    triggerVictory() {
        const overlay = document.getElementById('victory-overlay');
        const stats = document.getElementById('final-stats');

        stats.innerHTML = `
            <span>TIME: ${this.timerDisplay.textContent}</span>
            <span>GUESSES: ${this.moves}</span>
            <span>POINTS: ${this.score}</span>
        `;

        setTimeout(() => {
            overlay.classList.add('victory-reveal');
        }, 500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MemoryMatrix();
});
