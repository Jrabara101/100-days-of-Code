#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Autonomous Legal Contract Generation Engine
 * Usage:
 *   php contract_generator.php          (Interactive Workspace Dashboard)
 *   php contract_generator.php --batch  (Headless Batch Generation Node)
 */

date_default_timezone_set('UTC');

// ==========================================
// 1. Visual Styling & TUI Layout Engine
// ==========================================
class CliUI {
    const RESET   = "\e[0m";
    const BOLD    = "\e[1m";
    const DIM     = "\e[2m";
    const GREEN   = "\e[32m";
    const RED     = "\e[31m";
    const CYAN    = "\e[36m";
    const YELLOW  = "\e[33m";
    const BLUE    = "\e[34m";
    const MAGENTA = "\e[35m";

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

    public static function prompt(string $message, string $default = ""): string {
        $defLabel = $default ? self::DIM . " [{$default}]" . self::RESET : "";
        echo self::BOLD . $message . $defLabel . self::RESET . ": ";
        $input = trim(fgets(STDIN));
        return $input === "" ? $default : $input;
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to main workspace..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . $msg . self::RESET . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[CONTRACT-ENGINE] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'VERIFIED', 'COMPILED' => self::GREEN . self::BOLD . "  {$status}  " . self::RESET,
            'PENDING', 'DRAFT'     => self::YELLOW . "   {$status}   " . self::RESET,
            'TAMPERED', 'FAILED'   => self::RED . self::BOLD . "  {$status}  " . self::RESET,
            default                => $status
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No tracking records match current query parameters.\n" . self::RESET;
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
// 2. Data Persistence Layer (SQLite Vault)
// ==========================================
class ContractRepository {
    private PDO $db;
    private string $storageDir;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/contract_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        $this->storageDir = __DIR__ . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'contracts';
        if (!is_dir($this->storageDir)) {
            mkdir($this->storageDir, 0755, true);
        }

        $this->initSchema();
    }

    private function initSchema(): void {
        // Legal Templates Registry
        $this->db->exec("CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            required_tokens TEXT NOT NULL, -- JSON-encoded array of tokens
            body_template TEXT NOT NULL
        )");

        // Generated Contracts Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS contracts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_number TEXT UNIQUE NOT NULL,
            template_code TEXT NOT NULL,
            client_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            checksum_sha256 TEXT NOT NULL,
            status TEXT DEFAULT 'COMPILED',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (template_code) REFERENCES templates(code)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_contract_number ON contracts(contract_number)");

        // Pre-seed baseline legal templates if empty
        if ($this->db->query("SELECT COUNT(*) FROM templates")->fetchColumn() == 0) {
            $this->seedBaselineTemplates();
        }
    }

    private function seedBaselineTemplates(): void {
        $stmt = $this->db->prepare("INSERT INTO templates (code, title, required_tokens, body_template) VALUES (?, ?, ?, ?)");

        // Template 1: Master Services Agreement (MSA)
        $msaBody = <<<EOT
================================================================================
                        MASTER SERVICES AGREEMENT (MSA)
================================================================================
Contract Reference: {{contract_number}}
Effective Date    : {{effective_date}}

1. PARTIES
   This Agreement is entered into by and between {{provider_company}} ("Provider"),
   and {{client_company}} ("Client"), represented by {{client_name}}.

2. SCOPE OF SERVICES & COMPENSATION
   Provider shall perform professional services outlined as: {{service_scope}}.
   In consideration for services, Client agrees to pay Provider a total sum of
   \${{contract_value}} USD, payable within {{payment_terms_days}} days of invoicing.

3. GOVERNING LAW
   This Agreement shall be governed by and construed in accordance with the
   laws of the State/Jurisdiction of {{governing_jurisdiction}}.

IN WITNESS WHEREOF, the parties execute this Agreement as of {{effective_date}}.

_________________________________          _________________________________
Provider: {{provider_company}}            Client: {{client_company}}
EOT;

        $stmt->execute([
            'MSA-01',
            'Master Services Agreement',
            json_encode(['contract_number', 'effective_date', 'provider_company', 'client_company', 'client_name', 'service_scope', 'contract_value', 'payment_terms_days', 'governing_jurisdiction']),
            $msaBody
        ]);

        // Template 2: Non-Disclosure Agreement (NDA)
        $ndaBody = <<<EOT
================================================================================
                   MUTUAL NON-DISCLOSURE AGREEMENT (NDA)
================================================================================
Contract Reference: {{contract_number}}
Effective Date    : {{effective_date}}

Parties: {{provider_company}} & {{client_company}} (Represented by: {{client_name}})

1. CONFIDENTIAL INFORMATION
   The parties wish to explore a business opportunity related to: {{business_purpose}}.
   All oral or written information disclosed shall remain strictly confidential for
   a term of {{confidentiality_years}} years from the Effective Date.

2. JURISDICTION
   Governed by the laws of {{governing_jurisdiction}}.

_________________________________          _________________________________
Disclosing Party Authorized Rep            Receiving Party: {{client_name}}
EOT;

        $stmt->execute([
            'NDA-01',
            'Mutual Non-Disclosure Agreement',
            json_encode(['contract_number', 'effective_date', 'provider_company', 'client_company', 'client_name', 'business_purpose', 'confidentiality_years', 'governing_jurisdiction']),
            $ndaBody
        ]);
    }

    public function getTemplates(): array {
        return $this->db->query("SELECT * FROM templates ORDER BY id ASC")->fetchAll();
    }

    public function getTemplateByCode(string $code): ?array {
        $stmt = $this->db->prepare("SELECT * FROM templates WHERE code = ?");
        $stmt->execute([strtoupper(trim($code))]);
        return $stmt->fetch() ?: null;
    }

    public function storeContract(string $contractNumber, string $templateCode, string $clientName, string $filePath, string $checksum): void {
        $stmt = $this->db->prepare("
            INSERT INTO contracts (contract_number, template_code, client_name, file_path, checksum_sha256) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$contractNumber, $templateCode, $clientName, $filePath, $checksum]);
    }

