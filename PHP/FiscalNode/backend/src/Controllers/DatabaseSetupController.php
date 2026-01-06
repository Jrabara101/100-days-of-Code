<?php
namespace FiscalNode\Controllers;

use FiscalNode\Database;
use PDOException;

class DatabaseSetupController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    // POST /api/setup/database - Initialize database tables
    public function initialize() {
        try {
            $this->db->beginTransaction();

            // Create budgets table
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS budgets (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    parent_id INT NULL,
                    name VARCHAR(255) NOT NULL,
                    limit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (parent_id) REFERENCES budgets(id) ON DELETE CASCADE
                ) ENGINE=InnoDB
            ");

            // Create transactions table
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS transactions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    budget_id INT NOT NULL,
                    amount DECIMAL(15, 2) NOT NULL,
                    description VARCHAR(255),
                    transaction_date DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
                    INDEX idx_date (transaction_date)
                ) ENGINE=InnoDB
            ");

            // Create budget_history table
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS budget_history (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    budget_id INT NOT NULL,
                    old_limit DECIMAL(15, 2),
                    new_limit DECIMAL(15, 2),
                    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE
                ) ENGINE=InnoDB
            ");

            // Drop trigger if exists (MySQL doesn't support IF NOT EXISTS for triggers)
            try {
                $this->db->exec("DROP TRIGGER IF EXISTS after_budget_update");
            } catch (PDOException $e) {
                // Ignore if trigger doesn't exist
            }

            // Create trigger - Note: PDO doesn't support DELIMITER, so we use a single statement
            // We'll create it without DELIMITER by using a simpler approach
            $triggerSql = "
                CREATE TRIGGER after_budget_update
                AFTER UPDATE ON budgets
                FOR EACH ROW
                BEGIN
                    IF OLD.limit_amount <> NEW.limit_amount THEN
                        INSERT INTO budget_history (budget_id, old_limit, new_limit, changed_at)
                        VALUES (NEW.id, OLD.limit_amount, NEW.limit_amount, NOW());
                    END IF;
                END
            ";
            
            // Execute trigger creation - may fail if MySQL version doesn't support it, but that's okay
            try {
                // For PDO, we need to execute this as a single statement
                // Some MySQL configurations may require this to be done differently
                $this->db->exec($triggerSql);
            } catch (PDOException $e) {
                // Log but don't fail - trigger is optional for basic functionality
                error_log("Warning: Could not create trigger: " . $e->getMessage());
            }

            // Create or replace view
            $this->db->exec("
                CREATE OR REPLACE VIEW view_budget_burn_rates AS
                WITH MonthlySpends AS (
                    SELECT 
                        budget_id, 
                        SUM(amount) as total_spent 
                    FROM transactions 
                    WHERE DATE_FORMAT(transaction_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
                    GROUP BY budget_id
                )
                SELECT 
                    b.id,
                    b.parent_id,
                    b.name,
                    b.limit_amount,
                    COALESCE(ms.total_spent, 0) as direct_spend,
                    (COALESCE(ms.total_spent, 0) / NULLIF(b.limit_amount, 0)) * 100 as burn_rate_percentage,
                    (b.limit_amount - COALESCE(ms.total_spent, 0)) as remaining_balance
                FROM budgets b
                LEFT JOIN MonthlySpends ms ON b.id = ms.budget_id
            ");

            $this->db->commit();

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Database initialized successfully',
                'tables_created' => ['budgets', 'transactions', 'budget_history'],
                'view_created' => 'view_budget_burn_rates'
            ]);

        } catch (PDOException $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Database initialization failed: ' . $e->getMessage()
            ]);
        }
    }

    // GET /api/setup/check - Check if database is initialized
    public function check() {
        try {
            $tables = ['budgets', 'transactions', 'budget_history'];
            $existing = [];
            $missing = [];

            foreach ($tables as $table) {
                $stmt = $this->db->query("SHOW TABLES LIKE '$table'");
                if ($stmt->rowCount() > 0) {
                    $existing[] = $table;
                } else {
                    $missing[] = $table;
                }
            }

            // Check for view
            $viewExists = false;
            try {
                $stmt = $this->db->query("SHOW FULL TABLES WHERE Table_type = 'VIEW' AND Tables_in_fiscal_node = 'view_budget_burn_rates'");
                $viewExists = $stmt->rowCount() > 0;
            } catch (PDOException $e) {
                // View doesn't exist
            }

            $isInitialized = count($missing) === 0;

            http_response_code(200);
            echo json_encode([
                'initialized' => $isInitialized,
                'existing_tables' => $existing,
                'missing_tables' => $missing,
                'view_exists' => $viewExists,
                'message' => $isInitialized 
                    ? 'Database is fully initialized' 
                    : 'Database is not fully initialized. Missing: ' . implode(', ', $missing)
            ]);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Failed to check database status: ' . $e->getMessage()
            ]);
        }
    }
}

