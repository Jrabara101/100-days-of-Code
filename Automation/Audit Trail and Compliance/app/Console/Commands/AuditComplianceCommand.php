<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\AuditLedger;
use App\Services\Compliance\AuditComplianceService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use function Termwind\{render};

class AuditComplianceCommand extends Command
{
    protected $signature = 'audit:trail
                            {--verify : Execute cryptographic SHA-256 hash-chain verification}
                            {--tamper-test : Deliberately inject raw SQL mutation to test forensic detection}
                            {--limit=15 : Number of recent audit records to display}
                            {--standard= : Filter by compliance standard (SOC2, HIPAA, GDPR, PCI_DSS)}';

    protected $description = 'Cryptographic audit ledger verification and compliance forensic inspector';

    public function handle(AuditComplianceService $auditService): int
    {
        $this->renderHeader();

        if ($this->option('tamper-test')) {
            return $this->executeTamperTest();
        }

        if ($this->option('verify')) {
            return $this->executeVerification($auditService);
        }

        return $this->displayAuditLogGrid();
    }

    private function renderHeader(): void
    {
        render(<<<'HTML'
            <div class="mx-1 my-1 p-1">
                <div class="flex justify-between">
                    <span class="text-emerald-400 font-bold">🛡️ IMMUTABLE COMPLIANCE AUDIT VAULT</span>
                    <span class="bg-indigo-900 text-indigo-200 px-1 font-bold uppercase">SOC2 &bull; HIPAA &bull; GDPR</span>
                </div>
                <div class="text-gray-400 mt-1">
                    Integrity: <span class="text-cyan-300">Cryptographic Hash Chaining</span> | Data Guard: <span class="text-emerald-400">PII Zero-Knowledge Masking</span>
                </div>
            </div>
        HTML);
    }

    private function executeVerification(AuditComplianceService $auditService): int
    {
        $this->output->write("  <fg=cyan>⚡ Running linear cryptographic chain audit verification...</> ");
        $result = $auditService->verifyChainIntegrity();
        $this->output->writeln("<fg=green;options=bold>DONE</>\n");

        $healthStatus = $result->chainIntact
            ? '<span class="bg-emerald-600 text-white font-bold px-1">PASSED &bull; ZERO INTEGRITY TAMPERING DETECTED</span>'
            : '<span class="bg-red-600 text-white font-bold px-1">FAILED &bull; CRYPTOGRAPHIC CHAIN CORRUPTED</span>';

        render(<<<HTML
            <div class="my-1 p-1 bg-gray-900">
                <div class="flex justify-between mb-1">
                    <span class="font-bold text-indigo-300">📊 AUDIT CHAIN INTEGRITY REPORT</span>
                    <div>{$healthStatus}</div>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Total Entries Verified:</span>
                    <span class="text-white font-bold">{$result->totalChecked}</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Valid Cryptographic Signatures:</span>
                    <span class="text-emerald-400 font-bold">{$result->validCount}</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Tampered / Broken Blocks:</span>
                    <span class="text-red-400 font-bold">{$result->corruptedCount}</span>
                </div>
            </div>
        HTML);

        if (!$result->chainIntact) {
            $corruptedList = implode(', #', $result->corruptedEntryIds);
            render(<<<HTML
                <div class="my-1 p-1 bg-red-900 text-red-200">
                    <span class="font-bold text-white">⚠ FORENSIC TAMPER ALERT:</span> 
                    Cryptographic signature mismatch detected at Ledger Entry ID(s): <span class="text-yellow-300 font-bold">#{$corruptedList}</span>.
                    Database modifications bypassed the application layer or corrupted the previous hash vector.
                </div>
            HTML);
            return self::FAILURE;
        }

        return self::SUCCESS;
    }

    private function displayAuditLogGrid(): int
    {
        $limit = (int) $this->option('limit');
        $query = AuditLedger::query()->latest('id');

        if ($std = $this->option('standard')) {
            $query->where('compliance_standard', 'LIKE', "%{$std}%");
        }

        $records = $query->limit($limit)->get();

        if ($records->isEmpty()) {
            render(<<<'HTML'
                <div class="my-1 mx-2 p-1 bg-blue-900 text-white font-bold">
                    ℹ No audit ledger records located matching current filter constraints.
                </div>
            HTML);
            return self::SUCCESS;
        }

        $rows = '';
        foreach ($records as $r) {
            $actionBadge = match ($r->event_action) {
                'CREATE', 'AUTH_LOGIN' => '<span class="text-emerald-400 font-bold">CREATE</span>',
                'UPDATE' => '<span class="text-yellow-400 font-bold">UPDATE</span>',
                'DELETE' => '<span class="text-red-400 font-bold">DELETE</span>',
                'EXPORT' => '<span class="text-cyan-400 font-bold">EXPORT</span>',
                default => "<span class=\"text-gray-300\">{$r->event_action}</span>",
            };

            $hashShort = substr($r->current_hash, 0, 8) . '...' . substr($r->current_hash, -6);
            $prevShort = $r->prev_hash ? substr($r->prev_hash, 0, 6) . '..' : '<span class="text-gray-500">GENESIS</span>';
            $time = $r->recorded_at->format('M d H:i:s.u');
            $actor = $r->actor_email ?? 'SYSTEM_KERNEL';

            $rows .= <<<HTML
                <tr>
                    <td class="text-gray-400">#{$r->id}</td>
                    <td class="text-white">{$time}</td>
                    <td>{$actionBadge}</td>
                    <td class="text-cyan-300">{$r->compliance_standard}</td>
                    <td class="text-gray-300">{$actor}</td>
                    <td class="text-gray-400">{$prevShort}</td>
                    <td class="text-yellow-400">{$hashShort}</td>
                </tr>
            HTML;
        }

        render(<<<HTML
            <table class="w-full my-1">
                <thead>
                    <tr class="text-gray-400">
                        <th class="text-left font-bold text-cyan-400">ID</th>
                        <th class="text-left font-bold text-cyan-400">Timestamp (UTC)</th>
                        <th class="text-left font-bold text-cyan-400">Action</th>
                        <th class="text-left font-bold text-cyan-400">Compliance</th>
                        <th class="text-left font-bold text-cyan-400">Actor Context</th>
                        <th class="text-left font-bold text-cyan-400">Prev Hash</th>
                        <th class="text-left font-bold text-cyan-400">SHA-256 Ledger Hash</th>
                    </tr>
                </thead>
                <tbody>
                    {$rows}
                </tbody>
            </table>
        HTML);

        return self::SUCCESS;
    }

    private function executeTamperTest(): int
    {
        $target = AuditLedger::query()->latest('id')->first();

        if (!$target) {
            $this->error('No audit records exist to tamper with.');
            return self::FAILURE;
        }

        $this->warn("Simulating database breach on Ledger Entry #{$target->id}...");

        // Directly mutate database record bypassing Eloquent model protection
        DB::table('audit_ledgers')->where('id', $target->id)->update([
            'payload_diff' => json_encode(['tampered_key' => 'INJECTED_UNAUTHORIZED_ALTERATION']),
        ]);

        render(<<<HTML
            <div class="my-1 p-1 bg-yellow-900 text-yellow-200">
                ✔ Simulated tampering injected into Entry #{$target->id} via raw SQL mutation.<br/>
                Run <span class="text-white font-bold">php artisan audit:trail --verify</span> to test cryptographic forensics.
            </div>
        HTML);

        return self::SUCCESS;
    }
}
