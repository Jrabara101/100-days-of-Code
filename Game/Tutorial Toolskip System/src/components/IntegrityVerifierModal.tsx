import React, { useState } from 'react';
import { ReplayPayload, VerificationResult } from '../types/replay';
import { verifyReplayPayload } from '../engine/DeterministicVerifier';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, RefreshCw, X, Fingerprint, Cpu } from 'lucide-react';

interface IntegrityVerifierModalProps {
  isOpen: boolean;
  payload: ReplayPayload;
  onClose: () => void;
}

export const IntegrityVerifierModal: React.FC<IntegrityVerifierModalProps> = ({
  isOpen,
  payload,
  onClose,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  if (!isOpen) return null;

  const runVerification = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      // Simulate micro-inspection delay for authentic telemetry pass
      await new Promise(r => setTimeout(r, 600));
      const res = await verifyReplayPayload(payload);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-xl bg-[#141C30] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animation-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-base text-slate-100">
                SERVER ANTI-TAMPER &amp; DESYNC VERIFIER
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Headless Deterministic Simulation &amp; Integrity Adjudication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
          {/* Metadata Overview Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">REPLAY IDENTIFIER:</span>
              <span className="text-cyan-400 font-bold truncate block">{payload.metadata.replayId}</span>
            </div>
            <div>
              <span className="text-slate-500 block">RECORDED TICKS:</span>
              <span className="text-slate-200 font-bold">{payload.metadata.totalTicks} (60Hz Canonical)</span>
            </div>
            <div>
              <span className="text-slate-500 block">AUTHOR / RUNNER:</span>
              <span className="text-slate-200">{payload.metadata.authorName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">INTEGRITY DIGEST:</span>
              <span className="text-amber-400 truncate block">
                {payload.metadata.checksum ? payload.metadata.checksum.substring(0, 20) + '...' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Action Trigger */}
          {!result && !isRunning && (
            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-800 rounded-xl gap-3 text-center">
              <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" />
              <div>
                <h4 className="font-sans font-bold text-sm text-slate-200">
                  Ready to Validate Competitive Telemetry
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Replays the deterministic input stream through the headless physics engine to verify frame boundaries, reaction limits, and state hashes.
                </p>
              </div>
              <button
                onClick={runVerification}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs tracking-wider uppercase transition-colors shadow-lg shadow-emerald-600/30"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Run Deterministic Audit</span>
              </button>
            </div>
          )}

          {/* Running Spinner */}
          {isRunning && (
            <div className="flex flex-col items-center justify-center p-8 gap-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <span className="text-xs font-mono text-emerald-300">
                HEADLESS SIMULATION EXECUTING ACROSS {payload.metadata.totalTicks} TICKS...
              </span>
            </div>
          )}

          {/* Verification Results Feed */}
          {result && (
            <div className="flex flex-col gap-4 animation-fade-in">
              {/* Verdict Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  result.valid
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    : 'bg-rose-950/60 border-rose-500/60 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                }`}
              >
                {result.valid ? (
                  <ShieldCheck className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                ) : (
                  <ShieldAlert className="w-8 h-8 text-rose-400 flex-shrink-0" />
                )}
                <div>
                  <h3 className="font-sans font-extrabold text-sm tracking-wide">
                    {result.valid
                      ? '100% COMPETITIVE INTEGRITY VERIFIED'
                      : 'DESYNCHRONIZATION OR TAMPER DETECTED'}
                  </h3>
                  <p className="text-xs font-mono text-slate-300 mt-0.5">
                    {result.valid
                      ? 'Replay is 100% deterministic, mathematically sound, and tournament approved.'
                      : `Physics diverged or abnormal injection flagged at Tick ${result.divergenceTick ?? 'N/A'}.`}
                  </p>
                </div>
              </div>

              {/* Step Breakdown */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 tracking-wider">
                  CANONICAL AUDIT CHECKS:
                </span>
                {result.checks.map((c, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      {c.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-200 block">{c.name}</span>
                        <span className="text-[11px] font-mono text-slate-400">{c.details}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        c.passed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {c.passed ? 'PASSED' : 'FLAGGED'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Re-run button */}
              <button
                onClick={runVerification}
                className="self-center mt-2 flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-run Audit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
