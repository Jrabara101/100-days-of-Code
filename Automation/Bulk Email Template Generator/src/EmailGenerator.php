<?php

/**
 * EmailGenerator - Generates personalized emails
 * 
 * Replaces template placeholders with recipient data
 * and handles bulk email generation with statistics.
 */
class EmailGenerator
{
    /** @var array Generated emails from the last run */
    private array $generatedEmails = [];

    /** @var array Generation statistics */
    private array $stats = [];

    /**
     * Replace placeholders in a string with recipient data
     *
     * @param string $template The template string
     * @param array $data Recipient data (key => value)
     * @return string The processed string
     */
    public function replacePlaceholders(string $template, array $data): string
    {
        return preg_replace_callback('/\{\{(\w+)\}\}/', function ($matches) use ($data) {
            $key = strtolower($matches[1]);
            return $data[$key] ?? $matches[0]; // Keep original if not found
        }, $template);
    }

    /**
     * Generate a single email from a template and recipient data
     *
     * @param array $template The email template
     * @param array $recipient The recipient data
     * @return array Generated email with 'subject', 'body', 'recipient', 'type'
     */
    public function generateSingle(array $template, array $recipient): array
    {
        $subject = $this->replacePlaceholders($template['subject'] ?? '', $recipient);
        $body = $this->replacePlaceholders($template['body'] ?? '', $recipient);

        // If HTML type, wrap in basic HTML structure
        if (($template['type'] ?? 'text') === 'html') {
            $body = $this->wrapInHtml($subject, $body);
        }

        return [
            'to'        => $recipient['email'] ?? '',
            'name'      => $recipient['name'] ?? 'Unknown',
            'subject'   => $subject,
            'body'      => $body,
            'type'      => $template['type'] ?? 'text',
            'template'  => $template['name'] ?? '',
            'generated' => date('Y-m-d H:i:s'),
        ];
    }

    /**
     * Generate emails for all valid recipients
     *
     * @param array $template The email template
     * @param array $recipients Valid recipients
     * @param CLIUI $ui CLI interface for progress display
     * @return array Array of generated emails
     */
    public function generateBulk(array $template, array $recipients, CLIUI $ui): array
    {
        $this->generatedEmails = [];
        $startTime = microtime(true);
        $total = count($recipients);
        $successful = 0;
        $skipped = 0;

        foreach ($recipients as $index => $recipient) {
            // Show progress
            $ui->progressBar($index + 1, $total, 'Generating');

            try {
                // Validate email before generating
                if (!isset($recipient['email']) || !Validator::isValidEmail($recipient['email'])) {
                    $skipped++;
                    continue;
                }

                $email = $this->generateSingle($template, $recipient);
                $this->generatedEmails[] = $email;
                $successful++;
            } catch (Exception $e) {
                $skipped++;
            }

            // Small delay for visual effect on progress bar
            usleep(50000);
        }

        $endTime = microtime(true);
        $timeTaken = round($endTime - $startTime, 2);

        $this->stats = [
            'total'      => $total,
            'successful' => $successful,
            'skipped'    => $skipped,
            'invalid'    => $total - $successful - $skipped,
            'template'   => $template['name'] ?? '-',
            'format'     => $template['type'] ?? 'text',
            'time'       => $timeTaken . 's',
        ];

        return $this->generatedEmails;
    }

    /**
     * Get the generated emails from the last run
     */
    public function getGeneratedEmails(): array
    {
        return $this->generatedEmails;
    }

    /**
     * Get generation statistics
     */
    public function getStats(): array
    {
        return $this->stats;
    }

    /**
     * Check if there are generated emails
     */
    public function hasGeneratedEmails(): bool
    {
        return !empty($this->generatedEmails);
    }

    /**
     * Wrap body content in a basic HTML email structure
     */
    private function wrapInHtml(string $subject, string $body): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$subject}</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="email-container">
        {$body}
    </div>
