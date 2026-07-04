<?php
// simulate_webhook.php

$payload = json_encode([
    'event_id' => 'evt_order_id_994821', // Unique Idempotency Key
    'payload' => [
        'order_id' => 'ORD-10492',
        'email' => 'customer@domain.com',
        'sku' => 'SKU-PRO-DESK',
        'amount' => 1249.99
    ]
]);

$secret = 'whsec_secure_production_token_hash_2026';
$signature = hash_hmac('sha256', $payload, $secret);

$ch = curl_init('http://localhost:8081/webhooks/order');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    "X-Webhook-Signature: {$signature}"
]);

echo "Transmitting signature-verified order event...\n";
$response = curl_exec($ch);
echo "Gateway Response: " . $response . "\n";
curl_close($ch);
