#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Autonomous Monthly Payslip PDF Automation Engine
 * Usage:
 * php generate_payslips.php          (Interactive Payroll Dashboard)
 * php generate_payslips.php --cron   (Automated Background Batch Processor)
 */

$autoloader = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloader)) {
    die("\e[31m\e[1m✖ ERROR:\e[0m Composer autoloader not found. Please execute 'composer require fpdf/fpdf' first.\n");
}
require $autoloader;

use Fpdf\Fpdf as FPDF;

// ==========================================
// 1. Visual Styling & TUI Layout Engine
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

    public static function prompt(string $message, string $default = ""): string {
        $msg = $message;
        if ($default !== "") {
            $msg .= " [Default: " . $default . "]";
        }
        echo self::BOLD . $msg . self::RESET . ": ";
        $input = trim(fgets(STDIN));
        return $input === "" ? $default : $input;
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to main dashboard..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ " . $msg . self::RESET . "\n"; }
    public static function error(string $msg): void { echo self::RED . "✖ " . $msg . self::RESET . "\n"; }
    
    public static function updateProgress(int $current, int $total, string $msg): void {
        $percent = $total > 0 ? round(($current / $total) * 100) : 0;
        echo "\r" . str_repeat(" ", 80) . "\r" . self::YELLOW . "⚙ " . self::RESET . "[{$current}/{$total}] ({$percent}%) {$msg}";
    }
}

// ==========================================
// 2. Financial Precision Data Service
// ==========================================
class PayrollDataService {
    /**
     * Simulates fetching operational employee data accounts from a master repository.
     * All pricing values are mapped inside explicit micro-precision definitions.
     */
    public static function getActivePayrollRegistry(): array {
        return [
            [
                'emp_id' => 'EMP-84920',
                'name' => 'Alexander Wright',
                'email' => 'a.wright@enterprise.internal',
                'department' => 'Engineering',
                'base_salary' => 8500.00,
                'allowances' => 450.00
            ],
            [
                'emp_id' => 'EMP-31049',
                'name' => 'Sarah Connor',
                'email' => 's.connor@cyberdyne.io',
                'department' => 'Operations',
                'base_salary' => 6200.00,
                'allowances' => 150.00
            ],
            [
                'emp_id' => 'EMP-77412',
                'name' => 'Miles Dyson',
                'email' => 'm.dyson@cyberdyne.io',
                'department' => 'R&D Lab',
                'base_salary' => 12500.00,
                'allowances' => 900.00
            ]
        ];
    }

    /**
     * Executes localized payroll logic with strict decimal safety rules (BCMath)
     */
    public static function computeStatements(array $emp): array {
        $base = sprintf("%.2f", $emp['base_salary']);
        $allowances = sprintf("%.2f", $emp['allowances']);
        
        $grossPay = bcadd($base, $allowances, 2);
        
        // Dynamic tax slab calculation simulation
        $taxRate = bccomp($grossPay, '10000.00', 2) > 0 ? '0.30' : '0.22'; // 30% vs 22% tax rules
        $incomeTax = bcmul($grossPay, $taxRate, 2);
        $healthcareCost = bcmul($base, '0.045', 2); // 4.5% flat contribution rate
        
        $totalDeductions = bcadd($incomeTax, $healthcareCost, 2);
        $netPay = bcsub($grossPay, $totalDeductions, 2);

        return [
            'gross_pay'        => (float)$grossPay,
            'income_tax'       => (float)$incomeTax,
            'healthcare'       => (float)$healthcareCost,
            'total_deductions' => (float)$totalDeductions,
            'net_pay'          => (float)$netPay,
            'tax_rate_pct'     => (float)bcmul($taxRate, '100', 0) . '%'
        ];
    }
}

// ==========================================
// 3. Document Vector Presentation Engine
// ==========================================
class PdfGenerationEngine {
    private string $outputDir;

    public function __construct(string $outputDir) {
        $this->outputDir = rtrim($outputDir, DIRECTORY_SEPARATOR);
        if (!is_dir($this->outputDir)) {
            mkdir($this->outputDir, 0755, true);
        }
    }

