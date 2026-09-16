<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MonitorCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_monitor_command_runs_once_successfully(): void
    {
        $this->artisan('corelink:monitor --once')
            ->assertExitCode(0);
    }

    public function test_trigger_command_executes_successfully(): void
    {
        $this->artisan('corelink:trigger 8802 --sync')
            ->assertExitCode(0);
    }
}
