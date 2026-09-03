<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\Compliance\PiiSanitizer;
use PHPUnit\Framework\TestCase;

class PiiSanitizerTest extends TestCase
{
    public function test_it_redacts_blacklisted_keys_at_root_level(): void
    {
        $input = [
            'username' => 'alice_dev',
            'password' => 'superSecret123!',
            'api_key' => 'ak_live_998877665544332211',
            'token' => 'jwt.token.payload',
            'cvv' => '123',
            'ssn' => '000-12-3456',
            'tax_id' => '99-8877665',
        ];

        $sanitized = PiiSanitizer::sanitize($input);

        $this->assertSame('alice_dev', $sanitized['username']);
        $this->assertSame('[REDACTED_CONFIDENTIAL]', $sanitized['password']);
        $this->assertSame('[REDACTED_CONFIDENTIAL]', $sanitized['api_key']);
        $this->assertSame('[REDACTED_CONFIDENTIAL]', $sanitized['token']);
        $this->assertSame('[REDACTED_CONFIDENTIAL]', $sanitized['cvv']);
        $this->assertSame('[REDACTED_CONFIDENTIAL]', $sanitized['ssn']);
        $this->assertSame('[REDACTED_CONFIDENTIAL]', $sanitized['tax_id']);
    }

    public function test_it_recursively_redacts_nested_structures(): void
    {
        $input = [
            'user' => [
                'profile' => [
                    'email' => 'user@enterprise.com',
                    'auth_token' => 'bearer-token-abc',
                ],
                'billing' => [
                    'credit_card' => '4111222233334444',
                ],
            ],
        ];

        $sanitized = PiiSanitizer::sanitize($input);

        $this->assertSame('user@enterprise.com', $sanitized['user']['profile']['email']);
        $this->assertSame('[REDACTED_CONFIDENTIAL]', $sanitized['user']['profile']['auth_token']);
        $this->assertSame('[REDACTED_CONFIDENTIAL]', $sanitized['user']['billing']['credit_card']);
    }

    public function test_it_masks_credit_card_patterns_in_string_values(): void
    {
        $input = [
            'memo' => 'Customer provided payment card 4111222233334444 over voice call.',
            'formatted_memo' => 'Charged card 4111-2222-3333-4444 successfully.',
        ];

        $sanitized = PiiSanitizer::sanitize($input);

        $this->assertSame('Customer provided payment card 4111-XXXX-XXXX-4444 over voice call.', $sanitized['memo']);
        $this->assertSame('Charged card 4111-XXXX-XXXX-4444 successfully.', $sanitized['formatted_memo']);
    }

    public function test_it_masks_ssn_patterns_in_string_values(): void
    {
        $input = [
            'patient_note' => 'Identified by government SSN 123-45-6789 during intake.',
        ];

        $sanitized = PiiSanitizer::sanitize($input);

        $this->assertSame('Identified by government SSN XXX-XX-6789 during intake.', $sanitized['patient_note']);
    }

    public function test_it_preserves_non_sensitive_primitive_types(): void
    {
        $input = [
            'counter' => 42,
            'is_active' => true,
            'rate' => 19.95,
            'tags' => ['audit', 'compliance'],
            'notes' => null,
        ];

        $sanitized = PiiSanitizer::sanitize($input);

        $this->assertSame(42, $sanitized['counter']);
        $this->assertTrue($sanitized['is_active']);
        $this->assertSame(19.95, $sanitized['rate']);
        $this->assertSame(['audit', 'compliance'], $sanitized['tags']);
        $this->assertNull($sanitized['notes']);
    }
}
