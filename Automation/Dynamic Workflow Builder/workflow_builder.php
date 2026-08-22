#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Dynamic Workflow Builder & DAG Execution Engine
 * 
 * Usage:
 *   php workflow_builder.php                (Interactive TUI Workflow Workspace)
 *   php workflow_builder.php --run=WF-USER  (Headless Direct Workflow Execution)
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
        echo self::CYAN . self::BOLD;
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
        echo "\n" . self::DIM . "Press Enter to return to workflow builder console..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . "ℹ [INFO] " . self::RESET . $msg . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[WORKFLOW-ENGINE] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'COMPLETED', 'ACTIVE' => self::GREEN . self::BOLD . " COMPLETED " . self::RESET,
            'RUNNING', 'PENDING'  => self::YELLOW . "  RUNNING  " . self::RESET,
            'QUEUED'              => self::BLUE . "  QUEUED   " . self::RESET,
            'FAILED', 'HALTED'    => self::RED . self::BOLD . "  FAILED   " . self::RESET,
            default               => $status
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

    public static function renderDagTopology(array $steps): void {
        echo self::BOLD . "WORKFLOW TOPOLOGY (DAG MAPPING):" . self::RESET . "\n";
        $total = count($steps);
        $i = 0;
        foreach ($steps as $key => $node) {
            $i++;
            $isLast = ($i === $total);
            $prefix = $isLast ? "└──" : "├──";
            $nextList = !empty($node['next']) ? implode(', ', $node['next']) : 'TERMINATE';
            
            echo "  {$prefix} [" . self::YELLOW . $key . self::RESET . "] Type: " . self::CYAN . $node['type'] . self::RESET . " ──► Next: (" . self::GREEN . $nextList . self::RESET . ")\n";
        }
        echo "\n";
    }
}

