# 📦 CLI Quest: The PHP Chronicles - Project Structure

## Complete File Manifest

### 🎮 Core Game Files

#### `game.php` (MAIN ENTRY POINT)
- **Purpose**: Main game loop and initialization
- **Size**: ~100 lines
- **Key Features**:
  - Game loop (while true)
  - Input parsing and command processing
  - Event triggering
  - Game over conditions
- **How to Run**: `php game.php`

### 🔧 Source Code (src/)

#### `src/GameState.php` (900+ lines)
- **Purpose**: Core game logic and state management
- **Key Responsibilities**:
  - Track current location
  - Manage inventory (10 item limit)
  - Handle player stats (Health, XP, Gold)
  - Process all game commands
  - Validate actions (can you move there? do you have that item?)
- **Main Methods**:
  - `processCommand()` - Route commands to handlers
  - `handleMove()` - Movement between locations
  - `handleTakeItem()` - Pick up items
  - `handleInventory()` - Show inventory
  - `handleStatus()` - Display stats
  - `getters/setters` - Access game state

#### `src/CommandParser.php` (200+ lines)
- **Purpose**: Parse natural language input into game commands
- **Key Features**:
  - Tokenizes user input
  - Maps words to canonical actions
  - Handles command aliases (go/move/walk/travel all work)
  - Extracts targets (items, directions)
  - Normalizes directions (n = north, etc.)
- **Main Methods**:
  - `parse()` - Convert raw input to [action, target]
  - `normalizeDirection()` - Handle direction synonyms
  - `getSuggestions()` - Command hints

#### `src/Display.php` (250+ lines)
- **Purpose**: Handle all terminal output formatting
- **Key Features**:
  - Atmospheric text formatting
  - Location descriptions with word-wrapping
  - Visual health bar (█░ representation)
  - Status screens
  - Welcome and game over screens
- **Main Methods**:
  - `showWelcome()` - Title screen
  - `showLocation()` - Display current area
  - `showGameOver()` - End screen
  - `wordWrap()` - Text formatting
  - `getHealthBar()` - Visual HP display

#### `src/EventHandler.php` (300+ lines)
- **Purpose**: Trigger world events, NPC interactions, puzzles
- **Key Features**:
  - NPC dialogue system
  - Puzzle detection and solving
  - Random encounter triggers
  - Danger zone mechanics
  - Event messaging
- **Main Methods**:
  - `triggerEvents()` - Main event dispatcher
  - `handleNPCInteraction()` - NPC conversations
  - `checkLocationEvents()` - Location-specific events
  - `checkPuzzleEvents()` - Puzzle solutions
  - `triggerDangerEvent()` - Random encounters

### 📚 Optional Level 2 & 3 Files

#### `src/Combat.php` (400+ lines)
- **Status**: Level 2 Feature (Optional, Provided)
- **Purpose**: Implement combat system
- **Features**:
  - 4 enemy types (Goblin, Wraith, Beast, Knight)
  - Attack/Defend/Flee mechanics
  - Health damage system
  - XP and gold rewards
  - Difficulty-based encounters
- **Installation**: See DEVELOPER_GUIDE.md

#### `src/SaveManager.php` (350+ lines)
- **Status**: Level 3 Feature (Optional, Provided)
- **Purpose**: Game state persistence
- **Features**:
  - Save game to JSON file
  - Load previous games
  - List saved games
  - Delete saves
  - Backup/export saves
- **Installation**: See DEVELOPER_GUIDE.md

### ⚙️ Configuration

#### `config/world.php` (500+ lines)
- **Purpose**: All world data, separate from code
- **Contains**:
  - World map (8 locations)
  - Location definitions (exits, items, NPCs, descriptions)
  - NPC definitions (dialogue, hints)
  - Item definitions (9 items with stats and effects)
  - Game constants
- **Easy to Modify**: Add locations, NPCs, items here without touching code

### 📖 Documentation

#### `README.md` (700+ lines) - Complete User Manual
- Project overview
- Feature list (Level 1, 2, 3)
- World map and location descriptions
- Full command reference
- Game mechanics explanation
- Item effects and inventory system
- Architecture overview
- Extension instructions for Levels 2 & 3
- Technical notes and file structure

#### `QUICKSTART.md` (250+ lines) - Quick Start Guide
- 30-second quick start
- Basic commands
- Simple walkthrough example
- Quick location map
- Pro tips and tricks
- Hidden items guide
- Game mechanics summary
- Available command aliases
- FAQ section

