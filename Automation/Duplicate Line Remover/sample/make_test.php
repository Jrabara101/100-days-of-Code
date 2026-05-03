<?php
$lines = ['apple', 'banana', 'apple', 'cherry', 'banana', 'date', 'apple', 'elderberry', 'fig', 'cherry'];
file_put_contents(__DIR__ . '/sample/test_simple.txt', implode(PHP_EOL, $lines) . PHP_EOL);
echo "Created test_simple.txt with 10 lines (5 expected duplicates)\n";
