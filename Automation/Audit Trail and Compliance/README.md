# Cryptographic Audit Trail and Regulatory Compliance Vault

An enterprise-grade, tamper-evident audit ledger and regulatory compliance engine built with Laravel 13+, PHP 8.4+, and cryptographic hash chaining.

```
   ┌────────────────────────┐      ┌──────────────────────────────┐      ┌─────────────────────────────┐
   │ AUDIT INGESTION & DIFF │ ───► │ PII REDACTION & SANITIZER    │ ───► │ MERKLE-HASH CHAINING        │
   │ (Eloquent Mutation)    │      │ (PCI/GDPR Pattern Masking)   │      │ (SHA-256 Prev-Hash Link)    │
   └────────────────────────┘      └──────────────────────────────┘      └─────────────────────────────┘
                                                                                        │
                                                                                        ▼
                                                                         ┌─────────────────────────────┐
                                                                         │ INTEGRITY VERIFICATION CLI  │
                                                                         │ (Termwind Telemetry & Audit)│
                                                                         └─────────────────────────────┘
```

---

## 🛡️ Architectural Foundations & Domain Safeguards

Traditional database auditing models that record user actions into standard mutable database tables fail regulatory audits (such as **SOC 2 Type II**, **HIPAA § 164.312**, **GDPR Article 17**, and **PCI-DSS 4.0 Requirement 10**). If a rogue administrator, compromised database credential, or SQL injection attack modifies an audit row, standard databases accept the change without evidence of tampering.

This architecture enforces cryptographic chain integrity, runtime model immutability, and automated zero-knowledge PII redaction at the domain layer:

1. **Cryptographic Hash Chaining ($H_n$ Link)**:
   Every log entry computes an immutable cryptographic hash dependent on the preceding entry's hash:
   $$H_n = \text{SHA-256}\left( H_{n-1} \mathbin{\Vert} \text{Actor} \mathbin{\Vert} \text{Action} \mathbin{\Vert} \text{Payload} \mathbin{\Vert} T_{\text{timestamp}} \right)$$
   If any historical row is modified, injected, or truncated in the database, the hash cascade breaks downstream, identifying the exact record of corruption in an $O(N)$ linear scan.

