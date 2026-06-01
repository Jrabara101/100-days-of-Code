#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Weekly Business Report Generator & Emailer
 * Handles: Finance, Orders, Inventory, and Logistics.
 * * Usage: php weekly_report.php [recipient_email]
 */

$autoloader = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloader)) {
    die("\e[31m\e[1m✖ ERROR:\e[0m Composer autoloader not found. Run 'composer require phpmailer/phpmailer'.\n");
}
require $autoloader;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

// ==========================================
// 1. Configuration
// ==========================================
const SMTP_CONFIG = [
    'host'       => 'smtp.mailtrap.io', // e.g., smtp.sendgrid.net
    'username'   => 'your_username',
    'password'   => 'your_password',
    'port'       => 2525,               
    'encryption' => PHPMailer::ENCRYPTION_STARTTLS, 
    'from_email' => 'reports@yourcompany.com',
    'from_name'  => 'Ops System Automated Reports'
];

// ==========================================
// 2. Visual Styling & UI Engine
// ==========================================
class CliUI {
    const RESET = "\e[0m";
    const BOLD = "\e[1m";
    const DIM = "\e[2m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";

    public static function header(string $title): void {
        echo "\033[2J\033[;H"; 
        echo self::BOLD . self::CYAN;
        echo "╔═════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad(strtoupper($title), 71, " ", STR_PAD_BOTH) . " ║\n";
        echo "╚═════════════════════════════════════════════════════════════════════════╝\n" . self::RESET . "\n";
    }

    public static function step(string $msg): void { echo self::CYAN . " ➜ " . self::RESET . $msg . "... "; }
    public static function stepDone(): void { echo self::GREEN . "DONE" . self::RESET . "\n"; }
    public static function success(string $msg): void { echo "\n" . self::GREEN . self::BOLD . "✔ " . $msg . self::RESET . "\n\n"; }
    public static function error(string $msg): void { echo "\n" . self::RED . self::BOLD . "✖ " . $msg . self::RESET . "\n\n"; exit(1); }
}

// ==========================================
// 3. Data Service (Mock Database Queries)
// ==========================================
class ReportDataService {
    public function getWeeklyData(): array {
        // In production, these would be heavy COUNT() and SUM() SQL queries.
        return [
            'period' => date('M d, Y', strtotime('-7 days')) . ' - ' . date('M d, Y'),
            'finance' => [
                'gross_revenue' => 145250.00,
                'cogs' => 62100.00,
                'operating_expenses' => 28400.00,
                'net_profit' => 54750.00,
                'profit_margin' => '37.7%',
                'wow_growth' => '+4.2%' // Week-over-Week
            ],
            'orders' => [
                'total_orders' => 1245,
                'fulfilled' => 1210,
                'pending' => 35,
                'return_rate' => '1.8%',
                'aov' => 116.66 // Average Order Value
            ],
            'inventory' => [
                'total_skus' => 845,
                'low_stock_alerts' => 12,
                'out_of_stock' => 3,
                'inventory_value' => 450000.00
            ],
            'logistics' => [
                'avg_delivery_time' => '2.4 Days',
                'on_time_rate' => '98.5%',
                'total_shipping_costs' => 14200.00,
                'damaged_in_transit' => 4
            ]
        ];
    }
}

