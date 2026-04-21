<?php

/**
 * CLIUI - Command Line Interface User Interface
 * 
 * Handles all terminal display rendering including colors, boxes,
 * menus, progress bars, banners, and formatted output.
 */
class CLIUI
{
    // ─── ANSI Color Constants ─────────────────────────────────────────
    const RESET      = "\033[0m";
    const BOLD       = "\033[1m";
    const DIM        = "\033[2m";
    const ITALIC     = "\033[3m";
    const UNDERLINE  = "\033[4m";
    const BLINK      = "\033[5m";
    const REVERSE    = "\033[7m";
    const HIDDEN     = "\033[8m";

    // Foreground colors
    const BLACK      = "\033[30m";
    const RED        = "\033[31m";
    const GREEN      = "\033[32m";
    const YELLOW     = "\033[33m";
    const BLUE       = "\033[34m";
    const MAGENTA    = "\033[35m";
    const CYAN       = "\033[36m";
    const WHITE      = "\033[37m";

    // Bright foreground colors
    const BRIGHT_RED     = "\033[91m";
    const BRIGHT_GREEN   = "\033[92m";
    const BRIGHT_YELLOW  = "\033[93m";
    const BRIGHT_BLUE    = "\033[94m";
    const BRIGHT_MAGENTA = "\033[95m";
    const BRIGHT_CYAN    = "\033[96m";
    const BRIGHT_WHITE   = "\033[97m";

    // Background colors
    const BG_BLACK       = "\033[40m";
    const BG_RED         = "\033[41m";
    const BG_GREEN       = "\033[42m";
    const BG_YELLOW      = "\033[43m";
    const BG_BLUE        = "\033[44m";
    const BG_MAGENTA     = "\033[45m";
    const BG_CYAN        = "\033[46m";
    const BG_WHITE       = "\033[47m";
    const BG_BRIGHT_BLACK = "\033[100m";

    // Box drawing characters
    const BOX_TL = '╔';
    const BOX_TR = '╗';
    const BOX_BL = '╚';
    const BOX_BR = '╝';
    const BOX_H  = '═';
    const BOX_V  = '║';

    const BOX_LIGHT_TL = '┌';
    const BOX_LIGHT_TR = '┐';
    const BOX_LIGHT_BL = '└';
    const BOX_LIGHT_BR = '┘';
    const BOX_LIGHT_H  = '─';
    const BOX_LIGHT_V  = '│';

    // Icons / symbols
    const ICON_SUCCESS  = '✔';
    const ICON_ERROR    = '✘';
    const ICON_WARNING  = '⚠';
    const ICON_INFO     = 'ℹ';
    const ICON_ARROW    = '→';
    const ICON_BULLET   = '●';
    const ICON_STAR     = '★';
    const ICON_MAIL     = '✉';
    const ICON_FOLDER   = '📁';
    const ICON_FILE     = '📄';
    const ICON_USER     = '👤';
    const ICON_TEMPLATE = '📝';
    const ICON_GEAR     = '⚙';
    const ICON_SEARCH   = '🔍';
    const ICON_EXPORT   = '📤';
    const ICON_IMPORT   = '📥';
    const ICON_CHART    = '📊';
    const ICON_CLOCK    = '🕐';
    const ICON_CHECK    = '☑';

    /** @var int Terminal width */
    private int $termWidth;

    /** @var array Breadcrumb navigation stack */
    private array $breadcrumbs = ['Main Menu'];

    public function __construct()
    {
        $this->termWidth = $this->getTerminalWidth();
    }

    /**
     * Get the terminal width
     */
    private function getTerminalWidth(): int
    {
        if (PHP_OS_FAMILY === 'Windows') {
            $output = [];
            exec('mode con', $output);
            foreach ($output as $line) {
                if (stripos($line, 'Columns') !== false || stripos($line, 'CON') !== false) {
                    preg_match('/\d+/', $line, $matches);
                    if (!empty($matches)) {
                        return (int)$matches[0];
                    }
                }
            }
            return 80;
        }
        return (int)(exec('tput cols') ?: 80);
    }

