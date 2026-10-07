import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Search,
} from "lucide-react";
import { CycleCountTask } from "@/types/inventory";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { api } from "@/lib/api";
import { soundFx } from "@/lib/audio";

interface CycleCountProps {
  tasks: CycleCountTask[];
  onAuditCompleted: () => void;
}

export function CycleCountSentry({ tasks, onAuditCompleted }: CycleCountProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [countInput, setCountInput] = useState<string>("");
  const [notesInput, setNotesInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activeTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  const pendingCount = tasks.filter((t) => t.status === "PENDING").length;
  const discrepancyCount = tasks.filter((t) => t.status === "DISCREPANCY_FLAGGED").length;

  const handleSubmitCount = async () => {
    if (!activeTask || countInput === "") return;

    try {
      setIsSubmitting(true);
      const count = Number(countInput);

      const res = await api.submitCycleCount({
        taskId: activeTask.id,
        countedQuantity: count,
        operatorId: "OP-7740",
        notes: notesInput || "Daily 5-minute spot-count micro-audit",
      });

      if (count === activeTask.expectedQuantity) {
        soundFx.playSuccessTone();
        alert(`Audit VERIFIED: Physical count (${count}) perfectly matches system ledger!`);
      } else {
        soundFx.playErrorTone();
        const delta = count - activeTask.expectedQuantity;
        alert(`Discrepancy logged: Delta of ${delta > 0 ? "+" : ""}${delta} units recorded in ledger.`);
      }

      setCountInput("");
      setNotesInput("");
      onAuditCompleted();
    } catch (err: any) {
      alert(`Error submitting count: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Sentry Micro-Audit Summary Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase block">
              DAILY 5-MIN SPOT COUNTS PENDING
            </span>
            <div className="text-xl font-bold text-amber-400 mt-1 flex items-baseline gap-2">
              <span>{pendingCount} Audits</span>
              <span className="text-xs text-amber-400/80 font-normal">High-Variance SKUs</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase block">
              FLAGGED SHRINKAGE / DISCREPANCIES
            </span>
            <div className="text-xl font-bold text-red-400 mt-1 flex items-baseline gap-2">
              <span>{discrepancyCount} Instances</span>
              <span className="text-xs text-red-500/80 font-normal">Ledger Reconciled</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase block">
              AUDIT ACCURACY CONFIDENCE
            </span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              98.4%
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              Across rolling 30-day spot audits
            </div>
          </div>
          <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Micro-Audit Floor Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Task Queue */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-300 pb-1">
            <span className="font-semibold uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Micro-Audit Queue for Today
            </span>
            <span className="text-[10px] text-zinc-400">
              Targeting highest velocity & high shrinkage-risk bins
            </span>
          </div>

          <div className="space-y-2">
            {tasks.map((t) => {
              const isSelected = activeTask?.id === t.id;
              const isPending = t.status === "PENDING";
              const isDiscrepancy = t.status === "DISCREPANCY_FLAGGED";

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTaskId(t.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-zinc-900 border-cyan-500/50 shadow-md shadow-cyan-950/20 ring-1 ring-cyan-500/40"
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-cyan-300">{t.sku}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                            isPending
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : isDiscrepancy
                              ? "bg-red-500/10 text-red-400 border-red-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <h4 className="text-xs text-zinc-200 font-sans mt-0.5">{t.title}</h4>
                      <div className="text-[10px] text-zinc-400 mt-1">
                        Location: <span className="text-zinc-200">{t.binLocation}</span> • Schedule:{" "}
                        <span className="text-zinc-300">{t.scheduledTime}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-zinc-400">Expected Qty</div>
                      <div className="text-base font-bold text-white tabular-nums">
                        {t.expectedQuantity} Units
                      </div>
                      {t.discrepancyDelta !== undefined && (
                        <div
                          className={`text-[10px] font-bold ${
                            t.discrepancyDelta < 0 ? "text-red-400" : "text-emerald-400"
                          }`}
                        >
                          Delta: {t.discrepancyDelta > 0 ? "+" : ""}
                          {t.discrepancyDelta}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 mt-2 border-t border-zinc-800/80">
                    <span>Statistical Interval: {t.varianceConfidenceInterval}</span>
                    <span className="text-cyan-400 flex items-center gap-1">
                      Execute Count <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spot Count Input Terminal */}
        {activeTask && (
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-4 shadow-xl">
            <div className="border-b border-zinc-800 pb-3">
              <span className="text-[10px] text-zinc-400 uppercase block">
                ACTIVE AUDIT TERMINAL
              </span>
              <h3 className="text-sm font-bold text-white mt-1">{activeTask.sku}</h3>
              <p className="text-xs text-zinc-400">{activeTask.title}</p>
              <div className="mt-2 text-xs text-cyan-300 font-bold bg-cyan-950/30 border border-cyan-500/20 p-2 rounded">
                Target Bin: {activeTask.binLocation}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">
                  SYSTEM EXPECTED BALANCE:
                </label>
                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-sm font-bold text-zinc-200">
                  {activeTask.expectedQuantity} Units
                </div>
              </div>

              <div>
                <label className="text-[10px] text-cyan-400 font-bold block mb-1">
                  PHYSICAL COUNTED QUANTITY:
                </label>
                <Input
                  type="number"
                  value={countInput}
                  onChange={(e) => setCountInput(e.target.value)}
                  placeholder="Enter actual units in bin..."
                  className="h-9 text-sm font-bold text-cyan-300 bg-zinc-900 border-cyan-500/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">
                  AUDIT NOTES / OBSERVATIONS:
                </label>
                <Input
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Broken packaging, mislabeled carton..."
                  className="h-8 text-xs"
                />
              </div>

              {countInput !== "" && (
                <div className="p-2.5 rounded bg-zinc-900/80 border border-zinc-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">DISCREPANCY DELTA:</span>
                    <span
                      className={`font-bold ${
                        Number(countInput) === activeTask.expectedQuantity
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {Number(countInput) - activeTask.expectedQuantity > 0 ? "+" : ""}
                      {Number(countInput) - activeTask.expectedQuantity} Units
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSubmitCount}
                disabled={isSubmitting || countInput === ""}
                variant="default"
                size="lg"
                className="w-full font-mono text-xs gap-1.5 mt-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? "Reconciling Ledger..." : "Commit Micro-Audit"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
