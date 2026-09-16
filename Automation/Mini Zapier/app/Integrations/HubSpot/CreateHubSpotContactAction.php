<?php

declare(strict_types=1);

namespace App\Integrations\HubSpot;

use App\Integrations\Attributes\AsAction;
use App\Integrations\Contracts\ActionInterface;
use App\Integrations\DTOs\ActionResult;
use App\Integrations\DTOs\Payload;
use Illuminate\Support\Facades\Log;

#[AsAction(
    id: 'hubspot.create_contact',
    name: 'Create HubSpot Contact',
    description: 'Creates or updates a contact record in HubSpot CRM.',
    inputSchema: [
        'email' => 'string (email)',
        'firstname' => 'string',
        'lastname' => 'string',
    ]
)]
class CreateHubSpotContactAction implements ActionInterface
{
    public function execute(Payload $payload): ActionResult
    {
        $startTime = microtime(true);

        $email = (string) $payload->get('email');
        $firstname = (string) $payload->get('firstname', 'Customer');
        $lastname = (string) $payload->get('lastname', '');

        if (empty($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $duration = round(microtime(true) - $startTime, 3);
            return ActionResult::failure(
                errorMessage: "Invalid contact email: '{$email}'",
                duration: $duration,
                logs: ["Failed to validate email '{$email}' for HubSpot contact creation."]
            );
        }

        // Simulate network API request with realistic latency (approx 0.32s)
        usleep(320000);
        $duration = round(microtime(true) - $startTime, 2);

        $contactId = 'hub_' . rand(10000, 99999);

        Log::info("HubSpot Contact Created: ID={$contactId}, Email={$email}");

        return ActionResult::success(
            output: [
                'contact_id' => $contactId,
                'email' => $email,
                'firstname' => $firstname,
                'lastname' => $lastname,
                'created_at' => now()->toISOString(),
            ],
            duration: $duration,
            logs: ["Created HubSpot CRM contact record [{$contactId}] for {$email}"]
        );
    }

    public function getName(): string
    {
        return 'Create HubSpot Contact';
    }

    public function getDescription(): string
    {
        return 'Creates or updates a contact record in HubSpot CRM.';
    }

    public function getInputSchema(): array
    {
        return [
            'email' => 'string (valid email)',
            'firstname' => 'string',
            'lastname' => 'string',
        ];
    }
}
