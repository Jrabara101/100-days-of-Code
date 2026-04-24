<?php

namespace App\Cache;

class FileCache
{
    private string $cacheDir;
    private int $ttl;

    public function __construct(string $cacheDir, int $ttlMinutes = 15)
    {
        $this->cacheDir = $cacheDir;
        $this->ttl = $ttlMinutes * 60;

        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0777, true);
        }
    }

    private function getCacheFilePath(string $key): string
    {
        return $this->cacheDir . '/' . md5($key) . '.json';
    }

    public function get(string $key): ?array
    {
        $file = $this->getCacheFilePath($key);
        
        if (!file_exists($file)) {
            return null;
        }

        if (time() - filemtime($file) > $this->ttl) {
            unlink($file); // Expired
            return null;
        }

        $content = file_get_contents($file);
        return json_decode($content, true);
    }

    public function set(string $key, array $data): void
    {
        $file = $this->getCacheFilePath($key);
        file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
    }
}
