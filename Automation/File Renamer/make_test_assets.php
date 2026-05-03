<?php

/**
 * PhlexRename — Test Asset Generator
 *
 * Creates a sample ./test_assets/ directory with dummy files
 * so you can test PhlexRename without needing real media.
 *
 * Usage:  php make_test_assets.php
 */

declare(strict_types=1);

$dir = __DIR__ . '/test_assets';

if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
}

// Dummy image filenames
$images = [
    'IMG_9820.jpg', 'IMG_9821.jpg', 'IMG_9822.jpg', 'IMG_9823.jpg',
    'IMG_9824.jpg', 'photo_scan.jpg', 'vacation_beach.jpg',
    'logo.png', 'banner.png', 'thumbnail.gif',
    'screenshot_001.png', 'screenshot_002.png',
];

// Dummy audio filenames
$audio = [
    'track01.mp3', 'track02.mp3', 'favourite_song.mp3',
    'album_intro.flac', 'live_recording.ogg',
];

// Generic files
$generic = [
    'document.pdf', 'spreadsheet.xlsx', 'readme.txt',
    'archive.zip', 'video_clip.mp4',
];

$all = array_merge($images, $audio, $generic);

$created = 0;
foreach ($all as $filename) {
    $path = $dir . '/' . $filename;
    if (!file_exists($path)) {
        file_put_contents($path, "dummy content for {$filename}\n");
        $created++;
    }
}

// Create a duplicate to test collision prevention
$duplicate = $dir . '/logo_DUPE.png';
if (!file_exists($duplicate)) {
    file_put_contents($duplicate, "dummy duplicate\n");
    $created++;
}

echo "\e[38;2;105;240;174m✔ Created {$created} test asset(s) in: {$dir}\e[0m\n";
echo "\e[38;2;120;144;156m  Run a dry-run test:\e[0m\n";
echo "\e[38;2;179;136;255m  php phlex.php --target=./test_assets --pattern=\"{YYYY}-{MM}-{DD}_{OriginalName}.{ext}\" --dry-run\e[0m\n\n";
