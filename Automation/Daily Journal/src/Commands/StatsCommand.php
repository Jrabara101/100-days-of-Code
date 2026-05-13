<?php

declare(strict_types=1);

namespace ChronoVault\Commands;

use ChronoVault\Domain\Mood;
use ChronoVault\Storage\JournalRepositoryInterface;
use ChronoVault\Terminal\TerminalUI;

/**
 * StatsCommand — Renders journaling streaks and the 30-day mood ASCII chart.
 *
 * Usage: php cvault stats
 */
class StatsCommand implements CommandInterface
{
    public function __construct(
        private readonly JournalRepositoryInterface $repository,
        private readonly TerminalUI                 $ui,
    ) {}

    public function getName(): string
    {
        return 'stats';
    }

    public function getDescription(): string
    {
        return 'View journaling streaks and a 30-day mood trend chart';
    }

    public function execute(array $args): int
    {
        $allEntries = $this->repository->findAll();

        if (empty($allEntries)) {
            $this->ui->info('No data yet. Start journaling with: cvault write');
            return 0;
        }

        // ── Streak Calculation ──────────────────────────────────────────────
        // Collect all unique entry dates in ascending order.
        $dates = array_unique(array_map(fn($e) => $e->date, $allEntries));
        sort($dates);

        $currentStreak = $this->calculateCurrentStreak($dates);
        $longestStreak = $this->calculateLongestStreak($dates);

        // ── 30-Day Mood Data ─────────────────────────────────────────────────
        $thirtyDaysAgo = date('Y-m-d', strtotime('-29 days'));
        $today         = date('Y-m-d');

        $recentEntries = $this->repository->findByDateRange($thirtyDaysAgo, $today);

        // Build a date → mood score map (average if multiple entries per day).
        $moodByDate = [];
        foreach ($recentEntries as $entry) {
            if (!isset($moodByDate[$entry->date])) {
                $moodByDate[$entry->date] = [];
            }
            $moodByDate[$entry->date][] = $entry->mood->score();
        }

        // Compute average mood per day.
        $moodScores = [];
        for ($i = 0; $i < 30; $i++) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            if (isset($moodByDate[$date])) {
                $scores           = $moodByDate[$date];
                $moodScores[$date] = array_sum($scores) / count($scores);
            } else {
                $moodScores[$date] = null; // No entry that day
            }
        }
        krsort($moodScores); // Most recent first for display

        // ── Render ──────────────────────────────────────────────────────────
        $this->ui->renderStatsPanel(
            currentStreak: $currentStreak,
            longestStreak: $longestStreak,
            totalEntries:  count($allEntries),
            totalWords:    $this->repository->totalWordCount(),
            moodScores:    $moodScores,
            allEntries:    $allEntries,
        );

        return 0;
    }

    /**
     * Calculates the current writing streak (consecutive days ending today or yesterday).
     *
     * @param  string[] $sortedDates  Unique dates in ascending order (Y-m-d).
     */
    private function calculateCurrentStreak(array $sortedDates): int
    {
        if (empty($sortedDates)) {
            return 0;
        }

        $today     = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        $lastDate  = end($sortedDates);

        // Streak is broken if no entry today or yesterday.
        if ($lastDate !== $today && $lastDate !== $yesterday) {
            return 0;
        }

        $streak  = 1;
        $current = $lastDate;

        for ($i = count($sortedDates) - 2; $i >= 0; $i--) {
            $expected = date('Y-m-d', strtotime($current . ' -1 day'));
            if ($sortedDates[$i] === $expected) {
                $streak++;
                $current = $sortedDates[$i];
            } else {
                break;
            }
        }

        return $streak;
    }

    /**
     * Calculates the all-time longest consecutive writing streak.
     *
     * @param  string[] $sortedDates  Unique dates in ascending order.
     */
    private function calculateLongestStreak(array $sortedDates): int
    {
        if (empty($sortedDates)) {
            return 0;
        }

        $longest = 1;
        $current = 1;

        for ($i = 1; $i < count($sortedDates); $i++) {
            $prev     = $sortedDates[$i - 1];
            $curr     = $sortedDates[$i];
            $expected = date('Y-m-d', strtotime($prev . ' +1 day'));

            if ($curr === $expected) {
                $current++;
                $longest = max($longest, $current);
            } else {
                $current = 1;
            }
        }

        return $longest;
    }
}
