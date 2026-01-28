# CLI Quest: The PHP Chronicles

A retro-style text adventure engine built with PHP, featuring dynamic world simulation, inventory management, and state-driven gameplay.

## 🎮 Quick Start

### Running the Game

```bash
php game.php
```

Or from any directory:

```bash
php /path/to/CLI\ Chronicles/game.php
```

### System Requirements

- PHP 7.0+
- Windows/Mac/Linux terminal or command prompt
- No additional PHP extensions required

## 📋 Features Implemented

### ✅ Level 1: Core Game Engine
- **Dynamic World System**: 7 interconnected locations with rich descriptions
- **Command Parser**: Recognizes natural language commands with flexible syntax
- **Inventory Management**: 10-item carrying capacity with detailed item info
- **Player Stats**: Health, Experience (XP), and Gold tracking
- **State Machine**: Game loop with robust state management
- **Atmospheric UI**: Formatted terminal output with visual health bar

### 🎯 Level 2: Advanced Features (Expandable)
- **Combat System Framework**: Danger level detection and random encounters
- **NPC System**: Non-player characters with dialogue
- **Puzzle Events**: Interactive challenges (locked chest, crystal blessing)
- **Item Effects**: Consumable items with stat buffs

### 💾 Level 3: Save/Load (Ready for Implementation)
- Foundation in place for persistence layer

## 🗺️ World Map

```
                 TEMPLE_TOWER
                      |
                      |
  MERCHANT_SHOP -- VILLAGE -- FOREST_ENTRANCE -- FOREST_STREAM
                      |              |
                      |          (stream)
                  RIVERSIDE_CAMP
                      |
                DANGEROUS_CAVE
```

### Locations

1. **Forest Entrance** (Starting Location)
   - Items: Stick, Berry
   - Exits: North (Temple), East (Stream), South (Village)

2. **Forest Stream**
   - Items: Iron Key
   - Puzzle: Locked chest requiring iron key
   - Exits: West (Forest Entrance)

3. **Abandoned Temple**
   - NPCs: Wise Guardian
   - Special Item: Glowing Crystal
   - Exits: South (Forest), Up (Tower)

4. **Temple Tower**
   - Items: Old Journal (grants XP when used)
   - Exits: Down (Temple)

5. **Peaceful Village**
   - NPCs: Merchant
   - Exits: North (Forest), East (Camp), West (Shop)

6. **Merchant's Shop**
   - NPCs: Merchant
   - Exits: East (Village)

7. **Riverside Camp**
   - Items: Leather Backpack, Torch
   - Danger Level: 2 (random encounters possible)
   - Exits: West (Village), North (Cave)

8. **The Forgotten Cave**
   - Danger Level: 5 (high encounter chance)
   - Requirement: Must have torch to enter
   - Exits: South (Camp)

## 🎮 Command Reference

### Navigation
```
go [direction]        - Move (north, south, east, west, up, down)
  Examples: go north, move south, walk east
```

### Items & Inventory
```
take [item]          - Pick up an item (aliases: get, grab, pick)
inventory            - View your inventory (aliases: inv, items, bag)
examine [item]       - Get details about an item (aliases: inspect, study)
use [item]           - Consume/use an item from inventory
look                 - Re-examine your surroundings
```

### Interaction
```
talk [npc]           - Converse with NPCs (aliases: speak, chat, ask)
status               - View character stats (aliases: stats, character, info)
help                 - Display this command list
```

### System
```
quit / exit          - Exit the game
```

## 🎲 Game Mechanics

### Health System
- Start with 100 HP
- Damaged by encounters in danger zones
- Reduced HP ends the game
- Items can restore health (Berry restores 10 HP)

### Experience & Progression
- Gain XP by:
  - Reading the Old Journal: +25 XP
  - Examining magical items
- XP persists during session (foundation for leveling)

### Inventory Management
- Carry capacity: 10 items
- Some items are consumable (used once)
- Items have descriptions and values
- Can't pick up items if inventory is full

### Item Effects

| Item | Type | Effect |
|------|------|--------|
| Berry | Consumable | +10 Health |
| Old Journal | Consumable | +25 XP |
| Torch | Tool | Required for cave entry |
| Iron Key | Tool | Opens locked chest |
| Glowing Crystal | Treasure | High value (100 gold) |
| Leather Backpack | Utility | Increases capacity |

## 🏗️ Architecture

### Class Structure

```
GameState
├─ Manages current location, inventory, stats
├─ Processes commands
└─ Updates world state

CommandParser
├─ Tokenizes user input
├─ Maps to canonical actions
└─ Extracts targets (items, directions)

Display
├─ Formats terminal output
├─ Shows location descriptions
└─ Renders status bars

EventHandler
├─ Triggers NPC interactions
├─ Random encounters
└─ Puzzle solutions
```

### Data Structures

**World Map** (Associative Array):
```php
'location_key' => [
    'name' => 'Display Name',
    'description' => 'Atmospheric description',
    'exits' => ['direction' => 'next_location_key', ...],
    'items' => ['item1', 'item2', ...],
    'npcs' => ['npc_key', ...],
    'danger_level' => 1-5
]
```

**Inventory** (Dictionary/Hash):
```php
['item_key1' => 'item_key1', 'item_key2' => 'item_key2', ...]
```

