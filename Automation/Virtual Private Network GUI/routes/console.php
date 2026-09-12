<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('notifications:orchestrate --priority=P3 --type=HEALTH_HEARTBEAT')
    ->everyThirtyMinutes()
    ->withoutOverlapping()
    ->onOneServer()
    ->runInBackground();
