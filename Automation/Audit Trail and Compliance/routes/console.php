<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Automated Compliance Audit Integrity Verification Scheduler
|--------------------------------------------------------------------------
|
| Regularly executes the cryptographic SHA-256 hash-chain verification sweep
| to guarantee SOC2, HIPAA, and GDPR immutable audit trail integrity.
|
*/
Schedule::command('audit:trail --verify')
    ->hourly()
    ->withoutOverlapping()
    ->onOneServer()
    ->runInBackground();
