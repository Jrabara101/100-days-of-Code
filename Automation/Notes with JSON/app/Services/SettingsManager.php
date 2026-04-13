<?php

namespace App\Services;

/**
 * Handle configuration settings
 */
class SettingsManager
{
    private string $filePath;
    private array $settings;

    public function __construct(string $filePath)
    {
        $this->filePath = $filePath;
        if (!file_exists($filePath)) {
            $this->settings = [
                "app_name" => "Premium Notes CLI",
                "pagination" => 10,
                "confirm_delete" => true,
                "backup_before_delete" => true,
                "prevent_duplicate_titles" => false,
                "theme" => "dark"
            ];
            $this->save();
        } else {
            $this->settings = json_decode(file_get_contents($filePath), true);
        }
    }

    public function get(string $key, $default = null)
    {
        return $this->settings[$key] ?? $default;
    }

    public function set(string $key, $value): void
    {
        $this->settings[$key] = $value;
        $this->save();
    }

    public function all(): array
    {
        return $this->settings;
    }

    private function save(): void
    {
        file_put_contents($this->filePath, json_encode($this->settings, JSON_PRETTY_PRINT));
    }
}