// ==========================================
// 4. HTML Email Template Generator
// ==========================================
class HtmlReportGenerator {
    public function generate(array $data): string {
        $f = $data['finance'];
        $o = $data['orders'];
        $i = $data['inventory'];
        $l = $data['logistics'];

        // Inline CSS is strictly required for email clients
        $html = "
        <div style='font-family: Helvetica, Arial, sans-serif; max-width: 700px; margin: 0 auto; color: #333;'>
            
            <div style='background-color: #1e293b; color: #ffffff; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
                <h1 style='margin: 0; font-size: 24px;'>Weekly Business Report</h1>
                <p style='margin: 5px 0 0 0; font-size: 14px; color: #94a3b8;'>Period: {$data['period']}</p>
            </div>

            <div style='padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;'>
                
                {$this->sectionHeader('💰 Finance Overview')}
                <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px; background: #fff;'>
                    <tr>
                        <td style='padding: 12px; border: 1px solid #e2e8f0;'><strong>Gross Revenue:</strong></td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0; text-align: right;'>$" . number_format($f['gross_revenue'], 2) . "</td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0;'><strong>Net Profit:</strong></td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #16a34a; font-weight: bold;'>$" . number_format($f['net_profit'], 2) . "</td>
                    </tr>
                    <tr>
                        <td style='padding: 12px; border: 1px solid #e2e8f0;'><strong>Profit Margin:</strong></td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0; text-align: right;'>{$f['profit_margin']}</td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0;'><strong>W-o-W Growth:</strong></td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #16a34a;'>{$f['wow_growth']}</td>
                    </tr>
                </table>

                {$this->sectionHeader('📦 Orders & Sales')}
                <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px; background: #fff;'>
                    <tr>
                        <td style='padding: 12px; border: 1px solid #e2e8f0;'><strong>Total Orders:</strong></td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0; text-align: right;'>{$o['total_orders']}</td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0;'><strong>Avg Order Value:</strong></td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0; text-align: right;'>$" . number_format($o['aov'], 2) . "</td>
                    </tr>
                    <tr>
                        <td style='padding: 12px; border: 1px solid #e2e8f0;'><strong>Pending Fulfillment:</strong></td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #ca8a04;'>{$o['pending']}</td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0;'><strong>Return Rate:</strong></td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0; text-align: right;'>{$o['return_rate']}</td>
                    </tr>
                </table>

                {$this->sectionHeader('🏭 Inventory Health')}
                <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px; background: #fff;'>
                    <tr>
                        <td style='padding: 12px; border: 1px solid #e2e8f0;'><strong>Total SKUs:</strong></td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0; text-align: right;'>{$i['total_skus']}</td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0;'><strong>Total Asset Value:</strong></td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0; text-align: right;'>$" . number_format($i['inventory_value'], 2) . "</td>
                    </tr>
                    <tr>
                        <td style='padding: 12px; border: 1px solid #e2e8f0;'><strong>Low Stock Alerts:</strong></td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #ea580c; font-weight: bold;'>{$i['low_stock_alerts']}</td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0;'><strong>Out of Stock:</strong></td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #dc2626; font-weight: bold;'>{$i['out_of_stock']}</td>
                    </tr>
                </table>

                {$this->sectionHeader('🚚 Logistics & Shipping')}
                <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px; background: #fff;'>
                    <tr>
                        <td style='padding: 12px; border: 1px solid #e2e8f0;'><strong>On-Time Delivery Rate:</strong></td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #16a34a;'>{$l['on_time_rate']}</td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0;'><strong>Avg Delivery Time:</strong></td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0; text-align: right;'>{$l['avg_delivery_time']}</td>
                    </tr>
                    <tr>
                        <td style='padding: 12px; border: 1px solid #e2e8f0;'><strong>Total Shipping Costs:</strong></td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0; text-align: right;'>$" . number_format($l['total_shipping_costs'], 2) . "</td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0;'><strong>Damaged in Transit:</strong></td>
                        <td style='padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #dc2626;'>{$l['damaged_in_transit']}</td>
                    </tr>
                </table>

                <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #cbd5e1; font-size: 12px; color: #64748b;'>
                    Generated automatically by the Ops CLI Tool.<br>
                    Data is accurate as of " . date('M d, Y H:i:s T') . "
                </div>
            </div>
        </div>
        ";

        return $html;
    }

    private function sectionHeader(string $title): string {
        return "<h2 style='font-size: 18px; color: #0f172a; margin-bottom: 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; display: inline-block;'>{$title}</h2>";
    }
}

// ==========================================
// 5. SMTP Mailer Service
// ==========================================
class ReportMailer {
    public function send(string $toEmail, string $subject, string $htmlBody): void {
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = SMTP_CONFIG['host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = SMTP_CONFIG['username'];
            $mail->Password   = SMTP_CONFIG['password'];
            $mail->SMTPSecure = SMTP_CONFIG['encryption'];
            $mail->Port       = SMTP_CONFIG['port'];

            $mail->setFrom(SMTP_CONFIG['from_email'], SMTP_CONFIG['from_name']);
            $mail->addAddress($toEmail);

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            
            // Generate a clean text fallback for clients that block HTML
            $mail->AltBody = strip_tags(str_replace(['<br>', '</tr>', '</td>'], ["\n", "\n", "\t"], $htmlBody));

            $mail->send();
        } catch (PHPMailerException $e) {
            throw new Exception("SMTP Error: " . $mail->ErrorInfo);
        }
    }
}

// ==========================================
// 6. Main Application Flow
// ==========================================
class WeeklyReportApp {
    public function run(string $recipientEmail): void {
        CliUI::header("Weekly Report Generator");

        try {
            // Step 1: Data Extraction
            CliUI::step("Compiling metrics from Logistics, Inventory, Finance, and Orders");
            $dataService = new ReportDataService();
            $data = $dataService->getWeeklyData();
            usleep(800000); // Simulate heavy database query time for CLI UX
            CliUI::stepDone();

            // Step 2: HTML Generation
            CliUI::step("Rendering inline-styled HTML report template");
            $generator = new HtmlReportGenerator();
            $htmlPayload = $generator->generate($data);
            usleep(400000); // Simulate rendering time
            CliUI::stepDone();

            // Step 3: SMTP Delivery
            CliUI::step("Connecting to SMTP server and transmitting report");
            $mailer = new ReportMailer();
            $subject = "📊 Weekly Business Report: " . $data['period'];
            $mailer->send($recipientEmail, $subject, $htmlPayload);
            CliUI::stepDone();

            CliUI::success("Report successfully generated and emailed to {$recipientEmail}");

        } catch (Exception $e) {
            echo CliUI::RED . "FAILED\n" . CliUI::RESET;
            CliUI::error($e->getMessage());
        }
    }
}

// ==========================================
// Bootstrap
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("This application must be run from the command line.");
}

if ($argc < 2) {
    CliUI::header("Weekly Report Generator");
    echo "Usage: php " . basename(__FILE__) . " <recipient_email>\n";
    echo "Example: php " . basename(__FILE__) . " executive.team@company.com\n\n";
    exit(1);
}

$recipient = $argv[1];
if (!filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
    CliUI::error("Invalid recipient email address provided.");
}

$app = new WeeklyReportApp();
$app->run($recipient);
