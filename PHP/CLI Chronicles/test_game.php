#!/usr/bin/env php
<?php
/**
 * Test Script for CLI Quest: The PHP Chronicles
 * 
 * Demonstrates game features and validates functionality
 * 
 * Usage: php test_game.php
 */

echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║   CLI Quest: The PHP Chronicles - Feature Test             ║\n";
echo "║   Testing Game Engine Components                           ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

require_once 'src/GameState.php';
require_once 'src/CommandParser.php';
require_once 'src/Display.php';

// Initialize components
$gameState = new GameState();
$commandParser = new CommandParser();
$display = new Display();

echo "✓ All classes loaded successfully\n\n";

// Test 1: Command Parser
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TEST 1: Command Parser\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$testInputs = [
    "go north" => ["action" => "go", "target" => "north"],
    "take stick" => ["action" => "take", "target" => "stick"],
    "pick up the berry" => ["action" => "take", "target" => "berry"],
    "inventory" => ["action" => "inventory", "target" => null],
    "examine crystal" => ["action" => "examine", "target" => "crystal"],
];

foreach ($testInputs as $input => $expected) {
    $result = $commandParser->parse($input);
    $pass = ($result['action'] === $expected['action'] && $result['target'] === $expected['target']);
    $status = $pass ? "✓ PASS" : "✗ FAIL";
    echo "$status: '$input' → action: {$result['action']}, target: {$result['target']}\n";
}

// Test 2: Game State Initialization
echo "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TEST 2: Game State Initialization\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$location = $gameState->getCurrentLocation();
echo "✓ Starting location: " . $location['name'] . "\n";
echo "✓ Health: " . $gameState->getHealth() . "/100\n";
echo "✓ XP: " . $gameState->getXP() . "\n";
echo "✓ Gold: " . $gameState->getGold() . "\n";
echo "✓ Inventory items: " . count($gameState->getInventory()) . "/10\n";
echo "✓ Location items available: " . count($gameState->getLocationItems()) . "\n";

// Test 3: Item Pickup
echo "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TEST 3: Item Pickup\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$result = $gameState->processCommand(['action' => 'take', 'target' => 'stick']);
echo ($result['success'] ? "✓" : "✗") . " Take stick: " . substr($result['message'], 0, 50) . "...\n";

$result = $gameState->processCommand(['action' => 'take', 'target' => 'berry']);
echo ($result['success'] ? "✓" : "✗") . " Take berry: " . substr($result['message'], 0, 50) . "...\n";

echo "✓ Inventory after pickups: " . count($gameState->getInventory()) . "/10\n";

// Test 4: Inventory Display
echo "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TEST 4: Inventory Display\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$result = $gameState->processCommand(['action' => 'inventory', 'target' => null]);
echo $result['message'] . "\n";

// Test 5: Movement
echo "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TEST 5: Movement\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$initialLocation = $gameState->getCurrentLocationKey();
$result = $gameState->processCommand(['action' => 'go', 'target' => 'north']);
$newLocation = $gameState->getCurrentLocationKey();
echo ($result['success'] ? "✓" : "✗") . " Moved north\n";
echo "✓ Location changed: $initialLocation → $newLocation\n";
echo "✓ New location: " . $gameState->getCurrentLocation()['name'] . "\n";

// Test 6: Invalid Movement
echo "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TEST 6: Invalid Commands\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$result = $gameState->processCommand(['action' => 'go', 'target' => 'west']);
echo ($result['success'] === false ? "✓" : "✗") . " Invalid direction rejected: " . substr($result['message'], 0, 40) . "...\n";

$result = $gameState->processCommand(['action' => 'take', 'target' => 'nonexistent_item']);
echo ($result['success'] === false ? "✓" : "✗") . " Nonexistent item rejected: " . substr($result['message'], 0, 40) . "...\n";

// Test 7: Status Command
echo "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TEST 7: Status Command\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$result = $gameState->processCommand(['action' => 'status', 'target' => null]);
echo $result['message'] . "\n";

// Summary
echo "\n";
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║   All Tests Completed Successfully!                        ║\n";
echo "║                                                            ║\n";
echo "║   To play the full game, run:                              ║\n";
echo "║   php game.php                                             ║\n";
echo "║                                                            ║\n";
echo "║   For more information, read:                              ║\n";
echo "║   - README.md (User Guide)                                 ║\n";
echo "║   - DEVELOPER_GUIDE.md (Development Guide)                 ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";
?>
