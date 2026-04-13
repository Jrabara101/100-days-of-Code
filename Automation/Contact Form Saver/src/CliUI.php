<?php

class CliUI
{
    // Color codes
    const RESET = "\033[0m";
    const GREEN = "\033[32m";
    const RED = "\033[31m";
    const YELLOW = "\033[33m";
    const CYAN = "\033[36m";
    const BOLD = "\033[1m";

    public function clearScreen(): void
    {
        // Works for windows and linux
        echo strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' ? popen('cls', 'w') : "\033[2J\033[;H";
    }

    public function renderBanner(): void
    {
        $this->clearScreen();
        echo self::CYAN . self::BOLD;
        echo "=================================================\n";
        echo "   ___           __        _     ____            \n";
        echo "  / __\___  _ __/ /_____  | |__ |  _ \           \n";
        echo " / /  / _ \| '__\ \/ /\ \ | '_ \| |_) |          \n";
        echo "/ /__| (_) | |  / / /_> > | |_) |  _ <           \n";
        echo "\____/\___/|_| /____| \/  |_.__/|_| \_\          \n";
        echo "                                                 \n";
        echo "       CONTACT FORM SAVER - CLI AUTOMATION       \n";
        echo "=================================================\n";
        echo self::RESET . "\n";
    }

    public function renderMenu(): void
    {
        echo "Please select an option:\n\n";
        echo "  " . self::CYAN . "[1]" . self::RESET . " Add Contact Form Submission\n";
        echo "  " . self::CYAN . "[2]" . self::RESET . " List All Submissions\n";
        echo "  " . self::CYAN . "[3]" . self::RESET . " Search Submission\n";
        echo "  " . self::CYAN . "[4]" . self::RESET . " Edit Submission\n";
        echo "  " . self::CYAN . "[5]" . self::RESET . " Delete Submission\n";
        echo "  " . self::CYAN . "[6]" . self::RESET . " Export to CSV\n";
        echo "  " . self::CYAN . "[0]" . self::RESET . " Exit\n";
        echo "\n";
    }

    public function prompt(string $message): string
    {
        echo self::BOLD . $message . ": " . self::RESET;
        $input = fgets(STDIN);
        return $input !== false ? trim($input) : '';
    }

    public function confirm(string $message): bool
    {
        $response = $this->prompt($message . " (y/n)");
        return strtolower(trim($response)) === 'y';
    }

    public function title(string $title): void
    {
        echo "\n" . self::BOLD . self::YELLOW . "--- $title ---" . self::RESET . "\n\n";
    }

    public function ok(string $message): void
    {
        echo self::GREEN . "[OK] " . self::RESET . $message . "\n";
    }

    public function error(string $message): void
    {
        echo self::RED . "[ERROR] " . self::RESET . $message . "\n";
    }

    public function warning(string $message): void
    {
        echo self::YELLOW . "[WARNING] " . self::RESET . $message . "\n";
    }

    public function info(string $message): void
    {
        echo self::CYAN . "[INFO] " . self::RESET . $message . "\n";
    }
    
    public function simulatedLoading(string $message, int $dots = 3, int $speedMs = 300000): void
    {
        echo $message;
        for ($i = 0; $i < $dots; $i++) {
            usleep($speedMs);
            echo ".";
        }
        echo "\n";
    }

    public function pause(): void
    {
        echo "\nPress " . self::BOLD . "ENTER" . self::RESET . " to continue...";
        fgets(STDIN);
    }

    /**
     * @param Submission[] $submissions
     */
    public function renderTable(array $submissions): void
    {
        if (empty($submissions)) {
            $this->info("No submissions found.");
            return;
        }

        // Calculate columns width
        $idWidth = 10;
        $nameWidth = 15;
        $emailWidth = 20;
        $subjectWidth = 20;
        $dateWidth = 20;

        $format = "| %-{$idWidth}s | %-{$nameWidth}s | %-{$emailWidth}s | %-{$subjectWidth}s | %-{$dateWidth}s |\n";
        $separator = str_repeat("-", $idWidth + $nameWidth + $emailWidth + $subjectWidth + $dateWidth + 16) . "\n";

        echo $separator;
        printf($format, "ID", "Name", "Email", "Subject", "Created At");
        echo $separator;

        foreach ($submissions as $sub) {
            $id = strlen($sub->id) > 10 ? substr($sub->id, 0, 7) . '...' : $sub->id;
            $name = strlen($sub->name) > 15 ? substr($sub->name, 0, 12) . '...' : $sub->name;
            $email = strlen($sub->email) > 20 ? substr($sub->email, 0, 17) . '...' : $sub->email;
            $subject = strlen($sub->subject) > 20 ? substr($sub->subject, 0, 17) . '...' : $sub->subject;
            
            printf($format, $id, $name, $email, $subject, $sub->createdAt);
        }
        echo $separator;
    }

    public function renderSingleSubmission(Submission $sub): void
    {
        echo str_repeat("-", 40) . "\n";
        echo "ID:         {$sub->id}\n";
        echo "Name:       {$sub->name}\n";
        echo "Email:      {$sub->email}\n";
        echo "Phone:      " . ($sub->phone ?? 'N/A') . "\n";
        echo "Subject:    {$sub->subject}\n";
        echo "Message:\n{$sub->message}\n";
        echo "Created At: {$sub->createdAt}\n";
        echo "Updated At: {$sub->updatedAt}\n";
        echo str_repeat("-", 40) . "\n";
    }
}
