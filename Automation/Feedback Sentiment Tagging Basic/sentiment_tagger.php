#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Lexical Sentiment Tagging & Feedback Engine
 * * Usage: php sentiment_tagger.php
 */

date_default_timezone_set('UTC');

// ==========================================
// 1. Visual Presentation & TUI Layout Engine
// ==========================================
class CliUI {
    const RESET = "\e[0m";
    const BOLD = "\e[1m";
    const DIM = "\e[2m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";
    const BLUE = "\e[34m";

    public static function clearScreen(): void { echo "\033[2J\033[;H"; }

    public static function header(string $title, string $subtitle = ""): void {
        self::clearScreen();
        echo self::BLUE . self::BOLD;
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

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to main analytical terminal..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; }

    public static function sentimentBadge(string $tag): string {
        return match ($tag) {
            'POSITIVE' => self::GREEN . self::BOLD . " POSITIVE " . self::RESET,
            'NEGATIVE' => self::RED . self::BOLD . " NEGATIVE " . self::RESET,
            'NEUTRAL'  => self::YELLOW . self::BOLD . "  NEUTRAL " . self::RESET,
            default    => $tag
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No matching analytical records found.\n" . self::RESET;
            return;
        }

        $widths = array_map('strlen', $headers);
        foreach ($data as $row) {
            foreach ($headers as $key => $label) {
                $cleanString = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', (string)($row[$key] ?? ''));
                $widths[$key] = max($widths[$key], strlen($cleanString));
            }
        }

        $drawSeparator = function($l, $m, $r, $lineChar) use ($widths) {
            $segments = array_map(fn($w) => str_repeat($lineChar, $w + 2), $widths);
            echo $l . implode($m, $segments) . $r . "\n";
        };

        $drawSeparator("┌", "┬", "┐", "─");
        echo "│ ";
        foreach ($headers as $key => $label) {
            echo self::BOLD . self::CYAN . str_pad($label, $widths[$key]) . self::RESET . " │ ";
        }
        echo "\n";
        $drawSeparator("├", "┼", "┤", "─");

        foreach ($data as $row) {
            echo "│ ";
            foreach ($headers as $key => $label) {
                $content = (string)($row[$key] ?? '');
                $cleanString = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', $content);
                $padding = str_repeat(" ", max(0, $widths[$key] - strlen($cleanString)));
                echo $content . $padding . " │ ";
            }
            echo "\n";
        }
        $drawSeparator("└", "┴", "┘", "─");
        echo "\n";
    }
}

// ==========================================
// 2. Data Persistence Layer (SQLite Isolation)
// ==========================================
class FeedbackRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/sentiment_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        $this->db->exec("CREATE TABLE IF NOT EXISTS feedback_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            raw_text TEXT NOT NULL,
            sentiment_tag TEXT NOT NULL,
            score_delta INTEGER NOT NULL,
            logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_sentiment_tag ON feedback_logs(sentiment_tag)");

        // Automatically seed sandbox data arrays for real-time evaluations if blank
        if ($this->db->query("SELECT COUNT(*) FROM feedback_logs")->fetchColumn() == 0) {
            $this->saveFeedback("This pipeline software architecture is incredibly elegant, clean, and fast!", "POSITIVE", 3);
            $this->saveFeedback("The interface is buggy, laggy, and totally broken on production builds.", "NEGATIVE", -3);
            $this->saveFeedback("The tool performs basic system text conversions as described on the index file.", "NEUTRAL", 0);
        }
    }

    public function saveFeedback(string $text, string $tag, int $score): void {
        $stmt = $this->db->prepare("INSERT INTO feedback_logs (raw_text, sentiment_tag, score_delta) VALUES (?, ?, ?)");
        $stmt->execute([trim($text), $tag, $score]);
    }

    public function getAllFeedback(): array {
        return $this->db->query("SELECT * FROM feedback_logs ORDER BY logged_at DESC LIMIT 30")->fetchAll();
    }

    public function getSummaryBreakdown(): array {
        return $this->db->query("
            SELECT sentiment_tag, COUNT(*) as volume 
            FROM feedback_logs 
            GROUP BY sentiment_tag
        ")->fetchAll();
    }
}

// ==========================================
// 3. Tokenizer & Sentiment Analyzer Domain Service
// ==========================================
class SentimentAnalyzerService {
    // Explicit Lexicon Dictionary Mapping Arrays
    private array $positiveLexicon = [
        'elegant', 'fast', 'clean', 'love', 'amazing', 'great', 'awesome', 'brilliant', 
        'stable', 'perfect', 'smooth', 'efficient', 'helpful', 'satisfied', 'good'
    ];

    private array $negativeLexicon = [
        'buggy', 'laggy', 'broken', 'hate', 'terrible', 'worst', 'fail', 'slow', 
        'crash', 'error', 'fault', 'annoying', 'useless', 'garbage', 'bad', 'poor'
    ];

