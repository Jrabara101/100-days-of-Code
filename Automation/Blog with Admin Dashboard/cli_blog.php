#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI Blog & Admin Dashboard
 * 
 * Usage: php cli_blog.php
 */

// ==========================================
// 1. Visual Styling & UI Engine
// ==========================================
class CliUI {
    const RESET = "\e[0m";
    const BOLD = "\e[1m";
    const DIM = "\e[2m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";
    const MAGENTA = "\e[35m";

    public static function clearScreen(): void {
        echo "\033[2J\033[;H";
    }

    public static function header(string $title, string $subtitle = ""): void {
        self::clearScreen();
        echo self::CYAN . self::BOLD;
        echo "╔═════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad(strtoupper($title), 71, " ", STR_PAD_BOTH) . " ║\n";
        if ($subtitle) {
            echo "║ " . str_pad($subtitle, 71, " ", STR_PAD_BOTH) . " ║\n";
        }
        echo "╚═════════════════════════════════════════════════════════════════════════╝\n" . self::RESET . "\n";
    }

    public static function prompt(string $message): string {
        echo self::BOLD . $message . self::RESET . ": ";
        return trim(fgets(STDIN));
    }

    public static function promptPassword(string $message): string {
        echo self::BOLD . $message . self::RESET . ": ";
        $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
        if (!$isWindows) {
            system('stty -echo');
            $password = trim(fgets(STDIN));
            system('stty echo');
            echo "\n";
            return $password;
        }
        return trim(fgets(STDIN));
    }

    public static function promptMultiline(string $message): string {
        echo self::BOLD . $message . self::RESET . " " . self::DIM . "(Type 'END' on a new line to finish)" . self::RESET . ":\n";
        $content = "";
        while (true) {
            $line = fgets(STDIN);
            if (trim($line) === 'END') break;
            $content .= $line;
        }
        return trim($content);
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo "\n" . self::GREEN . "✔ " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo "\n" . self::RED . "✖ " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . $msg . self::RESET . "\n"; }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No records found.\n" . self::RESET;
            return;
        }

        $widths = array_map('strlen', $headers);
        foreach ($data as $row) {
            foreach ($headers as $key => $label) {
                // Strip ANSI codes just in case, for accurate string length calculation
                $cleanString = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', (string)($row[$key] ?? ''));
                $widths[$key] = max($widths[$key], min(strlen($cleanString), 40)); 
            }
        }

        $drawRow = function($row, $isHeader = false) use ($headers, $widths) {
            $line = "│ ";
            foreach ($headers as $key => $label) {
                $content = $isHeader ? $label : (string)($row[$key] ?? '');
                $cleanString = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', $content);
                
                if (strlen($cleanString) > 40) {
                    $content = substr($cleanString, 0, 37) . "...";
                    $cleanString = $content;
                }
                
                $padding = str_repeat(" ", $widths[$key] - strlen($cleanString));
                $color = $isHeader ? self::BOLD . self::CYAN : self::RESET;
                $line .= $color . $content . $padding . self::RESET . " │ ";
            }
            echo $line . "\n";
        };

        $drawSeparator = function($l, $m, $r, $lineChar) use ($widths) {
            $segments = array_map(fn($w) => str_repeat($lineChar, $w + 2), $widths);
            echo $l . implode($m, $segments) . $r . "\n";
        };

        $drawSeparator("┌", "┬", "┐", "─");
        $drawRow([], true);
        $drawSeparator("├", "┼", "┤", "─");
        foreach ($data as $row) { $drawRow($row); }
        $drawSeparator("└", "┴", "┘", "─");
        echo "\n";
    }
}

// ==========================================
// 2. Database & Repository
// ==========================================
class BlogRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/blog_data.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initDb();
    }

    private function initDb(): void {
        $this->db->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )");
        $this->db->exec("CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author_id INTEGER,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_published INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (author_id) REFERENCES users(id)
        )");

        // Seed default admin if no users exist
        if ($this->db->query("SELECT COUNT(*) FROM users")->fetchColumn() == 0) {
            $hash = password_hash('password123', PASSWORD_DEFAULT);
            $this->db->exec("INSERT INTO users (username, password) VALUES ('admin', '{$hash}')");
        }
    }

    public function authenticate(string $username, string $password): ?array {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if ($user && password_verify($password, $user['password'])) {
            return $user;
        }
        return null;
    }

    public function getPosts(bool $publishedOnly = true): array {
        $sql = "SELECT p.id, p.title, p.is_published, p.created_at, u.username as author 
                FROM posts p 
                JOIN users u ON p.author_id = u.id ";
        if ($publishedOnly) {
            $sql .= "WHERE p.is_published = 1 ";
        }
        $sql .= "ORDER BY p.created_at DESC";
        
        $posts = $this->db->query($sql)->fetchAll();
        
        // Format status for UI
        foreach ($posts as &$post) {
            $post['status'] = $post['is_published'] ? 
                CliUI::GREEN . "Published" . CliUI::RESET : 
                CliUI::YELLOW . "Draft" . CliUI::RESET;
            $post['date'] = date('M j, Y', strtotime($post['created_at']));
        }
        return $posts;
    }

    public function getPost(int $id): ?array {
        $stmt = $this->db->prepare("SELECT p.*, u.username as author FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function createPost(int $authorId, string $title, string $content): void {
        $stmt = $this->db->prepare("INSERT INTO posts (author_id, title, content, is_published) VALUES (?, ?, ?, 0)");
        $stmt->execute([$authorId, $title, $content]);
    }

    public function togglePublish(int $id): void {
        $this->db->prepare("UPDATE posts SET is_published = CASE WHEN is_published = 1 THEN 0 ELSE 1 END WHERE id = ?")->execute([$id]);
    }

    public function deletePost(int $id): void {
        $this->db->prepare("DELETE FROM posts WHERE id = ?")->execute([$id]);
    }
}

