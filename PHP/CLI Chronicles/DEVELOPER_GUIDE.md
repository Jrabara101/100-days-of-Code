# CLI Quest: Developer's Guide

## 🔧 Architecture Overview

### Design Patterns Used

1. **State Machine Pattern**: Game state transitions through commands
2. **Command Pattern**: Commands encapsulate user actions
3. **Factory Pattern**: Items and enemies created from data definitions
4. **MVC-like Separation**: Display, Logic, Data are separated

### Class Dependencies

```
game.php (Entry Point)
  ├── GameState (Core Logic)
  ├── CommandParser (Input Processing)
  ├── Display (Output Formatting)
  ├── EventHandler (World Events)
  ├── Combat (L2 - Optional)
  └── SaveManager (L3 - Optional)
```

## 📦 Level 1: Core System (COMPLETE)

### Current Implementation
- ✅ 8 fully connected locations
- ✅ 9 unique items with effects
- ✅ 2 NPCs with dialogue
- ✅ Command parsing with aliases
- ✅ Inventory management (10 items)
- ✅ Player stats tracking
- ✅ Atmospheric UI with health bar
- ✅ Puzzle/event framework

### Key Classes

#### GameState.php
```php
// Main methods
processCommand($command)        // Route commands
handleMove($direction)          // Location transitions
handleTakeItem($itemName)       // Inventory management
handleInventory()               // Show inventory
handleStatus()                  // Show stats

// Utility methods
hasItem($itemName)              // Check inventory
getCurrentLocation()            // Get location data
getHealth(), getXP(), getGold() // Getters
```

#### CommandParser.php
```php
parse($input)                   // Main parsing method
normalizeDirection($direction)  // Direction aliases
getSuggestions($input)          // Command suggestions
```

#### Display.php
```php
showWelcome()                   // Welcome screen
showLocation(GameState)         // Current location display
showGameOver()                  // Game over screen
wordWrap($text, $width)         // Text formatting
getHealthBar($health)           // Visual health indicator
```

#### EventHandler.php
```php
triggerEvents(GameState, $cmd)  // Main event trigger
handleNPCInteraction()          // NPC dialogue
checkLocationEvents()           // Location-specific
triggerDangerEvent()            // Random encounters
checkPuzzleEvents()             // Puzzle detection
```

---

## 🎯 Level 2: Combat System (PROVIDED)

### File: Combat.php

### Features Implemented
- ✅ Random enemy encounters based on danger level
- ✅ Attack/Defend/Flee mechanics
- ✅ Health damage simulation
- ✅ XP and gold rewards
- ✅ 4 enemy types (Goblin, Wraith, Beast, Knight)
- ✅ Different enemy stats by difficulty

### How to Enable Combat

#### Step 1: Update game.php

Add to imports:
```php
require_once 'src/Combat.php';
```

Create combat instance in main loop:
```php
$combat = new Combat();
```

#### Step 2: Update GameState.php

Add to `processCommand()` method's switch statement:
```php
case 'attack':
    if ($combat->isInCombat()) {
        return ['success' => true, 'message' => $combat->playerAttack($this)['message']];
    }
    return ['success' => false, 'message' => '[!] You are not in combat.'];

case 'defend':
    if ($combat->isInCombat()) {
        return ['success' => true, 'message' => $combat->playerDefend($this)['message']];
    }
    return ['success' => false, 'message' => '[!] You are not in combat.'];

case 'flee':
    if ($combat->isInCombat()) {
        return ['success' => true, 'message' => $combat->playerFlee($this)['message']];
    }
    return ['success' => false, 'message' => '[!] You are not in combat.'];
```

#### Step 3: Update EventHandler.php

Modify `checkLocationEvents()`:
```php
private function checkLocationEvents(GameState $gameState, $locationKey) {
    $config = require 'config/world.php';
    $location = $config['world'][$locationKey];
    
    // Danger level detection
    if (isset($location['danger_level']) && $location['danger_level'] > 1) {
        global $combat;  // Access combat instance
        if ($combat && !$combat->isInCombat()) {
            $combat->startEncounter($gameState, $location['danger_level']);
        }
    }
}
```

#### Step 4: Update help text in GameState.php