    /**
     * Executes algorithmic lexical string parsing mutations
     * Returns an array mapping classification tags and exact numerical offsets
     */
    public function analyze(string $text): array {
        // Step 1: Force lower-casing for case-insensitive token mapping
        $normalized = mb_strtolower($text, 'UTF-8');

        // Step 2: Strip out punctuation and character junk to isolate root text symbols
        $normalized = preg_replace('/[^\w\s]/u', '', $normalized);

        // Step 3: Split into individual word tokens
        $tokens = array_filter(explode(' ', $normalized));

        $score = 0;
        // Step 4: Map loop accumulations across lexicon tokens
        foreach ($tokens as $token) {
            if (in_array($token, $this->positiveLexicon, true)) {
                $score++;
            }
            if (in_array($token, $this->negativeLexicon, true)) {
                $score--;
            }
        }

        // Step 5: Classify evaluation results
        $tag = 'NEUTRAL';
        if ($score > 0) $tag = 'POSITIVE';
        if ($score < 0) $tag = 'NEGATIVE';

        return ['tag' => $tag, 'score' => $score];
    }
}

// ==========================================
// 4. Main Runtime System Interface Controller
// ==========================================
class SentimentTaggerApp {
    private FeedbackRepository $repo;
    private SentimentAnalyzerService $analyzer;

    public function __construct() {
        $this->repo = new FeedbackRepository();
        $this->analyzer = new SentimentAnalyzerService();
    }

    public function run(): void {
        while (true) {
            CliUI::header("Feedback Sentiment Processing Matrix", "Operational Context Filtering Engine");
            
            // Output summary statistics instantly inside the active dashboard framework view
            $this->renderDistributionSummary();

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Ingest & Analyze New Customer Feedback\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Output Master Classification Logs Ledger\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Sever active terminal shell context\n\n";

            switch (CliUI::prompt("Select Dashboard Command Route")) {
                case '1': $this->ingestFeedbackFlow(); break;
                case '2': $this->viewLogsLedger(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Operational reporting nodes disconnected cleanly.\n" . CliUI::RESET;
                    exit(0);
                default:
                    continue 2;
            }
        }
    }

    private function renderDistributionSummary(): void {
        $summary = $this->repo->getSummaryBreakdown();
        if (empty($summary)) return;

        echo " " . CliUI::BOLD . "Current Dataset Distribution Metrics Summary:" . CliUI::RESET . "\n";
        
        $tableData = [];
        foreach ($summary as $row) {
            $tableData[] = [
                'tag'    => CliUI::sentimentBadge($row['sentiment_tag']),
                'volume' => number_format($row['volume']) . " submissions"
            ];
        }
        CliUI::drawTable($tableData, ['tag' => 'Sentiment Category Class', 'volume' => 'Accumulated Volumetric Count']);
        echo "\n";
    }

    private function ingestFeedbackFlow(): void {
        CliUI::header("Ingest & Analyze Customer Feedback");
        $text = CliUI::prompt("Paste raw customer text content payload");

        if (empty($text)) {
            CliUI::error("Ingestion channels reject zero-length string arguments.");
            CliUI::pause();
            return;
        }

        // Execute localized core analysis passes
        $analysis = $this->analyzer->analyze($text);
        
        // Write evaluated states directly down to physical storage space
        $this->repo->saveFeedback($text, $analysis['tag'], $analysis['score']);

        echo "\n" . str_repeat("─", 75) . "\n";
        echo " 📊 " . CliUI::BOLD . "Real-Time Pipeline Analysis Output Metrics:" . CliUI::RESET . "\n";
        echo " ├─ Computed Score Delta : " . ($analysis['score'] >= 0 ? "+" : "") . $analysis['score'] . "\n";
        echo " └─ Assigned Tag State   : " . CliUI::sentimentBadge($analysis['tag']) . "\n";
        echo str_repeat("─", 75) . "\n";

        CliUI::success("Transformation cycle finished. Data written safely to ledger nodes.");
        CliUI::pause();
    }

    private function viewLogsLedger(): void {
        CliUI::header("Master Sentiment Classification Logs Ledger");
        $logs = $this->repo->getAllFeedback();

        foreach ($logs as &$row) {
            $row['status_badge'] = CliUI::sentimentBadge($row['sentiment_tag']);
            // Truncate long customer feedback text lines cleanly for console sizing alignments
            if (strlen($row['raw_text']) > 40) {
                $row['text_short'] = substr($row['raw_text'], 0, 37) . "...";
            } else {
                $row['text_short'] = $row['raw_text'];
            }
        }

        CliUI::drawTable($logs, [
            'id' => 'ID', 
            'text_short' => 'Normalized Clean Feedback Copy', 
            'score_delta' => 'Delta Score', 
            'status_badge' => 'Sentiment Assessment Tag'
        ]);
        CliUI::pause();
    }
}

// ==========================================
// 5. Global Runtime Pipeline Bootstrapper
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Monitoring Guard: Computational metric taggers require direct bash or zsh operational shells.");
}

try {
    $engine = new SentimentTaggerApp();
    $engine->run();
} catch (Exception $e) {
    echo "\n\e[31m\e[1mFatal Pipeline Runtime Exception: \e[0m" . $e->getMessage() . "\n";
    exit(1);
}
