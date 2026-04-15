<?php

class UIController {
    
    // ANSI color codes for terminal 
    const COLOR_RESET   = "\033[0m";
    const COLOR_RED     = "\033[31m";
    const COLOR_GREEN   = "\033[32m";
    const COLOR_YELLOW  = "\033[33m";
    const COLOR_BLUE    = "\033[34m";
    const COLOR_CYAN    = "\033[36m";

    public function displayWelcome() {
        $this->clearScreen();
        echo self::COLOR_CYAN;
        echo "=================================================\n";
        echo "   WELCOME TO THE FEEDBACK FORM TERMINAL APP   \n";
        echo "=================================================\n";
        echo self::COLOR_RESET;
        echo "Your feedback helps us improve our services.\n\n";
    }

    public function showMenu() {
        echo self::COLOR_YELLOW . "--- MAIN MENU ---\n" . self::COLOR_RESET;
        echo "1. Submit new feedback\n";
        echo "2. View saved feedback\n";
        echo "3. Exit\n";
        echo "-----------------\n";
        
        return $this->prompt("Please enter your choice (1-3): ");
    }

    public function prompt($message) {
        echo self::COLOR_BLUE . $message . self::COLOR_RESET;
        $input = fgets(STDIN);
        // Handle EOF or Ctrl+D cleanly
        if ($input === false) {
            return '';
        }
        return trim($input);
    }

    public function promptAndValidate($message, $validationCallback, $isOptional = false) {
        while (true) {
            $input = $this->prompt($message);
            $validationResult = call_user_func($validationCallback, $input);
            
            if ($validationResult === true) {
                return $input;
            } else {
                $this->printError($validationResult);
            }
        }
    }

    public function printSuccess($message) {
        echo self::COLOR_GREEN . "\n[SUCCESS] " . $message . self::COLOR_RESET . "\n\n";
    }

    public function printError($message) {
        echo self::COLOR_RED . "[ERROR] " . $message . self::COLOR_RESET . "\n";
    }
    
    public function printHeader($title) {
        echo "\n" . self::COLOR_CYAN . "=== $title ===" . self::COLOR_RESET . "\n";
    }

    public function clearScreen() {
        // Works on Windows (cls) and Unix (clear)
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            system('cls');
        } else {
            system('clear');
        }
    }

    public function printSummary($data, $categories) {
        $this->printHeader("REVIEW YOUR FEEDBACK");
        echo "-------------------------------------------------\n";
        printf("%-15s: %s\n", "Full Name", $data['full_name']);
        printf("%-15s: %s\n", "Email", $data['email']);
        printf("%-15s: %s\n", "Rating", $data['rating'] . "/5");
        printf("%-15s: %s\n", "Category", $categories[$data['category']]);
        printf("%-15s: %s\n", "Phone", empty($data['phone']) ? "N/A" : $data['phone']);
        echo "-------------------------------------------------\n";
        $wrappedMessage = wordwrap($data['message'], 40, "\n                 ");
        printf("%-15s: %s\n", "Message", $wrappedMessage);
        echo "-------------------------------------------------\n";
    }

    public function showCategories() {
        echo "\n" . self::COLOR_CYAN . "Feedback Categories:" . self::COLOR_RESET . "\n";
        echo "1. Bug Report\n";
        echo "2. Feature Request\n";
        echo "3. General Feedback\n";
        echo "4. Complaint\n";
        echo "5. Support\n";
    }
}
