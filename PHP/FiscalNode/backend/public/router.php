<?php
// Router script for PHP built-in server
// This ensures all requests are routed through index.php

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// If the file exists, serve it directly (for static assets)
if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
    return false; // Serve the file as-is
}

// Otherwise, route everything through index.php
require_once __DIR__ . '/index.php';

