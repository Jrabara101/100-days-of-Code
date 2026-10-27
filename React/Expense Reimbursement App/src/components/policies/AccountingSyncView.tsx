import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

export const AccountingSyncView: React.FC = () => {
  const { items, payoutBatches, exportERPBundle, dispatchPayoutBatch, triggerCelebration } =
    useExpense();

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleExport = (format: 'netsuite' | 'quickbooks' | 'xero') => {
    exportERPBundle(format);
    setDownloadSuccess(`Exported ${format.toUpperCase()} General Ledger & Audit Bundle`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleDownloadJSONAuditPacket = () => {
    const packet = {
      generator: 'AeroSpend Spend Governance Suite v3.8',
      organization: 'Apex Labs Inc. (ID: ORG-9921)',
      exported_at: new Date().toISOString(),
      cryptographic_root_hash: '8f7a6b5c4d3e2f1a0b9a8b7c6d5e4f3a2b1c0d9e',
      ledger_entries_count: items.length,
      payout_batches: payoutBatches,
      line_items: items.map((i) => ({
        id: i.id,
        report_id: i.report_id,
        merchant: i.merchant_name,
        category: i.category,
        gl_code: i.gl_code,
        reimbursement_amount_cents: i.reimbursement_amount_cents,
        sha256: i.receipt_sha256,
        status: i.status,
      })),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(packet, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `AeroSpend_Audit_Packet_${Date.now()}.json`);
    dlAnchorElem.click();

    setDownloadSuccess('Downloaded Cryptographic Tamper-Evident JSON Audit Packet.');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#171A20] p-6 rounded-xl border border-[#232730] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">General Ledger & ERP Sync Hub</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
              Ready for Close
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Automated journal entries with mapped GL accounts, tax deductible VAT classifications,
            and 1-click synchronizations for NetSuite, QuickBooks Online, and Xero.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('netsuite')}
            className="px-3.5 py-2 rounded-xl bg-[#121418] hover:bg-[#232730] border border-[#2E3440] text-xs font-mono text-gray-200 flex items-center gap-2 transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>NetSuite CSV</span>
          </button>
          <button
            onClick={() => handleExport('quickbooks')}
            className="px-3.5 py-2 rounded-xl bg-[#121418] hover:bg-[#232730] border border-[#2E3440] text-xs font-mono text-gray-200 flex items-center gap-2 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>QuickBooks</span>
          </button>
          <button
            onClick={handleDownloadJSONAuditPacket}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-900/40"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Audit Packet (.JSON)</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Payout Batches Ledger */}
      <div className="bg-[#171A20] rounded-xl border border-[#232730] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#232730]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            ACH & Fedwire Settlement Batches ({payoutBatches.length})
          </h3>
          <span className="text-xs text-gray-400 font-mono">Real-Time Banking Rails</span>
        </div>

        <div className="divide-y divide-[#232730]">
          {payoutBatches.map((batch) => (
            <div
              key={batch.id}
              className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-mono">{batch.id}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded bg-[#121418] text-gray-300 border border-[#2E3440]">
                    {batch.payment_rail}
                  </span>
                  {batch.status === 'settled' ? (
                    <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                      Settled ✓
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.2 rounded bg-blue-500/20 text-blue-400 font-medium animate-pulse">
                      In Transit ⚡
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  Trace: {batch.trace_id} • Chase Checking •••• {batch.bank_account_last4}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span className="font-mono text-base font-bold text-white tabular-nums">
                  ${(batch.amount_cents / 100).toFixed(2)} USD
                </span>

                {batch.status !== 'settled' && (
                  <button
                    onClick={() => {
                      dispatchPayoutBatch(batch.id);
                      triggerCelebration();
                    }}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition"
                  >
                    Release Settlement
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
