<?php

/**
 * App - Main Application Controller
 * 
 * Orchestrates the entire CLI application flow, handles menus,
 * user interactions, and coordinates between all managers.
 */
class App
{
    /** @var CLIUI CLI interface */
    private CLIUI $ui;

    /** @var FileManager File manager */
    private FileManager $fileManager;

    /** @var TemplateManager Template manager */
    private TemplateManager $templateManager;

    /** @var RecipientManager Recipient manager */
    private RecipientManager $recipientManager;

    /** @var EmailGenerator Email generator */
    private EmailGenerator $emailGenerator;

    /** @var bool Application running state */
    private bool $running = true;

    public function __construct(string $basePath)
    {
        $this->ui               = new CLIUI();
        $this->fileManager      = new FileManager($basePath);
        $this->templateManager  = new TemplateManager($this->fileManager);
        $this->recipientManager = new RecipientManager($this->fileManager);
        $this->emailGenerator   = new EmailGenerator();
    }

    /**
     * Run the application
     */
    public function run(): void
    {
        while ($this->running) {
            $this->ui->clearScreen();
            $this->ui->showBanner();
            $this->ui->resetBreadcrumbs();
            $this->ui->showMainMenu();

            $choice = $this->ui->choice('Select an option', ['0', '1', '2', '3', '4', '5', '6']);

            switch ($choice) {
                case '1':
                    $this->templateManagementMenu();
                    break;
                case '2':
                    $this->importRecipientsMenu();
                    break;
                case '3':
                    $this->generateEmailsMenu();
                    break;
                case '4':
                    $this->exportEmailsMenu();
                    break;
                case '5':
                    $this->viewHistory();
                    break;
                case '6':
                    $this->searchTemplates();
                    break;
                case '0':
                    $this->exitApp();
                    break;
            }
        }
    }

    // ════════════════════════════════════════════════════════════════════
    //  TEMPLATE MANAGEMENT
    // ════════════════════════════════════════════════════════════════════

    /**
     * Template management submenu
     */
    private function templateManagementMenu(): void
    {
        while (true) {
            $this->ui->clearScreen();
            $this->ui->showBanner();
            $this->ui->resetBreadcrumbs();
            $this->ui->pushBreadcrumb('Template Management');
            $this->ui->showTemplateMenu();

            $choice = $this->ui->choice('Select an option', ['0', '1', '2', '3', '4', '5']);

            switch ($choice) {
                case '1':
                    $this->createTemplate();
                    break;
                case '2':
                    $this->editTemplate();
                    break;
                case '3':
                    $this->deleteTemplate();
                    break;
                case '4':
                    $this->listTemplates();
                    break;
                case '5':
                    $this->duplicateTemplate();
                    break;
                case '0':
                    return;
            }
        }
    }

    /**
     * Create a new template (guided flow)
     */
    private function createTemplate(): void
    {
        $this->ui->clearScreen();
        $this->ui->showBanner();
        $this->ui->resetBreadcrumbs();
        $this->ui->pushBreadcrumb('Template Management');
        $this->ui->pushBreadcrumb('Create New Template');
        $this->ui->showBreadcrumbs();

        $this->ui->header('📝 Create New Email Template');
        $this->ui->info('Fill in the following fields to create a new template.');
        $this->ui->info('Use {{placeholder}} syntax for dynamic fields.');

        // Step 1: Template name
        $name = $this->ui->prompt('Template Name', true, [Validator::class, 'validateTemplateName']);

        // Step 2: Template type
        $this->ui->info('Template type determines the output format.');
        echo CLIUI::DIM . "  [1] text - Plain text email\n  [2] html - HTML email\n" . CLIUI::RESET;
        $typeChoice = $this->ui->choice('Select type', ['1', '2']);
        $type = $typeChoice === '2' ? 'html' : 'text';

        // Step 3: Subject
        $subject = $this->ui->prompt('Email Subject (supports {{placeholders}})', true, [Validator::class, 'validateSubject']);

        // Step 4: Body
        $body = $this->ui->promptMultiline('Email Body (supports {{placeholders}})');

        if (empty(trim($body))) {
            $this->ui->error('Template body cannot be empty. Template not created.');
            $this->ui->pressEnterToContinue();
            return;
        }

        // Show preview
        $this->ui->header('Preview');
        $template = [
            'name'       => $name,
            'subject'    => $subject,
            'body'       => $body,
            'type'       => $type,
            'created_at' => date('Y-m-d H:i:s'),
        ];
        $this->ui->showTemplateCard($template);

        // Confirm
        if (!$this->ui->confirm('Save this template?', true)) {
            $this->ui->warning('Template creation cancelled.');
            $this->ui->pressEnterToContinue();
            return;
        }

        try {
            $created = $this->templateManager->create($name, $subject, $body, $type);
            $this->ui->success("Template '{$name}' created successfully! (ID: {$created['id']})");
        } catch (Exception $e) {
            $this->ui->error('Failed to create template: ' . $e->getMessage());
        }

        $this->ui->pressEnterToContinue();
    }

