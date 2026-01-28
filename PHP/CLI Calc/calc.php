<?php

/**
 * PHP Calc-State CLI
 * 
 * A command-line calculator that maintains state and supports chained expressions.
 */

// Initialize memory state
$memory = 0;

echo "PHP Calc-State CLI\n";
echo "Type 'exit' to quit, 'c' or 'clear' to reset memory.\n";
echo "Supported operators: +, -, *, /\n\n";

while (true) {
    // Check if we have a non-zero memory to show in prompt context, 
    // though the standard prompt is fine.
    // echo "[$memory] > "; 
    echo "> ";

    $input = fgets(STDIN);

    // Handle end of file (Ctrl+D/Z)
    if ($input === false) {
        break;
    }

    $input = trim($input);

    // Empty input check
    if ($input === '') {
        continue;
    }

    // Commands
    if ($input === 'exit') {
        echo "Goodbye!\n";
        break;
    }

    if ($input === 'c' || $input === 'clear') {
        $memory = 0;
        echo "Memory cleared (0).\n";
        continue;
    }

    // Logic Building: Input Parsing
    // Check if the input starts with an operator (+, -, *, /)
    // If so, prepend the current memory value.
    if (preg_match('/^[\+\-\*\/]/', $input)) {
        $expression = $memory . ' ' . $input;
    } else {
        $expression = $input;
    }

    // Advanced Challenge: "The Chain"
    // We need to parse and evaluate the expression respecting PEMDAS/BODMAS.
    try {
        $result = evaluateExpression($expression);
        
        // Update memory
        $memory = $result;
        
        // Output result
        echo "= " . $memory . "\n";

    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

/**
 * Evaluates a mathematical expression string respecting order of operations.
 * Uses a simplified Shunting-Yard algorithm and RPN evaluator.
 *
 * @param string $expression
 * @return float|int
 * @throws Exception
 */
function evaluateExpression($expression) {
    // 1. Tokenize
    // Matches: numbers (integers or decimals), operators, parentheses
    // Note: This simple regex treats negative numbers as "operator" "number" unless closely handled.
    // For this challenge, we assume standard spacing or simple structure.
    preg_match_all('~(?:\d+(?:\.\d+)?)|[\+\-\*\/]|\(|\)~', $expression, $matches);
    $tokens = $matches[0];

    if (empty($tokens)) {
        throw new Exception("Invalid input");
    }

    // 2. Shunting-Yard Algorithm (Infix to Postfix/RPN)
    $outputQueue = [];
    $operatorStack = [];
    
    $precedence = [
        '+' => 1,
        '-' => 1,
        '*' => 2,
        '/' => 2,
    ];

    foreach ($tokens as $token) {
        if (is_numeric($token)) {
            $outputQueue[] = $token;
        } elseif (isset($precedence[$token])) {
            while (!empty($operatorStack)) {
                $top = end($operatorStack);
                if (isset($precedence[$top]) && $precedence[$top] >= $precedence[$token]) {
                    $outputQueue[] = array_pop($operatorStack);
                } else {
                    break;
                }
            }
            $operatorStack[] = $token;
        } elseif ($token === '(') {
            $operatorStack[] = $token;
        } elseif ($token === ')') {
            while (!empty($operatorStack) && end($operatorStack) !== '(') {
                $outputQueue[] = array_pop($operatorStack);
            }
            if (!empty($operatorStack) && end($operatorStack) === '(') {
                array_pop($operatorStack);
            } else {
                throw new Exception("Mismatched parentheses");
            }
        } else {
            throw new Exception("Unknown character: $token");
        }
    }

    while (!empty($operatorStack)) {
        $top = array_pop($operatorStack);
        if ($top === '(' || $top === ')') {
            throw new Exception("Mismatched parentheses");
        }
        $outputQueue[] = $top;
    }

    // 3. RPN Evaluator
    $evalStack = [];

    foreach ($outputQueue as $token) {
        if (is_numeric($token)) {
            $evalStack[] = (float)$token;
        } else {
            if (count($evalStack) < 2) {
                throw new Exception("Invalid expression structure");
            }
            $b = array_pop($evalStack);
            $a = array_pop($evalStack);

            switch ($token) {
                case '+':
                    $evalStack[] = $a + $b;
                    break;
                case '-':
                    $evalStack[] = $a - $b;
                    break;
                case '*':
                    $evalStack[] = $a * $b;
                    break;
                case '/':
                    if ($b == 0) {
                        throw new Exception("Division by zero");
                    }
                    $evalStack[] = $a / $b;
                    break;
            }
        }
    }

    if (count($evalStack) !== 1) {
        throw new Exception("Invalid expression calculation");
    }

    return $evalStack[0];
}
