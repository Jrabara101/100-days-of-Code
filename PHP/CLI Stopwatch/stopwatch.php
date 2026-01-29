<?php

echo "Stopwatch started. Available commands: start, stop, exit\n";

$startTime = null;

while (true) {
    $command = trim(readline("> "));

    switch ($command) {
        case 'start':
            if ($startTime) {
                echo "Stopwatch is already running.\n";
            } else {
                $startTime = microtime(true);
                echo "Stopwatch started.\n";
            }
            break;

        case 'stop':
            if ($startTime) {
                $endTime = microtime(true);
                $elapsedTime = $endTime - $startTime;
                echo "Stopwatch stopped. Elapsed time: " . round($elapsedTime, 2) . " seconds.\n";
                $startTime = null;
            } else {
                echo "Stopwatch is not running.\n";
            }
            break;

        case 'exit':
            echo "Exiting stopwatch.\n";
            exit;

        default:
            echo "Unknown command. Available commands: start, stop, exit\n";
            break;
    }
}