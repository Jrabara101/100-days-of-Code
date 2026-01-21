<?php
// client.php
// User Interface for CLI Chat

$host = '127.0.0.1';
$port = 12345;

// Helpers for ANSI codes
function clearScreen() {
    echo "\033[2J\033[H";
}
function moveCursorUp($lines = 1) {
    echo "\033[{$lines}A";
}
function callback($buffer) {
    // Redraw prompt with current buffer
    echo "\r\033[KYour Message: > " . $buffer;
}

clearScreen();
echo "========================================\n";
echo " WELCOME TO CLI CHAT\n";
echo "========================================\n";

echo "Enter your Username: ";
$handle = fopen("php://stdin", "r");
$username = trim(fgets($handle));
fclose($handle);

if (empty($username)) {
    $username = "Anonymous";
}

echo "Connecting to server...\n";

$socket = @stream_socket_client("tcp://$host:$port", $errno, $errstr, 30);

if (!$socket) {
    die("Could not connect: $errstr ($errno)\n");
}

// Set non-blocking
stream_set_blocking($socket, 0);

// For STDIN, it's tricky on Windows. 
// We will try to open stdin as a stream.
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    // Windows constraint: stream_set_blocking on STDIN might not work as expected in all shells.
    // We'll try our best with a non-blocking wrapper if possible, otherwise standard fread.
    stream_set_blocking(STDIN, 0);
} else {
    stream_set_blocking(STDIN, 0);
}

clearScreen();
echo "========================================\n";
echo "    WELCOME TO CLI CHAT: [Room #1]\n";
echo "========================================\n";
echo "Logged in as: $username\nType /exit to quit, /clear to clear screen.\n";
echo "========================================\n";

$inputBuffer = "";
echo "Your Message: > ";

while (true) {
    // 1. Check for incoming messages
    $read = [$socket];
    $write = null;
    $except = null;
    $changed = stream_select($read, $write, $except, 0, 100000); // 100ms wait

    if ($changed > 0) {
        $message = fread($socket, 2048);
        if ($message === false || $message === '') {
            echo "\nDisconnected from server.\n";
            break;
        }
        
        // Handle multiple JSON objects in one packet (if sticky packets occur, theoretically)
        // For simplicity, we assume newline delimited
        $lines = explode("\n", trim($message));
        foreach ($lines as $line) {
            $data = json_decode($line, true);
            if ($data) {
                // Clear current prompt line
                echo "\r\033[K"; 
                
                // Format output
                if (isset($data['type']) && $data['type'] == 'system') {
                     echo "\033[1;33m[SYSTEM] " . $data['message'] . "\033[0m\n";
                } else {
                    $time = $data['time'] ?? date('H:i');
                    $user = $data['username'] ?? 'Unknown';
                    $msg = $data['message'] ?? '';
                    
                    // Simple color for username
                    echo "[$time] \033[1;32m$user\033[0m: $msg\n";
                }
                
                // Redraw prompt
                echo "Your Message: > " . $inputBuffer;
            }
        }
    }

    // 2. Read from STDIN
    // On Windows, fread(STDIN) might block until Enter is pressed even with stream_set_blocking(0).
    // Unfortunately, fully non-blocking char-by-char input on stock Windows PHP is hard.
    // We will assume the user types and hits ENTER for the message to be 'caught' by the loop.
    
    $input = fread(STDIN, 1024);
    
    if ($input) {
        // Append to buffer (or just process if it's a line)
        // Since Windows console usually sends the whole line on Enter, 
        // we might not get partial characters relative to buffer.
        
        $input = str_replace(["\r\n", "\r"], "\n", $input);
        
        // If buffer contains newline, we have a message to send
        if (strpos($input, "\n") !== false) {
             $parts = explode("\n", $input);
             foreach ($parts as $part) {
                 if ($part === '') continue; // Trailing newline empty part
                 
                 // Process command
                 $cmd = trim($part);
                 if ($cmd === '/exit') {
                     fclose($socket);
                     echo "\nGoodbye!\n";
                     exit;
                 }
                 if ($cmd === '/clear') {
                     clearScreen();
                     echo "========================================\n";
                     echo "    WELCOME TO CLI CHAT: [Room #1]\n";
                     echo "========================================\n";
                     echo "Your Message: > ";
                     $inputBuffer = "";
                     continue;
                 }
                 
                 // Send Message
                 if (!empty($cmd)) {
                     $payload = json_encode([
                         'username' => $username,
                         'message' => $cmd,
                         'time' => date('H:i')
                     ]);
                     fwrite($socket, $payload);
                 }
             }
             // Reset visual buffer indicator
             $inputBuffer = "";
             echo "\r\033[KYour Message: > ";
        } else {
            // No newline yet, just typing (if system allows char reading)
            $inputBuffer .= $input;
        }
    }

    // Small sleep to reduce CPU usage
    usleep(50000);
}
?>