    public function compileFile(array $emp, array $ledger, string $payPeriod): string {
        // Secure token hash generation to protect filename enumeration visibility bugs
        $secureHash = substr(hash('sha256', $emp['emp_id'] . $payPeriod . 'SALT_PEPPER_SECURE'), 0, 12);
        $fileName = "payslip_" . $emp['emp_id'] . "_" . str_replace(' ', '_', $payPeriod) . "_" . $secureHash . ".pdf";
        $absolutePath = $this->outputDir . DIRECTORY_SEPARATOR . $fileName;

        // Instantiate FPDF structure logic mapping
        $pdf = new FPDF('P', 'mm', 'A4');
        $pdf->AddPage();
        $pdf->SetMargins(15, 15, 15);
        
        // Master Branding Header Banner Block
        $pdf->SetFillColor(30, 41, 59); // Slate Dark Blue
        $pdf->Rect(0, 0, 210, 40, 'F');
        
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetFont('Arial', 'B', 18);
        $pdf->Text(15, 16, "ENTERPRISE SYSTEMS CORPORATION");
        $pdf->SetFont('Arial', '', 11);
        $pdf->SetTextColor(148, 163, 184);
        $pdf->Text(15, 24, "Automated Compensation Ledger Statement File");
        
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetFont('Arial', 'B', 12);
        $pdf->Cell(0, 10, "", 0, 1, 'C'); // Offset line brake
        $pdf->Cell(0, 12, "PAY PERIOD: " . strtoupper($payPeriod), 0, 1, 'R');
        
        // Employee Identity Block Grid
        $pdf->Ln(10);
        $pdf->SetTextColor(15, 23, 42);
        $pdf->SetFont('Arial', 'B', 12);
        $pdf->Cell(0, 6, "EMPLOYEE INFORMATION", 0, 1, 'L');
        $pdf->Line(15, $pdf->GetY(), 195, $pdf->GetY());
        $pdf->Ln(2);

        $pdf->SetFont('Arial', '', 10);
        $pdf->Cell(35, 6, "Employee ID:", 0, 0); $pdf->Cell(60, 6, $emp['emp_id'], 0, 0);
        $pdf->Cell(35, 6, "Department:", 0, 0); $pdf->Cell(0, 6, $emp['department'], 0, 1);
        
        $pdf->Cell(35, 6, "Full Name:", 0, 0); $pdf->Cell(60, 6, $emp['name'], 0, 0);
        $pdf->Cell(35, 6, "Email Route:", 0, 0); $pdf->Cell(0, 6, $emp['email'], 0, 1);
        
        // Structural Financial Balance Tables Component Grid
        $pdf->Ln(12);
        $pdf->SetFont('Arial', 'B', 12);
        $pdf->Cell(90, 6, "EARNINGS", 0, 0);
        $pdf->Cell(90, 6, "DEDUCTIONS", 0, 1);
        $pdf->Line(15, $pdf->GetY(), 195, $pdf->GetY());
        $pdf->Ln(2);
        
        $pdf->SetFont('Arial', '', 10);
        // Row 1
        $pdf->Cell(60, 8, "Base Salary", 0, 0);
        $pdf->Cell(30, 8, "$" . number_format($emp['base_salary'], 2), 0, 0, 'R');
        $pdf->Cell(60, 8, "Income Tax (" . $ledger['tax_rate_pct'] . ")", 0, 0);
        $pdf->Cell(30, 8, "$" . number_format($ledger['income_tax'], 2), 0, 1, 'R');
        
        // Row 2
        $pdf->Cell(60, 8, "Corporate Allowances", 0, 0);
        $pdf->Cell(30, 8, "$" . number_format($emp['allowances'], 2), 0, 0, 'R');
        $pdf->Cell(60, 8, "Healthcare Contribution", 0, 0);
        $pdf->Cell(30, 8, "$" . number_format($ledger['healthcare'], 2), 0, 1, 'R');

        // Spacing Divider Lines Matrix
        $pdf->Ln(5);
        $pdf->Line(15, $pdf->GetY(), 195, $pdf->GetY());
        $pdf->Ln(2);

        // Summary Totals Blocks
        $pdf->SetFont('Arial', 'B', 10);
        $pdf->Cell(60, 8, "Total Gross Yield:", 0, 0);
        $pdf->Cell(30, 8, "$" . number_format($ledger['gross_pay'], 2), 0, 0, 'R');
        $pdf->Cell(60, 8, "Total Deductions Cost:", 0, 0);
        $pdf->Cell(30, 8, "$" . number_format($ledger['total_deductions'], 2), 0, 1, 'R');
        
        // Net Disbursed Card Render Block
        $pdf->Ln(10);
        $pdf->SetFillColor(241, 245, 249); // light grey background canvas matrix
        $pdf->Rect(15, $pdf->GetY(), 180, 14, 'F');
        
        $pdf->SetY($pdf->GetY() + 4);
        $pdf->SetX(20);
        $pdf->SetFont('Arial', 'B', 14);
        $pdf->SetTextColor(22, 163, 74); // Vibrant Green Net Text
        $pdf->Cell(80, 6, "NET DISBURSED AMOUNT:", 0, 0);
        $pdf->Cell(90, 6, "$" . number_format($ledger['net_pay'], 2), 0, 1, 'R');

        // Legal Compliance Disclaimer Footer Pass
        $pdf->SetY(270);
        $pdf->SetFont('Arial', 'I', 8);
        $pdf->SetTextColor(100, 116, 139);
        $pdf->Cell(0, 4, "This document serves as an immutable official record of payroll transmission.", 0, 1, 'C');
        $pdf->Cell(0, 4, "Security Verification Node Identification: Secure SHA " . strtoupper($secureHash), 0, 1, 'C');

        // Write content stream to protected local storage bounds
        $pdf->Output('F', $absolutePath);
        
        return $absolutePath;
    }
}

