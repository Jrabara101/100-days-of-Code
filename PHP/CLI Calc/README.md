# PHP Calc-State CLI

A robust command-line calculator built with PHP. It supports state persistence (memory), basic arithmetic, and complex chained expressions with proper Order of Operations (PEMDAS/BODMAS).

## Features

- **Input State ($ANS$):** Automatically uses the previous result if the input starts with an operator (e.g., `+ 5`).
- **Chain Expressions:** Calculates complex expressions like `10 + 5 * 2 / 4` correctly.
- **Error Handling:** Prevents crashes on Division by Zero and invalid syntax.
- **Commands:**
    - `c` or `clear`: Reset variable memory to 0.
    - `exit`: Quit the application.

## How to Run

1. Open your terminal.
2. Navigate to the directory:
   ```bash
   cd "c:\Users\Admin\100-days-of-Code\PHP\CLI Calc"
   ```
3. Run the script:
   ```bash
   php calc.php
   ```

## Usage Examples

**Basic:**
```text
> 10 + 5
= 15
```

**State / Memory:**
```text
> 10 + 5
= 15
> / 3
= 5  (Calculates 15 / 3)
```

**Chain (PEMDAS):**
```text
> 10 + 5 * 2
= 20 (Calculates 5 * 2 first)
```