2. **Database & Eloquent Immutability Shields**:
   The [`AuditLedger`](file:///app/Models/AuditLedger.php) model intercepts Eloquent `updating` and `deleting` events, throwing fatal domain `RuntimeException` exceptions to prevent tampering at the application runtime layer.

3. **Zero-Knowledge PII Redaction Pipeline**:
   Structured payloads pass through recursive key and regular-expression masking before hashing and persistence via [`PiiSanitizer`](file:///app/Services/Compliance/PiiSanitizer.php). Blacklisted credentials (`password`, `token`, `api_key`, `secret`, `cvv`, `ssn`, `tax_id`) and embedded pattern vectors (16-digit credit cards, Social Security Numbers) are masked with non-reversible tokens.

4. **Forensic Verification & Termwind Telemetry**:
   The Artisan CLI command [`audit:trail`](file:///app/Console/Commands/AuditComplianceCommand.php) performs an $O(N)$ linear integrity sweep, verifying parent hash links, re-computing SHA-256 digests, isolating manipulated rows, and rendering compliance telemetry dashboards.

---

## 📁 Pipeline Components

| Path | Description |
|---|---|
| [`database/migrations/2026_01_01_000001_create_compliance_audit_ledger_schema.php`](file:///database/migrations/2026_01_01_000001_create_compliance_audit_ledger_schema.php) | Table schema with indexes, UUIDs, previous hash, current hash, and microsecond precision |
| [`app/Models/AuditLedger.php`](file:///app/Models/AuditLedger.php) | Immutable Eloquent model with update/delete shields and deterministic SHA-256 calculation |
| [`app/Services/Compliance/PiiSanitizer.php`](file:///app/Services/Compliance/PiiSanitizer.php) | Recursive sanitization service masking blacklisted keys, credit cards, and SSNs |
| [`app/Services/Compliance/AuditComplianceService.php`](file:///app/Services/Compliance/AuditComplianceService.php) | Transactional ledger recording and $O(N)$ linear cryptographic chain integrity verification |
| [`app/Console/Commands/AuditComplianceCommand.php`](file:///app/Console/Commands/AuditComplianceCommand.php) | Artisan CLI command `audit:trail` supporting verification, grid display, and tamper testing |
| [`database/seeders/AuditComplianceSeeder.php`](file:///database/seeders/AuditComplianceSeeder.php) | Seeders simulating SOC2, HIPAA, PCI-DSS, and GDPR compliance events |
| [`database/seeders/DatabaseSeeder.php`](file:///database/seeders/DatabaseSeeder.php) | Application database seeder pipeline orchestrator |
| [`routes/console.php`](file:///routes/console.php) | Automated hourly compliance verification scheduler |
| [`tests/Unit/PiiSanitizerTest.php`](file:///tests/Unit/PiiSanitizerTest.php) | Unit tests verifying recursive key redaction and pattern masking |
| [`tests/Unit/AuditLedgerTest.php`](file:///tests/Unit/AuditLedgerTest.php) | Unit tests validating hash determinism and Eloquent immutability shields |
| [`tests/Feature/AuditComplianceServiceTest.php`](file:///tests/Feature/AuditComplianceServiceTest.php) | Feature tests covering cryptographic chaining, PII sanitization, and corruption detection |
| [`tests/Feature/AuditComplianceCommandTest.php`](file:///tests/Feature/AuditComplianceCommandTest.php) | Feature tests for command telemetry, filtering, verification pass/fail status |

---

## 🚀 Verification & Execution Workflow

### 1. Execute Migrations and Seed Integrity Ledger
```bash
php artisan migrate:fresh
php artisan db:seed --class=Database\Seeders\AuditComplianceSeeder
```

### 2. Display Formatted Compliance Grid
View recent immutable ledger logs, actor context, previous hash links, and current SHA-256 hashes:
```bash
php artisan audit:trail --limit=10
```

Example terminal output:
```text
  🛡️ IMMUTABLE COMPLIANCE AUDIT VAULT                                                             SOC2 • HIPAA • GDPR   
  Integrity: Cryptographic Hash Chaining | Data Guard: PII Zero-Knowledge Masking  

+----+------------------------+--------+----------------+--------------------------------+-----------+---------------------+
| ID | Timestamp (UTC)        | Action | Compliance     | Actor Context                  | Prev Hash | SHA-256 Ledger Hash |
+----+------------------------+--------+----------------+--------------------------------+-----------+---------------------+
| #5 | Sep 03 02:00:50.000000 | EXPORT | SOC2_CC6_8     | cfo.office@enterprise.com      | 9238b0..  | 185f77d2...ae19b6   |
| #4 | Sep 03 02:00:50.000000 | DELETE | GDPR_ART_17    | dpo@enterprise.com             | 951f5a..  | 9238b0ed...c50040   |
| #3 | Sep 03 02:00:50.000000 | CREATE | PCI_DSS_REQ_10 | checkout.service@ecommerce.net | da60ae..  | 951f5aae...3bcaa3   |
| #2 | Sep 03 02:00:50.000000 | ACCESS | HIPAA_164_312  | dr.carter@hospital.org         | 809250..  | da60ae99...2265ea   |
| #1 | Sep 03 02:00:50.000000 | CREATE | SOC2_CC6_1     | secops.lead@enterprise.com     | GENESIS   | 80925021...45609d   |
+----+------------------------+--------+----------------+--------------------------------+-----------+---------------------+
```

### 3. Execute Linear Cryptographic Verification
Run the verification engine to confirm all entries match their historical parent signatures:
```bash
php artisan audit:trail --verify
```

Output:
```text
  ⚡ Running linear cryptographic chain audit verification... DONE

 📊 AUDIT CHAIN INTEGRITY REPORT                                           
  PASSED • ZERO INTEGRITY TAMPERING DETECTED  

 Total Entries Verified:                                                              5 
 Valid Cryptographic Signatures:                                                      5 
 Tampered / Broken Blocks:                                                            0 
```

### 4. Simulate Unauthorized Database Tampering
Test the forensic verification logic by injecting an out-of-band SQL update that bypasses model event guards:
```bash
php artisan audit:trail --tamper-test
```

Re-run the verification command to pinpoint the broken link:
```bash
php artisan audit:trail --verify
```

Output:
```text
  ⚡ Running linear cryptographic chain audit verification... DONE

 📊 AUDIT CHAIN INTEGRITY REPORT                                               
  FAILED • CRYPTOGRAPHIC CHAIN CORRUPTED  

 Total Entries Verified:                                                              5 
 Valid Cryptographic Signatures:                                                      4 
 Tampered / Broken Blocks:                                                            1 

 ⚠ FORENSIC TAMPER ALERT: Cryptographic signature mismatch detected at Ledger Entry ID(s): #5.
 Database modifications bypassed the application layer or corrupted the previous hash vector. 
```

---

## 🧪 Running Automated Tests

Run the full automated test suite using PHPUnit:
```bash
php artisan test
```
All unit tests and feature tests will execute, confirming PII redaction, Eloquent immutability guards, hash determinism, and CLI forensics.