    public function getContracts(): array {
        return $this->db->query("SELECT * FROM contracts ORDER BY id DESC LIMIT 30")->fetchAll();
    }

    public function getStorageDir(): string {
        return $this->storageDir;
    }
}

// ==========================================
// 3. Strict Template Engine Domain Service
// ==========================================
class ContractTemplateEngine {
    /**
     * Compiles a template using strict token validation.
     * Throws an exception if any required placeholder token is missing or blank.
     */
    public static function compile(array $template, array $data): array {
        $requiredTokens = json_decode($template['required_tokens'], true) ?: [];
        $missingTokens = [];

        foreach ($requiredTokens as $token) {
            if (!array_key_exists($token, $data) || trim((string)$data[$token]) === '') {
                $missingTokens[] = $token;
            }
        }

        if (!empty($missingTokens)) {
            throw new InvalidArgumentException(
                "Legal Validation Failed: Unresolved mandatory placeholder tokens: [" . implode(', ', $missingTokens) . "]"
            );
        }

        // Perform token replacement using zero-dependency regex substitution
        $compiledBody = preg_replace_callback('/\{\{\s*([a-z0-9_]+)\s*\}\}/i', function ($matches) use ($data) {
            $key = $matches[1];
            return $data[$key] ?? $matches[0];
        }, $template['body_template']);

        // Generate SHA-256 cryptographic signature seal
        $checksum = hash('sha256', $compiledBody);

        return [
            'body'     => $compiledBody,
            'checksum' => $checksum
        ];
    }
}

// ==========================================
// 4. Main Application Controller
// ==========================================
class ContractGeneratorApp {
    private ContractRepository $repo;

    public function __construct() {
        $this->repo = new ContractRepository();
    }

