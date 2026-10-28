import React, { useState } from 'react';
import { ShieldCheck, Bell, Clock, AlertTriangle, CheckCircle2, PauseCircle, Sliders } from 'lucide-react';

export const DunningRulesView: React.FC = () => {
  const [autoPauseActive, setAutoPauseActive] = useState(true);
  const [lateFeeGraceDays, setLateFeeGraceDays] = useState(5);
  const [lateFeeAmount, setLateFeeAmount] = useState(50);
  const [interestPct, setInterestPct] = useState(1.5);

  const dunningStages = [
    {
      id: 1,
      name: 'Stage 1: Gentle Heads-Up',
      trigger: '3 days before due date',
      tone: 'Helpful & collaborative',
      preview: 'Hi Sarah, just a quick reminder that invoice INV-2026-089 ($8,450.00) is coming due in 3 days. A 1-click payment link is attached below.',
      enabled: true,
    },
    {
      id: 2,
      name: 'Stage 2: Due Date Notification',
      trigger: 'On due date at 09:00 AM',
      tone: 'Clear & professional',
      preview: 'Hello Sarah, invoice INV-2026-089 is due today. You can settle in 1 click with Stripe ACH ($0 fee) or corporate card.',
      enabled: true,
    },
    {
      id: 3,
      name: 'Stage 3: Firm Follow-Up',
      trigger: '7 days overdue (Grace period ended)',
      tone: 'Firm & direct with late fee notice',
      preview: 'Sarah, invoice INV-2026-089 is now 7 days overdue. A contractual late fee of $50.00 has been accrued.',
      enabled: true,
    },
    {
      id: 4,
      name: 'Stage 4: Final Notice & Work Pause',
      trigger: '14 days overdue',
      tone: 'Formal & contractual',
      preview: 'Sarah, this is our final reminder regarding INV-2026-089. Deliverables and active development are paused until settlement.',
      enabled: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Auto-Pause Hero Card */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-vault-850 to-vault-850 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">"Zero-Awkwardness" Dunning Safeguards</h2>
            <p className="text-xs text-slate-400">
              Automated reminders automatically pause the microsecond an ACH transfer enters processing or a Stripe/PayPal payment succeeds.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoPauseActive}
              onChange={(e) => setAutoPauseActive(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-9 h-5 rounded-full transition-colors relative ${autoPauseActive ? 'bg-emerald-500' : 'bg-slate-700'}`}>
              <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 ${autoPauseActive ? 'translate-x-4' : ''}`}></div>
            </div>
            <span className="text-xs font-medium text-slate-300">Auto-Pause Active</span>
          </label>
        </div>
      </div>

      {/* Cadence Timeline */}
      <div className="p-5 rounded-xl bg-vault-850/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-stripe" />
          Automated Dunning Cadence (4-Stage Sequence)
        </h3>

        <div className="space-y-3">
          {dunningStages.map((stage) => (
            <div
              key={stage.id}
              className="p-4 rounded-lg bg-vault-900 border border-slate-800/80 hover:border-slate-700 transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-vault-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                    {stage.id}
                  </span>
                  <span className="text-xs font-semibold text-white">{stage.name}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {stage.trigger}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono bg-vault-950 p-2.5 rounded border border-slate-800/60 text-[11px]">
                "{stage.preview}"
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Late-Fee Guardrails */}
      <div className="p-5 rounded-xl bg-vault-850/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Contractual Late-Fee Accrual & Courtesy Waiver Rules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-vault-900 border border-slate-800 space-y-1.5">
            <span className="text-xs text-slate-400">Grace Period</span>
            <div className="text-lg font-bold font-mono text-white">{lateFeeGraceDays} Calendar Days</div>
            <p className="text-[11px] text-slate-500">No penalties applied during grace window.</p>
          </div>

          <div className="p-4 rounded-lg bg-vault-900 border border-slate-800 space-y-1.5">
            <span className="text-xs text-slate-400">Flat Accrual Fee</span>
            <div className="text-lg font-bold font-mono text-rose-400">${lateFeeAmount}.00 USD</div>
            <p className="text-[11px] text-slate-500">Appends as auditable line item after grace.</p>
          </div>

          <div className="p-4 rounded-lg bg-vault-900 border border-slate-800 space-y-1.5">
            <span className="text-xs text-slate-400">Monthly Interest</span>
            <div className="text-lg font-bold font-mono text-amber-400">{interestPct}% APR Equivalent</div>
            <p className="text-[11px] text-slate-500">Calculated on outstanding balance.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
