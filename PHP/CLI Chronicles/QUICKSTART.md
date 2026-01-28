# 🎮 Quick Start Guide

## Getting Started in 30 Seconds

### 1. Run the Game

```bash
php game.php
```

### 2. Basic Commands

```
go north          - Move to another location
take stick        - Pick up an item
inventory         - Check your items
examine crystal   - Look at something closely
status            - Check your stats (HP, XP, Gold)
help              - Show all commands
quit              - Exit the game
```

### 3. Simple Walkthrough

```
> go north
You travel north...
[You arrive at: Abandoned Temple]

> look
[Re-examine your surroundings]

> examine crystal
[*] The crystal glows with ancient energy...

> take crystal  
[+] You picked up: Glowing Crystal

> go south
You travel south...

> go east
You travel east...

> examine chest
[!] The chest is locked. You need a key to open it.

> go west
[Back to starting location]

> go south
You travel south...
[Village]

> talk merchant
[NPC: The Merchant]
A merchant eyes you with interest...
```

## 🎯 Objectives

### Level 1: Basic Exploration
- ✅ Visit all 8 locations
- ✅ Collect 5 different items
- ✅ Talk to all NPCs
- ✅ Reach 100 XP

### Level 2: Puzzle Solving
- ✅ Find the Iron Key in the Forest Stream
- ✅ Open the locked chest
- ✅ Take the Glowing Crystal from the Temple
- ✅ Read the Old Journal for knowledge

### Level 3: Master Explorer
- ✅ Collect all items (9 total)
- ✅ Visit Temple Tower (most hidden location)
- ✅ Reach 100 HP without losing health
- ✅ Gather 200+ total gold worth of items

## 🗺️ Quick Location Map

```
           TEMPLE_TOWER
                |
           TEMPLE
          /     \
    SHOP - VILLAGE - FOREST - STREAM  
            |          |
          CAMP        (start here)
            |
          CAVE
```

## 💡 Pro Tips

1. **Always say `look` when you arrive** - You might miss important details
2. **Check inventory often** - You only have 10 items capacity
3. **Talk to NPCs** - They give hints about puzzles and items
4. **Read descriptions carefully** - Clues are hidden in the atmosphere
5. **Try different word combinations** - "pick up stick", "get stick", "take stick" all work

## 🎁 Hidden Items

| Location | Item | How to Get |
|----------|------|-----------|
| Forest Entrance | Stick | Ground |
| Forest Entrance | Berry | Ground |
| Forest Stream | Iron Key | Ground |
| Abandoned Temple | Crystal | Ground/Special |
| Temple Tower | Old Journal | Ground |
| Riverside Camp | Torch | Ground |
| Riverside Camp | Backpack | Ground |
| Forest Stream (Chest) | Gold Coin | Open chest with key |
| Forest Stream (Chest) | Ancient Map | Open chest with key |

## ⚡ Game Mechanics at a Glance

**Health (HP)**
- Start: 100/100
- Used by: Danger zones, encounters
- Restored by: Consuming items
- Game Over when: HP reaches 0

**Experience (XP)**
- Gained from: Reading books, completing puzzles
- Used for: Tracking progress (future levels)
- Tracked during: Your entire session

**Gold (¢)**
- Earned from: Defeating enemies (future level)
- Used for: Trading with NPCs (future level)
- Equivalent to: Item values

## 🎮 Available Aliases

Commands can be spoken naturally!

```
go north          = move north = walk north = travel north
take stick        = get stick = grab stick = pick up stick
inventory         = inv = items = bag
examine crystal   = inspect crystal = study crystal = read crystal
status            = stats = character = info
talk merchant     = speak merchant = chat merchant = ask merchant
look              = see = observe = check
help              = commands = assist
```

## 🔮 What to Expect

### Atmosphere
- Rich, descriptive text-based world
- Retro 1980s text adventure feel
- Atmospheric descriptions and mood

### Gameplay
- Puzzle-solving (find items, unlock things)
- Exploration (8 interconnected locations)
- Item management (inventory limits)
- NPC interactions (learn about the world)

### Challenge
- Moderate difficulty (puzzle-solving)
- No combat in Level 1
- Mainly navigation and collection

## 🚀 Next Steps

### Want More Challenge?
Read **DEVELOPER_GUIDE.md** to learn how to:
- Add new locations
- Create puzzles
- Enable the Combat System (Level 2)
- Implement Save/Load (Level 3)

### Want to Modify the Game?
All world data is in **config/world.php** - easy to customize:
- Add locations
- Create NPCs
- Design puzzles
- Add items

### Want to Understand the Code?
Each PHP file has clear documentation:
- **game.php** - Main game loop
- **src/GameState.php** - Game logic
- **src/CommandParser.php** - Input processing
- **src/Display.php** - Terminal output
- **src/EventHandler.php** - Events & puzzles

## ❓ FAQ

**Q: I'm stuck on a puzzle**
A: Read all descriptions carefully, talk to NPCs for hints, and try different items in different locations.

**Q: My inventory is full**
A: You can only carry 10 items. Drop items you don't need or use consumables.

**Q: Can I save my game?**
A: In Level 1, no. Level 3 adds save/load functionality - check DEVELOPER_GUIDE.md to enable it.

**Q: What happens if I die?**
A: In Level 1, there's no combat so you can't die. Level 2 adds combat encounters.

**Q: Are there multiple endings?**
A: Level 1 is a linear exploration game. Level 2+ will add branching paths.

**Q: How long is the game?**
A: About 15-30 minutes for first playthrough, depends on exploration style.

---

**Ready to begin your adventure?**

```bash
php game.php
```

May your quest be legendary! 🗡️✨
