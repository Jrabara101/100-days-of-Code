<?php
/**
 * GameState Class
 * Manages player state, location, inventory, and stats
 */

class GameState {
    private $currentLocation = 'forest_entrance';
    private $inventory = [];
    private $health = 100;
    private $xp = 0;
    private $gold = 0;
    private $worldMap = [];
    private $items = [];
    private $visitedLocations = [];
    
    public function __construct() {
        global $WORLD_MAP;
        require 'config/world.php';
        $config = require 'config/world.php';
        $this->worldMap = $config['world'];
        $this->items = $config['items'];
        $this->visitedLocations[$this->currentLocation] = true;
    }
    
    /**
     * Process player commands and update game state
     */
    public function processCommand($command) {
        $action = $command['action'];
        $target = $command['target'] ?? null;
        
        switch ($action) {
            case 'look':
                return $this->handleLook();
                
            case 'go':
                return $this->handleMove($target);
                
            case 'take':
            case 'get':
                return $this->handleTakeItem($target);
                
            case 'inventory':
            case 'inv':
                return $this->handleInventory();
                
            case 'examine':
            case 'inspect':
                return $this->handleExamine($target);
                
            case 'talk':
            case 'speak':
                return $this->handleTalk($target);
                
            case 'use':
                return $this->handleUse($target);
                
            case 'status':
                return $this->handleStatus();
                
            case 'help':
                return $this->handleHelp();
                
            default:
                return [
                    'success' => false,
                    'message' => "[!] Unknown action: $action"
                ];
        }
    }
    
    private function handleLook() {
        return [
            'success' => true,
            'message' => "You look around carefully at your surroundings."
        ];
    }
    
    private function handleMove($direction) {
        if (!$direction) {
            return [
                'success' => false,
                'message' => "[!] Go where? Please specify a direction (north, south, east, west, up, down)"
            ];
        }
        
        $location = $this->worldMap[$this->currentLocation];
        $direction = strtolower($direction);
        
        if (!isset($location['exits'][$direction])) {
            return [
                'success' => false,
                'message' => "[!] You cannot go $direction from here."
            ];
        }
        
        // Check for special conditions
        if (isset($location['special_condition'])) {
            if ($location['special_condition'] === 'torch_needed' && !$this->hasItem('torch')) {
                return [
                    'success' => false,
                    'message' => "[!] It is too dark to venture deeper. You need a source of light."
                ];
            }
        }
        
        $newLocationKey = $location['exits'][$direction];
        $this->currentLocation = $newLocationKey;
        $this->visitedLocations[$newLocationKey] = true;
        
        $newLocation = $this->worldMap[$newLocationKey];
        
        return [
            'success' => true,
            'message' => "You travel $direction...\n[You arrive at: " . $newLocation['name'] . "]"
        ];
    }
    
