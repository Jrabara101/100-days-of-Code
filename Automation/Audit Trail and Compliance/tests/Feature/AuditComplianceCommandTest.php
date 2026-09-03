<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\Compliance\AuditComplianceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditComplianceCommandTest extends TestCase
{
    use RefreshDatabase;

    private AuditComplianceService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AuditComplianceService();
    }

    public function test_it_displays_audit_grid_successfully(): void
    {
        $this->service->record('AUTH_LOGIN', 'SOC2_CC6_1', ['auth' => 'success']);
        $this->service->record('ACCESS', 'HIPAA_164_312', ['patient_id' => 999]);

        $this->artisan('audit:trail --limit=10')
            ->assertSuccessful();
    }

    public function test_it_filters_by_compliance_standard(): void
    {
        $this->service->record('AUTH_LOGIN', 'SOC2_CC6_1', ['auth' => 'success']);
        $this->service->record('ACCESS', 'HIPAA_164_312', ['patient_id' => 999]);

        $this->artisan('audit:trail --standard=HIPAA')
            ->assertSuccessful();
    }

    public function test_it_passes_verification_on_intact_ledger(): void
    {
        $this->service->record('CREATE', 'SOC2_CC6_1', ['order' => 1]);
        $this->service->record('UPDATE', 'SOC2_CC6_1', ['order' => 1, 'status' => 'APPROVED']);

        $this->artisan('audit:trail --verify')
            ->assertSuccessful();
    }

    public function test_it_simulates_tampering_and_fails_verification(): void
    {
        $this->service->record('CREATE', 'SOC2_CC6_1', ['order' => 1]);

        $this->artisan('audit:trail --tamper-test')
            ->assertSuccessful();

        $this->artisan('audit:trail --verify')
            ->assertFailed();
    }
}
