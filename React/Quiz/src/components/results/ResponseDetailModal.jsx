import React from 'react';
import { X, CheckCircle2, AlertTriangle, Monitor, Smartphone, Clock, Calendar } from 'lucide-react';

export default function ResponseDetailModal({
  response,
  questions = [],
  onClose
}) {
  if (!response) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-slide-up">
      <div className="relative w-full max-w-2xl bg-[#121418] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            {response.is_completed ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5" /> Ghost Partial (Abandoned)
              </span>
            )}
            <span className="font-mono text-xs text-slate-400">
              {response.session_token}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Strip */}
        <div className="px-6 py-3 border-b border-white/5 bg-white/[0.01] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <div className="text-slate-400">Device</div>
            <div className="text-white font-semibold flex items-center gap-1 mt-0.5 capitalize">
              {response.device === 'mobile' ? <Smartphone className="w-3.5 h-3.5 text-slate-400" /> : <Monitor className="w-3.5 h-3.5 text-slate-400" />}
              {response.device || 'desktop'}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Duration</div>
            <div className="text-white font-semibold mt-0.5">
              {response.duration_seconds ? `${response.duration_seconds}s` : 'In progress'}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Score / Grade</div>
            <div className="text-emerald-400 font-bold mt-0.5">
              {response.total_score !== undefined ? `${response.total_score}%` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Started</div>
            <div className="text-slate-200 mt-0.5">
              {response.started_at ? new Date(response.started_at).toLocaleTimeString() : 'Recent'}
            </div>
          </div>
        </div>

        {/* Answers List */}
        <div className="p-6 overflow-y-auto space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
            Recorded Question Inputs ({Object.keys(response.answers || {}).length} answered)
          </h3>

          {questions.map((q, idx) => {
            const answer = response.answers ? response.answers[q.id] : undefined;
            const isAnswered = answer !== undefined && answer !== null;
            const isLastQuestion = response.last_question_id === q.id;

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition-all ${
                  isAnswered
                    ? 'border-white/10 bg-white/[0.02]'
                    : isLastQuestion
                    ? 'border-amber-500/40 bg-amber-950/20'
                    : 'border-white/5 bg-transparent opacity-40'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-mono text-slate-400 font-semibold">
                    Q{idx + 1} • {q.type.replace('_', ' ')}
                  </span>
                  {isLastQuestion && !response.is_completed && (
                    <span className="font-mono text-[10px] text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 font-bold">
                      ⚠️ Dropped Out Here
                    </span>
                  )}
                </div>

                <div className="text-sm font-semibold text-white mb-2">
                  {q.title}
                </div>

                <div className="text-xs font-mono p-2.5 rounded-lg bg-black/40 border border-white/5">
                  {isAnswered ? (
                    <span className="text-emerald-300">
                      {typeof answer === 'object' ? JSON.stringify(answer) : String(answer)}
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">Not reached or skipped</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
