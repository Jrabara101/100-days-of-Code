<?php
declare(strict_types=1);
require __DIR__ . '/vendor/autoload.php';

use ChronoVault\Domain\Mood;
use ChronoVault\Domain\JournalEntry;
use ChronoVault\Domain\JournalEntryDraft;
use ChronoVault\Crypto\CipherEngine;
use ChronoVault\Crypto\KeyDerivation;
use ChronoVault\Storage\SqliteJournalRepository;
use ChronoVault\Storage\EncryptedJournalRepository;

$pass = true;

function check(string $label, bool $cond): void {
    global $pass;
    if ($cond) {
        echo "\e[32m  ✓ {$label}\e[0m\n";
    } else {
        echo "\e[31m  ✗ FAIL: {$label}\e[0m\n";
        $pass = false;
    }
}

echo "\n\e[1;35m  ChronoVault — Unit Smoke Tests\e[0m\n";
echo "  " . str_repeat('─', 50) . "\n\n";

// ── Test 1: Mood Enum ──────────────────────────────────────────────────────
echo "\e[33m  [1] Domain/Mood\e[0m\n";
check('GREAT label = Awesome',          Mood::GREAT->label()     === 'Awesome');
check('BAD emoji = 😞',                 Mood::BAD->emoji()       === '😞');
check('NEUTRAL score = 3',              Mood::NEUTRAL->score()   === 3);
check('fromScore(5) = GREAT',           Mood::fromScore(5)       === Mood::GREAT);
check('fromScore(1) = TERRIBLE',        Mood::fromScore(1)       === Mood::TERRIBLE);
check('fromScore(3) = NEUTRAL',         Mood::fromScore(3)       === Mood::NEUTRAL);
check('from("GOOD") = GOOD',            Mood::from('GOOD')       === Mood::GOOD);
echo "\n";

// ── Test 2: JournalEntryDraft ──────────────────────────────────────────────
echo "\e[33m  [2] Domain/JournalEntryDraft\e[0m\n";
$draft = new JournalEntryDraft();
$draft->body = "Hello world. This is a test.";
check('wordCount() = 6',    $draft->wordCount() === 6);
check('hasContent() = true', $draft->hasContent() === true);
$draft->setTagsFromString('#focus work anxiety');
check('tags parsed correctly', $draft->tags === ['#focus', '#work', '#anxiety']);
$empty = new JournalEntryDraft();
check('empty hasContent = false', $empty->hasContent() === false);
echo "\n";

// ── Test 3: KeyDerivation ─────────────────────────────────────────────────
echo "\e[33m  [3] Crypto/KeyDerivation\e[0m\n";
$tmpDir = sys_get_temp_dir() . '/cvault_test_' . bin2hex(random_bytes(4));
mkdir($tmpDir);
$kd = new KeyDerivation($tmpDir);
check('isInitialized() = false before first derive', !$kd->isInitialized());
$key1 = $kd->deriveKey('my-secure-passphrase');
check('isInitialized() = true after derive',  $kd->isInitialized());
check('key is 32 bytes',                       strlen($key1) === 32);
// Same passphrase → same key (deterministic with same salt)
$key2 = $kd->deriveKey('my-secure-passphrase');
check('same passphrase → same key',            $key1 === $key2);
// Different passphrase → different key
$key3 = $kd->deriveKey('wrong-passphrase');
check('different passphrase → different key',  $key1 !== $key3);
echo "\n";

