<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Configurations\AsyncPdfNodeConfig;
use App\Models\Configurations\EmailNodeConfig;
use App\Models\Configurations\ExtractDataNodeConfig;
use App\Models\Configurations\SlackNodeConfig;
use App\Models\Configurations\WebhookNodeConfig;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowNode;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $jsonPath = base_path('workflows/stripe_invoice_workflow.json');

        if (! file_exists($jsonPath)) {
            $this->command->error("Workflow JSON file not found at: {$jsonPath}");
            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true, 512, JSON_THROW_ON_ERROR);

        // 1. Create or update Workflow Definition
        $definition = WorkflowDefinition::updateOrCreate(
            ['id' => $data['id']],
            [
                'name' => $data['name'],
                'description' => $data['description'],
                'trigger_type' => $data['trigger_type'],
                'version' => $data['version'],
                'dag_topology' => [
                    'nodes' => array_column($data['nodes'], 'key'),
                    'dependencies' => array_column($data['nodes'], 'depends_on', 'key'),
                ],
                'is_active' => true,
            ]
        );

        // Remove previous nodes for clean re-seed
        $definition->nodes()->delete();

        // 2. Iterate and instantiate polymorphic configurations
        foreach ($data['nodes'] as $node) {
            $configModel = match ($node['config_type']) {
                WebhookNodeConfig::class, 'App\\Models\\Configurations\\WebhookNodeConfig' => WebhookNodeConfig::create($node['config']),
                ExtractDataNodeConfig::class, 'App\\Models\\Configurations\\ExtractDataNodeConfig' => ExtractDataNodeConfig::create($node['config']),
                AsyncPdfNodeConfig::class, 'App\\Models\\Configurations\\AsyncPdfNodeConfig' => AsyncPdfNodeConfig::create($node['config']),
                EmailNodeConfig::class, 'App\\Models\\Configurations\\EmailNodeConfig' => EmailNodeConfig::create($node['config']),
                SlackNodeConfig::class, 'App\\Models\\Configurations\\SlackNodeConfig' => SlackNodeConfig::create($node['config']),
                default => throw new \InvalidArgumentException("Unknown config type: {$node['config_type']}"),
            };

            WorkflowNode::create([
                'workflow_definition_id' => $definition->id,
                'node_key' => $node['key'],
                'node_class' => $node['class'],
                'order_index' => $node['order'],
                'is_async' => $node['async'] ?? false,
                'queue_name' => $node['queue'] ?? null,
                'max_attempts' => $node['max_attempts'] ?? 3,
                'timeout_seconds' => 60,
                'configurable_type' => get_class($configModel),
                'configurable_id' => $configModel->id,
            ]);
        }

        $this->command->info("Seeded workflow definition [{$definition->id}] with 5 polymorphic nodes.");
    }
}
