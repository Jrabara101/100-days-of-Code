# AutomataCLI – Enterprise Modular Workflow & Automation Engine

AutomataCLI is an enterprise-grade, event-driven Business Process Automation (BPA) engine built on **Laravel 11** and **PHP 8.2+**. Functioning as a headless automation engine (similar to Zapier or n8n), AutomataCLI dynamically chains discrete tasks (Nodes), resolves dependencies via Directed Acyclic Graphs (DAG), offloads heavy workloads asynchronously to Laravel Queues (Redis/Horizon), guarantees idempotent execution with state-preserving resumption and exponential backoff, records an immutable event-sourced audit trail, and visualizes live pipeline execution using an advanced Termwind & ANSI terminal dashboard.

---

## Key Features

- **Pipeline Pattern Orchestration**: Built upon `Illuminate\Pipeline\Pipeline` to pass immutable `WorkflowContext` DTOs through dynamically resolved `NodeInterface` pipes.
- **Topological DAG Resolution**: Utilizes Kahn's algorithm in `GraphResolver` to resolve node dependencies, detect circular references, and establish linear execution pipelines.
- **Idempotency & State Resumption**: Snapshots input and output payloads at every node in `workflow_node_executions`. If a step fails, resuming the workflow skips completed steps and resumes from the exact failure point.
- **Exponential Backoff & Rate Limiting**: Automatically catches `RateLimitException`, applies exponential backoff ($delay = 2^{attempt - 1} \times retry\_after$), and retries.
- **Polymorphic Node Configurations**: Dynamic database architecture using Eloquent Polymorphic Relationships (`morphTo`) to store distinct configurations for webhooks, data extraction, PDF generation, emails, and Slack alerts.
- **Event Sourced Auditing**: Immutable `workflow_events` log storing before/after payload snapshots, payload byte deltas, and timestamped log events for time-travel debugging.
- **Live Terminal UX & Styling Engine**: Built with Termwind and ANSI escape sequences to display live DAG statuses (`[✔]`, `[⚙]`, `[✖]`), active running pointers, async worker queues, attempt counts, and scrolling live event logs.

---

## CLI Commands

### 1. Run a Workflow Pipeline
```bash
php artisan automata:run WF-992-ALPHA
```
Options:
- `--resume`: Resume an existing workflow run from the last preserved state.
- `--fail-at=NodeKey`: Inject simulated failure for testing idempotency.
- `--rate-limit-at=NodeKey`: Inject simulated rate limiting for testing exponential backoff.
- `--queue=Redis`: Label the queue driver in the dashboard.

### 2. Resume a Workflow Idempotently
```bash
php artisan automata:resume WF-992-ALPHA
```

### 3. Time-Travel Audit Trail Inspection
```bash
php artisan automata:inspect WF-992-ALPHA
```
Drill into specific nodes:
```bash
php artisan automata:inspect WF-992-ALPHA --step=ExtractCustomerDataNode
```

### 4. List All Registered Workflows & Recent Runs
```bash
php artisan automata:list
```

---

## Visual Terminal Layout

```plaintext
AutomataCLI v1.0.0  [Engine: Laravel 11 | Queue: Redis]
======================================================================
[ WORKFLOW RUN: WF-992-ALPHA ]
Trigger : Inbound Webhook (Stripe Invoice)
Payload : 14.2 KB (JSON)

[ PIPELINE EXECUTION TOPOLOGY ]

  [✔] 1. WebhookReceiverNode       (0.02s)  [Payload Validated]
   │
   ▼
  [✔] 2. ExtractCustomerDataNode   (0.14s)  [Extracted: CUST_883]
   │
   ▼
  [⚙] 3. GeneratePdfInvoiceNode    (Async)  <-- [ RUNNING ]
   │                                            Queue: high-priority
   ▼                                            Attempts: 1/3
  [ ] 4. EmailCustomerNode         (Pending)
   │
   ▼
  [ ] 5. SlackNotifyOpsNode        (Pending)

======================================================================
[ LIVE EVENT LOG ]
[14:02:11] [INFO]    Workflow initialized.
[14:02:11] [SUCCESS] Context mutated by ExtractCustomerDataNode.
[14:02:12] [QUEUE]   GeneratePdfInvoiceNode dispatched to worker...

======================================================================
Press Ctrl+C to detach UI (Workflow will continue in background)
```

---

## Architecture & Project Structure

```
app/
├── Console/Commands/
│   ├── RunWorkflowCommand.php           # automata:run
│   ├── ResumeWorkflowCommand.php        # automata:resume
│   ├── InspectWorkflowAuditCommand.php  # automata:inspect
│   └── ListWorkflowsCommand.php         # automata:list
├── DTOs/
│   ├── WorkflowPayload.php              # PHP 8.2+ readonly immutable payload
│   └── WorkflowContext.php              # PHP 8.2+ readonly pipeline context
├── Engine/
│   ├── DAG/GraphResolver.php            # Topological sort & cycle detection
│   ├── Pipeline/WorkflowPipeline.php    # Illuminate\Pipeline\Pipeline wrapper
│   └── WorkflowManager.php              # Orchestration, idempotency, retries
├── Enums/
│   ├── NodeStatus.php                   # PENDING, PROCESSING, COMPLETED, etc.
│   ├── WorkflowStatus.php               # INITIALIZED, RUNNING, COMPLETED, etc.
│   └── LogLevel.php                     # INFO, SUCCESS, QUEUE, ERROR, etc.
├── Events/
│   ├── NodeExecutionStarted.php
│   ├── NodeExecutionCompleted.php
│   └── NodeExecutionFailed.php
├── Exceptions/
│   ├── RateLimitException.php           # Triggers exponential backoff
│   └── WorkflowExecutionException.php
├── Jobs/
│   └── ExecuteAsyncNodeJob.php          # Async queue worker job
├── Models/
│   ├── Configurations/                  # Polymorphic configurations
│   │   ├── WebhookNodeConfig.php
│   │   ├── ExtractDataNodeConfig.php
│   │   ├── AsyncPdfNodeConfig.php
│   │   ├── EmailNodeConfig.php
│   │   └── SlackNodeConfig.php
│   ├── WorkflowDefinition.php
│   ├── WorkflowNode.php                 # Unified node registry with morphTo
│   ├── WorkflowRun.php
│   ├── WorkflowNodeExecution.php        # Idempotency & state snapshots
│   └── WorkflowEvent.php                # Immutable event sourcing audit log
├── Nodes/
│   ├── Contracts/
│   │   ├── NodeInterface.php            # Pipeline contract
│   │   └── AsyncNodeInterface.php       # Async queue contract
│   └── Core/
│       ├── WebhookReceiverNode.php
│       ├── ExtractCustomerDataNode.php
│       ├── GeneratePdfInvoiceNode.php   # Async queue worker node
│       ├── EmailCustomerNode.php
│       └── SlackNotifyOpsNode.php
└── Rendering/
    └── CliTopologyRenderer.php          # Termwind & ANSI live DevOps dashboard
```
