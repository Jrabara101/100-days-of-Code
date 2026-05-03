<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Crawl Depth
    |--------------------------------------------------------------------------
    | How many levels deep the crawler will follow internal links.
    | Level 0 = base URL only, Level 1 = pages linked from base, etc.
    */
    'depth' => (int) env('LINKCHECKER_DEPTH', 3),

    /*
    |--------------------------------------------------------------------------
    | HTTP Request Timeout (seconds)
    |--------------------------------------------------------------------------
    | Maximum number of seconds to wait for a response before marking a
    | link as timed out.
    */
    'timeout' => (int) env('LINKCHECKER_TIMEOUT', 10),

    /*
    |--------------------------------------------------------------------------
    | Concurrent Requests
    |--------------------------------------------------------------------------
    | Number of simultaneous HTTP requests when using async mode.
    */
    'concurrency' => (int) env('LINKCHECKER_CONCURRENCY', 5),

    /*
    |--------------------------------------------------------------------------
    | User Agent
    |--------------------------------------------------------------------------
    | The User-Agent string sent with each HTTP request.
    */
    'user_agent' => 'LaravelLinkChecker/1.0 (+https://github.com/laravel)',

    /*
    |--------------------------------------------------------------------------
    | Notification Recipients
    |--------------------------------------------------------------------------
    | Email address and/or Slack webhook URL to notify when broken links
    | are found. Set to null to disable.
    */
    'notify_email'        => env('LINKCHECKER_EMAIL', null),
    'notify_slack'        => env('LINKCHECKER_SLACK_WEBHOOK', null),

    /*
    |--------------------------------------------------------------------------
    | Ignored URL Patterns
    |--------------------------------------------------------------------------
    | Regex patterns for URLs that should be skipped entirely (e.g. mailto:,
    | tel:, javascript:, anchor-only links).
    */
    'ignored_schemes' => [
        'mailto:',
        'tel:',
        'javascript:',
        'ftp:',
        'data:',
        '#',
    ],

    /*
    |--------------------------------------------------------------------------
    | Check External Links
    |--------------------------------------------------------------------------
    | If true, external (off-domain) links will be HEAD-requested and their
    | status logged, but NOT crawled recursively.
    */
    'check_external' => true,

];
