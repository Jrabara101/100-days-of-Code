<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Broken Link Checker — Scheduled Tasks
|--------------------------------------------------------------------------
|
| Runs a weekly scan of the configured base URL. Adjust the URL and
| frequency to match your needs. Requires `php artisan schedule:run`
| to be registered as a system cron:
|
|   * * * * * php /path/to/artisan schedule:run >> /dev/null 2>&1
|
*/

// Example: weekly scan with JSON report written to storage and email notification
Schedule::command(
    'links:check ' . (env('LINKCHECKER_SCHEDULE_URL', 'https://example.com'))
    . ' --report --notify'
)
    ->weekly()
    ->withoutOverlapping()
    ->onOneServer()
    ->appendOutputTo(storage_path('logs/linkchecker-schedule.log'));