    /**
     * Clear the terminal screen
     */
    public function clearScreen(): void
    {
        if (PHP_OS_FAMILY === 'Windows') {
            system('cls');
        } else {
            system('clear');
        }
    }

    /**
     * Push a breadcrumb
     */
    public function pushBreadcrumb(string $label): void
    {
        $this->breadcrumbs[] = $label;
    }

    /**
     * Pop a breadcrumb
     */
    public function popBreadcrumb(): void
    {
        if (count($this->breadcrumbs) > 1) {
            array_pop($this->breadcrumbs);
        }
    }

    /**
     * Reset breadcrumbs to main menu
     */
    public function resetBreadcrumbs(): void
    {
        $this->breadcrumbs = ['Main Menu'];
    }

    /**
     * Display the breadcrumb trail
     */
    public function showBreadcrumbs(): void
    {
        $trail = implode(self::DIM . ' > ' . self::RESET . self::CYAN, $this->breadcrumbs);
        echo self::DIM . self::CYAN . '  📍 ' . $trail . self::RESET . "\n";
        echo self::DIM . str_repeat('─', $this->termWidth) . self::RESET . "\n";
    }

    /**
     * Print the main application banner
     */
    public function showBanner(): void
    {
        $width = min($this->termWidth, 70);
        $lines = [
            '',
            '  ╔══════════════════════════════════════════════════════════════╗',
            '  ║                                                            ║',
            '  ║    ✉   B U L K   E M A I L   T E M P L A T E             ║',
            '  ║                  G E N E R A T O R                        ║',
            '  ║                                                            ║',
            '  ║    Generate personalized emails in bulk from templates     ║',
            '  ║    using CSV/JSON contact data.                           ║',
            '  ║                                                            ║',
            '  ╚══════════════════════════════════════════════════════════════╝',
            '',
        ];

        foreach ($lines as $line) {
            echo self::BOLD . self::BRIGHT_CYAN . $line . self::RESET . "\n";
        }
    }

    /**
     * Show the main menu
     */
    public function showMainMenu(): void
    {
        $this->showBreadcrumbs();
        echo "\n";
        $this->printBoxedMenu('Main Menu', [
            ['1', self::ICON_TEMPLATE . '  Template Management',  'Create, edit, delete, list templates'],
            ['2', self::ICON_IMPORT . '  Import Recipients',      'Load contacts from CSV or JSON'],
            ['3', self::ICON_MAIL . '  Generate Emails',          'Bulk generate personalized emails'],
            ['4', self::ICON_EXPORT . '  Export Emails',           'Save generated emails to file'],
            ['5', self::ICON_CHART . '  View History',             'Browse past generation runs'],
            ['6', self::ICON_SEARCH . '  Search Templates',        'Find templates by name'],
            ['0', self::ICON_ERROR . '   Exit',                    'Quit the application'],
        ]);
    }

    /**
     * Show the template management submenu
     */
    public function showTemplateMenu(): void
    {
        $this->showBreadcrumbs();
        echo "\n";
        $this->printBoxedMenu('Template Management', [
            ['1', self::ICON_TEMPLATE . '  Create New Template',  'Design a new email template'],
            ['2', '✏️   Edit Template',                            'Modify an existing template'],
            ['3', self::ICON_ERROR . '   Delete Template',        'Remove a template permanently'],
            ['4', '📋  List All Templates',                       'View all saved templates'],
            ['5', '📑  Duplicate Template',                       'Clone an existing template'],
            ['0', '↩   Back to Main Menu',                        'Return to main menu'],
        ]);
    }

    /**
     * Show the generate emails submenu
     */
    public function showGenerateMenu(): void
    {
        $this->showBreadcrumbs();
        echo "\n";
        $this->printBoxedMenu('Email Generation', [
            ['1', self::ICON_USER . '  Preview Single Email',    'Preview email for one recipient'],
            ['2', self::ICON_MAIL . '  Generate All Emails',     'Generate for all recipients'],
            ['0', '↩   Back to Main Menu',                       'Return to main menu'],
        ]);
    }

