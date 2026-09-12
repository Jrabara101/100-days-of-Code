<?php

declare(strict_types=1);

namespace App\Services\NotificationCenter;

use App\Models\DispatchEvent;
use App\Models\DispatchOutbox;
use App\Models\NotificationSubscriber;
use App\Services\NotificationCenter\Contracts\ChannelProviderInterface;
use App\Services\NotificationCenter\Dto\IngestedEventDto;
use App\Services\NotificationCenter\Dto\OutboxAuditReceipt;
use App\Services\NotificationCenter\Dto\ProviderDeliveryResponse;
use App\Services\NotificationCenter\Providers\AwsSesEmailGateway;
use App\Services\NotificationCenter\Providers\DiscordGateway;
use App\Services\NotificationCenter\Providers\SlackGateway;
use App\Services\NotificationCenter\Providers\TwilioSmsGateway;
use Carbon\CarbonImmutable;
use Illuminate\Support\Str;

class NotificationOrchestratorService
{
    /** @var array<string, ChannelProviderInterface> */
    private array $providers = [];

    // Fallback escalation paths if a channel fails or trips open
    private array $escalationFallback = [
        'SLACK'      => 'DISCORD',
        'DISCORD'    => 'TWILIO_SMS',
        'TWILIO_SMS' => 'AWS_SES',
        'AWS_SES'    => null,
    ];

    public function __construct(private readonly CircuitBreakerManager $circuitBreaker)
    {
        $this->registerProvider(new SlackGateway());
        $this->registerProvider(new DiscordGateway());
        $this->registerProvider(new TwilioSmsGateway());
        $this->registerProvider(new AwsSesEmailGateway());
    }

    public function registerProvider(ChannelProviderInterface $provider): void
    {
        $this->providers[$provider->code()] = $provider;
    }

    /**
     * Executes multi-channel fanout, quiet-hours filtering, and automated fallback dispatching.
     *
     * @return array<OutboxAuditReceipt>
     */
    public function orchestrate(IngestedEventDto $dto, bool $dryRun = false): array
    {
        $subscribers = NotificationSubscriber::all();
        $receipts = [];

        $event = null;
        if (!$dryRun) {
            $event = DispatchEvent::create([
                'event_uuid' => (string) Str::uuid(),
                'event_type' => $dto->eventType,
                'priority' => $dto->priority,
                'reference_id' => $dto->referenceId,
                'title' => $dto->title,
                'message' => $dto->message,
                'context_payload' => $dto->context,
            ]);
        }

        foreach ($subscribers as $subscriber) {
            // P0 Critical forces parallel delivery across all available channels
            if ($dto->priority === 'P0') {
                foreach (array_keys($this->providers) as $providerCode) {
                    $receipts[] = $this->routeToProvider(
                        subscriber: $subscriber,
                        providerCode: $providerCode,
                        dto: $dto,
                        event: $event,
                        dryRun: $dryRun,
                        allowFallback: false
                    );
                }
                continue;
            }

            // P1, P2, P3 follow subscriber priority configuration
            $channelChain = $subscriber->channel_routing_priority ?? ['SLACK', 'AWS_SES'];
            $primaryChannel = $channelChain[0] ?? 'AWS_SES';

            $receipts[] = $this->routeToProvider(
                subscriber: $subscriber,
                providerCode: $primaryChannel,
                dto: $dto,
                event: $event,
                dryRun: $dryRun,
                allowFallback: in_array($dto->priority, ['P0', 'P1'], true)
            );
        }

        return $receipts;
    }