</body>
</html>
HTML;
    }

    /**
     * Export generated emails to different formats
     *
     * @param string $format Export format (txt, html, json, csv)
     * @param FileManager $fileManager File manager for writing
     * @return string Path to the exported file
     */
    public function export(string $format, FileManager $fileManager): string
    {
        if (empty($this->generatedEmails)) {
            throw new RuntimeException('No generated emails to export.');
        }

        $timestamp = date('Y-m-d_H-i-s');
        $format = strtolower(trim($format));

        switch ($format) {
            case 'txt':
                return $this->exportAsTxt($fileManager, $timestamp);
            case 'html':
                return $this->exportAsHtml($fileManager, $timestamp);
            case 'json':
                return $this->exportAsJson($fileManager, $timestamp);
            case 'csv':
                return $this->exportAsCsv($fileManager, $timestamp);
            default:
                throw new RuntimeException("Unsupported export format: {$format}");
        }
    }

    /**
     * Export as plain text
     */
    private function exportAsTxt(FileManager $fileManager, string $timestamp): string
    {
        $content = "BULK EMAIL GENERATION EXPORT\n";
        $content .= "Generated: {$timestamp}\n";
        $content .= str_repeat('=', 60) . "\n\n";

        foreach ($this->generatedEmails as $index => $email) {
            $num = $index + 1;
            $content .= "--- Email #{$num} ---\n";
            $content .= "To:      {$email['to']}\n";
            $content .= "Name:    {$email['name']}\n";
            $content .= "Subject: {$email['subject']}\n";
            $content .= "Type:    {$email['type']}\n";
            $content .= str_repeat('-', 40) . "\n";
            $content .= $email['body'] . "\n\n";
            $content .= str_repeat('=', 60) . "\n\n";
        }

        return $fileManager->writeFile("exports/emails_{$timestamp}.txt", $content);
    }

    /**
     * Export as HTML
     */
    private function exportAsHtml(FileManager $fileManager, string $timestamp): string
    {
        $emailsHtml = '';

        foreach ($this->generatedEmails as $index => $email) {
            $num = $index + 1;
            $bodyHtml = nl2br(htmlspecialchars($email['body']));
            if ($email['type'] === 'html') {
                $bodyHtml = $email['body']; // Already HTML
            }

            $emailsHtml .= <<<HTML
            <div class="email-card">
                <div class="email-header">
                    <span class="email-number">#{$num}</span>
                    <strong>To:</strong> {$email['to']} ({$email['name']})
                </div>
                <div class="email-subject"><strong>Subject:</strong> {$email['subject']}</div>
                <div class="email-body">{$bodyHtml}</div>
            </div>
HTML;
        }

        $count = count($this->generatedEmails);
        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bulk Email Export - {$timestamp}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #1a1a2e; color: #e0e0e0; padding: 40px; }
        h1 { text-align: center; color: #00d4ff; margin-bottom: 10px; font-size: 2em; }
        .meta { text-align: center; color: #888; margin-bottom: 30px; }
        .email-card { background: #16213e; border-radius: 12px; padding: 24px; margin-bottom: 20px; border: 1px solid #0f3460; }
        .email-header { color: #00d4ff; margin-bottom: 10px; font-size: 1.1em; }
        .email-number { background: #0f3460; padding: 2px 10px; border-radius: 12px; margin-right: 10px; font-size: 0.9em; }
        .email-subject { color: #e94560; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #0f3460; }
        .email-body { line-height: 1.7; color: #ccc; white-space: pre-wrap; }
    </style>
</head>
<body>
    <h1>✉ Bulk Email Export</h1>
    <p class="meta">Generated: {$timestamp} | Total Emails: {$count}</p>
    {$emailsHtml}
</body>
</html>
HTML;

        return $fileManager->writeFile("exports/emails_{$timestamp}.html", $html);
    }

    /**
     * Export as JSON
     */
    private function exportAsJson(FileManager $fileManager, string $timestamp): string
    {
        $data = [
            'exported_at'  => $timestamp,
            'total_emails' => count($this->generatedEmails),
            'emails'       => $this->generatedEmails,
        ];

        $fileManager->writeJson("exports/emails_{$timestamp}.json", $data);
        return $fileManager->getPath("exports/emails_{$timestamp}.json");
    }

    /**
     * Export as CSV
     */
    private function exportAsCsv(FileManager $fileManager, string $timestamp): string
    {
        $headers = ['to', 'name', 'subject', 'type', 'body', 'generated'];
        $rows = $this->generatedEmails;

        return $fileManager->writeCsv("exports/emails_{$timestamp}.csv", $headers, $rows);
    }
}