// ── Test 4: CipherEngine ──────────────────────────────────────────────────
echo "\e[33m  [4] Crypto/CipherEngine\e[0m\n";
$cipher = new CipherEngine($key1);
$plain  = "Today I thought about the nature of encrypted journals and felt profound.";
$ad     = json_encode(['id' => 42, 'date' => '2026-05-10', 'mood' => 'GOOD', 'tags' => ['#focus']]);
$blob   = $cipher->encrypt($plain, $ad);
check('blob length > 24 (nonce + ciphertext)', strlen($blob) > 24);
// Nonces are random — two encryptions of same plaintext produce different blobs
$blob2 = $cipher->encrypt($plain, $ad);
check('random nonce: two encryptions differ',  $blob !== $blob2);
// Decryption round-trip
$cipher2    = new CipherEngine($key1);
$decrypted  = $cipher2->decrypt($blob, $ad);
check('decrypt round-trip matches plaintext',  $decrypted === $plain);
// Wrong key fails
$cipherWrong = new CipherEngine($key3);
$threw = false;
try { $cipherWrong->decrypt($blob, $ad); } catch (RuntimeException) { $threw = true; }
check('wrong key → RuntimeException',          $threw);
// Tampered ciphertext fails
$tampered    = $blob;
$tampered[35] = chr(ord($tampered[35]) ^ 0xFF);
$threw = false;
try { $cipher2->decrypt($tampered, $ad); } catch (RuntimeException) { $threw = true; }
check('tampered ciphertext → RuntimeException', $threw);
// Tampered associated data fails
$threw = false;
try { $cipher2->decrypt($blob, '{"id":42,"date":"2026-05-10","mood":"GREAT","tags":[]}'); } catch (RuntimeException) { $threw = true; }
check('tampered AD → RuntimeException',         $threw);
echo "\n";

// ── Test 5: SqliteJournalRepository ───────────────────────────────────────
echo "\e[33m  [5] Storage/SqliteJournalRepository + EncryptedJournalRepository\e[0m\n";
$dbPath  = $tmpDir . '/test_vault.db';
$sqlite  = new SqliteJournalRepository($dbPath);
$enc     = new EncryptedJournalRepository($sqlite, new CipherEngine($key1));

$draft2        = new JournalEntryDraft();
$draft2->body  = "This is my very first journal entry. Life is complex and beautiful.";
$draft2->mood  = Mood::GOOD;
$draft2->setTagsFromString('#life #reflection');

$savedEntry = $enc->save($draft2);
check('saved entry has numeric ID',            $savedEntry->id > 0);
check('saved entry mood = GOOD',               $savedEntry->mood === Mood::GOOD);
check('saved entry wordCount = 12',            $savedEntry->wordCount === 12);
check('saved entry body is plaintext',         $savedEntry->body === $draft2->body);
check('saved entry tags correct',              $savedEntry->tags === ['#life', '#reflection']);
check('formattedId() is #001',                 $savedEntry->formattedId() === '#001');

// Read back and decrypt
$fetched = $enc->findById($savedEntry->id);
check('findById() returns entry',              $fetched !== null);
check('findById() decrypts body correctly',    $fetched?->body === $draft2->body);
check('findById() mood matches',               $fetched?->mood === Mood::GOOD);

// Verify raw DB body is NOT plaintext (it's binary ciphertext)
$rawRow = (new PDO("sqlite:{$dbPath}"))->query("SELECT body FROM journal_entries WHERE id = {$savedEntry->id}")->fetchColumn();
check('raw DB body is NOT plaintext (encrypted)', $rawRow !== $draft2->body);
check('raw DB body is longer than plaintext',     strlen($rawRow) > strlen($draft2->body));

// Total word count
check('totalWordCount() > 0', $enc->totalWordCount() > 0);
check('count() = 1',          $enc->count() === 1);

echo "\n";

// ── Cleanup ────────────────────────────────────────────────────────────────
@unlink($dbPath);
@unlink($dbPath . '-wal');
@unlink($dbPath . '-shm');
array_map('unlink', glob($tmpDir . '/*'));
@rmdir($tmpDir);

// ── Result ─────────────────────────────────────────────────────────────────
echo "  " . str_repeat('─', 50) . "\n";
if ($pass) {
    echo "\e[1;32m  All tests passed ✓\e[0m\n\n";
    exit(0);
} else {
    echo "\e[1;31m  Some tests FAILED ✗\e[0m\n\n";
    exit(1);
}
