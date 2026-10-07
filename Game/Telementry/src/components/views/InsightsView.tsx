import React from 'react';
import { InsightRule } from '../../types/telemetry';
import { 
  Lightbulb, 
  SunMedium, 
  ShieldAlert, 
  Crosshair, 
  Clock, 
  ExternalLink, 
  X,
  CheckCircle2,
  BrainCircuit
} from 'lucide-react';

interface InsightsViewProps {
  insights: InsightRule[];
  onDismissInsight: (id: string) => void;
  onOpenWhy: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  insights,
  onDismissInsight,
  onOpenWhy
}) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'SunMedium': return SunMedium;
      case 'ShieldAlert': return ShieldAlert;
      case 'Crosshair': return Crosshair;
      case 'Clock': return Clock;
      default: return Lightbulb;
    }
  };

  const activeInsights = insights.filter(i => !i.dismissed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-lg bg-[#0d1322] border border-cyan-500/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
            <h2 className="font-['Space_Grotesk'] text-sm font-bold text-slate-100 uppercase tracking-wider">
              Deterministic Insights Engine
            </h2>
          </div>
          <p className="font-['Inter'] text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Rule-based behavioural observations derived from your raw session logs. 
            Every observation has verifiable mathematical proof and links directly to its underlying match cluster.
          </p>
        </div>

        <div className="text-[11px] font-['JetBrains_Mono'] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30 whitespace-nowrap self-start sm:self-auto">
          ✓ Verified Telemetry Rules
        </div>
      </section>

      {/* Insights Cards Feed */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {activeInsights.map((insight) => {
          const Icon = getIcon(insight.iconName);
          const isTilt = insight.type === 'tilt_warning';

          return (
            <div
              key={insight.id}
              className={`p-5 rounded-lg border transition flex flex-col justify-between space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] ${
                isTilt
                  ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-400/50'
                  : 'bg-[#0d1322] border-[#1f293d] hover:border-cyan-400/40'
              }`}
            >
              <div>
                {/* Tag & Close */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded ${
                      isTilt ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      {insight.type.replace('_', ' ')}
                    </span>
                  </div>

                  <button
                    onClick={() => onDismissInsight(insight.id)}
                    className="text-slate-500 hover:text-slate-300 p-0.5"
                    title="Dismiss observation"
                    aria-label="Dismiss insight"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Headline */}
                <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-100 leading-snug">
                  {insight.headline}
                </h3>

                {/* Narrative */}
                <p className="font-['Inter'] text-xs text-slate-300 mt-2 leading-relaxed">
                  {insight.narrative}
                </p>

                {/* Actionable Tip */}
                <div className="mt-3 p-2.5 rounded bg-[#090d16] border border-[#1f293d] flex items-start gap-2 text-xs font-['Inter']">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">
                    <strong className="text-cyan-300 font-['Space_Grotesk']">Tactical Recommendation: </strong>
                    {insight.actionableTip}
                  </span>
                </div>
              </div>

              {/* Evidence Box & Link */}
              <div className="pt-3 border-t border-[#1a2233] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-['JetBrains_Mono']">
                <div className="space-y-0.5">
                  <span className="text-slate-500 block text-[10px]">VERIFIED EVIDENCE ({insight.evidence.timeframe}):</span>
                  <div className="text-slate-300">
                    <span className="text-cyan-300 font-bold">{insight.evidence.valueA}</span> vs <span className="text-slate-400">{insight.evidence.valueB}</span>
                  </div>
                </div>

                <button
                  onClick={onOpenWhy}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline self-start sm:self-auto"
                >
                  <span>Inspect Audit Proof</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
