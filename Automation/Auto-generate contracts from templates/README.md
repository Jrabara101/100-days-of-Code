# Automated Legal Contract Generation Engine

A production-grade, cryptographically audited PHP CLI application for an Automated Legal Contract Generation Engine.

## Features

1. **Strict Token Schema Validation**: Enforces a strict schema for every template. If any template variable is missing or blank, compilation aborts immediately to prevent rendering incomplete legal agreements.
2. **Cryptographic Document Immutability**: Generates a SHA-256 hash of the exact output string payload and seals it in the database. During compliance audits, the files on disk are verified against their stored database signatures to flag any unauthorized tampering.
3. **Template Inheritance & Variable Interpolation**: Uses a zero-dependency, safe regex token parser (`/\{\{\s*([a-z0-9_]+)\s*\}\}/i`) to avoid `eval()` or heavy external template engines, keeping execution secure and fast.
4. **ANSI Screen Normalization & Table Padding**: Cleans TUI layouts by stripping ANSI escape sequences before calculating table cell widths, ensuring perfect ASCII border alignment.

## Getting Started

Make sure you have PHP installed with `ext-pdo` and `ext-pdo_sqlite` enabled.

### 1. Launch the Interactive Workspace
To run the interactive CLI terminal wizard:
```bash
php contract_generator.php
```

From here you can:
- Generate single contracts interactively.
- Run batch generation mock processes.
- Audit contracts ledger and cryptographic signatures (with tamper detection).
- View available template schemas.

### 2. Run Headless Batch Generation
For background cron jobs, webhook handlers, or CI/CD pipelines:
```bash
php contract_generator.php --batch
```
This is fully automated and runs without interactive TUI prompts.