    private function handleTakeItem($itemName) {
        if (!$itemName) {
            return [
                'success' => false,
                'message' => "[!] Take what? Please specify an item."
            ];
        }
        
        $location = $this->worldMap[$this->currentLocation];
        $itemName = strtolower($itemName);
        
        // Find item in location
        $found = false;
        foreach ($location['items'] as $item) {
            if (strtolower($item) === $itemName) {
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            return [
                'success' => false,
                'message' => "[!] There is no '$itemName' here to take."
            ];
        }
        
        // Check capacity
        if (count($this->inventory) >= 10) {
            return [
                'success' => false,
                'message' => "[!] Your inventory is full! Drop something first."
            ];
        }
        
        // Add item to inventory
        $this->inventory[$itemName] = $itemName;
        
        // Remove from location
        $this->worldMap[$this->currentLocation]['items'] = array_filter(
            $location['items'],
            function($item) use ($itemName) {
                return strtolower($item) !== $itemName;
            }
        );
        
        $itemData = $this->items[$itemName] ?? [];
        $description = $itemData['description'] ?? 'An interesting item';
        
        return [
            'success' => true,
            'message' => "[+] You picked up: " . ucfirst($itemName) . "\n    ($description)"
        ];
    }
    
    private function handleInventory() {
        if (empty($this->inventory)) {
            return [
                'success' => true,
                'message' => "Your inventory is empty."
            ];
        }
        
        $items = "=== INVENTORY ===\n";
        foreach ($this->inventory as $item) {
            $itemData = $this->items[$item] ?? [];
            $name = $itemData['name'] ?? ucfirst($item);
            $items .= "  • $name\n";
        }
        
        $items .= "\n[Total: " . count($this->inventory) . "/10]";
        
        return [
            'success' => true,
            'message' => $items
        ];
    }
    
    private function handleExamine($target) {
        if (!$target) {
            return [
                'success' => false,
                'message' => "[!] Examine what?"
            ];
        }
        
        $target = strtolower($target);
        
        // Check inventory
        if (isset($this->inventory[$target])) {
            $itemData = $this->items[$target] ?? [];
            $description = $itemData['description'] ?? 'You examine the item carefully.';
            return [
                'success' => true,
                'message' => "[*] " . $description
            ];
        }
        
        // Check location items
        $location = $this->worldMap[$this->currentLocation];
        foreach ($location['items'] as $item) {
            if (strtolower($item) === $target) {
                $itemData = $this->items[$item] ?? [];
                $description = $itemData['description'] ?? 'You examine it.';
                return [
                    'success' => true,
                    'message' => "[*] " . $description
                ];
            }
        }
        
        return [
            'success' => false,
            'message' => "[!] You don't see that here."
        ];
    }
    
    private function handleTalk($target) {
        if (!$target) {
            return [
                'success' => false,
                'message' => "[!] Talk to whom?"
            ];
        }
        
        $location = $this->worldMap[$this->currentLocation];
        
        if (empty($location['npcs'])) {
            return [
                'success' => false,
                'message' => "[!] There is no one to talk to here."
            ];
        }
        
        return [
            'success' => true,
            'message' => "[*] No one responds to your words here. Try another location."
        ];
    }
    
    private function handleUse($target) {
        if (!$target) {
            return [
                'success' => false,
                'message' => "[!] Use what?"
            ];
        }
        
        $target = strtolower($target);
        
        if (!isset($this->inventory[$target])) {
            return [
                'success' => false,
                'message' => "[!] You don't have that item."
            ];
        }
        
        $itemData = $this->items[$target] ?? [];
        
        if (!($itemData['usable'] ?? false)) {
            return [
                'success' => false,
                'message' => "[!] You can't use that item right now."
            ];
        }
        
        // Apply effects
        if (isset($itemData['effect'])) {
            foreach ($itemData['effect'] as $stat => $value) {
                if ($stat === 'health') {
                    $this->health = min(100, $this->health + $value);
                } elseif ($stat === 'xp') {
                    $this->xp += $value;
                }
            }
        }
        
        unset($this->inventory[$target]);
        
        return [
            'success' => true,
            'message' => "[+] You used: " . ($itemData['name'] ?? ucfirst($target)) . "\n    You feel energized!"
        ];
    }
    
    private function handleStatus() {
        $status = "=== CHARACTER STATUS ===\n";
        $status .= "Health (HP): $this->health/100\n";
        $status .= "Experience (XP): $this->xp\n";
        $status .= "Gold: $this->gold\n";
        $status .= "Current Location: " . $this->worldMap[$this->currentLocation]['name'];
        
        return [
            'success' => true,
            'message' => $status
        ];
    }
    
    private function handleHelp() {
        $help = "=== COMMAND HELP ===\n";
        $help .= "look              - Examine your surroundings\n";
        $help .= "go [direction]    - Move in a direction (north, south, east, west, up, down)\n";
        $help .= "take [item]       - Pick up an item\n";
        $help .= "inventory         - Check your inventory\n";
        $help .= "examine [item]    - Get details about an item\n";
        $help .= "use [item]        - Use an item from your inventory\n";
        $help .= "talk [npc]        - Talk to an NPC\n";
        $help .= "status            - Check your stats\n";
        $help .= "quit/exit         - Exit the game\n";
        
        return [
            'success' => true,
            'message' => $help
        ];
    }
    
    // Getters
    public function getCurrentLocation() {
        return $this->worldMap[$this->currentLocation];
    }
    
    public function getCurrentLocationKey() {
        return $this->currentLocation;
    }
    
    public function getInventory() {
        return $this->inventory;
    }
    
    public function getHealth() {
        return $this->health;
    }
    
    public function getXP() {
        return $this->xp;
    }
    
    public function getGold() {
        return $this->gold;
    }
    
    public function hasItem($itemName) {
        return isset($this->inventory[strtolower($itemName)]);
    }
    
    public function getLocationItems() {
        return $this->worldMap[$this->currentLocation]['items'];
    }
    
    // Setters
    public function addHealth($amount) {
        $this->health = min(100, $this->health + $amount);
    }
    
    public function removeHealth($amount) {
        $this->health = max(0, $this->health - $amount);
    }
    
    public function addXP($amount) {
        $this->xp += $amount;
    }
    
    public function addGold($amount) {
        $this->gold += $amount;
    }
}
?>
