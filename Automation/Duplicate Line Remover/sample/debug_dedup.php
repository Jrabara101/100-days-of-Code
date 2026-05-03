<?php
// Verify the array is actually populated correctly
$lines = ['apple','banana','apple','cherry','banana','date','apple','elderberry','fig','cherry','Apple','BANANA','apple',''];
echo "Count: " . count($lines) . "\n";
foreach ($lines as $i => $l) {
    echo "$i: '$l'\n";
}
echo "\nNow testing with md5:\n";
$seen = [];
foreach ($lines as $i => $line) {
    $hash = md5($line);
    echo "$i: hash=$hash exists=" . (array_key_exists($hash, $seen) ? 'YES (dupe)' : 'NO') . " line='$line'\n";
    $seen[$hash] = null;
}
