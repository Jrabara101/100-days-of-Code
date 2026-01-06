<?php
// FiscalNode API Entry Point

require __DIR__ . '/../vendor/autoload.php';

use FiscalNode\Controllers\BudgetController;
use FiscalNode\Controllers\TransactionController;
use FiscalNode\Controllers\DatabaseSetupController;

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Router Logic (Simple implementation for MVP)
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Remove /api prefix if present, and normalize leading/trailing slashes
$uri = rtrim($uri, '/');
if (strpos($uri, '/api') === 0) {
    $uri = substr($uri, 4); // Remove '/api'
}
if (empty($uri)) {
    $uri = '/';
}

$budgetController = new BudgetController();

// Route: /budgets
if ($uri === '/budgets' && $method === 'GET') {
    $budgetController->index();
    exit;
}

// Route: /budgets (POST) - Create budget
if ($uri === '/budgets' && $method === 'POST') {
    $budgetController->store();
    exit;
}

// Route: /budgets/:id
if (preg_match('/^\/budgets\/(\d+)$/', $uri, $matches) && $method === 'GET') {
    $budgetController->show($matches[1]);
    exit;
}

// Route: /health or /api/health
if ($uri === '/health' || $uri === '/') {
    echo json_encode(['status' => 'ok', 'timestamp' => time(), 'message' => 'FiscalNode API is running']);
    exit;
}

// Route: /transactions (POST)
if ($uri === '/transactions' && $method === 'POST') {
    (new TransactionController())->store();
    exit;
}

// Route: /setup/database (POST) - Initialize database
if ($uri === '/setup/database' && $method === 'POST') {
    (new DatabaseSetupController())->initialize();
    exit;
}

// Route: /setup/check (GET) - Check database status
if ($uri === '/setup/check' && $method === 'GET') {
    (new DatabaseSetupController())->check();
    exit;
}

// 404
http_response_code(404);
echo json_encode(['error' => 'Endpoint not found']);
