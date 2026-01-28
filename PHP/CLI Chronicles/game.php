<?php
/**
 * CLI Quest: The PHP Chronicles
 * A Retro-style Text Adventure Engine
 * 
 * Main game loop and initialization
 */

require_once 'config/world.php';
require_once 'src/GameState.php';
require_once 'src/CommandParser.php';
require_once 'src/Display.php';
require_once 'src/EventHandler.php';

// Initialize the game
$gameState = new GameState();
$commandParser = new CommandParser();
$display = new Display();
$eventHandler = new EventHandler();

// Display welcome screen
$display->showWelcome();

// Main game loop
while (true) {
    // Display current location
    $display->showLocation($gameState);
    
    // Get player input
    echo "\n> ";
    $input = trim(fgets(STDIN));
    
    // Check for quit command
    if (strtolower($input) === 'quit' || strtolower($input) === 'exit') {
        $display->showQuitMessage();
        break;
    }
    
    // Parse command
    $command = $commandParser->parse($input);
    
    // Handle invalid commands
    if (!$command) {
        echo "\n[!] I don't understand that command. Try: look, inventory, go [direction], take [item]\n";
        continue;
    }
    
    // Process command
    $result = $gameState->processCommand($command);
    
    // Handle events
    if ($result['success']) {
        $eventHandler->triggerEvents($gameState, $command);
    }
    
    // Display feedback
    echo "\n" . $result['message'] . "\n";
    
    // Check game over conditions
    if ($gameState->getHealth() <= 0) {
        $display->showGameOver();
        break;
    }
}

echo "\n[END OF SESSION]\n";
?>
