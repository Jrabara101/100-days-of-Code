#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI Contact Management System
 * 
 * Usage: php contacts_app.php
 */

// ==========================================
// 1. Visual Styling & UI Engine
// ==========================================
class CliUI {
    const RESET = "\e[0m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";
    const MAGENTA = "\e[35m";
    const BOLD = "\e[1m";

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

    public static function success(string $msg): void { echo self::GREEN . self::BOLD . "✔ " . $msg . self::RESET . "\n\n"; }
    public static function error(string $msg): void { echo self::RED . self::BOLD . "✖ " . $msg . self::RESET . "\n\n"; }
    public static function warning(string $msg): void { echo self::YELLOW . "⚠ " . $msg . self::RESET . "\n\n"; }
    
    public static function prompt(string $message, bool $required = false, string $default = ""): string {
        $reqMark = $required ? self::RED . "*" . self::RESET : "";
        $defMark = $default ? self::YELLOW . " [{$default}]" . self::RESET : "";
        echo self::BOLD . $message . $reqMark . $defMark . self::RESET . ": ";
        
        $input = trim(fgets(STDIN));
        return $input === "" ? $default : $input;
    }

    public static function pause(): void {
        echo self::CYAN . "\nPress Enter to continue..." . self::RESET;
        fgets(STDIN);
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            self::warning("No contacts found.");
            return;
        }

        // Calculate column widths
        $widths = [];
        foreach ($headers as $key => $label) {
            $widths[$key] = strlen($label);
        }
        foreach ($data as $row) {
            foreach ($headers as $key => $label) {
                $widths[$key] = max($widths[$key], strlen((string)($row[$key] ?? '')));
            }
        }

        // Drawing helper
        $drawRow = function($row, $isHeader = false) use ($headers, $widths) {
            $line = "│ ";
            foreach ($headers as $key => $label) {
                $content = $isHeader ? $label : (string)($row[$key] ?? '');
                $color = $isHeader ? self::BOLD . self::CYAN : self::RESET;
                // Truncate if too long (sanity check)
                if (strlen($content) > 30) $content = substr($content, 0, 27) . "...";
                $line .= $color . str_pad($content, min($widths[$key], 30)) . self::RESET . " │ ";
            }
            echo $line . "\n";
        };

        $drawSeparator = function($charLeft, $charMid, $charRight, $charLine) use ($headers, $widths) {
            $line = $charLeft;
            $segments = [];
            foreach ($headers as $key => $label) {
                $segments[] = str_repeat($charLine, min($widths[$key], 30) + 2);
            }
            echo $line . implode($charMid, $segments) . $charRight . "\n";
        };

        // Render
        $drawSeparator("┌", "┬", "┐", "─");
        $drawRow([], true); // Header row
        $drawSeparator("├", "┼", "┤", "─");
        foreach ($data as $row) {
            $drawRow($row);
        }
        $drawSeparator("└", "┴", "┘", "─");
        echo "\n";
    }
}

// ==========================================
// 2. Data Repository Component (SQLite)
// ==========================================
class ContactRepository {
    private PDO $db;

    public function __construct() {
        $dbPath = __DIR__ . '/contacts.sqlite';
        $this->db = new PDO("sqlite:" . $dbPath);
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initTable();
    }

    private function initTable(): void {
        $this->db->exec("CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            company TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");
    }

    public function add(array $data): bool {
        $stmt = $this->db->prepare("INSERT INTO contacts (name, phone, email, company) VALUES (:name, :phone, :email, :company)");
        return $stmt->execute([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'email' => $data['email'],
            'company' => $data['company']
        ]);
    }