    /**
     * Print a beautifully boxed menu
     */
    public function printBoxedMenu(string $title, array $options): void
    {
        $innerWidth = 64;
        $titlePad = (int)(($innerWidth - mb_strlen($title)) / 2);

        // Top border
        echo self::BRIGHT_CYAN . '  ╔' . str_repeat('═', $innerWidth) . '╗' . self::RESET . "\n";
        // Title
        echo self::BRIGHT_CYAN . '  ║' . self::RESET
            . self::BOLD . self::BRIGHT_WHITE
            . str_repeat(' ', $titlePad) . $title . str_repeat(' ', $innerWidth - $titlePad - mb_strlen($title))
            . self::RESET . self::BRIGHT_CYAN . '║' . self::RESET . "\n";
        // Separator
        echo self::BRIGHT_CYAN . '  ╠' . str_repeat('═', $innerWidth) . '╣' . self::RESET . "\n";

        foreach ($options as $opt) {
            $num = $opt[0];
            $label = $opt[1];
            $desc = $opt[2];

            // Calculate visible lengths (approximate, strip common emoji)
            $numDisplay = self::BRIGHT_YELLOW . " [{$num}]" . self::RESET;
            $labelDisplay = self::BRIGHT_WHITE . " {$label}" . self::RESET;

            // Build the line
            $lineContent = " [{$num}]  {$label}";
            $visibleLen = mb_strlen(strip_tags(preg_replace('/\033\[[0-9;]*m/', '', $lineContent)));
            $padding = max(1, $innerWidth - $visibleLen - mb_strlen($desc) - 2);

            echo self::BRIGHT_CYAN . '  ║' . self::RESET;
            echo self::BRIGHT_YELLOW . "  [{$num}]" . self::RESET;
            echo self::BRIGHT_WHITE . "  {$label}" . self::RESET;

            // Right-align description
            $usedSoFar = strlen(" [{$num}]") + strlen("  ") + $this->visibleLength($label);
            $remainingSpace = $innerWidth - $usedSoFar - mb_strlen($desc) - 2;
            if ($remainingSpace < 1) $remainingSpace = 1;
            echo self::DIM . str_repeat(' ', $remainingSpace) . $desc . ' ' . self::RESET;
            echo self::BRIGHT_CYAN . '║' . self::RESET . "\n";
        }

        // Bottom border
        echo self::BRIGHT_CYAN . '  ╚' . str_repeat('═', $innerWidth) . '╝' . self::RESET . "\n";
        echo "\n";
    }

    /**
     * Estimate visible length of a string (strip ANSI codes and approximate emoji width)
     */
    private function visibleLength(string $str): int
    {
        $stripped = preg_replace('/\033\[[0-9;]*m/', '', $str);
        return mb_strlen($stripped);
    }

    /**
     * Print a success message
     */
    public function success(string $message): void
    {
        echo "\n" . self::BOLD . self::BRIGHT_GREEN . '  ' . self::ICON_SUCCESS . '  ' . $message . self::RESET . "\n";
    }

    /**
     * Print an error message
     */
    public function error(string $message): void
    {
        echo "\n" . self::BOLD . self::BRIGHT_RED . '  ' . self::ICON_ERROR . '  ' . $message . self::RESET . "\n";
    }

    /**
     * Print a warning message
     */
    public function warning(string $message): void
    {
        echo "\n" . self::BOLD . self::BRIGHT_YELLOW . '  ' . self::ICON_WARNING . '  ' . $message . self::RESET . "\n";
    }

    /**
     * Print an info message
     */
    public function info(string $message): void
    {
        echo "\n" . self::CYAN . '  ' . self::ICON_INFO . '  ' . $message . self::RESET . "\n";
    }

    /**
     * Print a header/section title
     */
    public function header(string $title): void
    {
        echo "\n";
        echo self::BOLD . self::BRIGHT_MAGENTA . '  ── ' . $title . ' ──' . self::RESET . "\n";
        echo "\n";
    }

