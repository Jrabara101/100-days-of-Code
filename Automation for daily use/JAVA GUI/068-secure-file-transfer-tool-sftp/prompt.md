# Project #68 — Secure File Transfer Tool (Java SFTP)

**Date:** 2026-07-07
**Source list:** `Automation for daily use/JAVA GUI/Now, Deep Research about 100 projects on Java GUI.docx` — Advanced Projects (67–100)

## Senior prompt used

> create a JavaFX GUI with advanced senior developer prompt to generate more visual styling layout and more reasoning logic behind the code. — applied to: **"Secure File Transfer Tool (Java SFTP)"**. Build the connection lifecycle and file-transfer UI of a secure SFTP client: an explicit transfer state machine (IDLE → CONNECTING → AUTHENTICATING → TRANSFERRING → VERIFYING → COMPLETE/FAILED/CANCELLED), a checked-exception hierarchy that separates transient failures (network timeouts, broken pipes — safe to retry) from terminal ones (bad credentials, host-key mismatch, permission denied — retrying cannot fix these), a post-transfer integrity-verification step with pluggable checksum algorithms (CRC32 / MD5 / SHA-256), and a rich dark-themed JavaFX UI showing a file-queue table with per-file progress bars, state badges, and truncated checksum display with tooltip expansion.

## Design reasoning

- **Transient vs Terminal exception hierarchy** mirrors the real SFTP/SSH failure taxonomy: `TransientSftpException` covers failures where the server or network may recover (timeout, packet loss, connection reset) — `TransferSession.connectWithRetry()` backs off exponentially up to 3 attempts. `TerminalSftpException` covers failures that cannot be resolved by retrying the same parameters (host-key mismatch = possible MITM, bad credentials, remote path missing) — these abort immediately. This distinction is security-relevant: blindly retrying a credential-failure could trigger an account lockout.

- **`IntegrityVerifier` encodes real SFTP post-transfer verification reasoning.** The SFTP protocol has no mandatory end-to-end integrity check — clients that skip it silently accept silently-corrupted transfers. The three `ChecksumAlgorithm` values are ordered by trade-off: CRC32 is fast but non-cryptographic (accidental corruption only); MD5 and SHA-256 provide cryptographic resistance at low CPU cost, with SHA-256 being the only FIPS-140-compliant option. The verifier computes a local digest and compares it against the simulated remote server digest, mirroring the `check-file-handle` extension from draft-ietf-secsh-filexfer.

- **`ConnectionProfile.knownHostFingerprint` is a first-class field**, not an afterthought. In OpenSSH's `known_hosts` the fingerprint is separate from the host address so that a host's IP can change without invalidating the fingerprint, and so the mismatch check can happen before any data is sent. The simulated client checks for a `"MISMATCH"` prefix to demonstrate the terminal-abort path.

- **Sequential file-queue draining** (one file at a time) is an intentional policy choice: parallel transfers would saturate a shared uplink, make per-file progress bars meaningless, and complicate per-file retry accounting. The `TransferSession` holds a single shared `SftpClient` connection and drains the `ObservableList<FileEntry>` sequentially.

- **JavaFX Property bindings drive all UI state.** `FileEntry.progressProperty()` is bound directly to the `ProgressBarTableCell`; `TransferSession.statusMessageProperty()` and `sessionStateProperty()` are observed by listeners in the UI layer. No manual polling or `Platform.runLater` chains from the UI — all mutations happen on the session thread and are published via `Platform.runLater` inside `TransferSession`.

- **Checksum display in the table uses truncate + tooltip.** SHA-256 digests are 64 hex chars — showing the full string would require a very wide column. Truncating to 12 chars + "…" fits the column and a Tooltip reveals the full digest on hover, matching how file managers (e.g., macOS Get Info) handle long hashes.

## Files

- `src/TransferState.java` — transfer lifecycle enum (IDLE → CONNECTING → AUTHENTICATING → TRANSFERRING → VERIFYING → COMPLETE/FAILED/CANCELLED).
- `src/SftpException.java` — base checked exception for all SFTP failures.
- `src/TransientSftpException.java` — retryable failures (network timeouts, broken pipes).
- `src/TerminalSftpException.java` — non-retryable failures (bad credentials, host-key mismatch, permission denied).
- `src/ChecksumAlgorithm.java` — enum of integrity algorithms (CRC32, MD5, SHA-256) with JVM MessageDigest name and cryptographic flag.
- `src/FileEntry.java` — observable domain model for a queued file (JavaFX properties for name, size, progress, state, checksum, direction).
- `src/ConnectionProfile.java` — observable SFTP endpoint descriptor including known-host fingerprint field.
- `src/IntegrityVerifier.java` — post-transfer digest computation and comparison with triage logic (mismatch → TerminalSftpException).
- `src/SftpClient.java` — transport abstraction interface with ProgressCallback functional interface.
- `src/SimulatedSftpClient.java` — simulated SFTP back-end with configurable failure injection for transient and terminal scenarios.
- `src/TransferSession.java` — orchestrates connect-with-retry, sequential queue drain, per-file transfer-with-retry, integrity verification, and UI state publication.
- `src/SecureFileTransferApp.java` — JavaFX Application: dark teal/charcoal theme, connection profile panel, file-queue TableView with progress bars and state badges, status bar with animated indicator dot.

## Compile command and result

```
javac --module-path "C:\tools\javafx-sdk-26.0.1\lib" --add-modules javafx.controls,javafx.graphics,javafx.base,javafx.fxml -d out src\*.java
```

Result: **compiled cleanly, 0 errors**, 18 class files produced in `out/`.

## Layout summary

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Secure File Transfer           SSH File Transfer Protocol • integrity      │
│  (header bar — dark teal title, muted subtitle)                             │
├───────────────────────┬────────────────────────────────────────────────────┤
│  CONNECTION PROFILE   │  TRANSFER QUEUE                                     │
│                       │ ┌──────────────┬───┬──────┬───────────┬──────────┐ │
│  Host   [_________]   │ │ File         │Dir│ Size │ Progress  │ Status   │ │
│  Port   [22_______]   │ ├──────────────┼───┼──────┼───────────┼──────────┤ │
│  User   [_________]   │ │ report.pdf   │↑UP│1.2MB │ ████████  │COMPLETE  │ │
│  Pass   [•••••••••]   │ │ backup.zip   │↑UP│ 48MB │ ████░░░░  │TRANSFER  │ │
│  Path   [/uploads_]   │ │ config.json  │↑UP│ 4 KB │ ░░░░░░░░  │IDLE      │ │
│  Fprint [SHA256:…_]   │ └──────────────┴───┴──────┴───────────┴──────────┘ │
│  Algo   [SHA-256 ▾]   │                                                     │
│                       │  [=== overall progress bar ===]                     │
│  [+ Add Files]        │                                                     │
│  [Connect & Transfer] │                                                     │
│  [Cancel]             │                                                     │
├───────────────────────┴────────────────────────────────────────────────────┤
│  ● Transferring: backup.zip (attempt 1/3)                  (status bar)    │
└────────────────────────────────────────────────────────────────────────────┘
```

## Status

Marked complete in `Now, Deep Research about 100 projects on Java GUI.docx` (item #68, "Secure File Transfer Tool Java SFTP", highlighted red). Next up: **#69 — Remote Desktop Controller (Java RMI)**.
