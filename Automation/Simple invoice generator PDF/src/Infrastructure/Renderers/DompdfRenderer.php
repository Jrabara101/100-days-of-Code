<?php

declare(strict_types=1);

namespace InvioCLI\Infrastructure\Renderers;

use InvioCLI\Domain\Models\Invoice;
use Dompdf\Dompdf;
use Dompdf\Options;
use NumberFormatter;

class DompdfRenderer implements PdfRendererInterface
{
    public function __construct(private string $templatePath)
    {
    }

    public function render(Invoice $invoice, string $outputPath): void
    {
        $html = file_get_contents($this->templatePath);
        
        $currencySymbol = $invoice->currency->getSymbol();
        
        // Prepare replacement data
        $replacements = [
            '{{INVOICE_NUMBER}}' => htmlspecialchars($invoice->invoiceNumber),
            '{{DATE}}' => htmlspecialchars($invoice->date),
            '{{CUSTOMER_NAME}}' => htmlspecialchars($invoice->customer->name),
            '{{CUSTOMER_ID}}' => htmlspecialchars($invoice->customer->id),
            '{{CUSTOMER_ADDRESS}}' => nl2br(htmlspecialchars($invoice->customer->address)),
            '{{CUSTOMER_EMAIL}}' => htmlspecialchars($invoice->customer->email),
            '{{SUBTOTAL}}' => $this->formatCurrency($invoice->subtotalCents, $currencySymbol),
            '{{DISCOUNT_PERCENT}}' => (string) $invoice->discountPercent,
            '{{DISCOUNT}}' => $this->formatCurrency($invoice->discountCents, $currencySymbol),
            '{{TAX_BASE}}' => $this->formatCurrency($invoice->taxBaseCents, $currencySymbol),
            '{{TAX_TYPE}}' => htmlspecialchars($invoice->taxType->value),
            '{{TAX_PERCENT}}' => (string) $invoice->taxPercent,
            '{{TAX}}' => $this->formatCurrency($invoice->taxCents, $currencySymbol),
            '{{GRAND_TOTAL}}' => $this->formatCurrency($invoice->grandTotalCents, $currencySymbol),
        ];

        // Generate line items HTML
        $itemsHtml = '';
        foreach ($invoice->items as $item) {
            $unitPrice = $this->formatCurrency($item->unitPriceCents, $currencySymbol);
            $totalPrice = $this->formatCurrency($item->getTotalCents(), $currencySymbol);
            $itemsHtml .= "<tr>
                <td>" . htmlspecialchars($item->description) . "</td>
                <td style='text-align: right;'>" . $item->quantity . "</td>
                <td style='text-align: right;'>" . $unitPrice . "</td>
                <td style='text-align: right;'>" . $totalPrice . "</td>
            </tr>";
        }
        $replacements['{{LINE_ITEMS}}'] = $itemsHtml;

        $html = str_replace(array_keys($replacements), array_values($replacements), $html);

        $options = new Options();
        $options->set('defaultFont', 'Helvetica');
        $options->set('isHtml5ParserEnabled', true);
        
        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        file_put_contents($outputPath, $dompdf->output());
    }

    private function formatCurrency(int $cents, string $symbol): string
    {
        return $symbol . number_format($cents / 100, 2);
    }
}