    /**
     * Print a horizontal separator
     */
    public function separator(): void
    {
        echo self::DIM . '  ' . str_repeat('─', min($this->termWidth - 4, 66)) . self::RESET . "\n";
    }

    /**
     * Prompt the user for input with validation
     *
     * @param string $prompt The prompt text
     * @param bool $required Whether input is required
     * @param callable|null $validator Optional validator function
     * @return string The validated user input
     */
    public function prompt(string $prompt, bool $required = true, ?callable $validator = null): string
    {
        while (true) {
            echo self::BRIGHT_CYAN . "\n  " . self::ICON_ARROW . ' ' . $prompt . ': ' . self::RESET;
            $input = trim(readline(''));

            if ($required && $input === '') {
                $this->error('This field is required. Please try again.');
                continue;
            }

            if (!$required && $input === '') {
                return '';
            }

            if ($validator !== null) {
                $result = $validator($input);
                if ($result !== true) {
                    $this->error(is_string($result) ? $result : 'Invalid input. Please try again.');
                    continue;
                }
            }

            return $input;
        }
    }

    /**
     * Prompt for multi-line input (body text)
     */
    public function promptMultiline(string $prompt): string
    {
        echo self::BRIGHT_CYAN . "\n  " . self::ICON_ARROW . ' ' . $prompt . self::RESET . "\n";
        echo self::DIM . "  (Type your content. Enter an empty line to finish)" . self::RESET . "\n";
        echo self::DIM . "  Supported placeholders: {{name}}, {{email}}, {{company}}, {{role}}, {{subject}}, {{custom_field}}" . self::RESET . "\n\n";

        $lines = [];
        while (true) {
            echo self::DIM . '  > ' . self::RESET;
            $line = readline('');
            if ($line === '' || $line === false) {
                break;
            }
            $lines[] = $line;
        }

        return implode("\n", $lines);
    }

    /**
     * Ask a yes/no confirmation
     */
    public function confirm(string $message, bool $default = false): bool
    {
        $hint = $default ? '(Y/n)' : '(y/N)';
        echo self::BRIGHT_YELLOW . "\n  " . self::ICON_WARNING . ' ' . $message . " {$hint}: " . self::RESET;
        $input = strtolower(trim(readline('')));

        if ($input === '') {
            return $default;
        }

        return in_array($input, ['y', 'yes']);
    }

    /**
     * Show a progress bar
     */
    public function progressBar(int $current, int $total, string $label = 'Progress'): void
    {
        $barWidth = 40;
        $percentage = ($total > 0) ? (int)(($current / $total) * 100) : 0;
        $filled = (int)(($current / max($total, 1)) * $barWidth);
        $empty = $barWidth - $filled;

        $bar = self::BRIGHT_GREEN . str_repeat('█', $filled) . self::DIM . str_repeat('░', $empty) . self::RESET;

        echo "\r  {$label}: [{$bar}] " . self::BRIGHT_WHITE . "{$percentage}%" . self::RESET
            . " ({$current}/{$total})";

        if ($current >= $total) {
            echo "\n";
        }
    }

    /**
     * Show a spinner animation (single tick)
     */
    public function spinner(string $message, int $step): void
    {
        $frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        $frame = $frames[$step % count($frames)];
        echo "\r  " . self::BRIGHT_CYAN . $frame . self::RESET . " {$message}";
    }