    /**
     * Edit an existing template
     */
    private function editTemplate(): void
    {
        $this->ui->clearScreen();
        $this->ui->showBanner();
        $this->ui->resetBreadcrumbs();
        $this->ui->pushBreadcrumb('Template Management');
        $this->ui->pushBreadcrumb('Edit Template');
        $this->ui->showBreadcrumbs();

        $templates = $this->templateManager->getAll();
        if (empty($templates)) {
            $this->ui->warning('No templates found. Create one first.');
            $this->ui->pressEnterToContinue();
            return;
        }

        $this->ui->header('✏️  Edit Template');

        // List templates for selection
        foreach ($templates as $i => $tpl) {
            $num = $i + 1;
            echo CLIUI::BRIGHT_YELLOW . "  [{$num}]" . CLIUI::RESET
                . CLIUI::BRIGHT_WHITE . "  {$tpl['name']}" . CLIUI::RESET
                . CLIUI::DIM . "  ({$tpl['type']})" . CLIUI::RESET . "\n";
        }

        $validOptions = array_map('strval', range(1, count($templates)));
        $validOptions[] = '0';
        echo CLIUI::DIM . "\n  [0] Back" . CLIUI::RESET . "\n";
        $choice = $this->ui->choice('Select template to edit', $validOptions);

        if ($choice === '0') return;

        $template = $this->templateManager->getByIndex((int)$choice);
        if (!$template) {
            $this->ui->error('Template not found.');
            $this->ui->pressEnterToContinue();
            return;
        }

        // Show current template
        $this->ui->showTemplateCard($template);
        $this->ui->info('Leave a field blank to keep current value.');

        // Edit fields
        echo CLIUI::BRIGHT_CYAN . "\n  → Name [{$template['name']}]: " . CLIUI::RESET;
        $newName = trim(readline(''));
        if ($newName !== '') {
            $validation = Validator::validateTemplateName($newName);
            if ($validation !== true) {
                $this->ui->error($validation);
                $this->ui->pressEnterToContinue();
                return;
            }
        }

        echo CLIUI::BRIGHT_CYAN . "  → Subject [{$template['subject']}]: " . CLIUI::RESET;
        $newSubject = trim(readline(''));

        echo CLIUI::BRIGHT_CYAN . "  → Type [{$template['type']}] (text/html): " . CLIUI::RESET;
        $newType = trim(readline(''));
        if ($newType !== '' && !in_array($newType, ['text', 'html'])) {
            $this->ui->error("Invalid type. Must be 'text' or 'html'.");
            $this->ui->pressEnterToContinue();
            return;
        }

        $this->ui->info('Enter new body (leave empty to keep current):');
        $newBody = $this->ui->promptMultiline('New Body');

        // Build updates
        $updates = [];
        if ($newName !== '') $updates['name'] = $newName;
        if ($newSubject !== '') $updates['subject'] = $newSubject;
        if ($newType !== '') $updates['type'] = $newType;
        if ($newBody !== '') $updates['body'] = $newBody;

        if (empty($updates)) {
            $this->ui->info('No changes made.');
            $this->ui->pressEnterToContinue();
            return;
        }

        if (!$this->ui->confirm('Apply these changes?', true)) {
            $this->ui->warning('Edit cancelled.');
            $this->ui->pressEnterToContinue();
            return;
        }

        try {
            $updated = $this->templateManager->update($template['id'], $updates);
            if ($updated) {
                $this->ui->success("Template updated successfully!");
                $this->ui->showTemplateCard($updated);
            } else {
                $this->ui->error('Failed to update template.');
            }
        } catch (Exception $e) {
            $this->ui->error('Error: ' . $e->getMessage());
        }

        $this->ui->pressEnterToContinue();
    }

