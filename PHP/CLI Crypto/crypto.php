<?php

// CryptoPulse CLI – Real-Time WebSocket Tracker (Binance)
// Pure-PHP, no external dependencies. Connects via WebSocket, renders
// multi-asset ticker with sparkline trend, color-coded moves, and quit hotkey.

declare(strict_types=1);

set_time_limit(0);

// ---- CLI Arguments -------------------------------------------------------
$assetsArg = $argv[1] ?? '--assets=BTC,ETH,SOL';
if (str_starts_with($assetsArg, '--assets=')) {
    $symbols = explode(',', substr($assetsArg, strlen('--assets=')));
} else {
    $symbols = [$assetsArg];
}

$assets = [];
foreach ($symbols as $symbol) {
    $symbol = strtoupper(trim($symbol));
    if ($symbol === '') {
        continue;
    }
    // Binance uses USDT pairs; accept already-paired symbols too.
    $assets[] = str_ends_with($symbol, 'USDT') ? $symbol : $symbol . 'USDT';
}
$assets = array_values(array_unique($assets));
if (empty($assets)) {
    fwrite(STDERR, "No assets provided. Use --assets=BTC,ETH,SOL\n");
    exit(1);
}

// ---- WebSocket Client ----------------------------------------------------
function openWebSocket(string $host, int $port, string $path): mixed
{
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
        ],
    ]);

    $conn = @stream_socket_client(
        "ssl://{$host}:{$port}",
        $errno,
        $errstr,
        10,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if (!$conn) {
        throw new RuntimeException("Connection failed: {$errstr} ({$errno})");
    }

    stream_set_blocking($conn, true);

    $key = base64_encode(random_bytes(16));
    $headers = [
        "GET {$path} HTTP/1.1",
        "Host: {$host}:{$port}",
        "Upgrade: websocket",
        "Connection: Upgrade",
        "Sec-WebSocket-Key: {$key}",
        "Sec-WebSocket-Version: 13",
        "\r\n",
    ];
    $handshake = implode("\r\n", $headers);
    fwrite($conn, $handshake);

    $response = '';
    while (!str_contains($response, "\r\n\r\n")) {
        $chunk = fread($conn, 1024);
        if ($chunk === false || $chunk === '') {
            fclose($conn);
            throw new RuntimeException('Handshake failed: no response');
        }
        $response .= $chunk;
    }

    if (!preg_match('#Sec-WebSocket-Accept:\s*(.+)\r#i', $response, $m)) {
        fclose($conn);
        throw new RuntimeException("Handshake failed:\n{$response}");
    }

    stream_set_blocking($conn, false);
    return $conn;
}

function parseFrame(string &$buffer): ?array
{
    $len = strlen($buffer);
    if ($len < 2) {
        return null;
    }

    $b1 = ord($buffer[0]);
    $b2 = ord($buffer[1]);

    $fin = ($b1 & 0x80) === 0x80;
    $opcode = $b1 & 0x0F;
    $masked = ($b2 & 0x80) === 0x80;
    $payloadLen = $b2 & 0x7F;
    $offset = 2;

    if ($payloadLen === 126) {
        if ($len < 4) {
            return null;
        }
        $payloadLen = unpack('n', substr($buffer, $offset, 2))[1];
        $offset += 2;
    } elseif ($payloadLen === 127) {
        if ($len < 10) {
            return null;
        }
        $payloadLen = unpack('J', substr($buffer, $offset, 8))[1];
        $offset += 8;
    }

    if ($masked) {
        if ($len < $offset + 4) {
            return null;
        }
        $mask = substr($buffer, $offset, 4);
        $offset += 4;
    } else {
        $mask = null;
    }

    if ($len < $offset + $payloadLen) {
        return null;
    }

    $payload = substr($buffer, $offset, $payloadLen);
    $buffer = substr($buffer, $offset + $payloadLen);

    if ($masked && $mask !== null) {
        $decoded = '';
        for ($i = 0; $i < $payloadLen; $i++) {
            $decoded .= $payload[$i] ^ $mask[$i % 4];
        }
        $payload = $decoded;
    }

    return [
        'fin' => $fin,
        'opcode' => $opcode,
        'payload' => $payload,
    ];
}

function sendFrame($conn, string $payload, int $opcode = 0xA): void
{
    $header = chr(0x80 | ($opcode & 0x0F));
    $len = strlen($payload);
    if ($len <= 125) {
        $header .= chr($len);
    } elseif ($len <= 65535) {
        $header .= chr(126) . pack('n', $len);
    } else {
        $header .= chr(127) . pack('J', $len);
    }
    fwrite($conn, $header . $payload);
}

// ---- State & Helpers -----------------------------------------------------
$state = [];
foreach ($assets as $asset) {
    $state[$asset] = [
        'symbol' => $asset,
        'price' => null,
        'open' => null,
        'prev' => null,
        'history' => [],
        'lastUpdate' => null,
    ];
}