Add to `handleHelp()`:
```php
$help .= "attack            - Attack enemy in combat\n";
$help .= "defend            - Defend in combat\n";
$help .= "flee              - Attempt to escape combat\n";
```

### Combat Flow

```
1. Player enters danger zone
2. EventHandler checks for encounter
3. Combat.startEncounter() triggered
4. Display enemy and prompt for action
5. Combat loop:
   - Player chooses: attack/defend/flee
   - Action processed
   - Enemy counter-attacks
   - Check win/lose condition
6. Return to game loop if victorious
```

### Adding New Enemies

In Combat.php, add to `$enemies` array:

```php
'boss_name' => [
    'name' => 'Boss Title',
    'hp' => 100,
    'max_hp' => 100,
    'damage' => [20, 40],
    'xp_reward' => 500,
    'gold_reward' => 200,
    'description' => 'Atmospheric description of the boss.'
]
```

Then assign to danger levels in `getEnemiesForDanger()`:

```php
private function getEnemiesForDanger($level) {
    $difficulties = [
        1 => ['forest_goblin'],
        2 => ['forest_goblin', 'shadow_wraith'],
        3 => ['shadow_wraith', 'cave_beast'],
        4 => ['cave_beast', 'corrupted_knight', 'boss_name'],
        5 => ['boss_name', 'corrupted_knight']
    ];
    return $difficulties[$level] ?? ['forest_goblin'];
}
```

---

## 💾 Level 3: Save/Load System (PROVIDED)

### File: SaveManager.php

### Features Implemented
- ✅ Save game state to JSON files
- ✅ Load previous game states
- ✅ List all saved games
- ✅ Delete save files
- ✅ File validation and corruption checking
- ✅ Directory structure management

### How to Enable Save/Load

#### Step 1: Update game.php

Add import:
```php
require_once 'src/SaveManager.php';

$saveManager = new SaveManager();
```

#### Step 2: Update GameState.php

Add save/load command handlers:
```php
case 'save':
    if (!$target) {
        return ['success' => false, 'message' => '[!] Usage: save [name]'];
    }
    return $saveManager->saveGame($this, $target);

case 'load':
    if (!$target) {
        $saves = $saveManager->listSaves();
        if (empty($saves)) {
            return ['success' => true, 'message' => '[*] No saved games found.'];
        }
        // Display list of saves
        $list = "=== SAVED GAMES ===\n";
        foreach ($saves as $save) {
            $list .= $save['name'] . " - " . $save['timestamp'] . "\n";
            $list .= "  Location: " . $save['location'] . ", HP: " . $save['health'] . "\n";
        }
        return ['success' => true, 'message' => $list];
    }
    $result = $saveManager->loadGame($target);
    if ($result['success']) {
        $this->restoreFromSave($result['data']);
    }
    return ['success' => $result['success'], 'message' => $result['message']];
```

#### Step 3: Add restore method to GameState.php

```php
public function restoreFromSave($saveData) {
    $this->currentLocation = $saveData['currentLocation'];
    $this->inventory = $saveData['inventory'];
    $this->health = $saveData['health'];
    $this->xp = $saveData['xp'];
    $this->gold = $saveData['gold'];
}
```

#### Step 4: Update help text

```php
$help .= "save [name]       - Save your game\n";
$help .= "load [name]       - Load a saved game\n";
```

### Save File Structure

```json
{
    "version": "1.0",
    "timestamp": "2026-01-28 14:30:45",
    "playTime": "0:00",
    "currentLocation": "forest_entrance",
    "inventory": {
        "stick": "stick",
        "berry": "berry"
    },
    "health": 85,
    "xp": 50,
    "gold": 25
}
```

---

## 🎮 Adding New Locations

### Step 1: Create location in world.php

```php
'new_location_key' => [
    'name' => 'Display Name',
    'description' => 'Detailed atmospheric description that wraps nicely.',
    'exits' => [
        'north' => 'connected_location_key',
        'south' => 'another_location_key'
    ],
    'items' => ['item1', 'item2'],
    'npcs' => ['npc_key'],
    'danger_level' => 1,  // 1-5, optional
    'special_condition' => null  // optional
]
```

### Step 2: Add reverse connections

Update connected locations' exits:
```php
'connected_location_key' => [
    // ... existing data ...
    'exits' => [
        // ... existing exits ...
        'south' => 'new_location_key'  // Add reverse connection
    ]
]
```