    /**
     * Display a template preview in a card/box
     */
    public function showTemplateCard(array $template): void
    {
        $innerWidth = 62;
        $id = $template['id'] ?? 'N/A';
        $name = $template['name'] ?? 'Untitled';
        $subject = $template['subject'] ?? 'No subject';
        $type = $template['type'] ?? 'text';
        $created = $template['created_at'] ?? 'Unknown';
        $body = $template['body'] ?? '';

        echo "\n";
        echo self::BRIGHT_CYAN . '  ┌' . str_repeat('─', $innerWidth) . '┐' . self::RESET . "\n";

        // Title
        $this->printCardRow("  {$this->icon('TEMPLATE')} Template: {$name}", $innerWidth);
        echo self::BRIGHT_CYAN . '  ├' . str_repeat('─', $innerWidth) . '┤' . self::RESET . "\n";

        // Details
        $this->printCardRow("  ID:       {$id}", $innerWidth);
        $this->printCardRow("  Subject:  {$subject}", $innerWidth);
        $this->printCardRow("  Type:     {$type}", $innerWidth);
        $this->printCardRow("  Created:  {$created}", $innerWidth);

        echo self::BRIGHT_CYAN . '  ├' . str_repeat('─', $innerWidth) . '┤' . self::RESET . "\n";
        $this->printCardRow("  Body Preview:", $innerWidth);

        // Body preview (first 5 lines)
        $bodyLines = explode("\n", $body);
        $preview = array_slice($bodyLines, 0, 5);
        foreach ($preview as $line) {
            $this->printCardRow("  " . mb_substr($line, 0, $innerWidth - 6), $innerWidth);
        }
        if (count($bodyLines) > 5) {
            $this->printCardRow("  " . self::DIM . "... (" . (count($bodyLines) - 5) . " more lines)" . self::RESET, $innerWidth);
        }

        echo self::BRIGHT_CYAN . '  └' . str_repeat('─', $innerWidth) . '┘' . self::RESET . "\n";
    }

    /**
     * Display a generated email preview
     */
    public function showEmailPreview(string $subject, string $body, string $recipientName, string $type = 'text'): void
    {
        $innerWidth = 62;
        echo "\n";
        echo self::BRIGHT_GREEN . '  ┌' . str_repeat('─', $innerWidth) . '┐' . self::RESET . "\n";

        $this->printCardRow("  ✉  Generated Email for: {$recipientName}", $innerWidth, self::BRIGHT_GREEN);
        echo self::BRIGHT_GREEN . '  ├' . str_repeat('─', $innerWidth) . '┤' . self::RESET . "\n";

        $this->printCardRow("  Subject: {$subject}", $innerWidth, self::BRIGHT_GREEN);
        $this->printCardRow("  Type:    {$type}", $innerWidth, self::BRIGHT_GREEN);

        echo self::BRIGHT_GREEN . '  ├' . str_repeat('─', $innerWidth) . '┤' . self::RESET . "\n";

        $bodyLines = explode("\n", $body);
        foreach ($bodyLines as $line) {
            // Wrap long lines
            $wrapped = mb_str_split($line, $innerWidth - 6);
            if (empty($wrapped)) $wrapped = [''];
            foreach ($wrapped as $wl) {
                $this->printCardRow("  " . $wl, $innerWidth, self::BRIGHT_GREEN);
            }
        }

        echo self::BRIGHT_GREEN . '  └' . str_repeat('─', $innerWidth) . '┘' . self::RESET . "\n";
    }

    /**
     * Print a single row inside a card box
     */
    private function printCardRow(string $content, int $innerWidth, string $borderColor = ''): void
    {
        if ($borderColor === '') {
            $borderColor = self::BRIGHT_CYAN;
        }
        $visLen = $this->visibleLength($content);
        $padding = max(0, $innerWidth - $visLen);
        echo $borderColor . '  │' . self::RESET . $content . str_repeat(' ', $padding) . $borderColor . '│' . self::RESET . "\n";
    }

