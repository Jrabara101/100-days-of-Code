<?php

namespace App\Jobs;

use App\Models\LinkResult;
use App\Models\ScanSession;
use App\Services\LinkCheckerService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;

class CheckLinkJob implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Maximum number of attempts before marking as failed.
     */
    public int $tries = 3;

    /**
     * Number of seconds to wait before retrying after failure.
     */
    public int $backoff = 5;

    public function __construct(
        public readonly int    $scanSessionId,
        public readonly string $url,
        public readonly string $sourcePage,
        public readonly bool   $isExternal = false,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(LinkCheckerService $checker): void
    {
        $result = $checker->check($this->url);

        LinkResult::create([
            'scan_session_id' => $this->scanSessionId,
            'url'             => $this->url,
            'source_page'     => $this->sourcePage,
            'status_code'     => $result->statusCode,
            'final_url'       => $result->finalUrl,
            'error_message'   => $result->errorMessage,
            'is_broken'       => $result->isBroken,
            'is_external'     => $this->isExternal,
            'checked_at'      => now(),
        ]);
    }

    /**
     * Handle a job that has failed all retry attempts.
     */
    public function failed(\Throwable $exception): void
    {
        LinkResult::create([
            'scan_session_id' => $this->scanSessionId,
            'url'             => $this->url,
            'source_page'     => $this->sourcePage,
            'status_code'     => null,
            'final_url'       => null,
            'error_message'   => 'Job failed after max retries: ' . $exception->getMessage(),
            'is_broken'       => true,
            'is_external'     => $this->isExternal,
            'checked_at'      => now(),
        ]);
    }
}
