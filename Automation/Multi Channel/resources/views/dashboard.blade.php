<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enterprise Notification Center | Mission Control</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #0b0f19;
            color: #f1f5f9;
        }
        .font-mono {
            font-family: 'JetBrains Mono', monospace;
        }
        .glass-card {
            background: rgba(17, 24, 39, 0.75);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .glass-card:hover {
            border-color: rgba(99, 102, 241, 0.35);
        }
        .status-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }
    </style>
</head>
<body class="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">

    <!-- Header / Mission Control Bar -->
    <header class="border-b border-slate-800 bg-[#0c1222]/90 backdrop-blur sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center space-x-3">
                <div class="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div>
                    <div class="flex items-center space-x-2">
                        <h1 class="text-lg font-bold tracking-tight text-white">ENTERPRISE NOTIFICATION CENTER</h1>
                        <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">v2.6 SLA</span>
                    </div>
                    <p class="text-xs text-slate-400">Distributed Circuit Breakers &bull; Idempotent Outbox &bull; Dynamic Channel Escalation</p>
                </div>
            </div>

            <div class="flex items-center space-x-3">
                <form action="{{ route('circuits.reset') }}" method="POST">
                    @csrf
                    <button type="submit" class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition">
                        <svg class="w-3.5 h-3.5 mr-1.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reset Circuits
                    </button>
                </form>

                <div class="h-4 w-px bg-slate-800"></div>

                <div class="flex items-center text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
                    <span class="h-2 w-2 rounded-full bg-emerald-400 status-pulse mr-2"></span>
                    BUS RUNNING (ACTIVE)
                </div>
            </div>
        </div>
    </header>

    @if(session('status'))
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div class="p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-indigo-200 text-xs flex items-center shadow-lg">
            <svg class="w-4 h-4 mr-2 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ session('status') }}
        </div>
    </div>
    @endif

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">

        <!-- Metrics Overview Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div class="glass-card rounded-xl p-3.5 flex flex-col justify-between">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Dispatched</span>
                <span class="text-2xl font-extrabold text-white mt-1">{{ $stats['total_dispatches'] }}</span>
                <span class="text-[11px] text-slate-500 mt-1">Lifecycle audits</span>
            </div>
            <div class="glass-card rounded-xl p-3.5 flex flex-col justify-between">
                <span class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Direct Deliveries</span>
                <span class="text-2xl font-extrabold text-emerald-300 mt-1">{{ $stats['delivered'] }}</span>
                <span class="text-[11px] text-emerald-500/70 mt-1">Successful hops</span>
            </div>
            <div class="glass-card rounded-xl p-3.5 flex flex-col justify-between">
                <span class="text-xs font-semibold text-amber-400 uppercase tracking-wider">Fallback Hops</span>
                <span class="text-2xl font-extrabold text-amber-300 mt-1">{{ $stats['fallbacks'] }}</span>
                <span class="text-[11px] text-amber-500/70 mt-1">Escalated channels</span>
            </div>
            <div class="glass-card rounded-xl p-3.5 flex flex-col justify-between">
                <span class="text-xs font-semibold text-purple-400 uppercase tracking-wider">DND Suppressed</span>
                <span class="text-2xl font-extrabold text-purple-300 mt-1">{{ $stats['dnd_suppressed'] }}</span>
                <span class="text-[11px] text-purple-500/70 mt-1">Quiet-hours policy</span>
            </div>
            <div class="glass-card rounded-xl p-3.5 flex flex-col justify-between">
                <span class="text-xs font-semibold text-rose-400 uppercase tracking-wider">Circuit Bypasses</span>
                <span class="text-2xl font-extrabold text-rose-300 mt-1">{{ $stats['circuit_bypasses'] }}</span>
                <span class="text-[11px] text-rose-500/70 mt-1">0ms fast-reroute</span>
            </div>
            <div class="glass-card rounded-xl p-3.5 flex flex-col justify-between">
                <span class="text-xs font-semibold text-cyan-400 uppercase tracking-wider">SLA Delivery</span>
                @php
                    $deliveredHops = $stats['delivered'] + $stats['fallbacks'];
                    $totalValidHops = $stats['total_dispatches'] - $stats['dnd_suppressed'];
                    $sla = $totalValidHops > 0 ? round(($deliveredHops / $totalValidHops) * 100, 1) : 100.0;
                @endphp
                <span class="text-2xl font-extrabold text-cyan-300 mt-1">{{ $sla }}%</span>
                <span class="text-[11px] text-cyan-500/70 mt-1">Availability metric</span>
            </div>
        </div>

        <!-- Provider Circuit Breaker Status Cards -->
        <div>
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-2">
                    <h2 class="text-sm font-bold text-slate-200 uppercase tracking-wider">Gateway Providers &amp; Circuit Breakers</h2>
                    <span class="text-xs text-slate-500">(Threshold: 3 Fails &bull; Cooling: 60s &bull; Canary: 1 Probe)</span>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                @foreach($providers as $provider)
                @php
                    $isClosed = $provider->circuit_state === 'CLOSED';
                    $isOpen = $provider->circuit_state === 'OPEN';
                    $isHalfOpen = $provider->circuit_state === 'HALF_OPEN';

                    $badgeClass = $isClosed
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : ($isOpen ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20');
                    $dotClass = $isClosed ? 'bg-emerald-400' : ($isOpen ? 'bg-rose-500' : 'bg-amber-400');
                @endphp
                <div class="glass-card rounded-xl p-4 border border-slate-800 transition hover:shadow-lg">
                    <div class="flex items-start justify-between">
                        <div>
                            <span class="text-xs font-mono font-semibold text-slate-400">{{ $provider->code }}</span>
                            <h3 class="font-bold text-sm text-white mt-0.5">{{ $provider->name }}</h3>
                        </div>
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border {{ $badgeClass }}">
                            <span class="h-1.5 w-1.5 rounded-full {{ $dotClass }} mr-1.5"></span>
                            {{ $provider->circuit_state }}
                        </span>
                    </div>

                    <div class="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <span class="text-slate-500 block">Consecutive Fails</span>
                            <span class="font-mono font-bold {{ $provider->consecutive_failures > 0 ? 'text-rose-400' : 'text-slate-300' }}">
                                {{ $provider->consecutive_failures }} / 3
                            </span>
                        </div>
                        <div>
                            <span class="text-slate-500 block">Rate Limit</span>
                            <span class="font-mono text-slate-300">{{ $provider->rate_limit_per_minute }}/min</span>
                        </div>
                        <div class="col-span-2">
                            <span class="text-slate-500 block">Tripped At</span>
                            <span class="font-mono text-[11px] text-slate-400">
                                {{ $provider->circuit_opened_at ? $provider->circuit_opened_at->toDateTimeString() : 'N/A (Healthy)' }}
                            </span>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
        </div>

        <!-- Interactive Dispatch Terminal & Profiles -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- Trigger Form -->
            <div class="glass-card rounded-xl p-5 lg:col-span-1 flex flex-col justify-between">
                <div>
                    <div class="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-800">
                        <span class="text-indigo-400">⚡</span>
                        <h2 class="text-sm font-bold text-white uppercase tracking-wider">Test Dispatch Console</h2>
                    </div>

                    <form action="{{ route('dispatch.trigger') }}" method="POST" class="space-y-4">
                        @csrf
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Alert Priority Level</label>
                            <select name="priority" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono">
                                <option value="P0">P0 - Critical (All-Channel Fanout &bull; DND Bypass)</option>
                                <option value="P1" selected>P1 - High (Dynamic Fallback Escalation)</option>
                                <option value="P2">P2 - Normal (Preferred Channel &bull; DND Guard)</option>
                                <option value="P3">P3 - Low (Bulk Routine &bull; DND Guard)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Incident / Event Type</label>
                            <input type="text" name="type" value="CLUSTER_DOWN" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono">
                        </div>

                        <div class="flex items-center space-x-2 pt-1">
                            <input type="checkbox" name="dry_run" id="dry_run" value="1" class="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4">
                            <label for="dry_run" class="text-xs text-slate-300">Dry-Run Simulation (No database write)</label>
                        </div>

                        <button type="submit" class="w-full mt-3 py-2.5 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Trigger Ingestion Dispatch</span>
                        </button>
                    </form>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <p class="font-semibold text-slate-300 mb-1">Architecture Rules:</p>
                    <ul class="space-y-1 list-disc list-inside">
                        <li><span class="text-rose-400 font-mono">P0</span>: Simulates parallel blast to all channels.</li>
                        <li><span class="text-amber-400 font-mono">P1</span>: Marcus Brody Slack failure trips to Discord.</li>
                        <li><span class="text-purple-400 font-mono">P2/P3</span>: Elena Fisher suppressed by Tokyo quiet hours.</li>
                    </ul>
                </div>
            </div>

            <!-- Recipient Profiles -->
            <div class="glass-card rounded-xl p-5 lg:col-span-2">
                <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                    <div class="flex items-center space-x-2">
                        <span class="text-cyan-400">👥</span>
                        <h2 class="text-sm font-bold text-white uppercase tracking-wider">Subscribers &amp; Routing Profiles</h2>
                    </div>
                    <span class="text-xs text-slate-500">{{ count($subscribers) }} Registered Targets</span>
                </div>

                <div class="space-y-3">
                    @foreach($subscribers as $s)
                    <div class="bg-slate-900/60 rounded-lg p-3 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div class="space-y-0.5">
                            <div class="flex items-center space-x-2">
                                <span class="font-bold text-xs text-white">{{ $s->name }}</span>
                                <span class="text-[11px] text-slate-400 font-mono">{{ $s->timezone }}</span>
                            </div>
                            <div class="text-[11px] text-slate-400 flex flex-wrap gap-x-3">
                                <span>✉ {{ $s->email }}</span>
                                @if($s->phone) <span>📞 {{ $s->phone }}</span> @endif
                                <span>🌙 Quiet Hours: {{ sprintf('%02d:00 - %02d:00', $s->quiet_hours_start, $s->quiet_hours_end) }}</span>
                            </div>
                        </div>

                        <div class="flex items-center space-x-1 font-mono text-[11px]">
                            <span class="text-slate-500 text-[10px] uppercase font-semibold mr-1">Path:</span>
                            @foreach($s->channel_routing_priority as $idx => $channel)
                                <span class="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">{{ $channel }}</span>
                                @if(!$loop->last)
                                    <span class="text-slate-600">➔</span>
                                @endif
                            @endforeach
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>

        </div>

        <!-- Transactional Outbox History Table -->
        <div class="glass-card rounded-xl p-5">
            <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                <div class="flex items-center space-x-2">
                    <span class="text-emerald-400">📋</span>
                    <h2 class="text-sm font-bold text-white uppercase tracking-wider">Transactional Outbox &amp; Delivery Ledger</h2>
                </div>
                <span class="text-xs text-slate-400 font-mono">Latest 25 Events</span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-xs text-left">
                    <thead>
                        <tr class="text-slate-400 border-b border-slate-800 font-mono">
                            <th class="py-2.5 px-3">Event Ref / Type</th>
                            <th class="py-2.5 px-3">Recipient</th>
                            <th class="py-2.5 px-3">Provider</th>
                            <th class="py-2.5 px-3 text-right">Latency</th>
                            <th class="py-2.5 px-3">Status</th>
                            <th class="py-2.5 px-3">Details / Idempotency Key</th>
                            <th class="py-2.5 px-3 text-right">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 font-mono">
                        @forelse($recentDispatches as $item)
                        @php
                            $statusStyle = match($item->status) {
                                'DELIVERED' => 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                                'FALLBACK_RECOVERED' => 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                                'SUPPRESSED_DND' => 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                                'CIRCUIT_BYPASS' => 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                                default => 'text-slate-400 bg-slate-500/10 border-slate-500/20',
                            };
                        @endphp
                        <tr class="hover:bg-slate-800/30 transition">
                            <td class="py-2.5 px-3">
                                <div class="font-bold text-white">{{ $item->event?->reference_id ?? 'N/A' }}</div>
                                <div class="text-[10px] text-slate-400">{{ $item->event?->event_type }} ({{ $item->event?->priority }})</div>
                            </td>
                            <td class="py-2.5 px-3 font-sans font-semibold text-slate-200">
                                {{ $item->subscriber?->name ?? 'Unknown' }}
                            </td>
                            <td class="py-2.5 px-3 text-cyan-300 font-bold">
                                {{ $item->provider_code }}
                            </td>
                            <td class="py-2.5 px-3 text-right {{ $item->latency_ms > 50 ? 'text-amber-400' : 'text-slate-300' }}">
                                {{ $item->latency_ms }}ms
                            </td>
                            <td class="py-2.5 px-3">
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border {{ $statusStyle }}">
                                    {{ $item->status }}
                                </span>
                            </td>
                            <td class="py-2.5 px-3 text-[11px]">
                                @if($item->error_details)
                                    <span class="text-rose-400">{{ Str::limit($item->error_details, 40) }}</span>
                                @else
                                    <span class="text-slate-500">{{ Str::limit($item->idempotency_hash, 16) }}...</span>
                                @endif
                            </td>
                            <td class="py-2.5 px-3 text-right text-slate-400 text-[10px]">
                                {{ $item->created_at->diffForHumans() }}
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="7" class="py-8 text-center text-slate-500">
                                No dispatches recorded yet. Use the console above or run <code class="text-indigo-400">php artisan notifications:orchestrate</code>
                            </td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

    </main>

    <footer class="border-t border-slate-800/80 py-4 bg-[#080c16] text-center text-xs text-slate-500 font-mono">
        Enterprise Notification Bus &bull; Distributed Circuit Breaker Pattern &bull; Termwind Telemetry Engine
    </footer>

</body>
</html>