    private function routeToProvider(
        NotificationSubscriber $subscriber,
        string $providerCode,
        IngestedEventDto $dto,
        ?DispatchEvent $event,
        bool $dryRun,
        bool $allowFallback
    ): OutboxAuditReceipt {
        $idempotencyHash = hash('sha256', sprintf('%d|%s|%s|%s', $subscriber->id, $dto->eventType, $dto->referenceId, $providerCode));

        // Deduplication Check
        if (!$dryRun) {
            $existing = DispatchOutbox::where('idempotency_hash', $idempotencyHash)->first();
            if ($existing) {
                return new OutboxAuditReceipt($subscriber->name, $providerCode, 'IDEMPOTENT_SKIPPED', 0, false, false, "Idempotent bypass: already recorded with status [{$existing->status}].");
            }
        }

        // Quiet Hours Guard (P0 Critical bypasses DND)
        if ($this->isWithinQuietHours($subscriber) && $dto->priority !== 'P0') {
            if (!$dryRun && $event) {
                $this->commitOutbox($event->id, $subscriber->id, $providerCode, $idempotencyHash, 'SUPPRESSED_DND', 0, 'Recipient in local quiet hours.');
            }
            return new OutboxAuditReceipt($subscriber->name, $providerCode, 'SUPPRESSED_DND', 0, false, false);
        }

        if ($dryRun) {
            return new OutboxAuditReceipt($subscriber->name, $providerCode, 'SIMULATED', rand(15, 30), false, false);
        }

        // 1. Circuit Breaker Pre-Flight Check
        if (!$this->circuitBreaker->canAttempt($providerCode)) {
            // Circuit is OPEN: immediate zero-latency fallback bypass
            if ($allowFallback && ($fallbackTarget = $this->escalationFallback[$providerCode] ?? null)) {
                $fallbackReceipt = $this->routeToProvider($subscriber, $fallbackTarget, $dto, $event, $dryRun, false);
                return new OutboxAuditReceipt(
                    recipientName: $subscriber->name,
                    channelTrail: "{$providerCode} ➔ {$fallbackTarget}",
                    status: 'FALLBACK_RECOVERED',
                    latencyMs: $fallbackReceipt->latencyMs,
                    fallbackOccurred: true,
                    circuitTripped: true,
                    logDetail: "Circuit for [{$providerCode}] is OPEN. Fast-routed to [{$fallbackTarget}]."
                );
            }

            $this->commitOutbox($event->id, $subscriber->id, $providerCode, $idempotencyHash, 'CIRCUIT_BYPASS', 0, 'Circuit Open: Delivery skipped.');
            return new OutboxAuditReceipt($subscriber->name, $providerCode, 'CIRCUIT_BYPASS', 0, false, true, 'Circuit tripped.');
        }

        // 2. Transport Execution
        $provider = $this->providers[$providerCode] ?? null;
        if (!$provider) {
            return new OutboxAuditReceipt($subscriber->name, $providerCode, 'FAILED', 0, false, false, 'Provider unavailable.');
        }

        $res = $provider->deliver($subscriber, $dto);

        if ($res->success) {
            $this->circuitBreaker->recordSuccess($providerCode);
            $this->commitOutbox($event->id, $subscriber->id, $providerCode, $idempotencyHash, 'DELIVERED', $res->latencyMs);
            return new OutboxAuditReceipt($subscriber->name, $providerCode, 'DELIVERED', $res->latencyMs, false, false);
        }

        // 3. Provider Failed: Trip circuit breaker & initiate fallback
        $this->circuitBreaker->recordFailure($providerCode);

        if ($allowFallback && ($fallbackTarget = $this->escalationFallback[$providerCode] ?? null)) {
            $fallbackReceipt = $this->routeToProvider($subscriber, $fallbackTarget, $dto, $event, $dryRun, false);
            return new OutboxAuditReceipt(
                recipientName: $subscriber->name,
                channelTrail: "{$providerCode} ➔ {$fallbackTarget}",
                status: 'FALLBACK_RECOVERED',
                latencyMs: $res->latencyMs + $fallbackReceipt->latencyMs,
                fallbackOccurred: true,
                circuitTripped: false,
                logDetail: "Primary [{$providerCode}] failed: {$res->errorMessage}. Rerouted via [{$fallbackTarget}]."
            );
        }

        $this->commitOutbox($event->id, $subscriber->id, $providerCode, $idempotencyHash, 'FAILED', $res->latencyMs, $res->errorMessage);
        return new OutboxAuditReceipt($subscriber->name, $providerCode, 'FAILED', $res->latencyMs, false, false, $res->errorMessage);
    }

    private function isWithinQuietHours(NotificationSubscriber $subscriber): bool
    {
        $now = CarbonImmutable::now($subscriber->timezone);
        $hour = $now->hour;
        $start = $subscriber->quiet_hours_start;
        $end = $subscriber->quiet_hours_end;

        return ($start > $end)
            ? ($hour >= $start || $hour < $end)
            : ($hour >= $start && $hour < $end);
    }

    private function commitOutbox(int $eventId, int $subscriberId, string $provider, string $hash, string $status, int $latency, ?string $error = null): void
    {
        DispatchOutbox::create([
            'dispatch_event_id' => $eventId,
            'subscriber_id' => $subscriberId,
            'provider_code' => $provider,
            'idempotency_hash' => $hash,
            'status' => $status,
            'latency_ms' => $latency,
            'error_details' => $error,
            'dispatched_at' => ($status === 'DELIVERED' || $status === 'FALLBACK_RECOVERED') ? now() : null,
        ]);
    }
}
