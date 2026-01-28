<?php
/**
 * Display Class
 * Handles all terminal output and formatting
 */

class Display {
    
    private $lineLength = 60;
    
    /**
     * Show welcome screen
     */
    public function showWelcome() {
        $this->clearScreen();
        $this->printSeparator();
        echo "\n";
        echo "  " . $this->center("CLI QUEST: THE PHP CHRONICLES", 60) . "\n";
        echo "  " . $this->center("A Retro Text Adventure", 60) . "\n";
        echo "\n";
        $this->printSeparator();
        echo "\nWelcome, adventurer! You find yourself at the edge of a mysterious forest.\n";
        echo "The world awaits your exploration. Type 'help' for a list of commands.\n";
        echo "Type 'status' to check your stats, or 'quit' to exit the game.\n\n";
    }
    
    /**
     * Show current location
     */
    public function showLocation(GameState $gameState) {
        $location = $gameState->getCurrentLocation();
        
        // Location header
        $this->printSeparator();
        echo "\n";
        echo "  LOCATION: " . strtoupper($location['name']) . "\n";
        echo "\n";
        $this->printSeparator();
        
        // Description
        echo "\n" . $this->wordWrap($location['description'], 60) . "\n";
        
        // Exits
        if (!empty($location['exits'])) {
            echo "\n[Visible Exits]: " . implode(', ', array_map('ucfirst', array_keys($location['exits']))) . "\n";
        }
        
        // Items in location
        $items = $gameState->getLocationItems();
        if (!empty($items)) {
            echo "[Items here]: " . implode(', ', array_map('ucfirst', $items)) . "\n";
        }
        
        // Player status bar
        $health = $gameState->getHealth();
        $healthBar = $this->getHealthBar($health);
        echo "\n[HP: $healthBar $health/100]\n";
    }
    
    /**
     * Show game over message
     */
    public function showGameOver() {
        echo "\n";
        $this->printSeparator();
        echo "\n";
        echo "  " . $this->center("GAME OVER", 60) . "\n";
        echo "\n";
        echo "  " . $this->center("You have fallen in your quest.", 60) . "\n";
        echo "\n";
        $this->printSeparator();
        echo "\n";
    }
    
    /**
     * Show quit message
     */
    public function showQuitMessage() {
        echo "\n";
        echo "Thanks for playing CLI Quest: The PHP Chronicles!\n";
        echo "Your adventure ends here. Fare thee well, traveler.\n";
        echo "\n";
    }
    
    /**
     * Print separator line
     */
    private function printSeparator() {
        echo str_repeat("=", $this->lineLength) . "\n";
    }
    
    /**
     * Center text in a given width
     */
    private function center($text, $width) {
        $padding = intdiv($width - strlen($text), 2);
        return str_repeat(' ', $padding) . $text;
    }
    
    /**
     * Word wrap text to specified width
     */
    private function wordWrap($text, $width) {
        $lines = [];
        $text = trim($text);
        $words = preg_split('/\s+/', $text);
        
        $currentLine = '';
        foreach ($words as $word) {
            if (strlen($currentLine) + strlen($word) + 1 <= $width) {
                $currentLine .= (empty($currentLine) ? '' : ' ') . $word;
            } else {
                if (!empty($currentLine)) {
                    $lines[] = $currentLine;
                }
                $currentLine = $word;
            }
        }
        
        if (!empty($currentLine)) {
            $lines[] = $currentLine;
        }
        
        return implode("\n", $lines);
    }
    
    /**
     * Get visual health bar
     */
    private function getHealthBar($health) {
        $bars = intdiv($health, 10);
        $empty = 10 - $bars;
        
        $filled = str_repeat('█', $bars);
        $unfilled = str_repeat('░', $empty);
        
        return "[$filled$unfilled]";
    }
    
    /**
     * Clear screen (cross-platform)
     */
    private function clearScreen() {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            system('cls');
        } else {
            system('clear');
        }
    }
}
?>
