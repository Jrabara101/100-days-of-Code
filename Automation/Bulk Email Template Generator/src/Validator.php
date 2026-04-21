<?php

/**
 * Validator - Input and data validation
 * 
 * Validates email addresses, recipient data, template fields,
 * and provides detailed validation reports.
 */
class Validator
{
    /**
     * Validate an email address format
     *
     * @param string $email The email to validate
     * @return bool True if valid
     */
    public static function isValidEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Validate a template name (non-empty, reasonable length)
     *
     * @param string $name The template name
     * @return true|string True if valid, error message if invalid
     */
    public static function validateTemplateName(string $name): bool|string
    {
        if (empty(trim($name))) {
            return 'Template name cannot be empty.';
        }

        if (mb_strlen($name) > 100) {
            return 'Template name must be 100 characters or fewer.';
        }

        if (mb_strlen($name) < 2) {
            return 'Template name must be at least 2 characters long.';
        }

        return true;
    }

    /**
     * Validate template subject
     */
    public static function validateSubject(string $subject): bool|string
    {
        if (empty(trim($subject))) {
            return 'Subject cannot be empty.';
        }

        if (mb_strlen($subject) > 255) {
            return 'Subject must be 255 characters or fewer.';
        }

        return true;
    }

    /**
     * Validate template body
     */
    public static function validateBody(string $body): bool|string
    {
        if (empty(trim($body))) {
            return 'Template body cannot be empty.';
        }

        return true;
    }

    /**
     * Extract placeholders from a template string
     *
     * @param string $text The template text
     * @return array List of placeholder names (without {{ }})
     */
    public static function extractPlaceholders(string $text): array
    {
        preg_match_all('/\{\{(\w+)\}\}/', $text, $matches);
        return array_unique($matches[1] ?? []);
    }

    /**
     * Validate recipients data and return a report
     *
     * @param array $recipients Array of recipient data
     * @param array $requiredPlaceholders Placeholders used in the template
     * @return array Validation report with 'valid', 'invalid', 'warnings'
     */
    public static function validateRecipients(array $recipients, array $requiredPlaceholders = []): array
    {
        $report = [
            'valid'    => [],
            'invalid'  => [],
            'warnings' => [],
            'total'    => count($recipients),
        ];

        foreach ($recipients as $index => $recipient) {
            $rowNum = $index + 1;
            $errors = [];
            $warnings = [];

            // Check if email exists and is valid
            if (!isset($recipient['email']) || empty($recipient['email'])) {
                $errors[] = "Row {$rowNum}: Missing email address.";
            } elseif (!self::isValidEmail($recipient['email'])) {
                $errors[] = "Row {$rowNum}: Invalid email format '{$recipient['email']}'.";
            }

            // Check if name exists
            if (!isset($recipient['name']) || empty($recipient['name'])) {
                $warnings[] = "Row {$rowNum}: Missing 'name' field.";
            }

            // Check for required placeholders
            foreach ($requiredPlaceholders as $ph) {
                if (!isset($recipient[$ph]) || $recipient[$ph] === '') {
                    $warnings[] = "Row {$rowNum}: Missing placeholder field '{$ph}'.";
                }
            }

            if (!empty($errors)) {
                $report['invalid'][] = [
                    'row'    => $rowNum,
                    'data'   => $recipient,
                    'errors' => $errors,
                ];
            } else {
                $report['valid'][] = $recipient;
            }

            if (!empty($warnings)) {
                $report['warnings'] = array_merge($report['warnings'], $warnings);
            }
        }

        return $report;
    }

    /**
     * Validate a file path exists and is readable
     */
    public static function validateFilePath(string $path): bool|string
    {
        if (empty(trim($path))) {
            return 'File path cannot be empty.';
        }

        if (!file_exists($path)) {
            return "File not found: {$path}";
        }

        if (!is_readable($path)) {
            return "File is not readable: {$path}";
        }

        return true;
    }

    /**
     * Validate export format
     */
    public static function validateExportFormat(string $format): bool|string
    {
        $valid = ['txt', 'html', 'json', 'csv'];
        $format = strtolower(trim($format));

        if (!in_array($format, $valid)) {
            return "Invalid format. Supported formats: " . implode(', ', $valid);
        }

        return true;
    }

    /**
     * Validate template type
     */
    public static function validateTemplateType(string $type): bool|string
    {
        $valid = ['text', 'html'];
        $type = strtolower(trim($type));

        if (!in_array($type, $valid)) {
            return "Invalid type. Must be 'text' or 'html'.";
        }

        return true;
    }

    /**
     * Check if a numeric string is a valid positive integer
     */
    public static function isPositiveInteger(string $value): bool
    {
        return ctype_digit($value) && (int)$value > 0;
    }
}