    /**
     * Display a summary dashboard
     */
    public function showSummaryDashboard(array $stats): void
    {
        $innerWidth = 50;
        echo "\n";
        echo self::BOLD . self::BRIGHT_MAGENTA . '  ╔' . str_repeat('═', $innerWidth) . '╗' . self::RESET . "\n";

        $title = 'Generation Summary';
        $pad = (int)(($innerWidth - mb_strlen($title)) / 2);
        echo self::BOLD . self::BRIGHT_MAGENTA . '  ║' . self::RESET
            . self::BOLD . self::BRIGHT_WHITE
            . str_repeat(' ', $pad) . $title . str_repeat(' ', $innerWidth - $pad - mb_strlen($title))
            . self::RESET . self::BOLD . self::BRIGHT_MAGENTA . '║' . self::RESET . "\n";

        echo self::BOLD . self::BRIGHT_MAGENTA . '  ╠' . str_repeat('═', $innerWidth) . '╣' . self::RESET . "\n";

        $rows = [
            ['Total Recipients',     $stats['total'] ?? 0,      self::BRIGHT_WHITE],
            ['Successful',           $stats['successful'] ?? 0, self::BRIGHT_GREEN],
            ['Skipped',              $stats['skipped'] ?? 0,    self::BRIGHT_YELLOW],
            ['Invalid Records',      $stats['invalid'] ?? 0,    self::BRIGHT_RED],
            ['Template Used',        $stats['template'] ?? '-', self::BRIGHT_CYAN],
            ['Export Format',        $stats['format'] ?? '-',   self::BRIGHT_CYAN],
            ['Time Taken',           $stats['time'] ?? '-',     self::DIM],
        ];

        foreach ($rows as $row) {
            $label = $row[0];
            $value = (string)$row[1];
            $color = $row[2];
            $labelWidth = 25;
            $valueWidth = $innerWidth - $labelWidth - 4;
            echo self::BOLD . self::BRIGHT_MAGENTA . '  ║' . self::RESET
                . '  ' . self::BRIGHT_WHITE . str_pad($label, $labelWidth) . self::RESET
                . $color . str_pad($value, $valueWidth) . self::RESET
                . self::BOLD . self::BRIGHT_MAGENTA . '║' . self::RESET . "\n";
        }

        echo self::BOLD . self::BRIGHT_MAGENTA . '  ╚' . str_repeat('═', $innerWidth) . '╝' . self::RESET . "\n";
    }

    /**
     * Display paginated list of templates
     */
    public function showPaginatedTemplates(array $templates, int $page = 1, int $perPage = 5): array
    {
        $total = count($templates);
        $totalPages = max(1, (int)ceil($total / $perPage));
        $page = max(1, min($page, $totalPages));
        $offset = ($page - 1) * $perPage;
        $pageItems = array_slice($templates, $offset, $perPage);

        $this->header(self::ICON_TEMPLATE . " Saved Templates (Page {$page}/{$totalPages}, Total: {$total})");

        if (empty($pageItems)) {
            $this->warning('No templates found.');
            return ['page' => $page, 'totalPages' => $totalPages];
        }

        foreach ($pageItems as $index => $tpl) {
            $num = $offset + $index + 1;
            $name = $tpl['name'] ?? 'Untitled';
            $type = $tpl['type'] ?? 'text';
            $created = $tpl['created_at'] ?? '-';

            echo self::BRIGHT_YELLOW . "  [{$num}]" . self::RESET
                . self::BRIGHT_WHITE . "  {$name}" . self::RESET
                . self::DIM . "  ({$type}) - Created: {$created}" . self::RESET . "\n";
        }

        echo "\n";
        $this->separator();

        // Pagination controls
        $controls = [];
        if ($page > 1) $controls[] = '[P] Previous';
        if ($page < $totalPages) $controls[] = '[N] Next';
        $controls[] = '[0] Back';

        echo self::DIM . '  ' . implode('  |  ', $controls) . self::RESET . "\n";

        return ['page' => $page, 'totalPages' => $totalPages];
    }

