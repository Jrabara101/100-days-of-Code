// Coin Flip Simulator - Advanced Version

class CoinFlipSimulator {
    constructor() {
        this.stats = {
            totalFlips: 0,
            heads: 0,
            tails: 0
        };
        this.history = [];
        this.isFlipping = false;
        this.maxHistory = 50;

        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
    }

    initializeElements() {
        this.coin = document.getElementById('coin');
        this.flipBtn = document.getElementById('flipBtn');
        this.flip10Btn = document.getElementById('flip10Btn');
        this.flip100Btn = document.getElementById('flip100Btn');
        this.resetBtn = document.getElementById('resetBtn');
        this.resultText = document.querySelector('.result-text');
        this.historyList = document.getElementById('historyList');
        
        // Stats elements
        this.totalFlipsEl = document.getElementById('totalFlips');
        this.headsCountEl = document.getElementById('headsCount');
        this.tailsCountEl = document.getElementById('tailsCount');
        this.headsPercentEl = document.getElementById('headsPercent');
        this.tailsPercentEl = document.getElementById('tailsPercent');
    }

    attachEventListeners() {
        this.flipBtn.addEventListener('click', () => this.flipCoin());
        this.flip10Btn.addEventListener('click', () => this.flipMultiple(10));
        this.flip100Btn.addEventListener('click', () => this.flipMultiple(100));
        this.resetBtn.addEventListener('click', () => this.resetStats());
    }

    flipCoin() {
        if (this.isFlipping) return;

        this.isFlipping = true;
        this.disableButtons();

        // Remove previous result classes
        this.coin.classList.remove('show-heads', 'show-tails', 'flipping-fast');
        this.coin.classList.add('flipping');

        // Generate random result
        const result = Math.random() < 0.5 ? 'heads' : 'tails';

        // After animation completes
        setTimeout(() => {
            this.coin.classList.remove('flipping');
            this.coin.classList.add(`show-${result}`);
            
            // Update stats
            this.stats.totalFlips++;
            if (result === 'heads') {
                this.stats.heads++;
            } else {
                this.stats.tails++;
            }

            // Add to history
            this.addToHistory(result);

            // Update display
            this.updateDisplay();
            this.showResult(result);

            this.isFlipping = false;
            this.enableButtons();
        }, 1000);
    }

    flipMultiple(count) {
        if (this.isFlipping) return;

        this.isFlipping = true;
        this.disableButtons();

        let completed = 0;
        const results = { heads: 0, tails: 0 };

        const flipSequence = () => {
            if (completed >= count) {
                // Final update
                this.stats.totalFlips += count;
                this.stats.heads += results.heads;
                this.stats.tails += results.tails;

                // Add all results to history
                for (let i = 0; i < count; i++) {
                    const result = Math.random() < 0.5 ? 'heads' : 'tails';
                    results[result]++;
                    this.addToHistory(result);
                }

                // Show final result
                const finalResult = results.heads > results.tails ? 'heads' : 'tails';
                this.coin.classList.remove('flipping-fast');
                this.coin.classList.add(`show-${finalResult}`);

                this.updateDisplay();
                this.showResult(`${results.heads} Heads, ${results.tails} Tails`);
                
                this.isFlipping = false;
                this.enableButtons();
                return;
            }

            // Quick flip animation
            this.coin.classList.remove('show-heads', 'show-tails');
            this.coin.classList.add('flipping-fast');

            const result = Math.random() < 0.5 ? 'heads' : 'tails';
            results[result]++;

            setTimeout(() => {
                this.coin.classList.remove('flipping-fast');
                this.coin.classList.add(`show-${result}`);
                completed++;

                // Continue with next flip
                setTimeout(flipSequence, 100);
            }, 300);
        };

        flipSequence();
    }

    addToHistory(result) {
        this.history.unshift(result);
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<p class="no-history">No flips yet</p>';
            return;
        }

        this.historyList.innerHTML = this.history
            .slice(0, this.maxHistory)
            .map(result => 
                `<div class="history-item ${result}">${result === 'heads' ? 'H' : 'T'}</div>`
            )
            .join('');
    }

    showResult(result) {
        this.resultText.textContent = result === 'heads' 
            ? 'Heads!' 
            : 'Tails!';
        this.resultText.className = 'result-text ' + result;
    }

    updateDisplay() {
        // Update stats
        this.totalFlipsEl.textContent = this.stats.totalFlips;
        this.headsCountEl.textContent = this.stats.heads;
        this.tailsCountEl.textContent = this.stats.tails;

        // Calculate percentages
        const total = this.stats.totalFlips;
        const headsPercent = total > 0 
            ? ((this.stats.heads / total) * 100).toFixed(1) 
            : 0;
        const tailsPercent = total > 0 
            ? ((this.stats.tails / total) * 100).toFixed(1) 
            : 0;

        this.headsPercentEl.textContent = headsPercent + '%';
        this.tailsPercentEl.textContent = tailsPercent + '%';
    }

    resetStats() {
        if (this.isFlipping) return;

        if (confirm('Are you sure you want to reset all statistics?')) {
            this.stats = {
                totalFlips: 0,
                heads: 0,
                tails: 0
            };
            this.history = [];
            this.coin.classList.remove('show-heads', 'show-tails', 'flipping', 'flipping-fast');
            this.resultText.textContent = 'Click "Flip Coin" to start!';
            this.resultText.className = 'result-text';
            this.updateDisplay();
            this.updateHistoryDisplay();
        }
    }

    disableButtons() {
        this.flipBtn.disabled = true;
        this.flip10Btn.disabled = true;
        this.flip100Btn.disabled = true;
    }

    enableButtons() {
        this.flipBtn.disabled = false;
        this.flip10Btn.disabled = false;
        this.flip100Btn.disabled = false;
    }
}

// Initialize the simulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CoinFlipSimulator();
});

