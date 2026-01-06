<?php
namespace FiscalNode\Controllers;

use FiscalNode\Database;
use Exception;
use PDOException;

class TransactionController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    // POST /api/transactions
    public function store() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['budget_id']) || !isset($input['amount']) || !isset($input['date'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields: budget_id, amount, and date are required']);
            return;
        }

        // Validate budget_id is a number
        $budgetId = filter_var($input['budget_id'], FILTER_VALIDATE_INT);
        if ($budgetId === false) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid budget_id: must be a valid integer']);
            return;
        }

        // Validate amount is a number
        $amount = filter_var($input['amount'], FILTER_VALIDATE_FLOAT);
        if ($amount === false) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid amount: must be a valid number']);
            return;
        }

        // Validate date format
        $date = $input['date'];
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid date format: must be YYYY-MM-DD']);
            return;
        }

        try {
            // ACID Transaction Start
            $this->db->beginTransaction();

            // 1. Verify budget exists before inserting transaction
            $budgetCheck = $this->db->prepare("SELECT id FROM budgets WHERE id = ?");
            $budgetCheck->execute([$budgetId]);
            if ($budgetCheck->rowCount() === 0) {
                $this->db->rollBack();
                http_response_code(404);
                echo json_encode([
                    'error' => 'Budget not found',
                    'message' => "Budget with ID {$budgetId} does not exist. Please create the budget first.",
                    'budget_id' => $budgetId
                ]);
                return;
            }

            // 2. Prepare Statement
            $stmt = $this->db->prepare("
                INSERT INTO transactions (budget_id, amount, description, transaction_date) 
                VALUES (?, ?, ?, ?)
            ");

            // 3. Execute
            $stmt->execute([
                $budgetId,
                $amount,
                $input['description'] ?? '',
                $date
            ]);

            // 4. Update budget's updated_at timestamp
            $updateStmt = $this->db->prepare("UPDATE budgets SET updated_at = NOW() WHERE id = ?");
            $updateStmt->execute([$budgetId]);

            // Commit
            $this->db->commit();

            http_response_code(201);
            echo json_encode([
                'message' => 'Transaction logged successfully', 
                'id' => $this->db->lastInsertId(),
                'budget_id' => $budgetId
            ]);

        } catch (PDOException $e) {
            // Rollback on any error
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
                    'error' => 'Invalid budget reference',
                    'message' => "Budget with ID {$budgetId} does not exist. Please create the budget first.",
                    'budget_id' => $budgetId,
                    'details' => 'Foreign key constraint violation'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Transaction failed: ' . $e->getMessage()]);
            }
        } catch (Exception $e) {
            // Rollback on any error
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            http_response_code(500);
            echo json_encode(['error' => 'Transaction failed: ' . $e->getMessage()]);
        }
    }
}
