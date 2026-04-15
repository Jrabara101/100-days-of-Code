<?php

class FeedbackManager {
    private $storageFile;

    public function __construct($storageFile = __DIR__ . '/../data/feedback.json') {
        $this->storageFile = $storageFile;
        $this->ensureStorageExists();
    }

    /**
     * Ensures the data directory and the JSON file exist.
     */
    private function ensureStorageExists() {
        $dir = dirname($this->storageFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        
        if (!file_exists($this->storageFile)) {
            file_put_contents($this->storageFile, json_encode([]));
        }
    }

    /**
     * Load all feedback from the JSON file.
     * @return array
     */
    public function getFeedback() {
        if (!file_exists($this->storageFile)) {
            return [];
        }
        $json = file_get_contents($this->storageFile);
        $data = json_decode($json, true);
        return is_array($data) ? $data : [];
    }

    /**
     * Generate a unique ID for the new feedback entry.
     */
    private function generateId() {
        return uniqid('fb_') . bin2hex(random_bytes(2));
    }

    /**
     * Save a new feedback entry to the JSON file.
     * @param array $data The feedback details
     * @return bool
     */
    public function saveFeedback($data) {
        $feedbacks = $this->getFeedback();
        
        $entry = [
            'id' => $this->generateId(),
            'timestamp' => date('Y-m-d H:i:s'),
            'full_name' => $data['full_name'],
            'email' => $data['email'],
            'rating' => (int) $data['rating'],
            'category' => $data['category'], // we might save category integer ID or mapped string
            'message' => $data['message'],
            'phone' => empty($data['phone']) ? null : $data['phone']
        ];

        $feedbacks[] = $entry;

        $result = file_put_contents($this->storageFile, json_encode($feedbacks, JSON_PRETTY_PRINT));
        return $result !== false;
    }
}
