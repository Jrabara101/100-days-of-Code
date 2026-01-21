<?php
// server.php
// Logic Level 2: Socket Basic (TCP Server)

$host = '127.0.0.1';
$port = 12345;
$address = "tcp://$host:$port";

// Creates a stream socket server
$server = stream_socket_server($address, $errno, $errstr);

if (!$server) {
    die("Error: $errstr ($errno)\n");
}

echo "========================================\n";
echo " CLI CHAT SERVER STARTED\n";
echo " Listening on: $address\n";
echo "========================================\n";

// Array of connected client sockets
$clients = [$server];
// Map resource ID to username (optional, if we want to track it server-side)
$clientInfo = []; 

// Set non-blocking mode
stream_set_blocking($server, 0);

while (true) {
    // Prepare arrays for stream_select
    $read = $clients;
    $write = null;
    $except = null;

    // Wait for activity on any socket (timeout: 0s, 200ms)
    if (stream_select($read, $write, $except, 0, 200000) < 1) {
        continue; 
    }

    // Check if new connection
    if (in_array($server, $read)) {
        $newClient = stream_socket_accept($server);
        if ($newClient) {
            stream_set_blocking($newClient, 0);
            $clients[] = $newClient;
            
            // Get client info
            $info = stream_socket_get_name($newClient, true);
            echo "[SERVER] New connection from $info\n";
            
            // Send welcome message
            $welcome = json_encode([
                'type' => 'system',
                'message' => "Welcome to the CLI Chat! There are " . (count($clients) - 1) . " users online."
            ]) . "\n";
            fwrite($newClient, $welcome);
        }
        
        // Remove server from 'read' array so we don't try to read data from it
        $key = array_search($server, $read);
        unset($read[$key]);
    }

    // Handle data from existing clients
    foreach ($read as $activeSocket) {
        $data = @fread($activeSocket, 1024); // Read up to 1024 bytes

        if ($data === false || $data === '') {
            // Client disconnected
            $key = array_search($activeSocket, $clients);
            unset($clients[$key]);
            @fclose($activeSocket);
            echo "[SERVER] Client disconnected\n";
            continue;
        }

        // Broadcast to all other clients
        $data = trim($data);
        if (!empty($data)) {
            // Re-broadcast message to everyone
            // Note: In a real app, we might parse JSON here to get username server-side
            // But for simplicity, we treat the payload as ready-to-send or raw JSON
             // Actually, let's assume the client sends a JSON string.
             // We'll decode it quickly to print a log, then send it to others.
            
            $decoded = json_decode($data, true);
            if ($decoded) {
                 echo "[CHAT] " . ($decoded['username'] ?? 'Unknown') . ": " . ($decoded['message'] ?? '...') . "\n";
            }

            foreach ($clients as $sendSocket) {
                if ($sendSocket !== $server) { // Send to everyone including sender? usually just others or everyone.
                     // Let's send to everyone so the sender sees the confirmation (or exclude sender if client handles local echo)
                     // The user prompt says "interface where... text appears... with timestamp".
                     // Usually easier if server echoes back to ensure delivery, OR client prints locally.
                     // Let's send to everyone.
                    @fwrite($sendSocket, $data . "\n");
                }
            }
        }
    }
}
?>