#### `DEVELOPER_GUIDE.md` (700+ lines) - Developer Documentation
- Architecture overview
- Class dependencies and design patterns
- How to enable Combat System (Level 2)
- How to enable Save/Load System (Level 3)
- Adding new locations step-by-step
- Adding NPCs and dialogue
- Adding items with effects
- Creating interactive puzzles
- Game loop extension points
- Performance optimization tips
- Future feature ideas (Level 4+)
- Debugging tips and code style guide

### 🧪 Testing

#### `test_game.php` (150+ lines)
- **Purpose**: Automated feature testing
- **Tests**:
  1. Command Parser (5 different inputs)
  2. Game State Initialization
  3. Item Pickup (2 items)
  4. Inventory Display
  5. Movement Between Locations
  6. Invalid Command Handling (2 cases)
  7. Status Display
- **How to Run**: `php test_game.php`
- **Result**: All features validated

## 📊 Project Statistics

```
Total Files:        10
Total Lines:        4,500+
Core Code:          1,500+ lines
Documentation:      1,800+ lines
Tests:              150+ lines
World Data:         500+ lines

Game Locations:     8
Items:              9
NPCs:               2
Commands:           11
Command Aliases:    30+
```

## 🎯 Feature Breakdown

### Level 1: COMPLETE ✅
- [x] 8 interconnected locations
- [x] 9 items with effects
- [x] Inventory management (10 item limit)
- [x] Player stats (HP, XP, Gold)
- [x] Natural language command parser
- [x] NPC dialogue system
- [x] Puzzle framework
- [x] Atmospheric UI
- [x] Comprehensive game loop
- [x] Error handling

### Level 2: PROVIDED (Optional) 🔧
- [x] Combat system framework
- [x] 4 enemy types with stats
- [x] Attack/Defend/Flee mechanics
- [x] Random encounter system
- [x] XP and gold rewards
- [ ] Integration with game loop (requires enabling)

### Level 3: PROVIDED (Optional) 💾
- [x] Save game to JSON
- [x] Load previous games
- [x] List all saved games
- [x] Delete saves
- [x] File validation
- [ ] Integration with game loop (requires enabling)

## 🔐 Code Organization Principles

1. **Separation of Concerns**
   - Data (world.php) separate from logic
   - Display (Display.php) separate from game state
   - Input (CommandParser.php) separate from processing

2. **Object-Oriented Design**
   - One class per responsibility
   - Clear method names and purposes
   - Consistent return format ([success, message])

3. **Extensibility**
   - Easy to add locations without code changes
   - Easy to add items and NPCs
   - Easy to add new commands
   - Framework for puzzles and events

4. **Documentation**
   - Code comments for complex logic
   - PHPDoc for public methods
   - User guides and developer guides
   - Example implementations

## 🚀 How to Use This Project

### For Players
1. Read QUICKSTART.md
2. Run `php game.php`
3. Explore and enjoy!

### For Learning
1. Read README.md for overview
2. Study src/GameState.php for main logic
3. Read DEVELOPER_GUIDE.md for architecture
4. Examine config/world.php for data modeling
5. Try modifying world data to add content

### For Extending
1. Follow DEVELOPER_GUIDE.md step-by-step
2. Add locations in config/world.php
3. Create new puzzles in EventHandler.php
4. Enable Combat or Save systems as needed
5. Run test_game.php to validate changes

### For Contributing
1. Maintain code style (PSR-2, 4-space indent)
2. Update world.php for world changes
3. Add tests for new features
4. Update documentation
5. Keep concerns separated

## 📚 Learning Outcomes

By studying this project, you'll learn:

✅ **PHP Fundamentals**
- Object-oriented programming
- Array and string manipulation
- File I/O operations
- Command-line interfaces

✅ **Game Development**
- State management
- Game loops
- Event systems
- Player input handling
- Puzzle design

✅ **Software Architecture**
- Design patterns
- Separation of concerns
- Data modeling
- Extensible code

✅ **Documentation**
- User guides
- API documentation
- Developer guides
- Code comments

## 🎓 Next Steps

1. **Play the Game**
   - Run game.php
   - Complete all puzzles
   - Find all items

2. **Study the Code**
   - Read through each class
   - Understand the game loop
   - Learn the data structures

3. **Extend the Game**
   - Add new locations
   - Create puzzles
   - Design NPCs
   - Add items

4. **Enable Advanced Features**
   - Implement Combat (Level 2)
   - Add Save/Load (Level 3)
   - Create new features (Level 4+)

---

**Total project development time**: Comprehensive Level 1 + frameworks for Levels 2 & 3

**Ready to explore?** 🗡️✨

```bash
php game.php
```