function sparkline(array $values): string
{
    if (empty($values)) {
        return '—';
    }
    $chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    $min = min($values);
    $max = max($values);
    $range = ($max - $min) ?: 1;
    $out = '';
    foreach ($values as $v) {
        $idx = (int)floor((($v - $min) / $range) * (count($chars) - 1));
        $out .= $chars[$idx];
    }
    return $out;
}

function formatChange(?float $open, ?float $price): string
{
    if ($open === null || $price === null || $open == 0.0) {
        return '0.00%';
    }
    $pct = (($price - $open) / $open) * 100;
    return sprintf('%+.2f%%', $pct);
}

function render(array $state, ?string $status = null): void
{
    $green = "\033[32m";
    $red = "\033[31m";
    $yellow = "\033[33m";
    $reset = "\033[0m";

    echo "\033[H\033[J"; // clear screen
    echo "============================================================\n";
    echo "   CRYPTOPULSE LIVE: [WebSocket Connected]\n";
    echo "============================================================\n";
    echo "ASSET      PRICE (USD)    CHANGE (%)    TREND (Last 10)\n";
    echo "------------------------------------------------------------\n";

    foreach ($state as $asset => $row) {
        $price = $row['price'];
        $prev = $row['prev'];
        $open = $row['open'];
        $hist = $row['history'];

        $changeStr = formatChange($open, $price);
        $spark = sparkline(array_slice($hist, -10));
        $arrow = '·';
        $color = $reset;

        if ($price !== null && $prev !== null) {
            if ($price > $prev) {
                $arrow = '▲';
                $color = $green;
            } elseif ($price < $prev) {
                $arrow = '▼';
                $color = $red;
            } else {
                $arrow = '→';
                $color = $yellow;
            }
        }

        $priceStr = $price === null ? '—' : sprintf('$%.2f', $price);
        printf(
            "%-9s %s%-12s%s %-12s [%s]    %s\n",
            $asset,
            $color,
            str_pad($priceStr, 12),
            $reset,
            $changeStr,
            $arrow,
            $spark
        );
    }

    echo "------------------------------------------------------------\n";
    $ts = date('H:i:s');
    $statusLine = $status ? " | {$status}" : '';
    echo "[INFO] Last Update: {$ts}{$statusLine} | Press 'Q' to disconnect.\n";
    echo "============================================================\n";
}

// ---- Connect -------------------------------------------------------------
$host = 'stream.binance.com';
$port = 9443;
$streams = array_map(fn($s) => strtolower($s) . '@ticker', $assets);
$path = '/stream?streams=' . implode('/', $streams);

try {
    $conn = openWebSocket($host, $port, $path);
} catch (Throwable $e) {
    fwrite(STDERR, "Unable to connect: {$e->getMessage()}\n");
    exit(1);
}

$buffer = '';
stream_set_blocking(STDIN, false);
render($state, 'Awaiting data…');

// ---- Event Loop ----------------------------------------------------------
while (true) {
    $read = [$conn, STDIN];
    $write = null;
    $except = null;
    $num = stream_select($read, $write, $except, 1, 0);

    if ($num === false) {
        break;
    }

    // Handle keyboard
    if (in_array(STDIN, $read, true)) {
        $input = stream_get_contents(STDIN, 1);
        if ($input !== false && ($input === 'q' || $input === 'Q')) {
            break;
        }
    }

    // Handle socket data
    if (in_array($conn, $read, true)) {
        $chunk = fread($conn, 8192);
        if ($chunk === '' || $chunk === false) {
            render($state, 'Disconnected (server closed)');
            break;
        }
        $buffer .= $chunk;

        while ($frame = parseFrame($buffer)) {
            $opcode = $frame['opcode'];
            $payload = $frame['payload'];

            if ($opcode === 0x1) { // text
                $msg = json_decode($payload, true);
                if (!$msg || !isset($msg['data'])) {
                    continue;
                }
                $ticker = $msg['data'];
                $symbol = strtoupper($ticker['s'] ?? '');
                $price = isset($ticker['c']) ? (float)$ticker['c'] : null;

                if ($price === null || !isset($state[$symbol])) {
                    continue;
                }

                $row = &$state[$symbol];
                if ($row['open'] === null) {
                    $row['open'] = $price;
                }
                $row['prev'] = $row['price'];
                $row['price'] = $price;
                $row['lastUpdate'] = $ticker['E'] ?? (int)(microtime(true) * 1000);
                $row['history'][] = $price;
                $row['history'] = array_slice($row['history'], -20);

                render($state);
            } elseif ($opcode === 0x9) { // ping
                sendFrame($conn, $payload, 0xA);
            } elseif ($opcode === 0x8) { // close
                render($state, 'Server closed connection');
                break 2;
            }
        }
    }
}

// ---- Cleanup -------------------------------------------------------------
@fclose($conn);
echo "\nDisconnected. Bye.\n";