    public function update(int $id, array $data): bool {
        $stmt = $this->db->prepare("UPDATE contacts SET name = :name, phone = :phone, email = :email, company = :company WHERE id = :id");
        return $stmt->execute([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'email' => $data['email'],
            'company' => $data['company'],
            'id' => $id
        ]);
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM contacts WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM contacts WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function getAll(): array {
        return $this->db->query("SELECT id, name, phone, email, company FROM contacts ORDER BY name ASC")->fetchAll();
    }

    public function search(string $query): array {
        $stmt = $this->db->prepare("SELECT id, name, phone, email, company FROM contacts 
                                    WHERE name LIKE :q OR phone LIKE :q OR email LIKE :q OR company LIKE :q 
                                    ORDER BY name ASC");
        $stmt->execute(['q' => "%{$query}%"]);
        return $stmt->fetchAll();
    }

    public function getTotalCount(): int {
        return (int)$this->db->query("SELECT COUNT(*) FROM contacts")->fetchColumn();
    }
}

// ==========================================
// 3. Application Controller
// ==========================================
class ContactApp {
    private ContactRepository $repo;

    public function __construct() {
        $this->repo = new ContactRepository();
    }

    public function run(): void {
        while (true) {
            $total = $this->repo->getTotalCount();
            CliUI::header("Address Book Pro", "Total Contacts: {$total}");
            
            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " List All Contacts\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Search Contacts\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Add New Contact\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Edit Contact\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Delete Contact\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Exit\n\n";

            $choice = CliUI::prompt("Select an operation");

            switch ($choice) {
                case '1': $this->listContacts(); break;
                case '2': $this->searchContacts(); break;
                case '3': $this->addContact(); break;
                case '4': $this->editContact(); break;
                case '5': $this->deleteContact(); break;
                case '0': 
                    CliUI::clearScreen();
                    echo CliUI::CYAN . "Goodbye!\n" . CliUI::RESET;
                    exit(0);
                default:
                    CliUI::error("Invalid option selected.");
                    sleep(1);
            }
        }
    }

    private function listContacts(): void {
        CliUI::header("All Contacts");
        $contacts = $this->repo->getAll();
        CliUI::drawTable($contacts, [
            'id' => 'ID',
            'name' => 'Name',
            'phone' => 'Phone',
            'email' => 'Email',
            'company' => 'Company'
        ]);
        CliUI::pause();
    }

    private function searchContacts(): void {
        CliUI::header("Search Contacts");
        $query = CliUI::prompt("Enter search term (name, email, phone)");
        if (empty($query)) return;

        $results = $this->repo->search($query);
        CliUI::header("Search Results for '{$query}'");
        CliUI::drawTable($results, [
            'id' => 'ID',
            'name' => 'Name',
            'phone' => 'Phone',
            'email' => 'Email'
        ]);
        CliUI::pause();
    }

    private function addContact(): void {
        CliUI::header("Add New Contact");
        
        $name = CliUI::prompt("Name", true);
        if (empty($name)) {
            CliUI::error("Name is required!");
            sleep(1); return;
        }

        $phone = CliUI::prompt("Phone");
        $email = $this->promptEmail();
        $company = CliUI::prompt("Company");

        $this->repo->add([
            'name' => $name,
            'phone' => $phone,
            'email' => $email,
            'company' => $company
        ]);

        CliUI::success("Contact '{$name}' added successfully.");
        sleep(1);
    }

    private function editContact(): void {
        CliUI::header("Edit Contact");
        $id = (int)CliUI::prompt("Enter Contact ID to edit");
        
        $contact = $this->repo->getById($id);
        if (!$contact) {
            CliUI::error("Contact ID {$id} not found.");
            sleep(1); return;
        }

        echo CliUI::YELLOW . "Leave blank to keep current values.\n\n" . CliUI::RESET;

        $name = CliUI::prompt("Name", false, $contact['name']);
        $phone = CliUI::prompt("Phone", false, $contact['phone']);
        $company = CliUI::prompt("Company", false, $contact['company']);
        
        // Email requires special handling to allow keeping current, but validating if changed
        $emailInput = CliUI::prompt("Email", false, $contact['email']);
        $email = ($emailInput === $contact['email']) ? $contact['email'] : $this->validateEmail($emailInput);

        $this->repo->update($id, [
            'name' => $name,
            'phone' => $phone,
            'email' => $email,
            'company' => $company
        ]);

        CliUI::success("Contact ID {$id} updated.");
        sleep(1);
    }

    private function deleteContact(): void {
        CliUI::header("Delete Contact");
        $id = (int)CliUI::prompt("Enter Contact ID to delete");
        
        $contact = $this->repo->getById($id);
        if (!$contact) {
            CliUI::error("Contact ID {$id} not found.");
            sleep(1); return;
        }

        $confirm = CliUI::prompt("Are you sure you want to delete '{$contact['name']}'? (y/N)");
        if (strtolower($confirm) === 'y') {
            $this->repo->delete($id);
            CliUI::success("Contact deleted.");
        } else {
            CliUI::warning("Deletion cancelled.");
        }
        sleep(1);
    }

    private function promptEmail(): string {
        while (true) {
            $email = CliUI::prompt("Email");
            if (empty($email)) return ""; // Optional field
            
            $validated = $this->validateEmail($email);
            if ($validated !== false) return $validated;
            
            CliUI::error("Invalid email format. Please try again or leave blank.");
        }
    }

    private function validateEmail(string $email): string|bool {
        if (empty($email)) return "";
        return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : false;
    }
}

// ==========================================
// 4. Bootstrap
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("This application must be run from the command line.");
}

try {
    $app = new ContactApp();
    $app->run();
} catch (Exception $e) {
    echo "\n\e[31m\e[1mFatal Error: \e[0m" . $e->getMessage() . "\n";
    exit(1);
}
