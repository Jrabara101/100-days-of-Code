<?php
declare(strict_types=1);

/**
 * Simple, professional CLI Calculator
 * - Supports +, -, *, /
 * - Validates menu and numeric input
 * - Prevents division by zero
 * - Repeats until user chooses to exit
 */

// Ensure this script is run from the command line.
if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be run in CLI mode.\n");
    exit(1);
}

/**
 * Addition operation.
 */
function add(float $a, float $b): float
{
    return $a + $b;
}

/**
 * Subtraction operation.
 */
function subtract(float $a, float $b): float
{
    return $a - $b;
}

/**
 * Multiplication operation.
 */
function multiply(float $a, float $b): float
{
    return $a * $b;
}

/**
 * Division operation.
 * Returns null when division by zero is attempted.
 */
function divide(float $a, float $b): ?float
{
    if ($b == 0.0) {
        return null;
    }

    return $a / $b;
}

/**
 * Read input from the terminal with a prompt.
 */
function readInput(string $prompt): string
{
    if (function_exists('readline')) {
        $input = readline($prompt);
    } else {
        echo $prompt;
        $input = fgets(STDIN);
    }

    return trim((string) $input);
}

/**
 * Keep asking until a valid menu option (1-5) is entered.
 */
function getMenuChoice(): int
{
    while (true) {
        $choice = readInput("Choose an option (1-5): ");

        if (in_array($choice, ['1', '2', '3', '4', '5'], true)) {
            return (int) $choice;
        }

        echo "Invalid choice. Please enter a number from 1 to 5.\n\n";
    }
}

/**
 * Keep asking until user enters a valid numeric value.
 */
function getNumber(string $label): float
{
    while (true) {
        $input = readInput("Enter {$label}: ");

        if (is_numeric($input)) {
            return (float) $input;
        }

        echo "Invalid number. Please enter a valid numeric value.\n";
    }
}

/**
 * Ask if the user wants another calculation.
 */
function askToContinue(): bool
{
    while (true) {
        $answer = strtolower(readInput("Do you want to perform another calculation? (y/n): "));

        if (in_array($answer, ['y', 'yes'], true)) {
            return true;
        }

        if (in_array($answer, ['n', 'no'], true)) {
            return false;
        }

        echo "Please answer with 'y' or 'n'.\n";
    }
}

/**
 * Format result to keep output clean (e.g., remove trailing zeros).
 */
function formatNumber(float $number): string
{
    // Print as integer if it has no decimal part.
    if (fmod($number, 1.0) == 0.0) {
        return (string) (int) $number;
    }

    // Show up to 10 decimals, then trim trailing zeros and dot.
    return rtrim(rtrim(number_format($number, 10, '.', ''), '0'), '.');
}

echo "============================\n";
echo "   PHP CLI Calculator App   \n";
echo "============================\n\n";

while (true) {
    echo "Menu:\n";
    echo "1. Addition\n";
    echo "2. Subtraction\n";
    echo "3. Multiplication\n";
    echo "4. Division\n";
    echo "5. Exit\n\n";

    $choice = getMenuChoice();

    if ($choice === 5) {
        echo "\nThanks for using the calculator. Goodbye!\n";
        break;
    }

    $firstNumber = getNumber('the first number');
    $secondNumber = getNumber('the second number');

    switch ($choice) {
        case 1:
            $result = add($firstNumber, $secondNumber);
            echo "\nResult: " . formatNumber($firstNumber) . " + " . formatNumber($secondNumber) . " = " . formatNumber($result) . "\n";
            break;

        case 2:
            $result = subtract($firstNumber, $secondNumber);
            echo "\nResult: " . formatNumber($firstNumber) . " - " . formatNumber($secondNumber) . " = " . formatNumber($result) . "\n";
            break;

        case 3:
            $result = multiply($firstNumber, $secondNumber);
            echo "\nResult: " . formatNumber($firstNumber) . " * " . formatNumber($secondNumber) . " = " . formatNumber($result) . "\n";
            break;

        case 4:
            $result = divide($firstNumber, $secondNumber);

            if ($result === null) {
                echo "\nError: Division by zero is not allowed.\n";
            } else {
                echo "\nResult: " . formatNumber($firstNumber) . " / " . formatNumber($secondNumber) . " = " . formatNumber($result) . "\n";
            }

            break;
    }

    echo "\n";

    if (!askToContinue()) {
        echo "\nThanks for using the calculator. Goodbye!\n";
        break;
    }

    echo "\n";
}
