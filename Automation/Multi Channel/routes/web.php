<?php

use Illuminate\Support\Facades\Route;
use App\Models\NotificationProvider;
use App\Models\NotificationSubscriber;
use App\Models\DispatchEvent;
use App\Models\DispatchOutbox;
use App\Services\NotificationCenter\NotificationOrchestratorService;
use App\Services\NotificationCenter\Dto\IngestedEventDto;
use Illuminate\Http\Request;

Route::get('/', function () {
    $providers = NotificationProvider::all();
    $subscribers = NotificationSubscriber::all();
    $events = DispatchEvent::with('dispatches.subscriber')->latest()->take(10)->get();
    $recentDispatches = DispatchOutbox::with(['event', 'subscriber'])->latest()->take(25)->get();

    $stats = [
        'total_dispatches' => DispatchOutbox::count(),
        'delivered' => DispatchOutbox::where('status', 'DELIVERED')->count(),
        'fallbacks' => DispatchOutbox::where('status', 'FALLBACK_RECOVERED')->count(),
        'dnd_suppressed' => DispatchOutbox::where('status', 'SUPPRESSED_DND')->count(),
        'circuit_bypasses' => DispatchOutbox::where('status', 'CIRCUIT_BYPASS')->count(),
        'failed' => DispatchOutbox::where('status', 'FAILED')->count(),
    ];

    return view('dashboard', compact('providers', 'subscribers', 'events', 'recentDispatches', 'stats'));
})->name('dashboard');

Route::post('/dispatch', function (Request $request, NotificationOrchestratorService $orchestrator) {
    $priority = $request->input('priority', 'P1');
    $type = $request->input('type', 'SECURITY_INCIDENT');
    $dryRun = (bool) $request->input('dry_run', false);

    $dto = new IngestedEventDto(
        eventType: $type,
        priority: $priority,
        referenceId: 'WEB-' . date('Ymd') . '-' . rand(1000, 9999),
        title: match ($priority) {
            'P0' => '💥 P0 OUTAGE: Production Aurora Database Master Unreachable',
            'P1' => '🚨 P1 ALERT: High Latency Ingress Spike (>1500ms) on API Gateway',
            default => 'ℹ Operational System Report Generated',
        },
        message: 'Manual or automated trigger from Notification Center Mission Control console.',
        context: ['origin' => 'Mission-Control-Web-GUI', 'triggered_at' => now()->toIso8601String()]
    );

    $receipts = $orchestrator->orchestrate($dto, $dryRun);

    return redirect()->route('dashboard')->with('status', 'Event dispatched successfully! ' . count($receipts) . ' channels evaluated.');
})->name('dispatch.trigger');

Route::post('/circuits/reset', function () {
    NotificationProvider::query()->update([
        'circuit_state' => 'CLOSED',
        'consecutive_failures' => 0,
        'circuit_opened_at' => null
    ]);

    return redirect()->route('dashboard')->with('status', 'All provider circuit breakers have been reset to CLOSED.');
})->name('circuits.reset');
