<?php
/**
 * CommandParser Class
 * Parses natural language commands into action-target pairs
 */

class CommandParser {
    
    // Command aliases
    private $aliases = [
        'go' => ['go', 'move', 'walk', 'head', 'travel'],
        'take' => ['take', 'get', 'grab', 'pick', 'pickup'],
        'look' => ['look', 'see', 'observe', 'check'],
        'inventory' => ['inventory', 'inv', 'items', 'bag'],
        'examine' => ['examine', 'inspect', 'study', 'read'],
        'talk' => ['talk', 'speak', 'chat', 'ask'],
        'use' => ['use', 'activate', 'apply', 'wield'],
        'status' => ['status', 'stats', 'character', 'info'],
        'help' => ['help', 'commands', 'assist']
    ];
    
    /**
     * Parse raw input into structured command
     * 
     * @param string $input Raw user input
     * @return array|false Command array with 'action' and 'target', or false if invalid
     */
    public function parse($input) {
        // Clean input
        $input = trim($input);
        
        if (empty($input)) {
            return false;
        }
        
        // Split input into words
        $words = preg_split('/\s+/', strtolower($input));
        
        if (empty($words)) {
            return false;
        }
        
        // Extract action from first word
        $action = $this->getActionFromWord($words[0]);
        
        if (!$action) {
            return false;
        }
        
        // Extract target from remaining words
        $target = null;
        if (count($words) > 1) {
            $target = $this->extractTarget($action, $words);
        }
        
        return [
            'action' => $action,
            'target' => $target,
            'raw' => $input
        ];
    }
    
    /**
     * Get canonical action name from user's word
     */
    private function getActionFromWord($word) {
        foreach ($this->aliases as $action => $possibleWords) {
            if (in_array($word, $possibleWords)) {
                return $action;
            }
        }
        return false;
    }
    
    /**
     * Extract target from word array
     * Handles phrases like "pick up the rusty key" -> "rusty key"
     */
    private function extractTarget($action, $words) {
        // Remove action word
        array_shift($words);
        
        // Remove prepositions that are commonly used
        $prepositions = ['the', 'a', 'an', 'at', 'to', 'from', 'in', 'on', 'up', 'down'];
        $words = array_filter($words, function($word) use ($prepositions) {
            return !in_array($word, $prepositions);
        });
        
        // Join remaining words and return
        $target = implode(' ', $words);
        
        // Specific direction handling
        if ($action === 'go') {
            return $this->normalizeDirection($target);
        }
        
        return empty($target) ? null : $target;
    }
    
    /**
     * Normalize direction input
     */
    private function normalizeDirection($direction) {
        $directionMap = [
            'n' => 'north',
            'north' => 'north',
            's' => 'south',
            'south' => 'south',
            'e' => 'east',
            'east' => 'east',
            'w' => 'west',
            'west' => 'west',
            'u' => 'up',
            'up' => 'up',
            'd' => 'down',
            'down' => 'down',
            'northeast' => 'northeast',
            'northwest' => 'northwest',
            'southeast' => 'southeast',
            'southwest' => 'southwest',
        ];
        
        $normalized = strtolower(trim($direction));
        
        return $directionMap[$normalized] ?? $normalized;
    }
    
    /**
     * Get suggestions for incomplete commands
     */
    public function getSuggestions($input) {
        $input = strtolower(trim($input));
        $suggestions = [];
        
        foreach ($this->aliases as $action => $words) {
            foreach ($words as $word) {
                if (strpos($word, $input) === 0) {
                    $suggestions[] = $action;
                }
            }
        }
        
        return array_unique($suggestions);
    }
}
?>
