<?php
/**
 * Combat System (Level 2 Feature)
 * Handles battles with enemies and random encounters
 * 
 * HOW TO USE:
 * 1. Include this file in game.php: require_once 'src/Combat.php';
 * 2. Add to EventHandler.php checkPuzzleEvents():
 *    $combat = new Combat();
 *    $combat->startEncounter($gameState);
 * 3. Add combat commands to GameState.php processCommand()
 */

class Combat {
    
    private $enemies = [
        'forest_goblin' => [
            'name' => 'Forest Goblin',
            'hp' => 25,
            'max_hp' => 25,
            'damage' => [3, 8],
            'xp_reward' => 30,
            'gold_reward' => 15,
            'description' => 'A small, green creature with sharp teeth. It eyes you hungrily.'
        ],
        'shadow_wraith' => [
            'name' => 'Shadow Wraith',
            'hp' => 40,
            'max_hp' => 40,
            'damage' => [8, 15],
            'xp_reward' => 75,
            'gold_reward' => 40,
            'description' => 'A ghostly figure wreathed in dark energy. It lets out an otherworldly shriek.'
        ],
        'cave_beast' => [
            'name' => 'Cave Beast',
            'hp' => 50,
            'max_hp' => 50,
            'damage' => [10, 20],
            'xp_reward' => 100,
            'gold_reward' => 60,
            'description' => 'A massive creature with glowing eyes. It blocks your path completely.'
        ],
        'corrupted_knight' => [
            'name' => 'Corrupted Knight',
            'hp' => 60,
            'max_hp' => 60,
            'damage' => [12, 25],
            'xp_reward' => 150,
            'gold_reward' => 100,
            'description' => 'An armored figure once noble, now twisted by dark magic.'
        ]
    ];
    
    private $currentEnemy = null;
    private $isInCombat = false;
    
    /**
     * Start a random combat encounter
     */
    public function startEncounter(GameState $gameState, $locationDanger = 2) {
        $encounterChance = $locationDanger * 15; // 30%, 45%, 60%
        
        if (rand(1, 100) > $encounterChance) {
            return false; // No encounter
        }
        
        // Select random enemy based on danger level
        $possibleEnemies = $this->getEnemiesForDanger($locationDanger);
        $enemyKey = $possibleEnemies[array_rand($possibleEnemies)];
        
        $this->currentEnemy = $this->enemies[$enemyKey];
        $this->isInCombat = true;
        
        echo "\n";
        echo "═════════════════════════════════════════════════════════════\n";
        echo "⚔️  COMBAT ENCOUNTER!\n";
        echo "═════════════════════════════════════════════════════════════\n";
        echo "\n" . $this->currentEnemy['description'] . "\n";
        echo "Enemy: " . $this->currentEnemy['name'] . "\n";
        echo "HP: " . $this->currentEnemy['hp'] . "/" . $this->currentEnemy['max_hp'] . "\n\n";
        echo "Type 'attack', 'defend', or 'flee' to take action.\n";
        
        return true;
    }
    
    /**
     * Get enemies appropriate for danger level
     */
    private function getEnemiesForDanger($level) {
        $difficulties = [
            1 => ['forest_goblin'],
            2 => ['forest_goblin', 'shadow_wraith'],
            3 => ['shadow_wraith', 'cave_beast'],
            4 => ['cave_beast', 'corrupted_knight'],
            5 => ['corrupted_knight']
        ];
        
        return $difficulties[$level] ?? ['forest_goblin'];
    }
    
    /**
     * Handle player attack
     */
    public function playerAttack(GameState $gameState) {
        if (!$this->isInCombat || !$this->currentEnemy) {
            return ['success' => false, 'message' => "[!] You are not in combat."];
        }
        
        // Player attack roll
        $playerDamage = rand(8, 16);
        
        // Apply damage
        $this->currentEnemy['hp'] -= $playerDamage;
        
        echo "\n[+] You strike the " . $this->currentEnemy['name'] . " for $playerDamage damage!\n";
        
        // Check if enemy is defeated
        if ($this->currentEnemy['hp'] <= 0) {
            return $this->defeatEnemy($gameState);
        }
        
        // Enemy counter-attack
        return $this->enemyAttack($gameState);
    }
    
