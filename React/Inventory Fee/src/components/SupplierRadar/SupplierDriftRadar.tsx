import React from "react";
import {
  Compass,
  AlertTriangle,
  TrendingUp,
  Clock,
  ShieldCheck,
  Percent,
  DollarSign,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "../ui/Button";

interface SupplierDriftProps {
  suppliers: any[];
}

export function SupplierDriftRadar({ suppliers }: SupplierDriftProps) {
  const highRiskVendors = suppliers.filter((s) => s.riskLevel === "HIGH_RISK");
  const totalAnnualCreepUSD = suppliers.reduce(
    (sum, s) => sum + (s.projectedAnnualCreepLoss || 0),
    0
  );

  return (
    <div className="space-y-4 font-mono">
      {/* Radar Executive Metric Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase block">
              TOTAL PROJECTED ANNUAL CREEP LEAKAGE
            </span>
            <div className="text-xl font-bold text-red-400 mt-1">
              {formatCurrency(totalAnnualCreepUSD)}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              Cumulative drift vs signed quotes
            </div>
          </div>
          <div className="w-9 h-9 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <TrendingUp className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase block">
              VENDORS WITH PRICE CREEP &gt; 4%
            </span>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {suppliers.filter((s) => s.priceDriftPercentage > 4).length} Suppliers
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              Audited across 30 / 90 / 365d windows
            </div>
          </div>
          <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase block">
              AVG FACILITY PUNCTUALITY SCORE
            </span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {(
                suppliers.reduce((sum, s) => sum + s.punctualityScore, 0) /
                (suppliers.length || 1)
              ).toFixed(1)}
              %
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              On-time dock delivery fulfillment
            </div>
          </div>
          <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Supplier Radar Telemetry Grid */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
        <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-zinc-100 uppercase">
              Supplier Drift & Price-Creep Audit Registry
            </h3>
          </div>
          <span className="text-[10px] text-zinc-400">
            Continuous Vendor SLA Compliance Monitor
          </span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {suppliers.map((sup) => {
            const isHighRisk = sup.riskLevel === "HIGH_RISK";
            const isModerate = sup.riskLevel === "MODERATE";

            return (
              <div
                key={sup.id}
                className="p-4 hover:bg-zinc-900/40 transition-colors space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-white">{sup.name}</span>
                      <span className="text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                        {sup.category}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
                          isHighRisk
                            ? "bg-red-500/20 text-red-300 border-red-500/40"
                            : isModerate
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        }`}
                      >
                        {sup.riskLevel}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1">
                      Lead Time: <span className="text-zinc-200">{sup.leadTimeDays} Days</span> •
                      Contract ID: <span className="text-zinc-400">{sup.id}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-zinc-400">Unit Price Drift</div>
                    <div
                      className={`text-sm font-bold flex items-center justify-end gap-1 ${
                        sup.priceDriftPercentage > 5
                          ? "text-red-400"
                          : sup.priceDriftPercentage > 0
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      <span>+{sup.priceDriftPercentage}%</span>
                      <span className="text-xs font-normal text-zinc-400">
                        ({formatCurrency(sup.contractPrice)} → {formatCurrency(sup.latestPrice)})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metrics Breakdown Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-2.5 rounded bg-zinc-900/80 border border-zinc-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">PUNCTUALITY SLA:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`font-bold ${
                          sup.punctualityScore >= 90
                            ? "text-emerald-400"
                            : sup.punctualityScore >= 80
                            ? "text-amber-400"
                            : "text-red-400"
                        }`}
                      >
                        {sup.punctualityScore}% On-Time
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 block">DAMAGED GOODS RATE:</span>
                    <span className="font-bold text-zinc-200 mt-0.5 block">
                      {sup.defectRatePercentage}% defect in dock arrivals
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 block">
                      PROJECTED ANNUAL CREEP IMPACT:
                    </span>
                    <span
                      className={`font-bold mt-0.5 block ${
                        sup.projectedAnnualCreepLoss > 5000
                          ? "text-red-400"
                          : "text-zinc-300"
                      }`}
                    >
                      {formatCurrency(sup.projectedAnnualCreepLoss)} / year
                    </span>
                  </div>
                </div>

                {/* Tactical Recommendation */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span className="text-[10px] uppercase text-cyan-400 font-semibold">
                      Recommendation:
                    </span>
                    <span className="text-zinc-300">{sup.recommendation}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs font-mono text-zinc-300 hover:text-cyan-300"
                    onClick={() =>
                      alert(
                        `Formal rate renegotiation letter drafted for ${sup.name} referencing SLA breach (${sup.priceDriftPercentage}% price creep).`
                      )
                    }
                  >
                    Draft SLA Notice
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
