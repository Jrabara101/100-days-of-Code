<?php

/**
 * PHP KeyPulse – CLI Event Tester
 *
 * Captures and displays raw keyboard events in real-time.
 * Runs in raw mode to detect key presses without waiting for Enter.
 */

class KeyPulse {
    private $totalKeys = 0;
    private $running = true;
    private $isWindows;

    public function __construct() {
        $this->isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
    }

    public function run() {
        echo "================================================\n";
        echo "   KEYBOARD EVENT TESTER (Press 'ESC' to Exit)\n";
        echo "================================================\n";
        echo "Listening for input...\n\n";

        $this->enterRawMode();

        while ($this->running) {
            $this->processInput();
            usleep(10000); // Non-blocking delay to avoid high CPU usage
        }

        $this->exitRawMode();
        echo "\n================================================\n";
        echo "Total keys pressed: {$this->totalKeys}\n";
        echo "Goodbye!\n";
    }

    private function enterRawMode() {
        if ($this->isWindows) {
            // For Windows, disable echo and set console mode
            exec('mode con echo=off cols=80 lines=25 >nul 2>&1');
        } else {
            // Disable canonical mode and echo for raw input
            shell_exec('stty -icanon -echo');
        }
        // Make STDIN non-blocking
        stream_set_blocking(STDIN, 0);
    }

    private function exitRawMode() {
        if ($this->isWindows) {
            // Restore echo
            exec('mode con echo=on >nul 2>&1');
        } else {
            // Restore canonical mode and echo
            shell_exec('stty icanon echo');
        }
        // Restore blocking
        stream_set_blocking(STDIN, 1);
    }

    private function processInput() {
        $bytes = '';

        // Read up to 3 bytes to handle escape sequences
        for ($i = 0; $i < 3; $i++) {
            $char = fread(STDIN, 1);
            if ($char === false || $char === '') break;
            $bytes .= $char;
            $ord = ord($char);

            if ($ord == 27) { // ESC
                if ($i == 0) {
                    $this->handleKey('ESC', 27);
                    $this->running = false;
                    return;
                }
            } elseif ($ord < 32 || $ord == 127) { // Control characters
                $this->handleSpecialKey($ord, $bytes);
                return;
            } elseif ($ord >= 32 && $ord <= 126) { // Printable characters
                $this->handleKey($char, $ord);
                return;
            }
        }

        if (!empty($bytes)) {
            // Handle multi-byte sequences (e.g., arrow keys)
            $this->handleEscapeSequence($bytes);
        }
    }

    private function handleKey($key, $code) {
        echo "[EVENT] Key: '$key' | Code: $code\n";
        $this->totalKeys++;
    }

    private function handleSpecialKey($ord, $bytes) {
        $key = '';
        switch ($ord) {
            case 9: $key = 'TAB'; break;
            case 10: $key = 'ENTER'; break;
            case 13: $key = 'ENTER'; break;
            case 32: $key = 'SPACE'; break;
            case 127: $key = 'BACKSPACE'; break;
            default:
                if ($ord < 32) {
                    $key = 'CTRL+' . chr($ord + 64);
                } else {
                    $key = chr($ord);
                }
        }
        echo "[EVENT] Key: '$key' | Code: $ord\n";
        $this->totalKeys++;
    }

    private function handleEscapeSequence($bytes) {
        $seq = '';
        foreach (str_split($bytes) as $char) {
            $seq .= '^' . chr(ord($char) + 64);
        }

        $key = 'UNKNOWN';
        if ($bytes == "\e[A") $key = 'UP';
        elseif ($bytes == "\e[B") $key = 'DOWN';
        elseif ($bytes == "\e[C") $key = 'RIGHT';
        elseif ($bytes == "\e[D") $key = 'LEFT';
        elseif (preg_match('/^\e\[[0-9]+~/', $bytes)) {
            // Function keys, etc.
            $key = 'F' . (intval(substr($bytes, 2, -1)) - 10);
        }

        echo "[EVENT] Key: '$key' | Code: $seq\n";
        $this->totalKeys++;
    }
}

// Run the tester
$tester = new KeyPulse();
$tester->run();
