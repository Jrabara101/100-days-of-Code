<?php

declare(strict_types=1);

namespace InvioCLI\Console;

use InvioCLI\Domain\Builders\InvoiceBuilder;
use InvioCLI\Domain\Models\Customer;
use InvioCLI\Domain\Models\LineItem;
use InvioCLI\Domain\Enums\Currency;
use InvioCLI\Domain\Enums\TaxType;
use InvioCLI\Infrastructure\Renderers\PdfRendererInterface;
use InvioCLI\UI\CliDashboard;
use RuntimeException;

class GenerateInvoiceCommand
{
    public function __construct(
        private InvoiceBuilder $builder,
        private PdfRendererInterface $renderer,
        private CliDashboard $dashboard
    ) {
    }

    public function execute(array $args): void
    {
        $startTime = microtime(true);
        $dataFile = $this->getOptionValue($args, '--data');
        $isInteractive = in_array('--interactive', $args, true);

        if ($dataFile) {
            $this->loadFromJson($dataFile);
        } elseif ($isInteractive) {
            $this->loadInteractive();
        } else {
            throw new RuntimeException("Please provide --data=payload.json or use --interactive");
        }

        $invoice = $this->builder->build();
        
        $this->dashboard->printHeader();
        $this->dashboard->printCustomerInfo($invoice);
        
        usleep(300000); // Simulate calculation time for visual effect
        $this->dashboard->printCalculationSteps($invoice);
        
        usleep(300000);
        $this->dashboard->printFinancialSummary($invoice);

        $outputPath = dirname(__DIR__, 2) . "/invoices/{$invoice->invoiceNumber}.pdf";
        if (!is_dir(dirname($outputPath))) {
            mkdir(dirname($outputPath), 0777, true);
        }

        // Simulate progress bar rendering
        for ($i = 0; $i <= 100; $i += 20) {
            $this->dashboard->renderProgressBar($i, "Compiling HTML Template...");
            usleep(100000);
        }
        $this->dashboard->renderProgressBar(100, "Done.");

        $this->renderer->render($invoice, $outputPath);

        $executionTime = microtime(true) - $startTime;
        $peakRamMb = memory_get_peak_usage(true) / 1024 / 1024;
        
        $this->dashboard->printSuccess($outputPath, $executionTime, $peakRamMb);
    }

    private function getOptionValue(array $args, string $optionName): ?string
    {
        foreach ($args as $arg) {
            if (str_starts_with($arg, $optionName . '=')) {
                return explode('=', $arg, 2)[1];
            }
        }
        return null;
    }

    private function loadFromJson(string $path): void
    {
        if (!file_exists($path)) {
            throw new RuntimeException("Data file not found: {$path}");
        }
        $json = file_get_contents($path);
        $data = json_decode($json, true, 512, JSON_THROW_ON_ERROR);

        $this->builder->setInvoiceNumber($data['invoice_number']);
        $this->builder->setDate($data['date']);
        $this->builder->setCurrency(Currency::from($data['currency']));
        
        $this->builder->setCustomer(new Customer(
            $data['customer']['id'],
            $data['customer']['name'],
            $data['customer']['address'],
            $data['customer']['email']
        ));

        foreach ($data['items'] as $item) {
            $this->builder->addItem(new LineItem(
                $item['description'],
                (int) $item['quantity'],
                (int) $item['unit_price_cents']
            ));
        }

        $this->builder->setDiscountPercent((int) $data['discount_percent']);
        $this->builder->setTax(TaxType::from($data['tax_type']), (int) $data['tax_percent']);
    }

    private function loadInteractive(): void
    {
        echo "=== Interactive Invoice Builder ===\n";
        $invoiceNumber = readline("Invoice Number (e.g. INV-2026-001): ");
        $date = readline("Date (YYYY-MM-DD): ");
        $currency = readline("Currency (USD, EUR, GBP, PHP): ");

        $this->builder->setInvoiceNumber($invoiceNumber ?: 'INV-' . time())
                      ->setDate($date ?: date('Y-m-d'))
                      ->setCurrency(Currency::from($currency ?: 'USD'));

        echo "\n-- Customer Details --\n";
        $cId = readline("Customer ID: ");
        $cName = readline("Customer Name: ");
        $cAddress = readline("Customer Address: ");
        $cEmail = readline("Customer Email: ");

        $this->builder->setCustomer(new Customer($cId, $cName, $cAddress, $cEmail));

        echo "\n-- Line Items --\n";
        while (true) {
            $desc = readline("Item Description (or 'done' to finish): ");
            if (strtolower(trim($desc)) === 'done') break;
            
            $qty = (int) readline("Quantity: ");
            $priceCents = (int) readline("Unit Price (in cents, e.g. 1000 for $10.00): ");
            
            $this->builder->addItem(new LineItem($desc, $qty, $priceCents));
        }

        echo "\n-- Discounts & Taxes --\n";
        $discount = (int) readline("Discount Percent (0-100): ");
        $taxType = readline("Tax Type (VAT, GST, NONE): ");
        $taxPercent = (int) readline("Tax Percent (0-100): ");

        $this->builder->setDiscountPercent($discount ?: 0)
                      ->setTax(TaxType::from(strtoupper($taxType ?: 'NONE')), $taxPercent ?: 0);
    }
}