    /**
     * Delete a template
     */
    private function deleteTemplate(): void
    {
        $this->ui->clearScreen();
        $this->ui->showBanner();
        $this->ui->resetBreadcrumbs();
        $this->ui->pushBreadcrumb('Template Management');
        $this->ui->pushBreadcrumb('Delete Template');
        $this->ui->showBreadcrumbs();

        $templates = $this->templateManager->getAll();
        if (empty($templates)) {
            $this->ui->warning('No templates found.');
            $this->ui->pressEnterToContinue();
            return;
        }

        $this->ui->header('🗑️  Delete Template');

        foreach ($templates as $i => $tpl) {
            $num = $i + 1;
            echo CLIUI::BRIGHT_YELLOW . "  [{$num}]" . CLIUI::RESET
                . CLIUI::BRIGHT_WHITE . "  {$tpl['name']}" . CLIUI::RESET . "\n";
        }

        $validOptions = array_map('strval', range(1, count($templates)));
        $validOptions[] = '0';
        echo CLIUI::DIM . "\n  [0] Back" . CLIUI::RESET . "\n";
        $choice = $this->ui->choice('Select template to delete', $validOptions);

        if ($choice === '0') return;

        $template = $this->templateManager->getByIndex((int)$choice);
        if (!$template) {
            $this->ui->error('Template not found.');
            $this->ui->pressEnterToContinue();
            return;
        }

        $this->ui->showTemplateCard($template);

        if (!$this->ui->confirm("Are you sure you want to DELETE '{$template['name']}'? This cannot be undone.", false)) {
            $this->ui->warning('Deletion cancelled.');
            $this->ui->pressEnterToContinue();
            return;
        }

        try {
            if ($this->templateManager->delete($template['id'])) {
                $this->ui->success("Template '{$template['name']}' has been deleted.");
            } else {
                $this->ui->error('Failed to delete template.');
            }
        } catch (Exception $e) {
            $this->ui->error('Error: ' . $e->getMessage());
        }

        $this->ui->pressEnterToContinue();
    }

    /**
     * List all templates with pagination
     */
    private function listTemplates(): void
    {
        $page = 1;

        while (true) {
            $this->ui->clearScreen();
            $this->ui->showBanner();
            $this->ui->resetBreadcrumbs();
            $this->ui->pushBreadcrumb('Template Management');
            $this->ui->pushBreadcrumb('List Templates');
            $this->ui->showBreadcrumbs();

            $templates = $this->templateManager->getAll();

            if (empty($templates)) {
                $this->ui->warning('No templates found. Create one first.');
                $this->ui->pressEnterToContinue();
                return;
            }

            $pagination = $this->ui->showPaginatedTemplates($templates, $page);

            // Allow viewing a specific template
            echo CLIUI::DIM . "  Enter a template number to view details, or use navigation keys.\n" . CLIUI::RESET;
            echo CLIUI::BRIGHT_CYAN . "\n  → Choice: " . CLIUI::RESET;
            $input = strtoupper(trim(readline('')));

            if ($input === '0') return;
            if ($input === 'N' && $page < $pagination['totalPages']) {
                $page++;
                continue;
            }
            if ($input === 'P' && $page > 1) {
                $page--;
                continue;
            }

            // Check if it's a template number
            if (ctype_digit($input)) {
                $tpl = $this->templateManager->getByIndex((int)$input);
                if ($tpl) {
                    $this->ui->showTemplateCard($tpl);

                    // Show placeholders
                    $placeholders = $this->templateManager->getPlaceholders($tpl);
                    if (!empty($placeholders)) {
                        $this->ui->info('Placeholders used: {{' . implode('}}, {{', $placeholders) . '}}');
                    }

                    $this->ui->pressEnterToContinue();
                } else {
                    $this->ui->error('Invalid template number.');
                    $this->ui->pressEnterToContinue();
                }
            }
        }
    }

