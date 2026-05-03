#!/usr/bin/env php
<?php

/**
 * generate_sample_log.php
 *
 * Generates a realistic sample Nginx access log for testing OmniLog.
 * Run once: php generate_sample_log.php
 *
 * Output: logs/sample_nginx.log (~600 lines)
 */

$outputPath = __DIR__ . '/logs/sample_nginx.log';
$fp         = fopen($outputPath, 'w');

if ($fp === false) {
    fwrite(STDERR, "Cannot create: {$outputPath}\n");
    exit(1);
}

$ips = [
    '192.168.1.5',  '10.0.0.4',     '172.16.0.12',
    '203.0.113.42', '198.51.100.7', '10.10.10.10',
    '192.168.0.1',  '54.23.111.8',  '185.220.101.5',
    '66.249.64.15',
];

$endpoints = [
    '/api/v1/users',      '/api/v1/orders',  '/api/v1/products',
    '/api/v2/auth/login', '/admin/dashboard','/api/v1/payments',
    '/static/app.js',     '/static/style.css','/',
    '/api/v1/search',     '/health',         '/api/v1/webhooks',
];

$methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

$statusWeights = [
    200 => 55, 201 => 10, 301 => 5, 302 => 3,
    400 => 4,  401 => 4,  403 => 4, 404 => 5,
    429 => 2,  500 => 4,  502 => 2, 503 => 2,
];

$agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'curl/7.88.1',
    'python-requests/2.28.0',
    'Googlebot/2.1',
    'sqlmap/1.7.8',
    'Wget/1.21.3',
];

// Build weighted status pool
$statusPool = [];
foreach ($statusWeights as $code => $weight) {
    for ($i = 0; $i < $weight; $i++) {
        $statusPool[] = $code;
    }
}

// Generate 600 log lines spanning 30 days
$baseTime = mktime(0, 0, 0, 1, 1, 2024);
$lineCount = 0;

for ($i = 0; $i < 600; $i++) {
    $ts      = $baseTime + random_int(0, 86400 * 30);
    $date    = date('d/M/Y:H:i:s O', $ts);
    $ip      = $ips[array_rand($ips)];
    $method  = $methods[array_rand($methods)];
    $ep      = $endpoints[array_rand($endpoints)];
    $status  = $statusPool[array_rand($statusPool)];
    $bytes   = random_int(200, 48000);
    $agent   = $agents[array_rand($agents)];

    fwrite($fp, "{$ip} - - [{$date}] \"{$method} {$ep} HTTP/1.1\" {$status} {$bytes} \"-\" \"{$agent}\"\n");
    $lineCount++;
}

// Add some deliberately malformed lines to test fault tolerance
fwrite($fp, "THIS IS A MALFORMED LINE WITH NO STRUCTURE\n");
fwrite($fp, "::1 - - [BADDATE] \"GET / HTTP/1.1\" 200 512\n");
fwrite($fp, "\n");
fwrite($fp, "not-an-ip - - [01/Jan/2024:00:00:00 +0000] \"GET / HTTP/1.1\" abc 0\n");

fclose($fp);

echo "Generated {$lineCount} log lines → {$outputPath}\n";