    /**
     * Show recipients table
     */
    public function showRecipientsTable(array $recipients, int $limit = 10): void
    {
        if (empty($recipients)) {
            $this->warning('No recipients loaded.');
            return;
        }

        $this->header(self::ICON_USER . " Loaded Recipients (" . count($recipients) . " total)");

        // Get all field keys from first recipient
        $headers = array_keys($recipients[0]);
        $display = array_slice($recipients, 0, $limit);

        // Calculate column widths
        $colWidths = [];
        foreach ($headers as $h) {
            $colWidths[$h] = mb_strlen($h);
        }
        foreach ($display as $row) {
            foreach ($headers as $h) {
                $val = (string)($row[$h] ?? '');
                $colWidths[$h] = max($colWidths[$h], min(mb_strlen($val), 25));
            }
        }

        // Print header row
        $headerLine = '  ';
        foreach ($headers as $h) {
            $headerLine .= self::BOLD . self::BRIGHT_CYAN . str_pad(mb_strtoupper($h), $colWidths[$h] + 2) . self::RESET;
        }
        echo $headerLine . "\n";
        echo '  ' . self::DIM . str_repeat('─', array_sum($colWidths) + (count($colWidths) * 2)) . self::RESET . "\n";

        // Print data rows
        foreach ($display as $row) {
            $line = '  ';
            foreach ($headers as $h) {
                $val = (string)($row[$h] ?? '');
                if (mb_strlen($val) > 25) $val = mb_substr($val, 0, 22) . '...';
                $line .= self::WHITE . str_pad($val, $colWidths[$h] + 2) . self::RESET;
            }
            echo $line . "\n";
        }

        if (count($recipients) > $limit) {
            echo self::DIM . "\n  ... and " . (count($recipients) - $limit) . " more recipients" . self::RESET . "\n";
        }
    }

    /**
     * Helper to get icon by name
     */
    public function icon(string $name): string
    {
        $icons = [
            'SUCCESS'  => self::ICON_SUCCESS,
            'ERROR'    => self::ICON_ERROR,
            'WARNING'  => self::ICON_WARNING,
            'INFO'     => self::ICON_INFO,
            'ARROW'    => self::ICON_ARROW,
            'MAIL'     => self::ICON_MAIL,
            'TEMPLATE' => self::ICON_TEMPLATE,
            'USER'     => self::ICON_USER,
            'EXPORT'   => self::ICON_EXPORT,
            'SEARCH'   => self::ICON_SEARCH,
        ];
        return $icons[$name] ?? '';
    }

    /**
     * Prompt user for a numbered choice
     */
    public function choice(string $prompt, array $validOptions): string
    {
        while (true) {
            echo self::BRIGHT_CYAN . "\n  " . self::ICON_ARROW . ' ' . $prompt . ': ' . self::RESET;
            $input = trim(readline(''));

            if (in_array($input, $validOptions, true)) {
                return $input;
            }

            $this->error("Invalid choice. Please enter one of: " . implode(', ', $validOptions));
        }
    }

    /**
     * Print a simple loading animation
     */
    public function showLoading(string $message, int $seconds = 2): void
    {
        $totalSteps = $seconds * 10;
        for ($i = 0; $i < $totalSteps; $i++) {
            $this->spinner($message, $i);
            usleep(100000); // 100ms
        }
        echo "\r" . str_repeat(' ', $this->termWidth) . "\r";
    }

    /**
     * Wait for user to press Enter to continue
     */
    public function pressEnterToContinue(): void
    {
        echo self::DIM . "\n  Press Enter to continue..." . self::RESET;
        readline('');
    }

    /**
     * Display the goodbye message
     */
    public function showGoodbye(): void
    {
        echo "\n";
        echo self::BOLD . self::BRIGHT_CYAN . '  ╔══════════════════════════════════════════════════╗' . self::RESET . "\n";
        echo self::BOLD . self::BRIGHT_CYAN . '  ║                                                  ║' . self::RESET . "\n";
        echo self::BOLD . self::BRIGHT_CYAN . '  ║' . self::BRIGHT_WHITE . '     Thank you for using Bulk Email Generator!   ' . self::BRIGHT_CYAN . '║' . self::RESET . "\n";
        echo self::BOLD . self::BRIGHT_CYAN . '  ║' . self::DIM . '               Goodbye! 👋                       ' . self::BRIGHT_CYAN . '║' . self::RESET . "\n";
        echo self::BOLD . self::BRIGHT_CYAN . '  ║                                                  ║' . self::RESET . "\n";
        echo self::BOLD . self::BRIGHT_CYAN . '  ╚══════════════════════════════════════════════════╝' . self::RESET . "\n";
        echo "\n";
    }
}
