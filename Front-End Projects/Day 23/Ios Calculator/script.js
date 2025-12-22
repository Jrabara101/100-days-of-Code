class Calculator {
    constructor() {
        this.display = document.getElementById('result');
        this.equation = document.getElementById('equation');
        this.currentInput = '';
        this.operator = '';
        this.previousInput = '';
        this.shouldResetDisplay = false;
        this.isDemo = true;
        this.locked = false; // Lock if error occurs

        this.initializeEventListeners();
        this.initializeKeyboardSupport();
    }

    initializeEventListeners() {
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const value = e.target.dataset.value;

                if (this.locked && action !== 'clear') return;

                switch(action) {
                    case 'number':
                        this.handleNumber(value);
                        break;
                    case 'operator':
                        this.handleOperator(value);
                        break;
                    case 'equals':
                        this.handleEquals();
                        break;
                    case 'clear':
                        this.handleClear();
                        break;
                    case 'percent':
                        this.handlePercent();
                        break;
                    case 'plusminus':
                        this.handlePlusMinus();
                        break;
                }
            });
        });
    }

    initializeKeyboardSupport() {
        document.addEventListener('keydown', (e) => {
            if (this.locked && e.key !== 'Escape' && e.key !== 'Backspace') return;

            const keys = {
                '+': '+',
                '-': '-',
                '*': '×',
                '/': '÷',
                '%': '%',
                '.': '.',
                'Enter': '=',
                '=': '=',
                'Backspace': 'clear',
                'Escape': 'clear'
            };

            if (!isNaN(e.key)) {
                this.handleNumber(e.key);
            } else if (keys[e.key] === '=') {
                this.handleEquals();
            } else if (['+', '-', '*', '/'].includes(e.key)) {
                this.handleOperator(keys[e.key]);
            } else if (e.key === '.') {
                this.handleNumber('.');
            } else if (e.key === 'Backspace' || e.key === 'Escape') {
                this.handleClear();
            }
        });
    }

    handleNumber(num) {
        if (this.locked) return;

        // Reset demo calculation
        if (this.isDemo) {
            this.display.textContent = num;
            this.equation.textContent = '';
            this.currentInput = num;
            this.isDemo = false;
            return;
        }

        // Prevent multiple decimals
        if (num === '.' && this.currentInput.includes('.')) return;

        if (this.shouldResetDisplay) {
            this.currentInput = num === '.' ? '0.' : num;
            this.shouldResetDisplay = false;
        } else {
            this.currentInput = this.currentInput === '0' && num !== '.' 
                ? num 
                : this.currentInput + num;
        }

        this.display.textContent = this.currentInput;
    }

    handleOperator(op) {
        if (this.locked) return;

        if (this.isDemo) {
            this.isDemo = false;
            this.currentInput = this.display.textContent;
        }

        if (this.currentInput === '' && this.display.textContent !== '2033') {
            this.currentInput = this.display.textContent;
        }

        if (this.previousInput !== '' && this.currentInput !== '' && this.operator !== '') {
            this.calculate();
            this.previousInput = this.currentInput;
        } else {
            this.previousInput = this.currentInput;
        }

        this.operator = op;
        this.shouldResetDisplay = true;
        this.equation.textContent = `${this.previousInput} ${op}`;
    }

    handleEquals() {
        if (this.locked) return;

        if (this.previousInput !== '' && this.currentInput !== '' && this.operator !== '') {
            this.equation.textContent = `${this.previousInput} ${this.operator} ${this.currentInput}`;
            this.calculate();
            this.operator = '';
            this.previousInput = '';
            this.shouldResetDisplay = true;
        }
    }

    calculate() {
        const prev = parseFloat(this.previousInput);
        const curr = parseFloat(this.currentInput);
        let result;

        switch (this.operator) {
            case '+':
                result = prev + curr;
                break;
            case '-':
                result = prev - curr;
                break;
            case '×':
                result = prev * curr;
                break;
            case '÷':
                result = curr !== 0 ? prev / curr : 'Error';
                break;
            default:
                return;
        }

        this.display.textContent = result.toString();
        this.currentInput = result.toString();

        if (result === 'Error') {
            this.locked = true;
        }
    }

    handleClear() {
        this.display.textContent = '0';
        this.equation.textContent = '';
        this.currentInput = '';
        this.operator = '';
        this.previousInput = '';
        this.shouldResetDisplay = false;
        this.isDemo = false;
        this.locked = false;
    }

    handlePercent() {
        if (this.locked) return;

        const target = this.currentInput !== '' ? this.currentInput : this.display.textContent;

        if (target && !isNaN(target)) {
            const result = parseFloat(target) / 100;
            this.currentInput = result.toString();
            this.display.textContent = this.currentInput;
        }
    }

    handlePlusMinus() {
        if (this.locked) return;

        const target = this.currentInput !== '' ? this.currentInput : this.display.textContent;

        if (target && !isNaN(target)) {
            const result = parseFloat(target) * -1;
            this.currentInput = result.toString();
            this.display.textContent = this.currentInput;
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new Calculator();
});