    /**
     * Duplicate a template
     */
    private function duplicateTemplate(): void
    {
        $this->ui->clearScreen();
        $this->ui->showBanner();
        $this->ui->resetBreadcrumbs();
        $this->ui->pushBreadcrumb('Template Management');
        $this->ui->pushBreadcrumb('Duplicate Template');
        $this->ui->showBreadcrumbs();

        $templates = $this->templateManager->getAll();
        if (empty($templates)) {
            $this->ui->warning('No templates found to duplicate.');
            $this->ui->pressEnterToContinue();
            return;
        }

        $this->ui->header('📑 Duplicate Template');

        foreach ($templates as $i => $tpl) {
            $num = $i + 1;
            echo CLIUI::BRIGHT_YELLOW . "  [{$num}]" . CLIUI::RESET
                . CLIUI::BRIGHT_WHITE . "  {$tpl['name']}" . CLIUI::RESET . "\n";
        }

        $validOptions = array_map('strval', range(1, count($templates)));
        $validOptions[] = '0';
        echo CLIUI::DIM . "\n  [0] Back" . CLIUI::RESET . "\n";
        $choice = $this->ui->choice('Select template to duplicate', $validOptions);

        if ($choice === '0') return;

        $template = $this->templateManager->getByIndex((int)$choice);
        if (!$template) {
            $this->ui->error('Template not found.');
            $this->ui->pressEnterToContinue();
            return;
        }

        try {
            $duplicated = $this->templateManager->duplicate($template['id']);
            if ($duplicated) {
                $this->ui->success("Template duplicated as '{$duplicated['name']}' (ID: {$duplicated['id']})");
                $this->ui->showTemplateCard($duplicated);
            } else {
                $this->ui->error('Failed to duplicate template.');
            }
        } catch (Exception $e) {
            $this->ui->error('Error: ' . $e->getMessage());
        }

        $this->ui->pressEnterToContinue();
    }

    // ════════════════════════════════════════════════════════════════════
    //  IMPORT RECIPIENTS
    // ════════════════════════════════════════════════════════════════════

    /**
     * Import recipients menu
     */
    private function importRecipientsMenu(): void
    {
        $this->ui->clearScreen();
        $this->ui->showBanner();
        $this->ui->resetBreadcrumbs();
        $this->ui->pushBreadcrumb('Import Recipients');
        $this->ui->showBreadcrumbs();

        $this->ui->header('📥 Import Recipients');

        // Check for existing sample files
        $importDir = $this->fileManager->getPath('imports');
        $availableFiles = $this->fileManager->listFiles('imports');

        if (!empty($availableFiles)) {
            $this->ui->info('Files found in /imports directory:');
            foreach ($availableFiles as $i => $file) {
                $num = $i + 1;
                echo CLIUI::BRIGHT_YELLOW . "  [{$num}]" . CLIUI::RESET
                    . CLIUI::BRIGHT_WHITE . "  {$file}" . CLIUI::RESET . "\n";
            }
            echo "\n";
        }

        $this->ui->info("You can select a file from the list above OR enter a custom file path.");
        echo CLIUI::DIM . "  Supported formats: .csv, .json\n" . CLIUI::RESET;

        echo CLIUI::BRIGHT_CYAN . "\n  → Enter file number or full path (0 to go back): " . CLIUI::RESET;
        $input = trim(readline(''));

        if ($input === '0') return;

        // Determine file path
        $filePath = '';
        if (ctype_digit($input) && isset($availableFiles[(int)$input - 1])) {
            $filePath = $this->fileManager->getPath('imports/' . $availableFiles[(int)$input - 1]);
        } else {
            $filePath = $input;
            // If relative, try imports/ directory
            if (!file_exists($filePath)) {
                $tryPath = $this->fileManager->getPath('imports/' . $filePath);
                if (file_exists($tryPath)) {
                    $filePath = $tryPath;
                }
            }
        }

        // Validate file
        $validation = Validator::validateFilePath($filePath);
        if ($validation !== true) {
            $this->ui->error($validation);
            $this->ui->pressEnterToContinue();
            return;
        }

        try {
            $this->ui->showLoading('Importing recipients', 1);
            $recipients = $this->recipientManager->importFromFile($filePath);

            $this->ui->success("Successfully imported " . count($recipients) . " recipients!");
            $this->ui->showRecipientsTable($recipients);

            // Show available fields
            $fields = $this->recipientManager->getAvailableFields();
            $this->ui->info('Available fields: ' . implode(', ', $fields));

            // Validate data
            $report = $this->recipientManager->validate();
            $this->showValidationReport($report);

        } catch (Exception $e) {
            $this->ui->error('Import failed: ' . $e->getMessage());
        }

        $this->ui->pressEnterToContinue();
    }

