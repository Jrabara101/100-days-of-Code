<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\AuditLedger;
use App\Services\Compliance\AuditComplianceService;
use Illuminate\Database\Seeder;

class AuditComplianceSeeder extends Seeder
{
    public function run(AuditComplianceService $auditor): void
    {
        // 1. Genesis Login Event (SOC2)
        $auditor->record(
            eventAction: 'AUTH_LOGIN',
            complianceStandard: 'SOC2_CC6_1',
            payload: ['status' => 'MFA_SUCCESSFUL', 'auth_provider' => 'Okta_SAML'],
            extraMetadata: ['email' => 'secops.lead@enterprise.com']
        );

        // 2. Patient Health Record Access (HIPAA with PII Sanitization)
        $auditor->record(
            eventAction: 'ACCESS',
            complianceStandard: 'HIPAA_164_312',
            payload: [
                'resource' => 'PATIENT_DIAGNOSIS_RECORD',
                'patient_ssn' => '000-45-6789', // Will be redacted
                'doctor_notes' => 'Prescription refill authorized',
            ],
            extraMetadata: ['email' => 'dr.carter@hospital.org']
        );

        // 3. Credit Card Payment Terminal Tokenization (PCI-DSS)
        $auditor->record(
            eventAction: 'CREATE',
            complianceStandard: 'PCI_DSS_REQ_10',
            payload: [
                'card_number' => '4111222233334444', // Will be masked
                'cvv' => '987',                      // Will be redacted
                'amount_cents' => 45000,
                'gateway' => 'Stripe_Elements',
            ],
            extraMetadata: ['email' => 'checkout.service@ecommerce.net']
        );

        // 4. Data Subject Deletion Request (GDPR Right to be Forgotten)
        $auditor->record(
            eventAction: 'DELETE',
            complianceStandard: 'GDPR_ART_17',
            payload: [
                'subject_email' => 'privacy.eu.citizen@domain.de',
                'erasure_scope' => 'ALL_PII_ATTRIBUTES',
                'ticket_reference' => 'DSR-2026-0091',
            ],
            extraMetadata: ['email' => 'dpo@enterprise.com']
        );

        // 5. Bulk Export Incident (SOC2)
        $auditor->record(
            eventAction: 'EXPORT',
            complianceStandard: 'SOC2_CC6_8',
            payload: [
                'dataset' => 'Q2_FINANCIAL_LEDGER',
                'format' => 'ENCRYPTED_PARQUET',
                'row_count' => 1250000,
            ],
            extraMetadata: ['email' => 'cfo.office@enterprise.com']
        );
    }
}