    public function launchWorkspace(): void {
        while (true) {
            $contracts = $this->repo->getContracts();
            CliUI::header("Legal Document Automation Vault", "Compiled Contracts Index Count: " . count($contracts));

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Generate Single Contract (Interactive Wizard)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Run Batch Generation Node (Simulate Bulk Execution)\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Audit Contracts Ledger & Cryptographic SHA-256 Signatures\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " View Available Template Schemas\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect local workspace engine\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->interactiveGenerationWizard(); break;
                case '2': $this->runBatchGeneration(false); CliUI::pause(); break;
                case '3': $this->auditContractsLedger(); break;
                case '4': $this->viewTemplatesList(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Contract generation engine unmounted safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function interactiveGenerationWizard(): void {
        CliUI::header("Contract Generation Wizard");
        $templates = $this->repo->getTemplates();

        echo " Available Legal Templates:\n";
        foreach ($templates as $idx => $tmpl) {
            $num = $idx + 1;
            echo "  [{$num}] {$tmpl['title']} (" . CliUI::CYAN . $tmpl['code'] . CliUI::RESET . ")\n";
        }
        echo "\n";

        $choice = (int)CliUI::prompt("Select template number");
        if (!isset($templates[$choice - 1])) {
            CliUI::error("Invalid template selection index.");
            CliUI::pause();
            return;
        }

        $tmpl = $templates[$choice - 1];
        $tokens = json_decode($tmpl['required_tokens'], true);

        CliUI::header("Input Contract Variable Parameters", "Template: {$tmpl['title']}");
        $data = [];
        
        // Auto-generate contract number and current date
        $contractNum = "CTR-" . date('Y') . "-" . rand(10000, 99999);
        $data['contract_number'] = $contractNum;
        $data['effective_date']  = date('Y-m-d');
        $data['provider_company'] = "Enterprise Tech Solutions LLC";

        echo " Autogenerated Parameters:\n";
        echo "  • Contract Number : " . CliUI::YELLOW . $data['contract_number'] . CliUI::RESET . "\n";
        echo "  • Effective Date  : " . CliUI::YELLOW . $data['effective_date'] . CliUI::RESET . "\n";
        echo "  • Provider Name   : " . CliUI::YELLOW . $data['provider_company'] . CliUI::RESET . "\n\n";

        // Prompt for remaining user variables
        foreach ($tokens as $token) {
            if (isset($data[$token])) continue; // Skip auto-generated variables
            
            $label = ucwords(str_replace('_', ' ', $token));
            $data[$token] = CliUI::prompt("Enter {$label}");
        }

        try {
            // Compile with strict schema enforcement
            $compiled = ContractTemplateEngine::compile($tmpl, $data);

            // Write output contract text file to local storage
            $fileName = strtolower($data['contract_number']) . "_" . preg_replace('/[^a-z0-9]/i', '_', $data['client_company']) . ".txt";
            $filePath = $this->repo->getStorageDir() . DIRECTORY_SEPARATOR . $fileName;
            file_put_contents($filePath, $compiled['body']);

            // Record contract in the database vault
            $this->repo->storeContract(
                $data['contract_number'],
                $tmpl['code'],
                $data['client_company'],
                $filePath,
                $compiled['checksum']
            );

            CliUI::success("Contract {$data['contract_number']} compiled and cryptographically sealed!");
            
            echo "\n" . str_repeat("─", 75) . "\n";
            echo " " . CliUI::BOLD . "PREVIEW COMPILED CONTRACT OUTPUT:" . CliUI::RESET . "\n";
            echo CliUI::DIM . substr($compiled['body'], 0, 500) . "...\n" . CliUI::RESET;
            echo str_repeat("─", 75) . "\n";

        } catch (Exception $e) {
            CliUI::error($e->getMessage());
        }

        CliUI::pause();
    }

    public function runBatchGeneration(bool $headlessMode = true): void {
        if ($headlessMode) {
            CliUI::stepLog("Initializing batch generation processing node...");
        } else {
            echo "Executing batch contract generation sequence...\n";
        }

        $tmpl = $this->repo->getTemplateByCode('MSA-01');
        if (!$tmpl) {
            CliUI::error("Base MSA-01 template code missing.");
            return;
        }

        $mockClients = [
            ['name' => 'Acme Corporation', 'scope' => 'Cloud Infrastructure Migration', 'value' => '45000', 'days' => '30'],
            ['name' => 'Stark Industries', 'scope' => 'Arc Reactor Firmware Audit', 'value' => '120000', 'days' => '15'],
            ['name' => 'Cyberdyne Systems', 'scope' => 'Neural Net Security Evaluation', 'value' => '85000', 'days' => '45']
        ];

        $generatedCount = 0;

        foreach ($mockClients as $client) {
            $contractNum = "CTR-" . date('Y') . "-" . rand(10000, 99999);
            $data = [
                'contract_number'        => $contractNum,
                'effective_date'         => date('Y-m-d'),
                'provider_company'       => 'Enterprise Tech Solutions LLC',
                'client_company'         => $client['name'],
                'client_name'            => 'Authorized Officer',
                'service_scope'          => $client['scope'],
                'contract_value'         => $client['value'],
                'payment_terms_days'     => $client['days'],
                'governing_jurisdiction' => 'State of Delaware'
            ];

            try {
                $compiled = ContractTemplateEngine::compile($tmpl, $data);
                
                $fileName = strtolower($contractNum) . "_" . preg_replace('/[^a-z0-9]/i', '_', $client['name']) . ".txt";
                $filePath = $this->repo->getStorageDir() . DIRECTORY_SEPARATOR . $fileName;
                file_put_contents($filePath, $compiled['body']);

                $this->repo->storeContract($contractNum, 'MSA-01', $client['name'], $filePath, $compiled['checksum']);
                $generatedCount++;

                if ($headlessMode) {
                    CliUI::stepLog("Batch contract {$contractNum} compiled for {$client['name']}. SHA-256: " . substr($compiled['checksum'], 0, 10) . "...");
                } else {
                    echo "  " . CliUI::GREEN . "✔" . CliUI::RESET . " Contract [" . CliUI::BOLD . $contractNum . CliUI::RESET . "] compiled for " . $client['name'] . ".\n";
                }
            } catch (Exception $e) {
                CliUI::error("Failed batch compilation for {$client['name']}: " . $e->getMessage());
            }

            usleep(50000); // Small 50ms throttling buffer
        }

        $msg = "Batch processing complete. Generated contracts: {$generatedCount}";
        if ($headlessMode) {
            CliUI::stepLog($msg);
        } else {
            echo "\n " . CliUI::GREEN . "✔ " . $msg . CliUI::RESET . "\n";
        }
    }

    private function auditContractsLedger(): void {
        CliUI::header("Contracts Audit Ledger & Cryptographic Verification");
        $contracts = $this->repo->getContracts();

        if (empty($contracts)) {
            CliUI::info("No contracts found in the vault.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($contracts as $c) {
            // Re-verify document integrity on disk against database SHA-256 seal
            $diskStatus = 'VERIFIED';
            if (!file_exists($c['file_path'])) {
                $diskStatus = 'MISSING';
            } else {
                $currentChecksum = hash('sha256', file_get_contents($c['file_path']));
                if (!hash_equals($c['checksum_sha256'], $currentChecksum)) {
                    $diskStatus = 'TAMPERED';
                }
            }

            $tableData[] = [
                'number'    => $c['contract_number'],
                'template'  => $c['template_code'],
                'client'    => strlen($c['client_name']) > 22 ? substr($c['client_name'], 0, 19) . "..." : $c['client_name'],
                'sha_short' => substr($c['checksum_sha256'], 0, 12) . "...",
                'status'    => CliUI::statusBadge($diskStatus)
            ];
        }

        CliUI::drawTable($tableData, [
            'number' => 'Contract Ref', 'template' => 'Code', 'client' => 'Client Company', 'sha_short' => 'SHA-256 Audit Seal', 'status' => 'Integrity Status'
        ]);

        CliUI::pause();
    }

    private function viewTemplatesList(): void {
        CliUI::header("Registered Contract Templates");
        $templates = $this->repo->getTemplates();

        $tableData = [];
        foreach ($templates as $t) {
            $tokens = json_decode($t['required_tokens'], true);
            $tableData[] = [
                'code'        => $t['code'],
                'title'       => $t['title'],
                'token_count' => count($tokens) . " required tokens"
            ];
        }

        CliUI::drawTable($tableData, [
            'code' => 'Template Code', 'title' => 'Legal Agreement Title', 'token_count' => 'Schema Variables'
        ]);

        CliUI::pause();
    }
}

// ==========================================
// 5. Global Runtime Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Monitoring Guard: Contract generation engines require standard console CLI environments.");
}

$app = new ContractGeneratorApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--batch') {
    $app->runBatchGeneration(true);
} else {
    $app->launchWorkspace();
}