    /**
     * Show a validation report for recipients
     */
    private function showValidationReport(array $report): void
    {
        $this->ui->separator();
        $this->ui->header('📋 Validation Report');

        $validCount = count($report['valid'] ?? []);
        $invalidCount = count($report['invalid'] ?? []);
        $warningCount = count($report['warnings'] ?? []);

        echo CLIUI::BRIGHT_GREEN . "  ✔ Valid records:   {$validCount}" . CLIUI::RESET . "\n";
        echo CLIUI::BRIGHT_RED . "  ✘ Invalid records: {$invalidCount}" . CLIUI::RESET . "\n";
        echo CLIUI::BRIGHT_YELLOW . "  ⚠ Warnings:       {$warningCount}" . CLIUI::RESET . "\n";

        // Show invalid details
        if (!empty($report['invalid'])) {
            $this->ui->separator();
            echo CLIUI::BRIGHT_RED . "  Invalid Records:" . CLIUI::RESET . "\n";
            foreach ($report['invalid'] as $item) {
                foreach ($item['errors'] as $err) {
                    echo CLIUI::RED . "    • {$err}" . CLIUI::RESET . "\n";
                }
            }
        }

        // Show warnings (max 10)
        if (!empty($report['warnings'])) {
            $this->ui->separator();
            echo CLIUI::BRIGHT_YELLOW . "  Warnings:" . CLIUI::RESET . "\n";
            $shown = array_slice($report['warnings'], 0, 10);
            foreach ($shown as $w) {
                echo CLIUI::YELLOW . "    • {$w}" . CLIUI::RESET . "\n";
            }
            if (count($report['warnings']) > 10) {
                echo CLIUI::DIM . "    ... and " . (count($report['warnings']) - 10) . " more warnings." . CLIUI::RESET . "\n";
            }
        }
    }

    // ════════════════════════════════════════════════════════════════════
    //  EMAIL GENERATION
    // ════════════════════════════════════════════════════════════════════

    /**
     * Generate emails menu
     */
    private function generateEmailsMenu(): void
    {
        while (true) {
            $this->ui->clearScreen();
            $this->ui->showBanner();
            $this->ui->resetBreadcrumbs();
            $this->ui->pushBreadcrumb('Generate Emails');
            $this->ui->showGenerateMenu();

            // Status indicators
            $tplCount = $this->templateManager->count();
            $recCount = $this->recipientManager->count();

            echo CLIUI::DIM . "  📝 Templates loaded: {$tplCount}" . CLIUI::RESET . "\n";
            echo CLIUI::DIM . "  👤 Recipients loaded: {$recCount}" . CLIUI::RESET . "\n";

            if ($tplCount === 0) {
                $this->ui->warning('No templates available. Create one first.');
                $this->ui->pressEnterToContinue();
                return;
            }

            if ($recCount === 0) {
                $this->ui->warning('No recipients loaded. Import recipients first.');
                $this->ui->pressEnterToContinue();
                return;
            }

            $choice = $this->ui->choice('Select an option', ['0', '1', '2']);

            switch ($choice) {
                case '1':
                    $this->previewSingleEmail();
                    break;
                case '2':
                    $this->generateAllEmails();
                    break;
                case '0':
                    return;
            }
        }
    }

