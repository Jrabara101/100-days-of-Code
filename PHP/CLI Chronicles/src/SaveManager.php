<?php
/**
 * SaveManager Class (Level 3 Feature)
 * Handles game state persistence and file management
 * 
 * HOW TO USE:
 * 1. Include in game.php: require_once 'src/SaveManager.php';
 * 2. Add to GameState.php processCommand():
 *    case 'save': return $this->handleSave($target);
 *    case 'load': return $this->handleLoad($target);
 * 3. Use methods:
 *    - saveGame($filename)
 *    - loadGame($filename)
 *    - listSaves()
 */

class SaveManager {
    
    private $savePath = './saves/';
    private $saveExtension = '.quest';
    
    public function __construct() {
        // Create saves directory if it doesn't exist
        if (!is_dir($this->savePath)) {
            mkdir($this->savePath, 0755, true);
        }
    }
    
    /**
     * Save game state to file
     */
    public function saveGame(GameState $gameState, $fileName) {
        $fileName = $this->sanitizeFileName($fileName);
        
        if (empty($fileName)) {
            return [
                'success' => false,
                'message' => "[!] Invalid save file name."
            ];
        }
        
        $saveData = [
            'version' => '1.0',
            'timestamp' => date('Y-m-d H:i:s'),
            'playTime' => '0:00', // Can be expanded to track actual playtime
            'currentLocation' => $gameState->getCurrentLocationKey(),
            'inventory' => $gameState->getInventory(),
            'health' => $gameState->getHealth(),
            'xp' => $gameState->getXP(),
            'gold' => $gameState->getGold()
        ];
        
        $filePath = $this->savePath . $fileName . $this->saveExtension;
        
        if (file_put_contents($filePath, json_encode($saveData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES))) {
            return [
                'success' => true,
                'message' => "[+] Game saved as '$fileName'.\n    Location: " . $gameState->getCurrentLocation()['name'] . "\n    HP: " . $gameState->getHealth() . "/100"
            ];
        } else {
            return [
                'success' => false,
                'message' => "[!] Failed to save game. Check file permissions."
            ];
        }
    }
    
    /**
     * Load game state from file
     * Returns array with game state or error
     */
    public function loadGame($fileName) {
        $fileName = $this->sanitizeFileName($fileName);
        $filePath = $this->savePath . $fileName . $this->saveExtension;
        
        if (!file_exists($filePath)) {
            return [
                'success' => false,
                'message' => "[!] Save file '$fileName' not found.",
                'data' => null
            ];
        }
        
        $content = file_get_contents($filePath);
        $data = json_decode($content, true);
        
        if (!$data) {
            return [
                'success' => false,
                'message' => "[!] Corrupted save file.",
                'data' => null
            ];
        }
        
        return [
            'success' => true,
            'message' => "[+] Game loaded: " . $data['timestamp'] . " (Location: " . $data['currentLocation'] . ")",
            'data' => $data
        ];
    }
    
    /**
     * List all available save files
     */
    public function listSaves() {
        $saves = [];
        
        if (!is_dir($this->savePath)) {
            return $saves;
        }
        
        $files = scandir($this->savePath);
        
        foreach ($files as $file) {
            if (substr($file, -strlen($this->saveExtension)) === $this->saveExtension) {
                $filePath = $this->savePath . $file;
                $content = file_get_contents($filePath);
                $data = json_decode($content, true);
                
                if ($data) {
                    $saves[] = [
                        'name' => substr($file, 0, -strlen($this->saveExtension)),
                        'timestamp' => $data['timestamp'],
                        'location' => $data['currentLocation'],
                        'health' => $data['health'],
                        'xp' => $data['xp'],
                        'fileSize' => filesize($filePath)
                    ];
                }
            }
        }
        
        // Sort by timestamp (newest first)
        usort($saves, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });
        
        return $saves;
    }
    
    /**
     * Delete a save file
     */
    public function deleteSave($fileName) {
        $fileName = $this->sanitizeFileName($fileName);
        $filePath = $this->savePath . $fileName . $this->saveExtension;
        
        if (!file_exists($filePath)) {
            return [
                'success' => false,
                'message' => "[!] Save file not found."
            ];
        }
        
        if (unlink($filePath)) {
            return [
                'success' => true,
                'message' => "[+] Save file '$fileName' deleted."
            ];
        } else {
            return [
                'success' => false,
                'message' => "[!] Failed to delete save file."
            ];
        }
    }
    
    /**
     * Sanitize file name to prevent directory traversal
     */
    private function sanitizeFileName($fileName) {
        // Remove any path components
        $fileName = basename($fileName);
        
        // Remove dangerous characters
        $fileName = preg_replace('/[^a-zA-Z0-9_-]/', '', $fileName);
        
        return trim($fileName);
    }
    
    /**
     * Restore game state from saved data
     * To be called in GameState class
     */
    public function restoreGameState(GameState &$gameState, $saveData) {
        // This would need to be implemented in GameState class
        // as it would require protected method access
        // Example implementation in GameState:
        /*
        public function restoreFromSave($saveData) {
            $this->currentLocation = $saveData['currentLocation'];
            $this->inventory = $saveData['inventory'];
            $this->health = $saveData['health'];
            $this->xp = $saveData['xp'];
            $this->gold = $saveData['gold'];
        }
        */
    }
    
    /**
     * Export save file as backup
     */
    public function exportSave($fileName, $destinationPath) {
        $fileName = $this->sanitizeFileName($fileName);
        $sourcePath = $this->savePath . $fileName . $this->saveExtension;
        
        if (!file_exists($sourcePath)) {
            return [
                'success' => false,
                'message' => "[!] Save file not found."
            ];
        }
        
        if (copy($sourcePath, $destinationPath)) {
            return [
                'success' => true,
                'message' => "[+] Save exported to: $destinationPath"
            ];
        } else {
            return [
                'success' => false,
                'message' => "[!] Failed to export save file."
            ];
        }
    }
    
    /**
     * Display save file info
     */
    public function getSaveInfo($fileName) {
        $result = $this->loadGame($fileName);
        
        if (!$result['success']) {
            return $result;
        }
        
        $data = $result['data'];
        
        $info = "=== SAVE FILE INFO ===\n";
        $info .= "Name: $fileName\n";
        $info .= "Created: " . $data['timestamp'] . "\n";
        $info .= "Location: " . $data['currentLocation'] . "\n";
        $info .= "Health: " . $data['health'] . "/100\n";
        $info .= "Experience: " . $data['xp'] . "\n";
        $info .= "Gold: " . $data['gold'] . "\n";
        $info .= "Inventory: " . count($data['inventory']) . " items\n";
        
        return [
            'success' => true,
            'message' => $info
        ];
    }
}
?>
