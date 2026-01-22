<?php

class WorkforceCommander {
    private $dbFile = 'workforce.db';
    private $pdo;

    public function __construct() {
        $this->initializeDatabase();
    }

    private function initializeDatabase() {
        $this->pdo = new PDO('sqlite:' . $this->dbFile);
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Create departments table
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY,
                name TEXT UNIQUE NOT NULL
            )
        ");

        // Create employees table
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                department_id INTEGER NOT NULL,
                salary REAL NOT NULL,
                date_hired TEXT NOT NULL,
                FOREIGN KEY(department_id) REFERENCES departments(id)
            )
        ");

        // Insert default departments
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM departments");
        $stmt->execute();
        if ($stmt->fetchColumn() == 0) {
            $departments = ['IT', 'HR', 'Sales'];
            foreach ($departments as $dept) {
                $this->pdo->exec("INSERT INTO departments (name) VALUES ('$dept')");
            }
        }
    }

    public function addEmployee() {
        echo "\n=== Add New Employee ===\n";
        $name = readline("Employee Name: ");
        $role = readline("Role: ");
        $salary = (float)readline("Salary: ");
        $dateHired = readline("Date Hired (YYYY-MM-DD): ");

        echo "\nAvailable Departments:\n";
        $depts = $this->pdo->query("SELECT id, name FROM departments")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($depts as $dept) {
            echo "{$dept['id']}. {$dept['name']}\n";
        }
        $deptId = (int)readline("Select Department ID: ");

        $stmt = $this->pdo->prepare("INSERT INTO employees (name, role, department_id, salary, date_hired) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$name, $role, $deptId, $salary, $dateHired]);
        echo "\n✓ Employee added successfully!\n";
    }

    public function listEmployees() {
        $query = "
            SELECT e.id, e.name, e.role, d.name as department, e.salary, e.date_hired 
            FROM employees e 
            JOIN departments d ON e.department_id = d.id 
            ORDER BY e.id
        ";
        $employees = $this->pdo->query($query)->fetchAll(PDO::FETCH_ASSOC);

        if (empty($employees)) {
            echo "\nNo employees found.\n";
            return;
        }

        echo "\n" . str_repeat("=", 100) . "\n";
        printf("%-5s | %-20s | %-15s | %-15s | %-12s | %-15s\n", 
               "ID", "Name", "Role", "Department", "Salary", "Date Hired");
        echo str_repeat("=", 100) . "\n";

        foreach ($employees as $emp) {
            printf("%-5d | %-20s | %-15s | %-15s | PHP%-10.2f | %-15s\n",
                   $emp['id'], $emp['name'], $emp['role'], $emp['department'], 
                   $emp['salary'], $emp['date_hired']);
        }
        echo str_repeat("=", 100) . "\n";
    }

    public function updateEmployee() {
        $id = (int)readline("\nEnter Employee ID to update: ");
        $emp = $this->pdo->prepare("SELECT * FROM employees WHERE id = ?")->execute([$id]);

        echo "\nUpdate fields (leave blank to skip):\n";
        $name = readline("New Name: ") ?: null;
        $role = readline("New Role: ") ?: null;
        $salary = readline("New Salary: ");
        $salary = $salary ? (float)$salary : null;

        if ($name) $this->pdo->prepare("UPDATE employees SET name = ? WHERE id = ?")->execute([$name, $id]);
        if ($role) $this->pdo->prepare("UPDATE employees SET role = ? WHERE id = ?")->execute([$role, $id]);
        if ($salary) $this->pdo->prepare("UPDATE employees SET salary = ? WHERE id = ?")->execute([$salary, $id]);

        echo "\n✓ Employee updated successfully!\n";
    }

    public function deleteEmployee() {
        $id = (int)readline("\nEnter Employee ID to delete: ");
        $confirm = readline("Are you sure? (y/n): ");

        if (strtolower($confirm) === 'y') {
            $this->pdo->prepare("DELETE FROM employees WHERE id = ?")->execute([$id]);
            echo "\n✓ Employee deleted successfully!\n";
        } else {
            echo "\nCancelled.\n";
        }
    }

    public function displayAnalytics() {
        echo "\n" . str_repeat("=", 60) . "\n";
        echo "ANALYTICS DASHBOARD\n";
        echo str_repeat("=", 60) . "\n";

        // Department Breakdown
        echo "\n📊 DEPARTMENT BREAKDOWN:\n";
        $deptBreakdown = $this->pdo->query("
            SELECT d.name, COUNT(e.id) as count 
            FROM departments d 
            LEFT JOIN employees e ON d.id = e.department_id 
            GROUP BY d.id
        ")->fetchAll(PDO::FETCH_ASSOC);

        foreach ($deptBreakdown as $dept) {
            echo "  {$dept['name']}: {$dept['count']} employees\n";
        }

        // Salary Insights
        echo "\n💰 SALARY INSIGHTS:\n";
        $salaryInsights = $this->pdo->query("
            SELECT d.name, AVG(e.salary) as avg_salary, MAX(e.salary) as max_salary, 
                   MIN(e.salary) as min_salary 
            FROM departments d 
            LEFT JOIN employees e ON d.id = e.department_id 
            GROUP BY d.id
        ")->fetchAll(PDO::FETCH_ASSOC);

        foreach ($salaryInsights as $insight) {
            if ($insight['avg_salary']) {
                echo "  {$insight['name']}: Avg PHP" . number_format($insight['avg_salary'], 2) . 
                     " (Max: PHP" . number_format($insight['max_salary'], 2) . 
                     ", Min: PHP" . number_format($insight['min_salary'], 2) . ")\n";
            }
        }

        // Tenure Analytics
        echo "\n👑 PIONEERS (5+ years):\n";
        $pioneers = $this->pdo->query("
            SELECT name, date_hired, 
                   CAST((julianday('now') - julianday(date_hired)) / 365.25 AS INTEGER) as years 
            FROM employees 
            WHERE julianday('now') - julianday(date_hired) >= 1825 
            ORDER BY date_hired
        ")->fetchAll(PDO::FETCH_ASSOC);

        if (empty($pioneers)) {
            echo "  No pioneers yet.\n";
        } else {
            foreach ($pioneers as $pioneer) {
                echo "  {$pioneer['name']}: {$pioneer['years']} years (Hired: {$pioneer['date_hired']})\n";
            }
        }
        echo "\n" . str_repeat("=", 60) . "\n";
    }

    public function findEmployee($id) {
        $emp = $this->pdo->prepare("
            SELECT e.*, d.name as department 
            FROM employees e 
            JOIN departments d ON e.department_id = d.id 
            WHERE e.id = ?
        ")->fetchAll(PDO::FETCH_ASSOC);

        if ($emp) {
            echo "\n" . str_repeat("=", 60) . "\n";
            foreach ($emp[0] as $key => $value) {
                echo ucfirst($key) . ": $value\n";
            }
            echo str_repeat("=", 60) . "\n";
        } else {
            echo "\nEmployee not found.\n";
        }
    }
}

// CLI Handler
$commander = new WorkforceCommander();
$command = $argv[1] ?? '--help';

switch ($command) {
    case '--add':
        $commander->addEmployee();
        break;
    case '--list':
        $commander->listEmployees();
        break;
    case '--update':
        $commander->updateEmployee();
        break;
    case '--delete':
        $commander->deleteEmployee();
        break;
    case '--stats':
        $commander->displayAnalytics();
        break;
    case '--find':
        $id = $argv[3] ?? null;
        if ($id) {
            $commander->findEmployee($id);
        } else {
            echo "Usage: php workforce.php --find --id=101\n";
        }
        break;
    default:
        echo "Usage:\n";
        echo "  php workforce.php --add        Add new employee\n";
        echo "  php workforce.php --list       List all employees\n";
        echo "  php workforce.php --update     Update employee\n";
        echo "  php workforce.php --delete     Delete employee\n";
        echo "  php workforce.php --stats      View analytics\n";
        echo "  php workforce.php --find --id=101\n";
}
?>