    /**
     * Select a template (reusable helper)
     */
    private function selectTemplate(): ?array
    {
        $templates = $this->templateManager->getAll();

        $this->ui->header('Select Template');
        foreach ($templates as $i => $tpl) {
            $num = $i + 1;
            echo CLIUI::BRIGHT_YELLOW . "  [{$num}]" . CLIUI::RESET
                . CLIUI::BRIGHT_WHITE . "  {$tpl['name']}" . CLIUI::RESET
                . CLIUI::DIM . "  ({$tpl['type']})" . CLIUI::RESET . "\n";
        }

        $validOptions = array_map('strval', range(1, count($templates)));
        $validOptions[] = '0';
        echo CLIUI::DIM . "\n  [0] Cancel" . CLIUI::RESET . "\n";
        $choice = $this->ui->choice('Select template', $validOptions);

        if ($choice === '0') return null;

        return $this->templateManager->getByIndex((int)$choice);
    }

    /**
     * Preview a single email for one recipient
     */
    private function previewSingleEmail(): void
    {
        $this->ui->clearScreen();
        $this->ui->showBanner();
        $this->ui->resetBreadcrumbs();
        $this->ui->pushBreadcrumb('Generate Emails');
        $this->ui->pushBreadcrumb('Preview Single');
        $this->ui->showBreadcrumbs();

        // Select template
        $template = $this->selectTemplate();
        if (!$template) return;

        // Show template placeholders
        $placeholders = $this->templateManager->getPlaceholders($template);
        if (!empty($placeholders)) {
            $this->ui->info('Template placeholders: {{' . implode('}}, {{', $placeholders) . '}}');
        }

        // Select recipient
        $recipients = $this->recipientManager->getRecipients();
        $this->ui->header('Select Recipient for Preview');

        $showCount = min(count($recipients), 10);
        for ($i = 0; $i < $showCount; $i++) {
            $num = $i + 1;
            $name = $recipients[$i]['name'] ?? 'Unknown';
            $email = $recipients[$i]['email'] ?? 'N/A';
            echo CLIUI::BRIGHT_YELLOW . "  [{$num}]" . CLIUI::RESET
                . CLIUI::BRIGHT_WHITE . "  {$name}" . CLIUI::RESET
                . CLIUI::DIM . "  ({$email})" . CLIUI::RESET . "\n";
        }
        if (count($recipients) > 10) {
            echo CLIUI::DIM . "  ... and " . (count($recipients) - 10) . " more" . CLIUI::RESET . "\n";
        }

        $validOptions = array_map('strval', range(1, $showCount));
        $validOptions[] = '0';
        echo CLIUI::DIM . "\n  [0] Back" . CLIUI::RESET . "\n";
        $choice = $this->ui->choice('Select recipient', $validOptions);

        if ($choice === '0') return;

        $recipient = $this->recipientManager->getByIndex((int)$choice);
        if (!$recipient) {
            $this->ui->error('Recipient not found.');
            $this->ui->pressEnterToContinue();
            return;
        }

        // Generate preview
        $generated = $this->emailGenerator->generateSingle($template, $recipient);
        $this->ui->showEmailPreview(
            $generated['subject'],
            $generated['body'],
            $generated['name'],
            $generated['type']
        );

        // Check for unresolved placeholders
        if (preg_match('/\{\{\w+\}\}/', $generated['subject'] . $generated['body'])) {
            $this->ui->warning('Some placeholders could not be resolved. Check your recipient data.');
        }

        $this->ui->pressEnterToContinue();
    }

    /**
     * Generate emails for all recipients
     */
    private function generateAllEmails(): void
    {
        $this->ui->clearScreen();
        $this->ui->showBanner();
        $this->ui->resetBreadcrumbs();
        $this->ui->pushBreadcrumb('Generate Emails');
        $this->ui->pushBreadcrumb('Bulk Generate');
        $this->ui->showBreadcrumbs();

        // Select template
        $template = $this->selectTemplate();
        if (!$template) return;

        // Show template info
        $this->ui->showTemplateCard($template);
        $placeholders = $this->templateManager->getPlaceholders($template);

        // Validate recipients against template placeholders
        $report = $this->recipientManager->validate($placeholders);
        $this->showValidationReport($report);

        $validRecipients = $report['valid'];
        $invalidCount = count($report['invalid']);

        if (empty($validRecipients)) {
            $this->ui->error('No valid recipients to generate emails for.');
            $this->ui->pressEnterToContinue();
            return;
        }

        $total = count($validRecipients);
        $this->ui->info("Ready to generate {$total} emails.");

        if ($invalidCount > 0) {
            $this->ui->warning("{$invalidCount} invalid record(s) will be skipped.");
        }

        if (!$this->ui->confirm("Proceed with generation for {$total} recipients?", true)) {
            $this->ui->warning('Generation cancelled.');
            $this->ui->pressEnterToContinue();
            return;
        }

        echo "\n";

        // Generate!
        $emails = $this->emailGenerator->generateBulk($template, $validRecipients, $this->ui);

        echo "\n";
        $this->ui->success("Email generation complete!");

        // Show summary dashboard
        $stats = $this->emailGenerator->getStats();
        $this->ui->showSummaryDashboard($stats);

        // Save to history
        $this->saveHistory($stats, $template);

        // Preview first generated email
        if (!empty($emails)) {
            $first = $emails[0];
            $this->ui->info('Preview of first generated email:');
            $this->ui->showEmailPreview($first['subject'], $first['body'], $first['name'], $first['type']);
        }

        $this->ui->pressEnterToContinue();
    }

