#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - URL Slug Generator & Uniqueness Engine
 * * Usage: php slug_generator.php "<post_title>"
 * Example: php slug_generator.php "What's New in PHP 8.3 & Beyond! 🔥"
 */

// ==========================================
// 1. Visual Styling Component
// ==========================================
class CliUI {
    const RESET = "\e[0m";
    const BOLD = "\e[1m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";

    public static function header(string $title): void {
        echo self::CYAN . self::BOLD;
        echo "╔═════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad(strtoupper($title), 71, " ", STR_PAD_BOTH) . " ║\n";
        echo "╚═════════════════════════════════════════════════════════════════════════╝\n" . self::RESET . "\n";
    }

    public static function outputMetric(string $label, string $value, string $color = self::RESET): void {
        echo " " . str_pad($label, 18) . ": " . $color . $value . self::RESET . "\n";
    }

    public static function error(string $msg): void { 
        echo "\n" . self::RED . self::BOLD . "✖ ERROR: " . self::RESET . self::RED . $msg . self::RESET . "\n\n"; 
        exit(1); 
    }
}

// ==========================================
// 2. Database Integration (SQLite Mock Engine)
// ==========================================
class PostRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/slugs.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initDb();
    }

    private function initDb(): void {
        $this->db->exec("CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL
        )");

        // Seed some duplicate data to demonstrate the collision logic
        if ($this->db->query("SELECT COUNT(*) FROM posts")->fetchColumn() == 0) {
            $this->db->exec("INSERT INTO posts (title, slug) VALUES ('Hello World', 'hello-world')");
            $this->db->exec("INSERT INTO posts (title, slug) VALUES ('Hello World Extra', 'hello-world-1')");
        }
    }

    /**
     * Checks if a slug exists in the database.
     */
    public function slugExists(string $slug): bool {
        $stmt = $this->db->prepare("SELECT 1 FROM posts WHERE slug = ? LIMIT 1");
        $stmt->execute([$slug]);
        return (bool)$stmt->fetchColumn();
    }

    /**
     * Persists the newly created slug.
     */
    public function savePost(string $title, string $slug): void {
        $stmt = $this->db->prepare("INSERT INTO posts (title, slug) VALUES (?, ?)");
        $stmt->execute([$title, $slug]);
    }
}

// ==========================================
// 3. Slug Core Engine
// ==========================================
class SlugService {
    private PostRepository $repo;

    public function __construct() {
        $this->repo = new PostRepository();
    }

    /**
     * Transforms a raw string into a URL-friendly slug with multilingual support.
     */
    public function generateRawSlug(string $title): string {
        // Step 1: Lowercase the string
        $slug = mb_strtolower($title, 'UTF-8');

        // Step 2: Transliterate non-ASCII characters if the intl extension is active
        if (extension_loaded('intl')) {
            $transliterator = Transliterator::create('Any-Latin; Latin-ASCII; Lower();');
            if ($transliterator) {
                $slug = $transliterator->transliterate($slug);
            }
        }

        // Step 3: Strip remaining unwanted characters/punctuation (Keep letters, numbers, spaces, and hyphens)
        $slug = preg_replace('/[^a-z0-9\s\-]/u', '', $slug);

        // Step 4: Turn spaces and underscores into clean hyphens
        $slug = preg_replace('/[\s_]+/', '-', $slug);

        // Step 5: Clean up structural artifacts (consecutive, leading, or trailing hyphens)
        $slug = preg_replace('/-+/', '-', $slug);
        $slug = trim($slug, '-');

        return $slug;
    }

    /**
     * Resolves naming collisions by looking up existing database records
     * and auto-incrementing suffixes if needed.
     */
    public function makeSlugUnique(string $baseSlug): string {
        $slug = $baseSlug;
        $counter = 1;

        // Keep looping until we find a variant that doesn't conflict
        while ($this->repo->slugExists($slug)) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}

// ==========================================
// 4. Runtime Entry Point
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("This utility must be run via the CLI environment.");
}

if ($argc < 2 || empty(trim($argv[1]))) {
    CliUI::header("URL Slug Optimizer");
    echo "Usage: php " . basename(__FILE__) . " \"<your post title here>\"\n";
    echo "Example: php " . basename(__FILE__) . " \"Laravel 11: The Fresh Framework Lifecycle! 🚀\"\n\n";
    exit(1);
}

$inputTitle = trim($argv[1]);
CliUI::header("Slug Pipeline Optimization");

try {
    $slugService = new SlugService();
    $repo = new PostRepository();

    // Run string transformations
    $rawSlug = $slugService->generateRawSlug($inputTitle);
    
    if (empty($rawSlug)) {
        CliUI::error("The title provided contains zero valid characters to build a slug out of.");
    }

    // Run database collision checks
    $finalUniqueSlug = $slugService->makeSlugUnique($rawSlug);
    $isCollisionDetected = ($rawSlug !== $finalUniqueSlug);

    // Persist changes
    $repo->savePost($inputTitle, $finalUniqueSlug);

    // Visual breakdown
    CliUI::outputMetric("Original Input", $inputTitle);
    CliUI::outputMetric("Normalized Raw", $rawSlug, CliUI::YELLOW);
    
    if ($isCollisionDetected) {
        CliUI::outputMetric("Collision Warning", "Database conflict resolved by appending increment counter.", CliUI::YELLOW);
    }
    
    CliUI::outputMetric("Production Slug", $finalUniqueSlug, CliUI::GREEN . CliUI::BOLD);
    echo "\n";

} catch (Exception $e) {
    CliUI::error("Fatal parsing engine exception: " . $e->getMessage());
}
