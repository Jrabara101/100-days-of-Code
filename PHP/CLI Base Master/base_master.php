<?php

/**
 * CLI Base Master
 * A PHP terminal application to convert numbers between Decimal, Binary, and Hexadecimal.
 */

// Mapping for user selection to base
const BASE_MAP = [
    1 => ['name' => 'Decimal', 'base' => 10],
    2 => ['name' => 'Binary', 'base' => 2],
    3 => ['name' => 'Hexadecimal', 'base' => 16],
];

function clearScreen() {
    // Basic ANSI clear screen
    echo "\033[2J\033[H";
}

function prompt($message) {
    echo $message;
    $input = fgets(STDIN);
    return trim($input);
}

function validateInput($number, $base) {
    if ($base === 2) {
        // Binary: only 0 and 1
        if (!preg_match('/^[01]+$/', $number)) {
            return "Error: '$number' is not a valid Binary value (0-1 only).";
        }
    } elseif ($base === 16) {
        // Hex: 0-9, A-F
        if (!preg_match('/^[0-9A-Fa-f]+$/', $number)) {
            return "Error: '$number' is not a valid Hexadecimal character (0-9, A-F).";
        }
    } elseif ($base === 10) {
        // Decimal: 0-9
        if (!preg_match('/^[0-9]+$/', $number)) {
            return "Error: '$number' is not a valid Decimal number.";
        }
    }
    return true;
}

echo "Welcome to Base Master!\n";

while (true) {
    echo "\n----------------------------------------\n";
    echo "SELECT SOURCE BASE:\n";
    echo "1: Decimal\n";
    echo "2: Binary\n";
    echo "3: Hexadecimal\n";
    echo "----------------------------------------\n";
    
    $sourceChoice = prompt("> Choose Source (1-3) or 'exit' to quit: ");
    
    if (strtolower($sourceChoice) === 'exit') {
        echo "Exiting Base Master. Goodbye!\n";
        break;
    }

    if (!isset(BASE_MAP[$sourceChoice])) {
        echo "Invalid selection. Please choose 1, 2, or 3.\n";
        continue;
    }

    $sourceBase = BASE_MAP[$sourceChoice];
    
    echo "\nSOURCE: " . $sourceBase['name'] . "\n";
    
    // Choose Target
    echo "\nSELECT TARGET BASE:\n";
    foreach (BASE_MAP as $key => $map) {
        // Optional: Exclude source if desired, but user might want same base
        echo "$key: {$map['name']}\n";
    }
    
    $targetChoice = prompt("> Choose Target (1-3): ");
    
    if (!isset(BASE_MAP[$targetChoice])) {
        echo "Invalid selection.\n";
        continue;
    }
    
    $targetBase = BASE_MAP[$targetChoice];

    // Get Number
    $inputNumber = prompt("> Enter {$sourceBase['name']} Number: ");
    
    // Validation
    $validation = validateInput($inputNumber, $sourceBase['base']);
    if ($validation !== true) {
        echo "\n$validation\n";
        continue;
    }

    // Conversion
    // Using base_convert for Level 2 Challenge
    $result = base_convert($inputNumber, $sourceBase['base'], $targetBase['base']);
    
    // Formatting: Hex Uppercase
    if ($targetBase['base'] === 16) {
        $result = strtoupper($result);
    }

    echo "\n>> Result in {$targetBase['name']}: $result\n";
    
    // Continue?
    $cont = prompt("\nContinue? (y/n): ");
    if (strtolower($cont) === 'n') {
        echo "Exiting Base Master. Goodbye!\n";
        break;
    }
}
