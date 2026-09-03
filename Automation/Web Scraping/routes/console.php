<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Automated Scraping Pipeline Scheduler
|--------------------------------------------------------------------------
|
| Regularly executes the enterprise scraping pipeline with rate limiting,
| cryptographic deduplication, and export generation.
|
*/
Schedule::command('scrape:pipeline --export=storage/app/daily_crawl.json')
    ->hourly()
    ->withoutOverlapping()
    ->onOneServer()
    ->runInBackground();
