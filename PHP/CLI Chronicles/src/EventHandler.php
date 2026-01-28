<?php
/**
 * EventHandler Class
 * Manages special events, puzzles, and world interactions
 */

class EventHandler {
    
    private $npcs = [];
    
    public function __construct() {
        $config = require 'config/world.php';
        $this->npcs = $config['npcs'];
    }
    
    /**
     * Trigger events based on player actions and location
     */
    public function triggerEvents(GameState $gameState, $command) {
        $locationKey = $gameState->getCurrentLocationKey();
        $action = $command['action'];
        $target = $command['target'];
        
        // Check NPC interactions
        if (in_array($action, ['talk', 'speak', 'chat'])) {
            $this->handleNPCInteraction($gameState, $target);
        }
        
        // Check for special location events
        $this->checkLocationEvents($gameState, $locationKey);
        
        // Check for puzzle events
        $this->checkPuzzleEvents($gameState, $action, $target);
    }
    
    /**
     * Handle NPC conversations
     */
    private function handleNPCInteraction(GameState $gameState, $target) {
        $location = $gameState->getCurrentLocation();
        
        if (empty($location['npcs'])) {
            return;
        }
        
        // Find NPC
        foreach ($location['npcs'] as $npcKey) {
            if ($target && strpos(strtolower($npcKey), strtolower($target)) !== false) {
                $npc = $this->npcs[$npcKey] ?? null;
                if ($npc) {
                    echo "\n[NPC: " . $npc['name'] . "]\n";
                    echo $npc['dialogue'] . "\n";
                }
                return;
            }
        }
        
        // If no specific target, talk to first NPC
        if (!$target && !empty($location['npcs'])) {
            $npc = $this->npcs[$location['npcs'][0]] ?? null;
            if ($npc) {
                echo "\n[NPC: " . $npc['name'] . "]\n";
                echo $npc['dialogue'] . "\n";
            }
        }
    }
    
    /**
     * Check for location-specific events
     */
    private function checkLocationEvents(GameState $gameState, $locationKey) {
        $config = require 'config/world.php';
        $location = $config['world'][$locationKey];
        
        // Danger level detection
        if (isset($location['danger_level']) && $location['danger_level'] > 2) {
            // Random encounter chance
            if (rand(1, 10) > 7) {
                $this->triggerDangerEvent($gameState, $location);
            }
        }
    }
    
    /**
     * Handle danger zone encounters
     */
    private function triggerDangerEvent(GameState $gameState, $location) {
        $messages = [
            "You hear a low growl in the darkness...",
            "Something moves in the shadows nearby.",
            "You sense a presence watching you.",
            "The temperature drops suddenly.",
            "An eerie sound echoes through the area."
        ];
        
        $dangerLevel = $location['danger_level'];
        $damageChance = $dangerLevel * 5; // 10-50% chance
        
        echo "\n[!] " . $messages[array_rand($messages)] . "\n";
        
        if (rand(1, 100) < $damageChance) {
            $damage = rand(5, 15);
            $gameState->removeHealth($damage);
            echo "[!] You took $damage damage from an unseen threat!\n";
            echo "    Current Health: " . $gameState->getHealth() . "/100\n";
        }
    }
    
    /**
     * Check for puzzle solutions
     */
    private function checkPuzzleEvents(GameState $gameState, $action, $target) {
        $locationKey = $gameState->getCurrentLocationKey();
        
        // Chest puzzle in stream location
        if ($locationKey === 'forest_stream' && $action === 'examine' && 
            strpos($target, 'chest') !== false) {
            
            if ($gameState->hasItem('iron_key')) {
                echo "\n[+] You unlock the chest with the iron key!\n";
                echo "    Inside, you find a golden coin and an ancient map.\n";
            } else {
                echo "\n[!] The chest is locked. You need a key to open it.\n";
            }
        }
        
        // Temple crystal blessing
        if ($locationKey === 'abandoned_temple' && $action === 'examine' && 
            strpos($target, 'crystal') !== false) {
            
            echo "\n[*] The crystal glows with ancient energy...\n";
            echo "    You feel its power resonate within you.\n";
            
            if ($gameState->hasItem('crystal')) {
                $gameState->addXP(50);
                echo "    [+XP +50]\n";
            }
        }
    }
    
    /**
     * Get random event message
     */
    public function getRandomEvent() {
        $events = [
            "A gentle breeze passes through the area.",
            "Birds sing in the distance.",
            "You hear the sound of running water.",
            "Leaves rustle nearby.",
            "The air smells of ancient magic.",
            "Time seems to slow down momentarily."
        ];
        
        return $events[array_rand($events)];
    }
}
?>