    // ════════════════════════════════════════════════════════════════════
    //  EXPORT
    // ════════════════════════════════════════════════════════════════════

    /**
     * Export generated emails
     */
    private function exportEmailsMenu(): void
    {
        $this->ui->clearScreen();
        $this->ui->showBanner();
        $this->ui->resetBreadcrumbs();
        $this->ui->pushBreadcrumb('Export Emails');
        $this->ui->showBreadcrumbs();

        $this->ui->header('📤 Export Generated Emails');

        if (!$this->emailGenerator->hasGeneratedEmails()) {
            $this->ui->warning('No generated emails to export. Generate emails first.');
            $this->ui->pressEnterToContinue();
            return;
        }

        $emailCount = count($this->emailGenerator->getGeneratedEmails());
        $this->ui->info("{$emailCount} generated emails ready for export.");

        echo CLIUI::BRIGHT_WHITE . "\n  Available export formats:" . CLIUI::RESET . "\n";
        echo CLIUI::BRIGHT_YELLOW . "  [1]" . CLIUI::RESET . "  TXT  - Plain text file" . "\n";
        echo CLIUI::BRIGHT_YELLOW . "  [2]" . CLIUI::RESET . "  HTML - Styled HTML page" . "\n";
        echo CLIUI::BRIGHT_YELLOW . "  [3]" . CLIUI::RESET . "  JSON - Structured JSON data" . "\n";
        echo CLIUI::BRIGHT_YELLOW . "  [4]" . CLIUI::RESET . "  CSV  - Spreadsheet format" . "\n";
        echo CLIUI::DIM . "\n  [0] Back" . CLIUI::RESET . "\n";

        $choice = $this->ui->choice('Select export format', ['0', '1', '2', '3', '4']);

        if ($choice === '0') return;

        $formatMap = ['1' => 'txt', '2' => 'html', '3' => 'json', '4' => 'csv'];
        $format = $formatMap[$choice];

        // Check if export file exists
        $timestamp = date('Y-m-d_H-i-s');
        $exportFile = "exports/emails_{$timestamp}.{$format}";
        if ($this->fileManager->fileExists($exportFile)) {
            if (!$this->ui->confirm('An export file with this name already exists. Overwrite?', false)) {
                $this->ui->warning('Export cancelled.');
                $this->ui->pressEnterToContinue();
                return;
            }
        }

        try {
            $this->ui->showLoading('Exporting emails', 2);
            $path = $this->emailGenerator->export($format, $this->fileManager);
            $this->ui->success("Emails exported successfully!");
            $this->ui->info("File saved to: {$path}");
        } catch (Exception $e) {
            $this->ui->error('Export failed: ' . $e->getMessage());
        }

        $this->ui->pressEnterToContinue();
    }

    // ════════════════════════════════════════════════════════════════════
    //  HISTORY
    // ════════════════════════════════════════════════════════════════════

    /**
     * Save generation run to history
     */
    private function saveHistory(array $stats, array $template): void
    {
        try {
            $history = $this->fileManager->readJson('data/history.json');
            $history[] = [
                'id'         => 'run_' . substr(md5(uniqid((string)mt_rand(), true)), 0, 8),
                'template'   => $template['name'],
                'stats'      => $stats,
                'created_at' => date('Y-m-d H:i:s'),
            ];
            $this->fileManager->writeJson('data/history.json', $history);
        } catch (Exception $e) {
            // Silently fail on history save
        }
    }

