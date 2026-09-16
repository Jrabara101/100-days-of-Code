# CoreLink CLI: Systems Architecture & Engineering Treatise

**Author**: Senior Laravel Systems Architect  
**Project**: CoreLink CLI – Internal Zapier-Clone Integration Daemon  
**Framework**: Laravel 11.x | PHP 8.4 / 8.2+ | Termwind  

---

## 1. Executive Summary & Core Architectural Tenets

CoreLink CLI is an enterprise-grade automation and webhook routing daemon designed to mirror the workflow orchestration capabilities of Zapier or Make within a self-hosted Laravel ecosystem. The engine is engineered around three non-negotiable architectural tenets:
1. **Dynamic Zero-Coupling Data Interpolation (The Mapper Pattern)**: Business logic in action integrations must remain entirely ignorant of where parameters originated.
2. **Deterministic Background Choreography (Chained Job Bus)**: Multi-step workflows follow strict sequential dependencies where step failure aborts subsequent operations instantly while preserving forensic telemetry.
3. **Decoupled Strategy Resolution via the Service Container**: Integrations, actions, and triggers adhere to clean contracts and are registered through native PHP 8.2+ attributes, instantiated on demand with automated dependency injection.

---

## 2. Deep Architectural Reasoning & Pattern Dissections

### 2.1 The Mapper Pattern & Dynamic Payload Interpolation (`PayloadMapper`)
The `PayloadMapper` engine decouples workflow definition from execution. In a workflow step, action configurations are declared as abstract templates with mustache tokens, such as `{{ trigger.user.email }}` or `{{ step_1.contact_id }}`. 

The mapping algorithm evaluates these templates through a two-stage recursive traversal:
1. **Exact-Match Type Preservation**: If a template field contains an isolated token (e.g. `"{{ trigger.amount }}"`), the regex `^\s*\{\{\s*([a-zA-Z0-9_\.\-]+)\s*\}\}\s*$` matches. Instead of casting the resolved variable into a string, the mapper extracts the dot-path and queries the execution context array using Laravel's native `data_get($context, $path)`. This guarantees that boolean flags, integers, floats, or complex JSON sub-arrays retain their native primitive types when injected into the downstream action DTO.
2. **String-Embedded Token Interpolation**: When tokens are embedded inside text (e.g. `"Welcome {{ trigger.user.name }} ({{ trigger.user.email }})"`), `preg_replace_callback('/\{\{\s*([a-zA-Z0-9_\.\-]+)\s*\}\}/', ...)` parses each token match. The captured path is resolved through `data_get($context, $tokenPath)`. If the path resolves to `null`, a safe blank string is interpolated; if it resolves to an array, it is JSON-encoded inline.

During mapping, the engine generates an array of `InterpolationTrace` DTOs, tracking which token was extracted, what value was resolved, and which key received it. This trace is persisted into SQLite/Redis to power real-time CLI topology inspection in the live daemon without runtime overhead.

```
Incoming Trigger Payload
   │  { "user": { "name": "Jane Doe", "email": "jane@example.com" } }
   ▼
PayloadMapper Engine
   │  Regex: /\{\{\s*([a-zA-Z0-9_\.\-]+)\s*\}\}/
   │  Resolver: data_get($accumulatedContext, "trigger.user.name")
   ▼
InterpolationTrace & Typed Payload DTO
   ├─ {{ trigger.user.name }}  => "Jane Doe"
   └─ {{ trigger.user.email }} => "jane@example.com"
```

### 2.2 Chained Asynchronous Execution vs. Batches (`Bus::chain()`)
A frequent architectural dilemma in pipeline design is whether to employ `Illuminate\Support\Facades\Bus::batch()` or `Bus::chain()`. For a Zapier-style workflow engine, `Bus::chain()` is fundamentally the superior choice:
- **Strict Sequential Ordering (FIFO)**: Unlike batches (which excel at parallel worker fan-out for independent tasks), Zapier actions are inherently sequential DAG dependencies. Step 2 (`SendSlackNotificationAction`) requires the customer ID or ticket key emitted by Step 1 (`CreateHubSpotContactAction`).
- **Fail-Fast Semantics**: If Step 1 encounters an invalid email, network rate limit, or authentication error, Step 2 must never fire. In a `Bus::chain()`, any unhandled exception immediately halts the remaining jobs in the queue pipeline.
- **Interception via `->catch()`**: CoreLink attaches a failure callback to the chain:
  ```php
  Bus::chain($jobs)
      ->catch(function (Throwable $exception) use ($executionId, $workflowName) {
          Log::error("Workflow Chain Failed: #{$executionId} [{$workflowName}]. Error: {$exception->getMessage()}");
          $execution = WorkflowExecution::find($executionId);
          if ($execution && $execution->status !== WorkflowStatus::FAILED) {
              $execution->status = WorkflowStatus::FAILED;
              $execution->error_message = $exception->getMessage();
              $execution->save();
          }
      })
      ->dispatch();
  ```
  When an action strategy fails, `ExecuteWorkflowStep` records the step failure trace, marks the execution status as `WorkflowStatus::FAILED`, and throws a `RuntimeException`. This triggers the chain's `catch()` closure, preventing downstream jobs from dequeuing and ensuring the terminal monitor immediately flags the workflow with `[FAILED] ❌`.

