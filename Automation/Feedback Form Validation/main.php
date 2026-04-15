<?php

require_once __DIR__ . '/app/UIController.php';
require_once __DIR__ . '/app/Validator.php';
require_once __DIR__ . '/app/FeedbackManager.php';

class App {
    private $ui;
    private $manager;
    private $categories = [
        '1' => 'Bug Report',
        '2' => 'Feature Request',
        '3' => 'General Feedback',
        '4' => 'Complaint',
        '5' => 'Support'
    ];

    public function __construct() {
        $this->ui = new UIController();
        $this->manager = new FeedbackManager();
    }

    public function run() {
        $this->ui->displayWelcome();
        
        while (true) {
            $choice = $this->ui->showMenu();

            switch ($choice) {
                case '1':
                    $this->handleSubmission();
                    break;
                case '2':
                    $this->handleViewFeedback();
                    break;
                case '3':
                case 'exit':
                case 'quit':
                    echo "\nThank you for using the feedback app. Goodbye!\n";
                    exit(0);
                default:
                    $this->ui->printError("Invalid choice. Please select 1, 2, or 3.");
            }
        }
    }

    private function handleSubmission() {
        $this->ui->clearScreen();
        $this->ui->printHeader("SUBMIT FEEDBACK");
        echo "Please provide your feedback. Fields marked with '*' are required.\n\n";

        $data = [];

        // 1. Full name
        $data['full_name'] = $this->ui->promptAndValidate(
            "Full Name *: ", 
            ['Validator', 'validateName']
        );

        // 2. Email Address
        $data['email'] = $this->ui->promptAndValidate(
            "Email Address *: ", 
            ['Validator', 'validateEmail']
        );

        // 3. Optional Phone Number
        $data['phone'] = $this->ui->promptAndValidate(
            "Phone Number (Optional, press Enter to skip): ", 
            ['Validator', 'validatePhone'],
            true
        );

        // 4. Rating
        $data['rating'] = $this->ui->promptAndValidate(
            "Rating (1 to 5) *: ", 
            ['Validator', 'validateRating']
        );

        // 5. Category
        $this->ui->showCategories();
        $data['category'] = $this->ui->promptAndValidate(
            "Select a category (1-5) *: ", 
            ['Validator', 'validateCategory']
        );

        // 6. Message
        $data['message'] = $this->ui->promptAndValidate(
            "Feedback Message (min 10 chars) *: ", 
            ['Validator', 'validateMessage']
        );

        // Summarize and confirm
        $this->ui->clearScreen();
        $this->ui->printSummary($data, $this->categories);

        while (true) {
            $confirm = strtolower($this->ui->prompt("Do you want to save this feedback? (Y/N/Edit): "));
            if ($confirm === 'y' || $confirm === 'yes') {
                // save data
                if ($this->manager->saveFeedback($data)) {
                    $this->ui->printSuccess("Thank you! Your feedback has been saved.");
                } else {
                    $this->ui->printError("Failed to save feedback.");
                }
                break;
            } elseif ($confirm === 'n' || $confirm === 'no') {
                echo "Feedback discarded.\n";
                break;
            } elseif ($confirm === 'edit' || $confirm === 'e') {
                // allow editing logic or re-enter
                echo "Restarting feedback form...\n";
                // simple approach: restart the form
                sleep(1);
                $this->handleSubmission();
                return; // escape the current call stack
            } else {
                $this->ui->printError("Invalid input. Please enter Y, N, or Edit.");
            }
        }
        
        echo "Press Enter to return to the main menu...";
        fgets(STDIN);
        $this->ui->clearScreen();
    }

    private function handleViewFeedback() {
        $this->ui->clearScreen();
        $this->ui->printHeader("SAVED FEEDBACK");

        $feedbacks = $this->manager->getFeedback();

        if (empty($feedbacks)) {
            echo "No feedback found.\n";
        } else {
            foreach ($feedbacks as $fb) {
                echo UIController::COLOR_CYAN . "[ " . $fb['timestamp'] . " ] ID: " . $fb['id'] . UIController::COLOR_RESET . "\n";
                echo "Name   : " . $fb['full_name'] . " (" . $fb['email'] . ")\n";
                echo "Phone  : " . ($fb['phone'] ?? 'N/A') . "\n";
                echo "Rating : " . str_repeat('★', $fb['rating']) . str_repeat('☆', 5 - $fb['rating']) . " (" . $fb['rating'] . "/5)\n";
                
                // if we saved category ID, resolve it to text, else just display
                $catStr = isset($this->categories[$fb['category']]) ? $this->categories[$fb['category']] : $fb['category'];
                echo "Category: " . $catStr . "\n";
                
                $wrappedMessage = wordwrap($fb['message'], 60, "\n  ");
                echo "Message:\n  " . UIController::COLOR_YELLOW . $wrappedMessage . UIController::COLOR_RESET . "\n";
                echo str_repeat('-', 40) . "\n";
            }
            echo "\nTotal feedbacks: " . count($feedbacks) . "\n";
        }

        echo "\nPress Enter to return to the main menu...";
        fgets(STDIN);
        $this->ui->clearScreen();
    }
}

// Start Application
$app = new App();
$app->run();