// ==========================================
// 3. Application State & Controllers
// ==========================================
class BlogApp {
    private BlogRepository $repo;
    private ?array $currentUser = null;

    public function __construct() {
        $this->repo = new BlogRepository();
    }

    public function run(): void {
        while (true) {
            if ($this->currentUser) {
                $this->adminDashboard();
            } else {
                $this->publicView();
            }
        }
    }

    // --- PUBLIC ROUTER ---
    private function publicView(): void {
        CliUI::header("The Terminal Times", "Public Blog Reader");
        
        $posts = $this->repo->getPosts(true);
        if (empty($posts)) {
            CliUI::info("No published posts yet. Check back later!\n");
        } else {
            CliUI::drawTable($posts, ['id' => 'ID', 'title' => 'Title', 'author' => 'Author', 'date' => 'Published']);
        }

        echo "\n";
        echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Read a Post\n";
        echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Admin Login\n";
        echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Exit\n\n";

        switch (CliUI::prompt("Choice")) {
            case '1': $this->readPost(); break;
            case '2': $this->login(); break;
            case '0': exit(0);
        }
    }

    private function readPost(): void {
        $id = (int)CliUI::prompt("Enter Post ID to read");
        $post = $this->repo->getPost($id);

        if (!$post || !$post['is_published']) {
            CliUI::error("Post not found or not published.");
            return;
        }

        CliUI::clearScreen();
        echo CliUI::MAGENTA . CliUI::BOLD . "\n" . strtoupper($post['title']) . "\n" . CliUI::RESET;
        echo CliUI::DIM . "By {$post['author']} on " . date('M j, Y', strtotime($post['created_at'])) . "\n";
        echo str_repeat("─", 50) . "\n\n";
        
        // Wordwrap text nicely for terminal reading
        echo wordwrap($post['content'], 80, "\n") . "\n";
        echo "\n" . str_repeat("─", 50) . "\n";
        CliUI::pause();
    }

    private function login(): void {
        CliUI::header("Admin Login");
        CliUI::info(CliUI::DIM . "Hint: Default is admin / password123" . CliUI::RESET . "\n");
        $user = CliUI::prompt("Username");
        $pass = CliUI::promptPassword("Password");

        $auth = $this->repo->authenticate($user, $pass);
        if ($auth) {
            $this->currentUser = $auth;
            CliUI::success("Welcome back, {$auth['username']}.");
        } else {
            CliUI::error("Invalid credentials.");
        }
    }

    // --- ADMIN ROUTER ---
    private function adminDashboard(): void {
        CliUI::header("Admin Dashboard", "Logged in as: " . $this->currentUser['username']);
        
        $posts = $this->repo->getPosts(false); // Get ALL posts
        CliUI::drawTable($posts, ['id' => 'ID', 'status' => 'Status', 'title' => 'Title', 'date' => 'Date']);

        echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Write New Post\n";
        echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Read Post (Preview)\n";
        echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Toggle Publish Status\n";
        echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Delete Post\n";
        echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Log Out\n\n";

        switch (CliUI::prompt("Choice")) {
            case '1': $this->writePost(); break;
            case '2': $this->previewPost(); break;
            case '3': $this->togglePublish(); break;
            case '4': $this->deletePost(); break;
            case '0': 
                $this->currentUser = null; 
                CliUI::success("Logged out."); 
                break;
        }
    }

    private function writePost(): void {
        CliUI::header("Write a New Post");
        $title = CliUI::prompt("Title");
        if (empty($title)) {
            CliUI::error("Title cannot be empty."); return;
        }
        
        echo "\n";
        $content = CliUI::promptMultiline("Body Content");
        if (empty($content)) {
            CliUI::error("Content cannot be empty."); return;
        }

        $this->repo->createPost($this->currentUser['id'], $title, $content);
        CliUI::success("Post created and saved as Draft.");
    }

    private function previewPost(): void {
        $id = (int)CliUI::prompt("Enter Post ID to preview");
        $post = $this->repo->getPost($id);
        if (!$post) { CliUI::error("Post not found."); return; }

        CliUI::header("Preview: " . $post['title']);
        $status = $post['is_published'] ? CliUI::GREEN . "PUBLISHED" : CliUI::YELLOW . "DRAFT";
        echo "Status: " . $status . CliUI::RESET . "\n\n";
        echo wordwrap($post['content'], 80, "\n") . "\n";
        CliUI::pause();
    }

    private function togglePublish(): void {
        $id = (int)CliUI::prompt("Enter Post ID to toggle");
        $post = $this->repo->getPost($id);
        if ($post) {
            $this->repo->togglePublish($id);
            $action = $post['is_published'] ? 'Unpublished' : 'Published';
            CliUI::success("Post #{$id} has been {$action}.");
        } else {
            CliUI::error("Post not found.");
        }
    }

    private function deletePost(): void {
        $id = (int)CliUI::prompt("Enter Post ID to delete");
        $post = $this->repo->getPost($id);
        if ($post) {
            $confirm = CliUI::prompt("Are you sure you want to delete '{$post['title']}'? (y/N)");
            if (strtolower($confirm) === 'y') {
                $this->repo->deletePost($id);
                CliUI::success("Post deleted permanently.");
            }
        } else {
            CliUI::error("Post not found.");
        }
    }
}

// Bootstrap
if (php_sapi_name() !== 'cli') die("Must run in CLI environment.");
(new BlogApp())->run();
