# ChronoVault – Architecture Document

> **v1.0.3** | Engine: PHP 8.2+ | Cipher: XChaCha20-Poly1305 | KDF: Argon2id

---

## 1. Cryptographic Strategy

ChronoVault's security model rests on two interlocking cryptographic primitives: **Argon2id** for key derivation and **XChaCha20-Poly1305** for authenticated encryption. These choices are deliberate and grounded in modern cryptographic best practices.

### 1.1 Key Derivation — Argon2id

A user's master passphrase cannot be used directly as an encryption key. Human-chosen passwords have low entropy, vary in length, and are vulnerable to offline dictionary attacks if an attacker obtains the ciphertext. ChronoVault solves this by running the passphrase through `sodium_crypto_pwhash()` using the **Argon2id** algorithm (the 2015 Password Hashing Competition winner). Argon2id is "memory-hard" — it requires a configurable amount of RAM to compute, making GPU and ASIC brute-force attacks prohibitively expensive. The `INTERACTIVE` memory limit (~64 MB) is used, which causes roughly 300ms of derivation time on modern hardware. This delay is imperceptible to a human typing once but is devastating to an attacker attempting millions of guesses per second.

The derivation also uses a **16-byte cryptographically random salt** stored in `.vault.salt` alongside the database. The salt is not secret — it simply ensures that even if two users choose the same password, their derived keys are completely different, eliminating pre-computation attacks like rainbow tables. On first run, `KeyDerivation::loadOrCreateSalt()` generates this salt via `random_bytes()` (backed by the OS CSPRNG) and persists it. File permissions are set to `0600` on Unix systems to prevent other local users from reading it. The output of the KDF is exactly 32 bytes — matching the required key length for XChaCha20-Poly1305. Critically, `sodium_memzero()` is called immediately after the key is derived to wipe the passphrase from PHP's memory heap, preventing it from appearing in a memory dump.

The PHP 8.2 `#[\SensitiveParameter]` attribute is applied to the `$passphrase` parameter in `KeyDerivation::deriveKey()`. This instructs the PHP runtime to **redact the parameter value from any stack traces** generated during the method's execution. Without this attribute, an uncaught exception inside the KDF could print `deriveKey(passphrase: "my-secret-password")` in logs or on screen — a catastrophic credential leak. This attribute is a native, zero-overhead security guard.

### 1.2 Authenticated Encryption — XChaCha20-Poly1305 (AEAD)

Each journal entry's body is encrypted using `sodium_crypto_aead_xchacha20poly1305_ietf_encrypt()`. The "AEAD" acronym stands for **Authenticated Encryption with Associated Data**, and it is the gold standard for modern symmetric encryption because it simultaneously provides:

1. **Confidentiality** (XChaCha20 stream cipher) — The journal text is indistinguishable from random bytes to anyone without the key.
2. **Integrity + Authenticity** (Poly1305 MAC) — Any modification of the ciphertext — even a single bit flip — is detected on decryption, which returns `false` rather than corrupt plaintext.

The design makes a strategic decision about the **associated data (AD)** parameter. Each entry's metadata (id, date, mood, tags) is stored in plaintext SQLite columns to enable fast analytics queries (streak counting, mood trending) without requiring decryption of every row. However, this metadata is also serialized to JSON and passed as the AD to the encryption call. This **cryptographically binds** the body ciphertext to its metadata: if an attacker modifies the SQLite row (e.g., changes mood from `BAD` to `GREAT`), the AD reconstructed during decryption will no longer match what was used during encryption, and Poly1305 authentication will fail. The vault is therefore both **encrypted** and **tamper-evident**.

