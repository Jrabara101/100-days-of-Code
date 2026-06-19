<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Trigger the cleanup pipeline sequentially at midnight every Sunday night
Schedule::command('system:cleanup')->weeklyOn(0, '00:00')->appendOutputTo(storage_path('logs/system_cleanup.log'));

