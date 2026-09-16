<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\PayloadMapper;
use PHPUnit\Framework\TestCase;

class PayloadMapperTest extends TestCase
{
    private PayloadMapper $mapper;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mapper = new PayloadMapper();
    }

    public function test_extracts_tokens_correctly(): void
    {
        $template = [
            'greeting' => 'Hello {{ trigger.user.name }}!',
            'metadata' => [
                'email' => '{{ trigger.user.email }}',
                'customer_id' => '{{ trigger.id }}',
            ],
        ];

        $tokens = $this->mapper->extractTokens($template);

        $this->assertCount(3, $tokens);
        $this->assertContains('trigger.user.name', $tokens);
        $this->assertContains('trigger.user.email', $tokens);
        $this->assertContains('trigger.id', $tokens);
    }

    public function test_interpolates_nested_dot_notation(): void
    {
        $context = [
            'trigger' => [
                'customer' => [
                    'profile' => [
                        'first_name' => 'Alice',
                        'email' => 'alice@example.com',
                    ],
                ],
            ],
            'step_1' => [
                'hubspot_id' => 'hub_12345',
            ],
        ];

        $template = [
            'name' => '{{ trigger.customer.profile.first_name }}',
            'email' => '{{ trigger.customer.profile.email }}',
            'note' => 'Synced with ID {{ step_1.hubspot_id }} for {{ trigger.customer.profile.first_name }}',
        ];

        $result = $this->mapper->mapToPayload($template, $context, '8802', 1);
        $payload = $result['payload'];

        $this->assertSame('Alice', $payload->get('name'));
        $this->assertSame('alice@example.com', $payload->get('email'));
        $this->assertSame('Synced with ID hub_12345 for Alice', $payload->get('note'));
    }

    public function test_preserves_native_types_when_exact_match(): void
    {
        $context = [
            'trigger' => [
                'is_active' => true,
                'count' => 42,
                'items' => ['item_a', 'item_b'],
                'non_existent' => null,
            ],
        ];

        $template = [
            'active_flag' => '{{ trigger.is_active }}',
            'total_count' => '{{ trigger.count }}',
            'item_list' => '{{ trigger.items }}',
            'empty_val' => '{{ trigger.non_existent }}',
        ];

        $result = $this->mapper->mapToPayload($template, $context);
        $payload = $result['payload'];

        $this->assertTrue($payload->get('active_flag'));
        $this->assertSame(42, $payload->get('total_count'));
        $this->assertSame(['item_a', 'item_b'], $payload->get('item_list'));
        $this->assertNull($payload->get('empty_val'));
    }

    public function test_records_interpolation_traces_for_debugging(): void
    {
        $context = [
            'trigger' => [
                'user' => [
                    'name' => 'Jane Doe',
                    'email' => 'jane@example.com',
                ],
            ],
        ];

        $template = [
            'firstname' => '{{ trigger.user.name }}',
            'email' => '{{ trigger.user.email }}',
        ];

        $result = $this->mapper->mapToPayload($template, $context, '8802', 1);
        $traces = $result['traces'];

        $this->assertCount(2, $traces);
        $this->assertSame('{{ trigger.user.name }}', $traces[0]->token);
        $this->assertSame('Jane Doe', $traces[0]->resolvedValue);
        $this->assertSame('{{ trigger.user.email }}', $traces[1]->token);
        $this->assertSame('jane@example.com', $traces[1]->resolvedValue);
    }
}