**XChaCha20 over AES-GCM**: The "X" prefix denotes an extended 192-bit nonce (vs. AES-GCM's 96-bit nonce). With random nonce generation, a 192-bit space means a collision becomes probable only after ~2^96 encryptions — writing a journal entry every nanosecond for the age of the universe wouldn't get close. AES-GCM with 96-bit random nonces reaches birthday-bound collision probability after ~2^48 encryptions. Additionally, ChaCha20 is constant-time in pure software, with no dependency on hardware AES-NI instructions — making it safe from timing side-channel attacks on arbitrary hardware.

The wire format stored in the database BLOB is: `[24-byte nonce][variable ciphertext + 16-byte Poly1305 auth tag]`. The nonce is not secret; it is prepended in plaintext because it is required for decryption and must be stored with the ciphertext.

---

## 2. Process Control — The $EDITOR Integration

The engineering challenge of editor integration in PHP is non-trivial. PHP is designed as a request-response scripting engine; it doesn't natively "pause" while a subprocess runs and resumes. The solution requires understanding Unix process groups, file descriptors, and terminal semantics.

### 2.1 Why proc_open() Is the Right Tool

Three common PHP subprocess functions exist: `exec()`, `shell_exec()`, and `proc_open()`. The first two are inadequate because they capture or inherit output in ways that conflict with full-screen terminal editors. When Vim starts, it immediately writes escape sequences to the terminal to query its dimensions, enter raw mode, and paint its full-screen buffer. These sequences require a **real TTY** (a pseudo-terminal device). When PHP's `exec()` is used, the child process's file descriptors are often wired to pipes rather than the parent's TTY, causing Vim to detect "Not a terminal" and either error out or fall into line-editing mode.

`proc_open()` solves this with explicit descriptor inheritance: `$descriptors = [0 => STDIN, 1 => STDOUT, 2 => STDERR]`. By passing PHP's own `STDIN`/`STDOUT`/`STDERR` constants (which are resources pointing to the current PTY), the child editor process is given direct access to the terminal. From the OS kernel's perspective, the editor's stdin/stdout/stderr **are** the same file descriptors as the PHP parent's — the editor gets full TTY control, including `ioctl()` calls for terminal size, raw input mode for keystrokes, and full-screen ANSI rendering.

`proc_close()` is the blocking call that causes PHP to wait. It internally calls `waitpid()` on the child process, suspending the PHP interpreter until the editor process exits (when the user types `:wq` in Vim or `Ctrl+X` in Nano). PHP then resumes and receives the editor's exit code.

### 2.2 Secure Temp File Lifecycle

A temporary file is created in the system temp directory (`sys_get_temp_dir()`) with a randomly generated name (`cvault_` + 16 hex chars + `.md`). Permissions are set to `0600` (owner read/write only) on Unix immediately after creation. After the editor exits and the content is read into memory, a **two-phase secure deletion** is performed:

1. **Overwrite**: The file is opened in write mode and filled with NUL bytes (`\x00`) equal to its original size. This overwrites the data on disk blocks before the directory entry is unlinked.
2. **Unlink**: `unlink()` removes the directory entry.

This mitigates forensic recovery of plaintext journal content from sectors that haven't yet been overwritten by the OS. A caveat: on SSDs with wear-leveling firmware and on filesystems with journaling (ext4, NTFS), true unrecoverable deletion requires OS-level tools (`shred`, TRIM commands). For the threat model of a personal journal (not a state-secret repository), this implementation provides a strong and reasonable best-effort mitigation.

---

## 3. Design Patterns & Modern PHP Architecture

### 3.1 The Decorator Pattern on Storage

The core storage architecture is built around a single interface: `JournalRepositoryInterface`. Two concrete implementations exist: `SqliteJournalRepository` (the **Component**) and `EncryptedJournalRepository` (the **Decorator**).

The Decorator implements the same interface as the Component and holds a reference to it. When `EncryptedJournalRepository::save()` is called, it encrypts the draft body, then delegates the actual SQL INSERT to `SqliteJournalRepository::save()`. When `findById()` is called, it fetches the raw row (with binary ciphertext body) from the SQLite component, then decrypts the body and returns a clean `JournalEntry` DTO with the plaintext. The rest of the application (commands, dashboard) only ever holds a `JournalRepositoryInterface` reference — it is completely unaware of whether encryption is happening. This is the Open/Closed Principle in action: `SqliteJournalRepository` is closed for modification (encryption was not "added" to it), yet the system is open for extension (we could add a `CompressedJournalRepository` decorator that wraps the encrypted one to also compress before encrypting, without touching any existing code).

### 3.2 PHP 8.2+ Feature Usage

| Feature | Class | Purpose |
|---|---|---|
| `enum Mood: string` | `Domain/Mood.php` | String-backed enum for SQLite storage; carries `label()`, `emoji()`, `score()`, `ansiColor()` methods — a clean alternative to class constants with a match expression |
| `readonly class JournalEntry` | `Domain/JournalEntry.php` | Immutable DTO. All properties are set once at construction; PHP 8.2 enforces this at the language level — no accidental mutation anywhere in the call stack |
| `#[\SensitiveParameter]` | `Crypto/KeyDerivation.php` | Redacts `$passphrase` from PHP exception stack traces — a PHP 8.2 native security feature with zero runtime overhead |
| Constructor property promotion | All service classes | Reduces boilerplate; `public function __construct(private readonly X $x)` declares, types, assigns in one line |
| Named arguments | `Application.php` | `$keyDerivation->deriveKey(passphrase: $p)` improves readability at call sites; validates parameter names at compile time |
| `match` expression | `Mood.php`, `CipherEngine.php` | Strict (no type coercion), exhaustive (throws on unmatched arm), expression-oriented — superior to `switch` for mapping values |
| `json_encode(..., JSON_THROW_ON_ERROR)` | `EncryptedJournalRepository.php` | Fails loudly rather than silently returning `false` on encoding errors — required for reliable AD construction |
| `str_starts_with()` | `WriteCommand.php` | Native PHP 8.0+ string function; avoids `strpos() === 0` idiom |

### 3.3 Command Pattern for CLI Routing

Each CLI verb (`write`, `read`, `list`, `stats`) is encapsulated in a class implementing `CommandInterface`, which requires `execute(array $args): int` (following Unix exit code conventions) and metadata methods `getName()` and `getDescription()`. The `Application` class builds a keyed registry of commands and routes `$argv[1]` to the correct implementation. Adding a new command requires only creating a new class and registering it in `Application::buildCommands()` — no `switch` statement modifications, no nested conditionals.

---

## 4. Security Threat Model Summary

| Threat | Mitigation |
|---|---|
| Stolen `vault.db` file | XChaCha20-Poly1305 encryption; no key = random bytes |
| Weak master password | Argon2id KDF with 64MB RAM + 300ms cost per attempt |
| Rainbow table attack | Per-vault 16-byte random salt |
| SQLite metadata tampering | AEAD associated data binds body to metadata; tamper = auth failure |
| Plaintext in temp file | Editor temp file zero-overwritten then unlinked after ingestion |
| Password in stack traces | `#[\SensitiveParameter]` on `$passphrase` parameter |
| Password in memory | `sodium_memzero()` called immediately after key derivation |
| Password visible in terminal | `stty -echo` / PowerShell masked input suppresses echo |
| Wrong key silent corruption | Poly1305 MAC; decryption returns `false` and throws, never returns garbage |