    /**
     * View generation history
     */
    private function viewHistory(): void
    {
        $this->ui->clearScreen();
        $this->ui->showBanner();
        $this->ui->resetBreadcrumbs();
        $this->ui->pushBreadcrumb('View History');
        $this->ui->showBreadcrumbs();

        $this->ui->header('📊 Generation History');

        try {
            $history = $this->fileManager->readJson('data/history.json');
        } catch (Exception $e) {
            $this->ui->error('Could not load history: ' . $e->getMessage());
            $this->ui->pressEnterToContinue();
            return;
        }

        if (empty($history)) {
            $this->ui->warning('No generation history found.');
            $this->ui->pressEnterToContinue();
            return;
        }

        // Show history entries (most recent first)
        $history = array_reverse($history);
        $shown = array_slice($history, 0, 20);

        foreach ($shown as $index => $entry) {
            $num = $index + 1;

            echo CLIUI::BRIGHT_CYAN . '  ┌' . str_repeat('─', 55) . '┐' . CLIUI::RESET . "\n";
            echo CLIUI::BRIGHT_CYAN . '  │' . CLIUI::RESET
                . CLIUI::BOLD . CLIUI::BRIGHT_WHITE . " Run #{$num}: {$entry['template']}"
                . str_repeat(' ', max(1, 55 - strlen(" Run #{$num}: {$entry['template']}") - strlen($entry['created_at']) - 1))
                . CLIUI::DIM . $entry['created_at'] . ' '
                . CLIUI::RESET . CLIUI::BRIGHT_CYAN . '│' . CLIUI::RESET . "\n";
            echo CLIUI::BRIGHT_CYAN . '  ├' . str_repeat('─', 55) . '┤' . CLIUI::RESET . "\n";

            $stats = $entry['stats'] ?? [];
            $statsLine = sprintf(
                " Total: %s | Success: %s | Skipped: %s | Time: %s",
                $stats['total'] ?? '-',
                $stats['successful'] ?? '-',
                $stats['skipped'] ?? '-',
                $stats['time'] ?? '-'
            );
            $padding = max(1, 55 - strlen($statsLine));
            echo CLIUI::BRIGHT_CYAN . '  │' . CLIUI::RESET
                . CLIUI::DIM . $statsLine . str_repeat(' ', $padding)
                . CLIUI::RESET . CLIUI::BRIGHT_CYAN . '│' . CLIUI::RESET . "\n";
            echo CLIUI::BRIGHT_CYAN . '  └' . str_repeat('─', 55) . '┘' . CLIUI::RESET . "\n\n";
        }

        if (count($history) > 20) {
            $this->ui->info("Showing 20 of " . count($history) . " records.");
        }

        $this->ui->pressEnterToContinue();
    }

    // ════════════════════════════════════════════════════════════════════
    //  SEARCH
    // ════════════════════════════════════════════════════════════════════

    /**
     * Search templates by name
     */
    private function searchTemplates(): void
    {
        $this->ui->clearScreen();
        $this->ui->showBanner();
        $this->ui->resetBreadcrumbs();
        $this->ui->pushBreadcrumb('Search Templates');
        $this->ui->showBreadcrumbs();

        $this->ui->header('🔍 Search Templates');

        $query = $this->ui->prompt('Enter search term');

        $results = $this->templateManager->search($query);

        if (empty($results)) {
            $this->ui->warning("No templates found matching '{$query}'.");
        } else {
            $this->ui->success("Found " . count($results) . " template(s):");

            foreach ($results as $tpl) {
                $this->ui->showTemplateCard($tpl);
            }
        }

        $this->ui->pressEnterToContinue();
    }

    // ════════════════════════════════════════════════════════════════════
    //  EXIT
    // ════════════════════════════════════════════════════════════════════

    /**
     * Exit the application
     */
    private function exitApp(): void
    {
        if ($this->ui->confirm('Are you sure you want to exit?', true)) {
            $this->ui->clearScreen();
            $this->ui->showGoodbye();
            $this->running = false;
        }
    }
}
