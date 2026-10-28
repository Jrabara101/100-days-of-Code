import React, { useState } from 'react';
import { BillableTimeEntry, ReimbursableExpense, InvoiceLineItem } from '../../types';
import { formatCents } from '../../utils/currency';
import { Clock, Receipt, Check, X, Plus } from 'lucide-react';

interface UnbilledTimeExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  timeEntries: BillableTimeEntry[];
  expenses: ReimbursableExpense[];
  onImportItems: (items: Omit<InvoiceLineItem, 'id' | 'invoice_id'>[]) => void;
}

export const UnbilledTimeExpenseModal: React.FC<UnbilledTimeExpenseModalProps> = ({
  isOpen,
  onClose,
  clientId,
  timeEntries,
  expenses,
  onImportItems,
}) => {
  const [selectedTimeIds, setSelectedTimeIds] = useState<string[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const clientTimes = timeEntries.filter((t) => !clientId || t.client_id === clientId);
  const clientExpenses = expenses.filter((e) => !clientId || e.client_id === clientId);

  const toggleTime = (id: string) => {
    setSelectedTimeIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleExpense = (id: string) => {
    setSelectedExpenseIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleImport = () => {
    const newItems: Omit<InvoiceLineItem, 'id' | 'invoice_id'>[] = [];

    // Import times
    for (const time of clientTimes) {
      if (selectedTimeIds.includes(time.id)) {
        newItems.push({
          title: `${time.project_name}: ${time.description}`,
          description: `Logged on ${time.date} • ${time.hours} billable hours @ ${formatCents(time.rate_cents)}/hr${time.deliverable_url ? ` • Deliverable: ${time.deliverable_url}` : ''}`,
          quantity: time.hours,
          unit_price_cents: time.rate_cents,
          tax_rate_bps: 0,
          is_optional_addon: false,
          is_addon_selected: false,
          sort_order: 10,
        });
      }
    }

    // Import expenses
    for (const exp of clientExpenses) {
      if (selectedExpenseIds.includes(exp.id)) {
        newItems.push({
          title: `Reimbursable Expense: ${exp.category}`,
          description: `${exp.description} (${exp.date})${exp.receipt_url ? ` • Receipt: ${exp.receipt_url}` : ''}`,
          quantity: 1,
          unit_price_cents: exp.amount_cents,
          tax_rate_bps: 0,
          is_optional_addon: false,
          is_addon_selected: false,
          sort_order: 20,
        });
      }
    }

    onImportItems(newItems);
    onClose();
  };

  const totalSelectedCents =
    clientTimes
      .filter((t) => selectedTimeIds.includes(t.id))
      .reduce((sum, t) => sum + Math.round(t.hours * t.rate_cents), 0) +
    clientExpenses
      .filter((e) => selectedExpenseIds.includes(e.id))
      .reduce((sum, e) => sum + e.amount_cents, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-vault-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-vault-850">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-stripe" />
            <h3 className="text-sm font-semibold text-white">Import Unbilled Time & Expenses</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Billable Hours */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Clock className="w-3.5 h-3.5 text-stripe" />
                Tracked Billable Hours ({clientTimes.length})
              </span>
              <button
                onClick={() => setSelectedTimeIds(clientTimes.map((t) => t.id))}
                className="text-stripe hover:underline text-[11px]"
              >
                Select All
              </button>
            </div>

            {clientTimes.length === 0 ? (
              <p className="text-slate-500 py-2">No unbilled hours for this client.</p>
            ) : (
              <div className="space-y-1.5">
                {clientTimes.map((t) => {
                  const isChecked = selectedTimeIds.includes(t.id);
                  const totalCents = Math.round(t.hours * t.rate_cents);
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleTime(t.id)}
                      className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-stripe/10 border-stripe/40 text-white'
                          : 'bg-vault-850/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-700 text-stripe focus:ring-0"
                        />
                        <div className="truncate">
                          <span className="font-semibold block truncate">{t.project_name}</span>
                          <span className="text-[11px] text-slate-400 block truncate">{t.description}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-semibold block">{formatCents(totalCents)}</span>
                        <span className="text-[10px] text-slate-400">{t.hours} hrs @ {formatCents(t.rate_cents)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reimbursable Expenses */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                Reimbursable Expenses ({clientExpenses.length})
              </span>
              <button
                onClick={() => setSelectedExpenseIds(clientExpenses.map((e) => e.id))}
                className="text-emerald-400 hover:underline text-[11px]"
              >
                Select All
              </button>
            </div>

            {clientExpenses.length === 0 ? (
              <p className="text-slate-500 py-2">No unbilled expenses for this client.</p>
            ) : (
              <div className="space-y-1.5">
                {clientExpenses.map((e) => {
                  const isChecked = selectedExpenseIds.includes(e.id);
                  return (
                    <div
                      key={e.id}
                      onClick={() => toggleExpense(e.id)}
                      className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                          : 'bg-vault-850/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <div className="truncate">
                          <span className="font-semibold block truncate">{e.category}</span>
                          <span className="text-[11px] text-slate-400 block truncate">{e.description}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-semibold block text-emerald-400">
                          {formatCents(e.amount_cents)}
                        </span>
                        <span className="text-[10px] text-slate-400">{e.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-vault-850 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Selected Total:{' '}
            <span className="font-mono font-bold text-white text-sm">
              {formatCents(totalSelectedCents)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedTimeIds.length === 0 && selectedExpenseIds.length === 0}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-stripe hover:bg-stripe-hover disabled:opacity-40 disabled:pointer-events-none text-white transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import to Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