    /**
     * Handle enemy attack
     */
    private function enemyAttack(GameState $gameState) {
        $enemyDamage = rand(...$this->currentEnemy['damage']);
        
        // Defense chance
        if (rand(1, 100) > 60) {
            echo "[!] " . $this->currentEnemy['name'] . " attacks, but you dodge!\n";
            echo "\nEnemy HP: " . $this->currentEnemy['hp'] . "\n";
            echo "Your HP: " . $gameState->getHealth() . "\n";
            echo "\nYour action (attack/defend/flee)? ";
            return ['success' => true, 'message' => ''];
        }
        
        $gameState->removeHealth($enemyDamage);
        echo "[!] " . $this->currentEnemy['name'] . " attacks for $enemyDamage damage!\n";
        
        if ($gameState->getHealth() <= 0) {
            echo "\n[X] You have been defeated...\n";
            return ['success' => false, 'message' => 'You were defeated in combat.'];
        }
        
        echo "\nEnemy HP: " . $this->currentEnemy['hp'] . "\n";
        echo "Your HP: " . $gameState->getHealth() . "\n";
        echo "\nYour action (attack/defend/flee)? ";
        
        return ['success' => true, 'message' => ''];
    }
    
    /**
     * Handle defending
     */
    public function playerDefend(GameState $gameState) {
        if (!$this->isInCombat) {
            return ['success' => false, 'message' => "[!] You are not in combat."];
        }
        
        echo "\n[*] You take a defensive stance, bracing for impact!\n";
        
        $enemyDamage = rand(...$this->currentEnemy['damage']);
        $reducedDamage = intdiv($enemyDamage, 2); // 50% reduction
        
        if (rand(1, 100) > 40) {
            echo "[+] You successfully block most of the attack!\n";
            $reducedDamage = intdiv($reducedDamage, 2);
        }
        
        $gameState->removeHealth($reducedDamage);
        echo "[!] You take $reducedDamage damage!\n";
        
        if ($gameState->getHealth() <= 0) {
            echo "\n[X] You have been defeated...\n";
            $this->isInCombat = false;
            return ['success' => false, 'message' => 'You were defeated in combat.'];
        }
        
        echo "\nEnemy HP: " . $this->currentEnemy['hp'] . "\n";
        echo "Your HP: " . $gameState->getHealth() . "\n";
        echo "\nYour action (attack/defend/flee)? ";
        
        return ['success' => true, 'message' => ''];
    }
    
    /**
     * Attempt to flee combat
     */
    public function playerFlee(GameState $gameState) {
        if (!$this->isInCombat) {
            return ['success' => false, 'message' => "[!] You are not in combat."];
        }
        
        if (rand(1, 100) > 50) {
            echo "\n[+] You managed to escape!\n";
            $this->isInCombat = false;
            return ['success' => true, 'message' => 'You fled from combat.'];
        }
        
        echo "\n[!] You couldn't escape! The enemy blocks your path.\n";
        return $this->enemyAttack($gameState);
    }
    
    /**
     * Handle enemy defeat
     */
    private function defeatEnemy(GameState $gameState) {
        echo "\n";
        echo "═════════════════════════════════════════════════════════════\n";
        echo "[✓] VICTORY!\n";
        echo "═════════════════════════════════════════════════════════════\n";
        
        $xpGain = $this->currentEnemy['xp_reward'];
        $goldGain = $this->currentEnemy['gold_reward'];
        
        $gameState->addXP($xpGain);
        $gameState->addGold($goldGain);
        
        echo "\n[+] You defeated the " . $this->currentEnemy['name'] . "!\n";
        echo "[+XP +" . $xpGain . "]\n";
        echo "[+Gold +" . $goldGain . "]\n";
        
        $this->isInCombat = false;
        $this->currentEnemy = null;
        
        return ['success' => true, 'message' => 'Combat victory!'];
    }
    
    /**
     * Check if player is in combat
     */
    public function isInCombat() {
        return $this->isInCombat;
    }
    
    /**
     * Get current combat status
     */
    public function getStatus() {
        if (!$this->isInCombat || !$this->currentEnemy) {
            return null;
        }
        
        return [
            'enemy_name' => $this->currentEnemy['name'],
            'enemy_hp' => $this->currentEnemy['hp'],
            'enemy_max_hp' => $this->currentEnemy['max_hp']
        ];
    }
}
?>
