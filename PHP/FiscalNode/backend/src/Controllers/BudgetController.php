<?php
namespace FiscalNode\Controllers;

use FiscalNode\Database;
use PDO;
use PDOException;

class BudgetController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    // GET /api/budgets
    public function index() {
        try {
            // Try to fetch from the View which handles the aggregation
            $stmt = $this->db->query("SELECT * FROM view_budget_burn_rates ORDER BY id ASC");
            $budgets = $stmt->fetchAll();
        } catch (PDOException $e) {
            // Check if it's a table missing error
            if (strpos($e->getMessage(), "doesn't exist") !== false && strpos($e->getMessage(), 'budgets') !== false) {
                http_response_code(503);
                echo json_encode([
                    'error' => 'Database tables not initialized',
                    'message' => 'Please initialize the database first by calling POST /api/setup/database',
                    'details' => $e->getMessage()
                ]);
                return;
            }
            // View doesn't exist, fallback to calculating stats manually
            $budgets = $this->getBudgetsWithStats();
        }
        
        // Convert flat list to tree for the UI
        echo json_encode(['data' => $this->buildTree($budgets)]);
    }

    // POST /api/budgets
    public function store() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        if (!isset($input['name']) || empty(trim($input['name']))) {
            http_response_code(400);
            echo json_encode(['error' => 'Budget name is required']);
            return;
        }

        if (!isset($input['limit_amount'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Limit amount is required']);
            return;
        }

        // Validate and sanitize inputs
        $name = trim($input['name']);
        $limitAmount = filter_var($input['limit_amount'], FILTER_VALIDATE_FLOAT);
        
        if ($limitAmount === false || $limitAmount < 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid limit amount: must be a positive number']);
            return;
        }

        // Optional parent_id validation
        $parentId = null;
        if (isset($input['parent_id']) && !empty($input['parent_id'])) {
            $parentId = filter_var($input['parent_id'], FILTER_VALIDATE_INT);
            if ($parentId === false || $parentId < 1) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid parent_id: must be a positive integer']);
                return;
            }

            // Verify parent budget exists
            try {
                $parentCheck = $this->db->prepare("SELECT id FROM budgets WHERE id = ?");
                $parentCheck->execute([$parentId]);
                if ($parentCheck->rowCount() === 0) {
                    http_response_code(404);
                    echo json_encode([
                        'error' => 'Parent budget not found',
                        'message' => "Parent budget with ID {$parentId} does not exist",
                        'parent_id' => $parentId
                    ]);
                    return;
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to validate parent budget: ' . $e->getMessage()]);
                return;
            }
        }

        try {
            $this->db->beginTransaction();

            // Insert new budget
            $stmt = $this->db->prepare("
                INSERT INTO budgets (name, limit_amount, parent_id) 
                VALUES (?, ?, ?)
            ");

            $stmt->execute([
                $name,
                $limitAmount,
                $parentId
            ]);

            $budgetId = $this->db->lastInsertId();

            $this->db->commit();

            http_response_code(201);
            echo json_encode([
                'message' => 'Budget created successfully',
                'id' => $budgetId,
                'budget' => [
                    'id' => $budgetId,
                    'name' => $name,
                    'limit_amount' => $limitAmount,
                    'parent_id' => $parentId
                ]
            ]);

        } catch (PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            // Check for specific error types
            if (strpos($e->getMessage(), "doesn't exist") !== false) {
                http_response_code(503);
                echo json_encode([
                    'error' => 'Database tables not initialized',
                    'message' => 'Please initialize the database first by calling POST /api/setup/database',
                    'details' => $e->getMessage()
                ]);
            } elseif (strpos($e->getMessage(), 'foreign key constraint') !== false || 
                      strpos($e->getMessage(), '1452') !== false) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Invalid parent budget reference',
                    'message' => "Parent budget with ID {$parentId} does not exist",
                    'parent_id' => $parentId
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create budget: ' . $e->getMessage()]);
            }
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create budget: ' . $e->getMessage()]);
        }
    }

    // GET /api/budgets/:id
    public function show($id) {
        try {
            // Try to fetch from the view
            $stmt = $this->db->prepare("SELECT * FROM view_budget_burn_rates WHERE id = ?");
            $stmt->execute([$id]);
            $budget = $stmt->fetch();
        } catch (PDOException $e) {
            // Check if it's a table missing error
            if (strpos($e->getMessage(), "doesn't exist") !== false && strpos($e->getMessage(), 'budgets') !== false) {
                http_response_code(503);
                echo json_encode([
                    'error' => 'Database tables not initialized',
                    'message' => 'Please initialize the database first by calling POST /api/setup/database',
                    'details' => $e->getMessage()
                ]);
                return;
            }
            // View doesn't exist, fallback to manual calculation
            $budgets = $this->getBudgetsWithStats();
            $budget = null;
            foreach ($budgets as $b) {
                if ($b['id'] == $id) {
                    $budget = $b;
                    break;
                }
            }
        }

        if (!$budget) {
            http_response_code(404);
            echo json_encode(['error' => 'Budget not found']);
            return;
        }

        // Fetch transactions for deep dive
        $transStmt = $this->db->prepare("SELECT * FROM transactions WHERE budget_id = ? ORDER BY transaction_date DESC");
        $transStmt->execute([$id]);
        $transactions = $transStmt->fetchAll();

        // Predictive Analytics
        // Logic: passed days / total days in month vs spent %
        $directSpend = $budget['direct_spend'] ?? 0;
        $prediction = $this->calculatePrediction($budget['limit_amount'], $directSpend);

        echo json_encode([
            'budget' => $budget,
            'transactions' => $transactions,
            'prediction' => $prediction
        ]);
    }

    // Fallback method when view doesn't exist - calculates stats manually
    private function getBudgetsWithStats() {
        $query = "
            SELECT 
                b.id,
                b.parent_id,
                b.name,
                b.limit_amount,
                COALESCE(ms.total_spent, 0) as direct_spend,
                (COALESCE(ms.total_spent, 0) / NULLIF(b.limit_amount, 0)) * 100 as burn_rate_percentage,
                (b.limit_amount - COALESCE(ms.total_spent, 0)) as remaining_balance
            FROM budgets b
            LEFT JOIN (
                SELECT 
                    budget_id, 
                    SUM(amount) as total_spent 
                FROM transactions 
                WHERE DATE_FORMAT(transaction_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
                GROUP BY budget_id
            ) ms ON b.id = ms.budget_id
            ORDER BY b.id ASC
        ";
        $stmt = $this->db->query($query);
        return $stmt->fetchAll();
    }

    private function buildTree(array $elements, $parentId = null) {
        $branch = array();
        foreach ($elements as $element) {
            if ($element['parent_id'] == $parentId) {
                $children = $this->buildTree($elements, $element['id']);
                if ($children) {
                    $element['children'] = $children;
                }
                $branch[] = $element;
            }
        }
        return $branch;
    }

    // "Senior UX: The 'Budget Health' Dashboard" logic
    private function calculatePrediction($limit, $spent) {
        if ($limit <= 0) return ['status' => 'N/A', 'message' => 'No limit set'];

        $dayOfMonth = (int)date('j');
        $daysInMonth = (int)date('t');
        $monthProgress = $dayOfMonth / $daysInMonth; // e.g., 0.5 for mid-month
        $spendProgress = $spent / $limit; // e.g., 0.7 for 70%

        // "If it's day 15 (0.5) and they've spent 70% (0.7)..."
        // On Track means Spend Progress <= Month Progress (roughly)
        
        $status = 'on_track';
        $projectedTotal = ($spent / $dayOfMonth) * $daysInMonth;
        $projectedOverage = $projectedTotal - $limit;

        if ($spendProgress > $monthProgress) {
            $status = 'danger'; // Overspending
        } elseif ($spendProgress > ($monthProgress * 0.9)) {
            $status = 'warning'; // Close to overspending
        }

        return [
            'status' => $status,
            'month_progress_pct' => round($monthProgress * 100, 1),
            'spend_pct' => round($spendProgress * 100, 1),
            'projected_total' => round($projectedTotal, 2),
            'projected_overage' => $projectedOverage > 0 ? round($projectedOverage, 2) : 0
        ];
    }
}
