<?php
// ============================================================
// Log Controller — Automation log viewer
// ============================================================

class LogController extends Controller
{
    public function index(): void
    {
        $logModel  = new AutomationLog();
        $logs      = $logModel->getAll(100);
        $totalRuns = $logModel->getTotalRuns();
        $lastRun   = $logModel->getLast();
        $totals    = $logModel->getTotals();

        $this->render('logs/index', compact('logs', 'totalRuns', 'lastRun', 'totals'));
    }
}