// ==========================================
// 4. Batch Pipeline Execution Engine
// ==========================================
class PayrollAutomationController {
    private PdfGenerationEngine $pdfEngine;

    public function __construct() {
        // Output path targeted outside standard exposed public directory configurations
        $this->pdfEngine = new PdfGenerationEngine(__DIR__ . '/storage/secure_payslips');
    }

    public function dispatchBatch(string $payPeriod, bool $isHeadless = false): void {
        $prefix = $isHeadless ? "[" . date('Y-m-d H:i:s') . "] [WORKER] " : "";
        echo "{$prefix}Initializing structural calculations iteration loops...\n";

        $employees = PayrollDataService::getActivePayrollRegistry();
        $processedCount = 0;

        foreach ($employees as $employee) {
            if (!$isHeadless) {
                CliUI::updateProgress($processedCount, count($employees), "Generating: {$employee['emp_id']}");
            }

            // Execute isolated mathematical computations safely
            $ledger = PayrollDataService::computeStatements($employee);

            // Trigger vector rendering step pipelines
            $this->pdfEngine->compileFile($employee, $ledger, $payPeriod);
            
            $processedCount++;

            // Explicit Memory Control Management: Drop transient operational loops instantly 
            unset($ledger, $employee);
            // Reclaim system heap bounds programmatically inside heavy asset loop boundaries
            gc_collect_cycles();
        }

        if (!$isHeadless) {
            CliUI::updateProgress($processedCount, count($employees), "Batch sequence closed.");
            echo "\n";
            CliUI::success("Generated {$processedCount} verified ledger payslip PDFs inside /storage directory paths.");
        } else {
            echo "{$prefix}Payroll generation cycle finished. Mutated files written: {$processedCount}\n";
        }
    }

    public function interactiveLoop(): void {
        while (true) {
            CliUI::header("Payroll PDF Distribution Server", "Enterprise Compensation Ledger Nodes");
            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Fire Automated Monthly Generation Batch Pipeline\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect active worker console matrix\n\n";

            switch (CliUI::prompt("Select Action Route")) {
                case '1':
                    $defaultPeriod = date('F Y');
                    $period = CliUI::prompt("Specify targeted payment calculation month", $defaultPeriod);
                    $this->dispatchBatch($period, false);
                    CliUI::pause();
                    break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Console engine tracking nodes disconnected cleanly.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }
}

// ==========================================
// 5. Execution Gateway Initialization
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("Automated calculation architectures require native shell execution runtime pipelines.");
}

$app = new PayrollAutomationController();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--cron') {
    // Unattended daemon background runtime context
    $currentPeriod = date('F Y');
    $app->dispatchBatch($currentPeriod, true);
} else {
    // Interactive local supervisor workspace interface
    $app->interactiveLoop();
}
