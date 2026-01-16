<?php

/**
 * PHP CLI Pomodoro Timer
 * 
 * Usage: php pomodoro.php --work=25 --break=5
 * Options:
 *  -w, --work   Work duration in minutes (default: 25)
 *  -b, --break  Break duration in minutes (default: 5)
 */

// Set defaults
$workDuration = 25;
$breakDuration = 5;

// Parse command line arguments
$options = getopt("w:b:", ["work:", "break:"]);

if (isset($options['w'])) $workDuration = (int)$options['w'];
if (isset($options['work'])) $workDuration = (int)$options['work'];
if (isset($options['b'])) $breakDuration = (int)$options['b'];
if (isset($options['break'])) $breakDuration = (int)$options['break'];

// Validate inputs
if ($workDuration <= 0) $workDuration = 25;
if ($breakDuration <= 0) $breakDuration = 5;

// Clear screen/Reset for a clean start (OS dependent)
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    system('cls');
} else {
    system('clear');
}

echo "\033[1;36m    ____                          __                 \033[0m\n";
echo "\033[1;36m   / __ \____  ____ ___  ____  ____/ /___  ________     \033[0m\n";
echo "\033[1;36m  / /_/ / __ \/ __ `__ \/ __ \/ __  / __ \/ ___/ __ \   \033[0m\n";
echo "\033[1;36m / ____/ /_/ / / / / / / /_/ / /_/ / /_/ / /  / /_/ /   \033[0m\n";
echo "\033[1;36m/_/    \____/_/ /_/ /_/\____/\__,_/\____/_/   \____/    \033[0m\n";
echo "\n";
echo "Welcome to your Pomodoro Timer!\n";
echo "Configuration: \033[32mWork {$workDuration}m\033[0m | \033[33mBreak {$breakDuration}m\033[0m\n\n";

/**
 * Formats seconds into MM:SS
 */
function formatTime($seconds) {
    $m = floor($seconds / 60);
    $s = $seconds % 60;
    return sprintf("%02d:%02d", $m, $s);
}

/**
 * Draws a progress bar in the terminal
 */
function drawProgressBar($current, $total, $label, $colorCode = "32") {
    $width = 30;
    $percent = min(1, $current / $total);
    $filledLength = (int)round($width * $percent);
    
    $bar = str_repeat("█", $filledLength) . str_repeat("░", $width - $filledLength);
    $percentage = round($percent * 100);
    $timeStr = formatTime($total - $current);

    // \r moves cursor to beginning of line
    // ANSI colors: \033[32m is green, \033[33m is yellow, etc.
    echo "\r\033[{$colorCode}m{$label}\033[0m [{$bar}] {$percentage}% - {$timeStr} left  ";
}

/**
 * Sends a system notification
 */
function sendNotification($title, $message) {
    $os = strtoupper(substr(PHP_OS, 0, 3));

    if ($os === 'WIN') {
        // Windows: Use PowerShell to create a notification
        // Note: Requires execution policy to allow this, or generally accessible powershell
        $psScript = "
        [void] [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms');
        \$objNotifyIcon = New-Object System.Windows.Forms.NotifyIcon;
        \$objNotifyIcon.Icon = [System.Drawing.SystemIcons]::Information;
        \$objNotifyIcon.Visible = \$True;
        \$objNotifyIcon.BalloonTipTitle = '{$title}';
        \$objNotifyIcon.BalloonTipText = '{$message}';
        \$objNotifyIcon.ShowBalloonTip(10000);
        Start-Sleep -Seconds 2;
        \$objNotifyIcon.Visible = \$False;
        ";
        
        // Flatten the script to a single line
        $psCommand = str_replace(["\r", "\n", '"'], [" ", " ", "'"], $psScript);
        // Execute non-blocking or short blocking
        pclose(popen("powershell -Command \"$psCommand\"", "r"));

    } elseif ($os === 'DAR') {
        // macOS
        exec("terminal-notifier -title '{$title}' -message '{$message}' > /dev/null 2>&1 &");
    } else {
        // Linux
        exec("notify-send '{$title}' '{$message}' > /dev/null 2>&1 &");
    }
}

/**
 * Risks the timer for a specified duration
 */
function startTimer($minutes, $type) {
    $totalSeconds = $minutes * 60;
    $startTime = microtime(true);
    
    $color = ($type === 'Work') ? "32" : "33"; // Green for Work, Yellow for Break

    echo "Starting: \033[1;{$color}m{$type}\033[0m ($minutes mins)\n";
    
    // Initial draw
    drawProgressBar(0, $totalSeconds, $type, $color);

    while (true) {
        $currentTime = microtime(true);
        $elapsed = $currentTime - $startTime;
        
        if ($elapsed >= $totalSeconds) {
            break;
        }

        drawProgressBar($elapsed, $totalSeconds, $type, $color);
        
        // Sleep for 100ms (100,000 microseconds) for precision and smooth UI
        usleep(100000); 
    }
    
    // Final draw at 100%
    drawProgressBar($totalSeconds, $totalSeconds, $type, $color);
    echo "\n\n";

    sendNotification("Pomodoro Timer", "$type session complete!");
    
    // Bell sound
    echo "\x07";
}

// Main Loop
while (true) {
    startTimer($workDuration, "Work");

    echo "Work session finished! Take a break.\n";
    echo "Press [Enter] to start break (or Ctrl+C to quit)...";
    $handle = fopen("php://stdin", "r");
    fgets($handle);
    fclose($handle);

    startTimer($breakDuration, "Break");

    echo "Break finished! Ready to work?\n";
    echo "Press [Enter] to start work (or Ctrl+C to quit)...";
    $handle = fopen("php://stdin", "r");
    fgets($handle);
    fclose($handle);
}