### Example: Adding a Haunted Library

```php
'haunted_library' => [
    'name' => 'Haunted Library',
    'description' => 'Towering bookshelves stretch into shadow. 
Dust motes dance in faint moonlight. Ancient volumes 
line the shelves, their leather spines cracked with age. 
You hear whispers echoing through the stacks.',
    'exits' => [
        'south' => 'abandoned_temple'
    ],
    'items' => ['spell_book', 'forgotten_letter'],
    'npcs' => ['library_ghost'],
    'danger_level' => 3,
    'special_items' => [
        'spell_book' => [
            'takeable' => true,
            'description' => 'A spell book containing ancient incantations',
            'magical' => true
        ]
    ]
]
```

---

## 👥 Adding NPCs

### Step 1: Define NPC in world.php

```php
$NPCS = [
    'library_ghost' => [
        'name' => 'The Library Ghost',
        'dialogue' => 'A translucent figure materializes among the books:
        
"Welcome, seeker of knowledge. I have guarded these 
tomes for centuries. Perhaps you seek wisdom?"',
        'hint' => 'The ghost whispers: "The spell book holds secrets..."'
    ]
]
```

### Step 2: Add NPC reference to location

```php
'haunted_library' => [
    // ...
    'npcs' => ['library_ghost']
]
```

### Step 3: NPC interactions are automatically handled by EventHandler

---

## 🎁 Adding New Items

### Step 1: Define item in world.php

```php
'spell_book' => [
    'name' => 'Ancient Spell Book',
    'description' => 'A leather-bound tome filled with cryptic spells',
    'value' => 75,
    'usable' => true,
    'effect' => ['xp' => 50],
    'magical' => true
]
```

### Step 2: Add item to location or inventory

Add to location items array:
```php
'items' => ['spell_book', 'torch']
```

Or start with it in inventory (modify GameState constructor):
```php
$this->inventory['spell_book'] = 'spell_book';
```

### Item Properties

- **name**: Display name
- **description**: What player sees when examining
- **value**: Worth in gold (for trading, future feature)
- **usable**: Can player use/consume it?
- **effect**: Stats modified when used
  - `health`: HP restored
  - `xp`: Experience gained
  - `capacity`: Carrying capacity increase
- **magical**: True if magical property (for special events)

---

## 🧩 Puzzle System

### Creating Interactive Puzzles

#### Framework Already Exists in EventHandler.checkPuzzleEvents()

```php
private function checkPuzzleEvents(GameState $gameState, $action, $target) {
    // Example puzzle structure
    if ($locationKey === 'location_key' && $action === 'examine' && 
        strpos($target, 'object') !== false) {
        
        if ($gameState->hasItem('required_item')) {
            echo "\n[+] Puzzle solved!\n";
            // Add rewards
            $gameState->addXP(50);
        } else {
            echo "\n[!] You need something to solve this.\n";
        }
    }
}
```

### Example: Create a Locked Door Puzzle

Add to EventHandler.checkPuzzleEvents():

```php
// Locked door in forest
if ($locationKey === 'forest_entrance' && $action === 'examine' && 
    strpos($target, 'door') !== false) {
    
    if ($gameState->hasItem('forest_key')) {
        echo "\n[+] You unlock the mysterious door!\n";
        echo "    A hidden chamber is revealed...\n";
        $gameState->addXP(25);
    } else {
        echo "\n[!] The door is locked. You need a key.\n";
    }
}
```

---

## 🔄 Extending the Game Loop

### Current Loop Structure (game.php)

```
1. Display location
2. Get user input
3. Parse command
4. Process command (update state)
5. Trigger events
6. Display feedback
7. Check end conditions
8. Repeat
```

### Adding Pre/Post-Move Hooks

Modify game.php:

```php
// Before command processing
if ($command['action'] === 'go') {
    // Check for blocked paths
    // Check time-based events
    // Check NPC interactions
}

// After command processing
if ($command['action'] === 'go' && $result['success']) {
    // Log location visit
    // Trigger entrance events
    // Check for new NPCs
}
```

---

## 🎓 Testing Your Changes

### Unit Testing Framework (Future Enhancement)

Create `tests/GameStateTest.php`:

```php
<?php
require_once 'src/GameState.php';

class GameStateTest {
    private $gameState;
    
    public function setUp() {
        $this->gameState = new GameState();
    }
    
    public function testMovement() {
        $result = $this->gameState->processCommand([
            'action' => 'go',
            'target' => 'north'
        ]);
        
        assert($result['success'] === true);
        assert($this->gameState->getCurrentLocationKey() === 'abandoned_temple');
    }
    
    public function testInventory() {
        $this->gameState->processCommand([
            'action' => 'take',
            'target' => 'stick'
        ]);
        
        assert($this->gameState->hasItem('stick'));
    }
}
?>
```

Run with:
```bash
php tests/GameStateTest.php
```

---

## 📊 Performance Considerations

### Current Limitations
- Single-player, single-session only
- No persistent database (Level 3 uses JSON files)
- Max 10 inventory items (arbitrary limit)
- 8 locations (easily scalable)

### Optimization Tips

1. **Lazy Loading Locations**
```php
// Load location data only when needed
private function getLocation($key) {
    if (!isset($this->locationCache[$key])) {
        $this->locationCache[$key] = $this->worldMap[$key];
    }
    return $this->locationCache[$key];
}
```

2. **Cache Command Aliases**
```php
// Pre-compile alias lookups
private $aliasMap = [];

public function __construct() {
    foreach ($this->aliases as $action => $words) {
        foreach ($words as $word) {
            $this->aliasMap[$word] = $action;
        }
    }
}
```

3. **Batch IO Operations**
```php
// Save multiple things at once
$saveData = $this->collectGameState();
$saveManager->saveGame($saveData, $fileName);
```

---

## 🚀 Future Features (Ideas)

### Level 4: Advanced Features

1. **Multiplayer/Shared World**
   - Use SQLite for shared state
   - Player collision detection
   - Trading system

2. **Crafting System**
   - Combine items: stick + berries = food
   - Recipes database
   - Skill progression

3. **Quest System**
   - NPC quests with objectives
   - Quest tracking
   - Reward tiers

4. **Dynamic World**
   - Time-based events
   - Day/night cycle
   - Weather system
   - NPC schedules

5. **Advanced Combat**
   - Character classes (Warrior, Mage, Rogue)
   - Skill trees
   - Equipment/armor system
   - Spell casting

6. **Leaderboards**
   - High scores database
   - Speed run records
   - Completion statistics

---

## 🐛 Debugging Tips

### Enable Debug Mode

Add to game.php:

```php
define('DEBUG', true);

if (DEBUG) {
    echo "[DEBUG] Command parsed: " . json_encode($command) . "\n";
    echo "[DEBUG] Current location: " . $gameState->getCurrentLocationKey() . "\n";
    echo "[DEBUG] Inventory count: " . count($gameState->getInventory()) . "\n";
}
```

### Common Issues

**Problem**: Commands not recognized
- **Solution**: Check CommandParser aliases, ensure input is lowercase

**Problem**: Items disappear
- **Solution**: Check world.php location items array hasn't been corrupted

**Problem**: NPCs not appearing
- **Solution**: Verify NPC key exists and location 'npcs' array references it

**Problem**: Infinite loop
- **Solution**: Check while(true) loop has proper break conditions

---

## 📚 Code Style Guide

### PHP Code Standards Used

- **PSR-2 Style**: 4-space indentation
- **Naming**: CamelCase for classes, camelCase for methods
- **Comments**: PHPDoc for public methods
- **Error Handling**: Explicit success/error responses

### Example Implementation

```php
/**
 * Description of what the method does
 * 
 * @param Type $parameter Description
 * @return array Status and message array
 */
public function exampleMethod($parameter) {
    // Implementation
    return [
        'success' => true,
        'message' => 'Success message'
    ];
}
```

---

## 🤝 Contributing Tips

When extending the system:

1. **Maintain separation of concerns**: Keep Display, Logic, and Data separate
2. **Use consistent return format**: Always return ['success' => bool, 'message' => string]
3. **Add documentation**: Comment complex logic and data structures
4. **Test edge cases**: Empty inventory, invalid input, game boundaries
5. **Keep world.php clean**: All world data should be here, not scattered in code

---

**Happy coding! May your adventures be legendary!** 🗡️✨