// ==========================================
// 2. Data Persistence Layer (SQLite Vault)
// ==========================================
class WorkflowRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/workflow_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Workflow Definitions Registry
        $this->db->exec("CREATE TABLE IF NOT EXISTS workflow_definitions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            dag_definition TEXT NOT NULL, -- JSON DAG step graph
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Workflow Execution Instances
        $this->db->exec("CREATE TABLE IF NOT EXISTS workflow_instances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instance_code TEXT UNIQUE NOT NULL,
            workflow_id INTEGER NOT NULL,
            status TEXT DEFAULT 'QUEUED', -- QUEUED, RUNNING, COMPLETED, FAILED
            current_context TEXT NOT NULL, -- JSON context state dictionary
            current_step TEXT DEFAULT NULL,
            error_message TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workflow_id) REFERENCES workflow_definitions(id)
        )");

        // Atomic Step Execution Log
        $this->db->exec("CREATE TABLE IF NOT EXISTS step_executions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instance_id INTEGER NOT NULL,
            step_key TEXT NOT NULL,
            status TEXT NOT NULL, -- COMPLETED, FAILED
            input_snapshot TEXT NOT NULL,
            output_snapshot TEXT NOT NULL,
            execution_time_ms REAL NOT NULL,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (instance_id) REFERENCES workflow_instances(id)
        )");

        // Cryptographic Audit Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS workflow_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instance_id INTEGER NOT NULL,
            step_key TEXT NOT NULL,
            action_taken TEXT NOT NULL,
            signature_hash TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (instance_id) REFERENCES workflow_instances(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_wf_status ON workflow_instances(status)");

        if ($this->db->query("SELECT COUNT(*) FROM workflow_definitions")->fetchColumn() == 0) {
            $this->seedBaselineWorkflows();
        }
    }

    private function seedBaselineWorkflows(): void {
        // Seed 1: User Onboarding Pipeline
        $onboardingDag = [
            'initial_step' => 'validate_payload',
            'steps' => [
                'validate_payload' => [
                    'type' => 'VALIDATE_SCHEMA',
                    'required_fields' => ['email', 'full_name', 'account_type'],
                    'next' => ['enrich_profile']
                ],
                'enrich_profile' => [
                    'type' => 'TRANSFORM_CONTEXT',
                    'transform_action' => 'ENRICH_USER_METADATA',
                    'next' => ['check_enterprise_tier']
                ],
                'check_enterprise_tier' => [
                    'type' => 'CONDITIONAL_BRANCH',
                    'condition_field' => 'account_type',
                    'condition_value' => 'ENTERPRISE',
                    'on_true' => 'provision_vip_channel',
                    'on_false' => 'send_standard_welcome',
                    'next' => ['provision_vip_channel', 'send_standard_welcome']
                ],
                'provision_vip_channel' => [
                    'type' => 'DISPATCH_WEBHOOK',
                    'target_channel' => 'SLACK_VIP_NOTIFY',
                    'next' => ['send_standard_welcome']
                ],
                'send_standard_welcome' => [
                    'type' => 'TERMINATE_NOTIFY',
                    'message' => 'Welcome email dispatched & onboarding finalized.',
                    'next' => []
                ]
            ]
        ];

        $stmt = $this->db->prepare("INSERT INTO workflow_definitions (code, name, description, dag_definition) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            'WF-ONBOARD',
            'Customer Registration & VIP Routing Engine',
            'Validates inbound registration, branches enterprise customers, and alerts support.',
            json_encode($onboardingDag, JSON_PRETTY_PRINT)
        ]);

        // Seed 2: Order Fulfillment & Inventory Quarantine Pipeline
        $orderDag = [
            'initial_step' => 'verify_funds',
            'steps' => [
                'verify_funds' => [
                    'type' => 'VALIDATE_SCHEMA',
                    'required_fields' => ['order_id', 'amount', 'stock_available'],
                    'next' => ['evaluate_inventory']
                ],
                'evaluate_inventory' => [
                    'type' => 'CONDITIONAL_BRANCH',
                    'condition_field' => 'stock_available',
                    'condition_value' => true,
                    'on_true' => 'allocate_stock',
                    'on_false' => 'quarantine_backorder',
                    'next' => ['allocate_stock', 'quarantine_backorder']
                ],
                'allocate_stock' => [
                    'type' => 'TRANSFORM_CONTEXT',
                    'transform_action' => 'REDUCE_INVENTORY_COUNT',
                    'next' => ['dispatch_shipment']
                ],
                'quarantine_backorder' => [
                    'type' => 'TERMINATE_NOTIFY',
                    'message' => 'Insufficient stock: order held in quarantine queue.',
                    'next' => []
                ],
                'dispatch_shipment' => [
                    'type' => 'TERMINATE_NOTIFY',
                    'message' => 'Warehouse dispatch ticket generated.',
                    'next' => []
                ]
            ]
        ];

        $stmt->execute([
            'WF-FULFILL',
            'Order Settlement & Warehouse Routing',
            'Evaluates settlement funds, checks stock levels, and generates warehouse dispatches.',
            json_encode($orderDag, JSON_PRETTY_PRINT)
        ]);
    }

    public function getWorkflows(): array {
        return $this->db->query("SELECT * FROM workflow_definitions ORDER BY id ASC")->fetchAll();
    }

    public function getWorkflowByCode(string $code): ?array {
        $stmt = $this->db->prepare("SELECT * FROM workflow_definitions WHERE code = ?");
        $stmt->execute([trim($code)]);
        return $stmt->fetch() ?: null;
    }

    public function createInstance(int $workflowId, array $initialContext): string {
        $code = "INST-" . date('Ymd') . "-" . strtoupper(bin2hex(random_bytes(4)));
        $stmt = $this->db->prepare("
            INSERT INTO workflow_instances (instance_code, workflow_id, current_context, status) 
            VALUES (?, ?, ?, 'QUEUED')
        ");
        $stmt->execute([$code, $workflowId, json_encode($initialContext)]);
        return $code;
    }

    public function getInstanceByCode(string $code): ?array {
        $stmt = $this->db->prepare("
            SELECT i.*, w.code as workflow_code, w.name as workflow_name, w.dag_definition 
            FROM workflow_instances i
            JOIN workflow_definitions w ON i.workflow_id = w.id
            WHERE i.instance_code = ?
        ");
        $stmt->execute([trim($code)]);
        return $stmt->fetch() ?: null;
    }

    public function updateInstanceStatus(int $id, string $status, array $context, ?string $currentStep = null, ?string $error = null): void {
        $stmt = $this->db->prepare("
            UPDATE workflow_instances 
            SET status = ?, current_context = ?, current_step = ?, error_message = ?, updated_at = datetime('now')
            WHERE id = ?
        ");
        $stmt->execute([$status, json_encode($context), $currentStep, $error, $id]);
    }

    public function logStepExecution(int $instanceId, string $stepKey, string $status, array $input, array $output, float $timeMs): void {
        $stmt = $this->db->prepare("
            INSERT INTO step_executions (instance_id, step_key, status, input_snapshot, output_snapshot, execution_time_ms)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$instanceId, $stepKey, $status, json_encode($input), json_encode($output), $timeMs]);
    }

    public function logAudit(int $instanceId, string $stepKey, string $action, array $contextSnapshot): void {
        $sigPayload = "{$instanceId}|{$stepKey}|{$action}|" . json_encode($contextSnapshot) . "|" . microtime();
        $signature = hash('sha256', $sigPayload);

        $stmt = $this->db->prepare("
            INSERT INTO workflow_audit_logs (instance_id, step_key, action_taken, signature_hash)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$instanceId, $stepKey, $action, $signature]);
    }

    public function getStepExecutions(int $instanceId): array {
        $stmt = $this->db->prepare("SELECT * FROM step_executions WHERE instance_id = ? ORDER BY id ASC");
        $stmt->execute([$instanceId]);
        return $stmt->fetchAll();
    }

    public function getAuditTrail(int $instanceId): array {
        $stmt = $this->db->prepare("SELECT * FROM workflow_audit_logs WHERE instance_id = ? ORDER BY id ASC");
        $stmt->execute([$instanceId]);
        return $stmt->fetchAll();
    }

    public function getGlobalInstances(): array {
        return $this->db->query("
            SELECT i.id, i.instance_code, w.name as workflow_name, i.status, i.current_step, i.updated_at
            FROM workflow_instances i
            JOIN workflow_definitions w ON i.workflow_id = w.id
            ORDER BY i.id DESC LIMIT 25
        ")->fetchAll();
    }

    public function getPDO(): PDO {
        return $this->db;
    }
}

// ==========================================
// 3. Step Handler Registry & Strategy Layer
// ==========================================
interface StepHandlerInterface {
    public function execute(array $context, array $config): array;
}

class ValidateSchemaHandler implements StepHandlerInterface {
    public function execute(array $context, array $config): array {
        $required = $config['required_fields'] ?? [];
        foreach ($required as $field) {
            if (!array_key_exists($field, $context) || $context[$field] === null || $context[$field] === '') {
                throw new InvalidArgumentException("Schema validation failed: Missing required field [{$field}].");
            }
        }
        $context['_schema_validated'] = true;
        return ['status' => 'CONTINUE', 'next_step' => $config['next'][0] ?? null, 'context' => $context];
    }
}

class TransformContextHandler implements StepHandlerInterface {
    public function execute(array $context, array $config): array {
        $action = $config['transform_action'] ?? 'DEFAULT';
        
        match ($action) {
            'ENRICH_USER_METADATA' => (function() use (&$context) {
                $context['tier_level'] = ($context['account_type'] === 'ENTERPRISE') ? 'TIER_1_VIP' : 'TIER_3_STANDARD';
                $context['assigned_region'] = 'US-EAST-1';
                $context['profile_initialized_at'] = date('Y-m-d H:i:s');
            })(),
            'REDUCE_INVENTORY_COUNT' => (function() use (&$context) {
                $context['inventory_allocated'] = true;
                $context['tracking_ref'] = "TRK-" . rand(100000, 999999);
            })(),
            default => null
        };

        return ['status' => 'CONTINUE', 'next_step' => $config['next'][0] ?? null, 'context' => $context];
    }
}

class ConditionalBranchHandler implements StepHandlerInterface {
    public function execute(array $context, array $config): array {
        $field = $config['condition_field'];
        $expected = $config['condition_value'];
        $actual = $context[$field] ?? null;

        $match = ($actual === $expected);
        $next = $match ? $config['on_true'] : $config['on_false'];

        $context['_last_branch_decision'] = [
            'field' => $field,
            'matched' => $match,
            'routed_to' => $next
        ];

        return ['status' => 'BRANCH', 'next_step' => $next, 'context' => $context];
    }
}

class DispatchWebhookHandler implements StepHandlerInterface {
    public function execute(array $context, array $config): array {
        // Simulate external API/Webhook dispatch with latency
        usleep(100000); // 100ms HTTP connection simulation
        $context['_webhook_dispatched'] = true;
        $context['_webhook_target'] = $config['target_channel'];

        return ['status' => 'CONTINUE', 'next_step' => $config['next'][0] ?? null, 'context' => $context];
    }
}

class TerminateNotifyHandler implements StepHandlerInterface {
    public function execute(array $context, array $config): array {
        $context['_terminal_message'] = $config['message'] ?? 'Workflow ended.';
        return ['status' => 'TERMINATE', 'next_step' => null, 'context' => $context];
    }
}

// ==========================================
// 4. DAG Orchestration & Execution Pipeline
// ==========================================
class WorkflowOrchestrator {
    private array $handlers = [];

    public function __construct(private WorkflowRepository $repo) {
        $this->handlers['VALIDATE_SCHEMA']     = new ValidateSchemaHandler();
        $this->handlers['TRANSFORM_CONTEXT']   = new TransformContextHandler();
        $this->handlers['CONDITIONAL_BRANCH']  = new ConditionalBranchHandler();
        $this->handlers['DISPATCH_WEBHOOK']    = new DispatchWebhookHandler();
        $this->handlers['TERMINATE_NOTIFY']    = new TerminateNotifyHandler();
    }

    /**
     * Executes an instance step-by-step through its DAG topology.
     */
    public function runInstance(string $instanceCode, bool $silent = false): array {
        $instance = $this->repo->getInstanceByCode($instanceCode);
        if (!$instance) {
            return ['success' => false, 'message' => "Instance [{$instanceCode}] not found."];
        }

        $dag = json_decode($instance['dag_definition'], true);
        $context = json_decode($instance['current_context'], true);
        $currentStepKey = $instance['current_step'] ?? $dag['initial_step'];

        $this->repo->updateInstanceStatus((int)$instance['id'], 'RUNNING', $context, $currentStepKey);

        if (!$silent) {
            CliUI::stepLog("Initiating execution for instance [{$instanceCode}] ({$instance['workflow_name']})...");
        }

        $executionStepsCount = 0;

        while ($currentStepKey !== null) {
            if (!isset($dag['steps'][$currentStepKey])) {
                $error = "Graph fault: Node [{$currentStepKey}] is not defined in DAG specification.";
                $this->repo->updateInstanceStatus((int)$instance['id'], 'FAILED', $context, $currentStepKey, $error);
                return ['success' => false, 'message' => $error];
            }

            $stepConfig = $dag['steps'][$currentStepKey];
            $handlerType = $stepConfig['type'];

            if (!isset($this->handlers[$handlerType])) {
                $error = "Execution fault: No registered handler for step type [{$handlerType}].";
                $this->repo->updateInstanceStatus((int)$instance['id'], 'FAILED', $context, $currentStepKey, $error);
                return ['success' => false, 'message' => $error];
            }

            $start = microtime(true);
            try {
                $handler = $this->handlers[$handlerType];
                $res = $handler->execute($context, $stepConfig);
                $duration = round((microtime(true) - $start) * 1000, 2);

                // Commit State Snapshots
                $newContext = $res['context'];
                $this->repo->logStepExecution((int)$instance['id'], $currentStepKey, 'COMPLETED', $context, $newContext, $duration);
                $this->repo->logAudit((int)$instance['id'], $currentStepKey, 'NODE_COMPLETED', $newContext);

                $context = $newContext;
                $currentStepKey = $res['next_step'];
                $executionStepsCount++;

                if (!$silent) {
                    CliUI::stepLog("Node [" . CliUI::YELLOW . $stepConfig['type'] . CliUI::RESET . "] completed in {$duration}ms. Transition ──► Next: (" . ($currentStepKey ?: 'END') . ")");
                }

                if ($res['status'] === 'TERMINATE' || $currentStepKey === null) {
                    break;
                }

            } catch (Exception $e) {
                $duration = round((microtime(true) - $start) * 1000, 2);
                $this->repo->logStepExecution((int)$instance['id'], $currentStepKey, 'FAILED', $context, ['error' => $e->getMessage()], $duration);
                $this->repo->logAudit((int)$instance['id'], $currentStepKey, 'NODE_FAILED', ['error' => $e->getMessage()]);
                $this->repo->updateInstanceStatus((int)$instance['id'], 'FAILED', $context, $currentStepKey, $e->getMessage());

                if (!$silent) {
                    CliUI::stepLog(CliUI::RED . "Node [{$currentStepKey}] FAILED: " . $e->getMessage() . CliUI::RESET);
                }
                return ['success' => false, 'message' => $e->getMessage(), 'failed_at' => $currentStepKey];
            }
        }

        $this->repo->updateInstanceStatus((int)$instance['id'], 'COMPLETED', $context, null);
        
        if (!$silent) {
            CliUI::stepLog(CliUI::GREEN . "Workflow Instance completed successfully across {$executionStepsCount} nodes." . CliUI::RESET);
        }

        return ['success' => true, 'instance_code' => $instanceCode, 'final_context' => $context];
    }
}

// ==========================================
// 5. Main Application Console Loop
// ==========================================
class WorkflowConsoleApp {
    private WorkflowRepository $repo;
    private WorkflowOrchestrator $orchestrator;

    public function __construct() {
        $this->repo = new WorkflowRepository();
        $this->orchestrator = new WorkflowOrchestrator($this->repo);
    }

    public function launchWorkspace(): void {
        while (true) {
            $workflows = $this->repo->getWorkflows();
            CliUI::header("Dynamic Workflow Builder & DAG Engine", "Active Registered Topologies: " . count($workflows));

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Execute Workflow Instance (Run Interactive Wizard)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Inspect Workflow Topologies & DAG Hierarchies\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Output Global Instance Execution Registry\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Inspect Step-by-Step Context Transitions\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Audit Cryptographic SHA-256 Hashes\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect workflow workspace\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->instantiateWizard(); break;
                case '2': $this->viewTopologies(); break;
                case '3': $this->viewInstances(); break;
                case '4': $this->viewStepTransitions(); break;
                case '5': $this->auditTrailFlow(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Workflow engine unmounted safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function instantiateWizard(): void {
        CliUI::header("Instantiate Workflow Pipeline");
        $workflows = $this->repo->getWorkflows();

        echo " Available Workflow Blueprints:\n";
        foreach ($workflows as $w) {
            echo "  [" . CliUI::CYAN . $w['code'] . CliUI::RESET . "] {$w['name']}\n";
        }
        echo "\n";

        $code = strtoupper(CliUI::prompt("Enter Blueprint Code", "WF-ONBOARD"));
        $wf = $this->repo->getWorkflowByCode($code);

        if (!$wf) {
            CliUI::error("Workflow code not recognized.");
            CliUI::pause();
            return;
        }

        echo "\n Initializing Context Payload Parameters:\n";
        $initialContext = [];

        if ($code === 'WF-ONBOARD') {
            $initialContext['email'] = CliUI::prompt("  • User Email", "jane.doe@enterprise.org");
            $initialContext['full_name'] = CliUI::prompt("  • Full Name", "Jane Doe");
            $initialContext['account_type'] = strtoupper(CliUI::prompt("  • Account Type (STANDARD / ENTERPRISE)", "ENTERPRISE"));
        } else {
            $initialContext['order_id'] = CliUI::prompt("  • Order ID", "ORD-9901");
            $initialContext['amount'] = (float)CliUI::prompt("  • Order Amount ($)", "450.00");
            $initialContext['stock_available'] = (CliUI::prompt("  • Stock Available in Warehouse (Y/N)", "Y") === 'Y');
        }

        $instCode = $this->repo->createInstance((int)$wf['id'], $initialContext);
        CliUI::info("Instance [{$instCode}] queued. Triggering pipeline execution...");
        echo "\n";

        $res = $this->orchestrator->runInstance($instCode, false);

        if ($res['success']) {
            CliUI::success("Workflow run completed without errors.");
        } else {
            CliUI::error("Execution aborted: " . $res['message']);
        }

        CliUI::pause();
    }

    private function viewTopologies(): void {
        CliUI::header("Workflow DAG Topologies");
        $workflows = $this->repo->getWorkflows();

        foreach ($workflows as $w) {
            echo " " . CliUI::BOLD . "BLUEPRINT: " . $w['name'] . " (" . CliUI::CYAN . $w['code'] . CliUI::RESET . ")\n";
            echo " " . CliUI::DIM . $w['description'] . CliUI::RESET . "\n\n";

            $dag = json_decode($w['dag_definition'], true);
            CliUI::renderDagTopology($dag['steps']);
            echo str_repeat("─", 75) . "\n\n";
        }

        CliUI::pause();
    }

    private function viewInstances(): void {
        CliUI::header("Global Instance Execution Registry");
        $instances = $this->repo->getGlobalInstances();

        $tableData = [];
        foreach ($instances as $i) {
            $tableData[] = [
                'id'       => $i['id'],
                'code'     => $i['instance_code'],
                'workflow' => $i['workflow_name'],
                'step'     => $i['current_step'] ?: 'COMPLETED',
                'status'   => CliUI::statusBadge($i['status']),
                'updated'  => $i['updated_at']
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'code' => 'Instance Code', 'workflow' => 'Blueprint', 'step' => 'Current Node', 'status' => 'State', 'updated' => 'Timestamp'
        ]);

        CliUI::pause();
    }

    private function viewStepTransitions(): void {
        CliUI::header("Step-by-Step Context Transitions");
        $code = CliUI::prompt("Enter Instance Code (e.g. INST-...)");

        $instance = $this->repo->getInstanceByCode($code);
        if (!$instance) {
            CliUI::error("Instance Code not found.");
            CliUI::pause();
            return;
        }

        $steps = $this->repo->getStepExecutions((int)$instance['id']);
        if (empty($steps)) {
            CliUI::info("No recorded step executions for this instance.");
            CliUI::pause();
            return;
        }

        echo "\n " . CliUI::BOLD . "EXECUTION NODE TRANSITIONS FOR [{$code}]:" . CliUI::RESET . "\n";
        foreach ($steps as $s) {
            $color = ($s['status'] === 'COMPLETED') ? CliUI::GREEN : CliUI::RED;
            echo "  ├─ Node: " . CliUI::BOLD . $s['step_key'] . CliUI::RESET . " (" . $color . $s['status'] . CliUI::RESET . " in {$s['execution_time_ms']}ms)\n";
            echo "  │  Output State: " . CliUI::DIM . $s['output_snapshot'] . CliUI::RESET . "\n";
        }
        echo "  └─ Pipeline Complete.\n";

        CliUI::pause();
    }

    private function auditTrailFlow(): void {
        CliUI::header("Compliance Audit Trail Extraction");
        $code = CliUI::prompt("Enter Instance Code");

        $instance = $this->repo->getInstanceByCode($code);
        if (!$instance) {
            CliUI::error("Instance not found.");
            CliUI::pause();
            return;
        }

        $logs = $this->repo->getAuditTrail((int)$instance['id']);
        if (empty($logs)) {
            CliUI::error("No audit logs found for that instance.");
            CliUI::pause();
            return;
        }

        echo "\n " . CliUI::BOLD . "CHRONOLOGICAL AUDIT TRAIL FOR [{$code}]:" . CliUI::RESET . "\n";
        foreach ($logs as $l) {
            echo "  ├─ [" . $l['timestamp'] . "] Node: " . CliUI::BOLD . $l['step_key'] . CliUI::RESET . "\n";
            echo "  │  Action Taken : " . CliUI::CYAN . $l['action_taken'] . CliUI::RESET . "\n";
            echo "  │  SHA-256 Sig  : " . CliUI::YELLOW . substr($l['signature_hash'], 0, 16) . "..." . CliUI::RESET . "\n";
        }
        echo "  └─ End of Sequence Analysis.\n";

        CliUI::pause();
    }

    public function runDirect(string $wfCode): void {
        $wf = $this->repo->getWorkflowByCode($wfCode);
        if (!$wf) {
            CliUI::error("Workflow code [{$wfCode}] not found.");
            exit(1);
        }

        $defaultContext = [
            'email' => 'daemon.test@enterprise.org',
            'full_name' => 'Automated Daemon',
            'account_type' => 'ENTERPRISE',
            'order_id' => 'ORD-AUTO',
            'amount' => 120.00,
            'stock_available' => true
        ];

        $code = $this->repo->createInstance((int)$wf['id'], $defaultContext);
        $this->orchestrator->runInstance($code, true);
        CliUI::stepLog("Direct execution finished. Instance [{$code}] => COMPLETED.");
    }
}

// ==========================================
// 6. Global Runtime Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Guard: Dynamic Workflow Builder requires a standard console CLI environment.\n");
}

$app = new WorkflowConsoleApp();

$runArg = null;
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--run=')) {
        $runArg = substr($arg, 6);
    }
}

if ($runArg !== null) {
    $app->runDirect($runArg);
} else {
    $app->launchWorkspace();
}