### 2.3 The Strategy Pattern & Service Container Dependency Injection
Action execution follows the **Strategy Pattern**. Each action implements `App\Integrations\Contracts\ActionInterface`:
```php
interface ActionInterface
{
    public function execute(Payload $payload): ActionResult;
    public function getName(): string;
    public function getDescription(): string;
    public function getInputSchema(): array;
}
```

The `IntegrationRegistry` maps declarative action identifiers (e.g. `'slack.send_message'`, `'hubspot.create_contact'`, `'jira.sync_ticket'`) to their corresponding PHP classes. Rather than using manual instantiation (`new $class`), CoreLink resolves every strategy through Laravel's Service Container:
```php
$action = $this->container->make($class);
```
This architecture yields two immense benefits:
1. **Full Dependency Injection**: Integration strategies can inject HTTP clients (`Illuminate\Http\Client\Factory`), loggers, database repositories, or rate limiters directly into their constructors.
2. **Runtime Extensibility**: Adding a new integration (e.g., Salesforce, SendGrid, or Linear) requires zero modifications to `WorkflowEngine` or `ExecuteWorkflowStep`. Developers simply create a new class decorated with the `#[AsAction]` attribute, and it is immediately available for workflows.

### 2.4 Modern Laravel 11 & PHP 8.2+ Architecture
- **PHP 8.2+ Native Attributes**:
  - `#[AsIntegration(id: 'slack', name: 'Slack')]`: Metadata container for third-party service suites.
  - `#[AsAction(id: 'slack.send_message', name: 'Send Slack Notification')]`: Self-documenting action strategies with validation schemas.
  - `#[AsTrigger(id: 'stripe.payment_success', name: 'Stripe Payment Success', route: '/hooks/stripe')]`: Declarative trigger routes.
- **Backed Enums**: `WorkflowStatus`, `StepStatus`, and `TriggerType` enforce strict state guarantees with custom helper methods for ANSI/Termwind color mapping (`status->colorClass()`, `status->badge()`).
- **Readonly DTOs**: `Payload`, `ActionResult`, and `InterpolationTrace` leverage PHP 8.2 `readonly class` syntax, ensuring immutability across queue workers.

---

## 3. Terminal UI Architecture (`TermwindMonitorRenderer`)

The monitoring daemon (`php artisan corelink:monitor`) functions as an `htop`-style live operational dashboard. It polls SQLite/Redis state, recalculates uptime and throughput metrics, and streams updates using ANSI terminal repositioning (`\033[2J\033[H`).

The rendering layer (`TermwindMonitorRenderer`) generates responsive CLI layouts using Laravel Termwind:
1. **Header Zone**: CoreLink version, active engine driver (Redis Horizon / Sync), and calculated uptime.
2. **Active Triggers**: Lists currently listening Webhook endpoints, Cron schedules, and Eloquent model event listeners.
3. **Recent Executions Matrix**: Real-time status table showing workflow IDs, friendly names, mapped token summaries, and colored status badges (`[SUCCESS]`, `[FAILED] ❌`).
4. **Debug Topology Tree**: An ASCII branch diagram (`├──`, `└──`, `▼`) visualizing the active execution's runtime graph, including:
   - Inbound Trigger name
   - Payload interpolation resolution (`{{ trigger.user.name }} => "Jane Doe"`)
   - Sequential Action steps with individual execution latency timings (`0.32s`, `0.15s`)
5. **Telemetry Footer**: System health index, throughput in Zaps/min, peak RAM allocation in MB, and graceful `Ctrl+C` interrupt handling.