## 🎯 Puzzles & Events

### Active Puzzles

1. **Locked Chest (Forest Stream)**
   - Find the Iron Key in the stream
   - Examine the chest
   - Use the key to unlock
   - Reward: Golden Coin + Ancient Map

2. **Dark Cave (Dangerous Cave)**
   - Must have Torch in inventory
   - High danger encounters (5/10 danger level)
   - Can only enter if properly prepared

3. **Crystal Blessing (Temple)**
   - Examine the glowing crystal
   - Gain bonus XP if crystal in inventory

### Random Events

- **Danger Zone Encounters**: 30-50% chance to take damage in high-danger areas
- **Atmospheric Messages**: Area-specific ambiance (sounds, weather, sensations)

## 📈 How to Extend

### Level 2 - Combat System

The framework is ready. To implement:

1. Add `Combat.php` class:
```php
class Combat {
    public function startEncounter(GameState $state) { ... }
    public function rollAttack() { ... }
    public function applyDamage(GameState $state, $damage) { ... }
}
```

2. Expand `EventHandler.php` to trigger full combat encounters

3. Add enemy definitions to `world.php`:
```php
$ENEMIES = [
    'goblin' => ['hp' => 20, 'damage' => 5, 'xp_reward' => 25],
    'shadow_beast' => ['hp' => 50, 'damage' => 15, 'xp_reward' => 100],
];
```

### Level 3 - Save/Load System

Create `SaveManager.php`:

```php
class SaveManager {
    public function saveGame(GameState $state, $filename) {
        $save = [
            'location' => $state->getCurrentLocationKey(),
            'inventory' => $state->getInventory(),
            'health' => $state->getHealth(),
            'xp' => $state->getXP(),
            'timestamp' => date('Y-m-d H:i:s')
        ];
        file_put_contents($filename, json_encode($save, JSON_PRETTY_PRINT));
    }
    
    public function loadGame($filename) {
        // Restore state from JSON
    }
}
```

Then add commands:
```
save [name]    - Save your game
load [name]    - Load a saved game
```

## 🎨 Terminal Output Examples

### Starting Location
```
============================================================
   LOCATION: FOREST ENTRANCE
============================================================
You stand at the edge of a dense forest. Tall oak trees 
tower above you, their branches casting dark shadows on 
the overgrown path.

[Visible Exits]: North, East, South
[Items here]: Stick, Berry

[HP: [██████░░░░] 100/100]
```

### Successful Item Pickup
```
> take stick
[+] You picked up: Stick
    (A sturdy wooden stick)
```

### Failed Command
```
> go west
[!] You cannot go west from here.
```

### NPC Dialogue
```
> talk guardian
[NPC: The Wise Guardian]
A shimmering figure materializes before you. It speaks 
in ancient tones:

"Greetings, traveler. I have been waiting for someone 
brave enough to seek the forgotten knowledge..."
```

## 🔧 Technical Notes

### Command Parsing Algorithm

```
1. Tokenize input: "pick up the rusty key" → ["pick", "up", "the", "rusty", "key"]
2. Extract action: "pick" → "take" (via aliases)
3. Remove prepositions: ["the", "rusty", "key"] → ["rusty", "key"]
4. Join target: "rusty key"
5. Return: ['action' => 'take', 'target' => 'rusty key']
```

### State Management Flow

```
1. Display current location
2. Read user input
3. Parse command
4. Validate command (item exists? direction available?)
5. Update game state
6. Trigger events
7. Display result
8. Repeat
```

### File Structure
```
CLI Chronicles/
├── game.php                    # Main entry point
├── config/
│   └── world.php              # World data, NPCs, items
├── src/
│   ├── GameState.php          # Core game logic
│   ├── CommandParser.php      # Input processing
│   ├── Display.php            # Terminal UI
│   └── EventHandler.php       # Events & interactions
└── README.md                  # This file
```

## 🎮 Example Playthrough

```
> help
=== COMMAND HELP ===
go [direction]    - Move in a direction...
[... other commands ...]

> status
=== CHARACTER STATUS ===
Health (HP): 100/100
Experience (XP): 0
Gold: 0
Current Location: Forest Entrance

> go north
You travel north...
[You arrive at: Abandoned Temple]

> examine crystal
[*] The crystal glows with ancient energy...
    You feel its power resonate within you.

> take crystal
[+] You picked up: Glowing Crystal
    (An ancient magical crystal from the temple)

> go south
You travel south...
[You arrive at: Forest Entrance]

> go east
You travel east...
[You arrive at: Forest Stream]

> examine chest
[!] The chest is locked. You need a key to open it.

> take iron_key
[+] You picked up: Iron Key

> examine chest
[+] You unlock the chest with the iron key!
    Inside, you find a golden coin and an ancient map.

> quit
Thanks for playing CLI Quest: The PHP Chronicles!
```

## 🐛 Known Limitations & Future Work

- **No permanent save system** (Level 3 feature)
- **No combat implementation** (Level 2 feature) - framework in place
- **Single-session only** - all progress lost on exit
- **No multiplayer** - single player only
- **Limited to 8 locations** - easily expandable

## 📝 License

Educational project from the 100 Days of Code series.

---

**Happy adventuring!** May your quests be legendary and your inventory full of treasures! 🗡️✨
