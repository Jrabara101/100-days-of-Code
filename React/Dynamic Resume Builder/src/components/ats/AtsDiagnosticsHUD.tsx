import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useResumeStore } from '../../store/useResumeStore';
import { calculateAtsDiagnostics } from '../../utils/atsDiagnostics';

export const AtsDiagnosticsHUD: React.FC = () => {
  const { present, applyAutoTune, viewMode } = useResumeStore();
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const diagnostics = calculateAtsDiagnostics(present);
  const { score, rating, actionVerbCount, wordCount, targetRolePresent } = diagnostics;

  // SVG Circular Gauge calculations
  const radius = 20;
  const circumference = 2 * Math.PI * radius; // ~125.66
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const handleAutoFix = () => {
    const changesCount = applyAutoTune();
    
    // Trigger celebratory confetti burst
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.85, x: 0.8 },
      colors: ['#4edea3', '#c0c1ff', '#ffb95f'],
    });

    setFeedbackToast(
      changesCount > 0
        ? `Optimized ${changesCount} bullets with power action verbs!`
        : 'Resume already optimized with top-tier action verbs!'
    );

    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  // If in Preview mode and minimized, show tiny floating trigger
  if (viewMode === 'preview' && isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-40 bg-surface-container-high/90 backdrop-blur-xl px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 border border-outline-variant/30 text-secondary font-bold font-code-metric no-print hover:scale-105 transition-transform"
        type="button"
      >
        <span className="material-symbols-outlined text-[16px]">verified</span>
        <span>ATS {score}</span>
      </button>
    );
  }

  return (
    <aside
      aria-label="ATS Score Diagnostics"
      className="fixed bottom-6 right-10 z-40 bg-surface-container-high/95 backdrop-blur-2xl rounded-2xl p-space-md shadow-2xl flex items-center gap-space-md w-[460px] ring-1 ring-white/10 no-print transition-all"
    >
      {/* Toast Notification for Auto-Fix */}
      {feedbackToast && (
        <div className="absolute -top-12 left-0 right-0 mx-auto w-fit bg-secondary text-on-secondary px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold shadow-lg animate-bounce">
          {feedbackToast}
        </div>
      )}

      {/* Circular Progress Dial SVG */}
      <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
          <circle
            className="text-surface-container-highest"
            cx="24"
            cy="24"
            fill="none"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
          />
          <circle
            className="text-secondary transition-all duration-700 ease-out"
            cx="24"
            cy="24"
            fill="none"
            r={radius}
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            strokeWidth="4"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-title text-title font-extrabold text-on-surface leading-none">
            {score}
          </span>
          <span className="font-label-sm text-[8px] text-on-surface-variant uppercase font-bold">
            Match
          </span>
        </div>
      </div>

      {/* Diagnostic Details & Micro Metrics */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-title text-title text-on-surface font-semibold flex items-center gap-1">
            ATS Diagnostics{' '}
            <span
              className={`w-2 h-2 rounded-full ${
                score >= 80 ? 'bg-secondary' : 'bg-tertiary'
              } animate-pulse`}
            ></span>
          </span>
          <div className="flex items-center gap-1">
            <span className="font-label-sm text-label-sm text-secondary font-medium">
              {rating}
            </span>
            {viewMode === 'preview' && (
              <button
                onClick={() => setIsMinimized(true)}
                className="text-on-surface-variant hover:text-on-surface p-0.5 rounded"
                title="Minimize HUD"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">minimize</span>
              </button>
            )}
          </div>
        </div>

        {/* Badge row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-1.5 py-0.5 rounded bg-secondary-container/20 text-secondary font-code-metric text-code-metric flex items-center gap-0.5 text-[11px]">
            ✓ {actionVerbCount} Action Verbs
          </span>
          <span className="px-1.5 py-0.5 rounded bg-primary-container/20 text-primary font-code-metric text-code-metric flex items-center gap-0.5 text-[11px]">
            ✓ {wordCount} Words
          </span>
          {!targetRolePresent ? (
            <span className="px-1.5 py-0.5 rounded bg-tertiary-container/20 text-tertiary font-code-metric text-code-metric flex items-center gap-0.5 text-[11px]">
              ⚠ Target Role Missing
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-code-metric text-code-metric text-[11px]">
              ✓ Role Aligned
            </span>
          )}
        </div>
      </div>

      {/* Quick Auto-Fix Action Button */}
      <button
        onClick={handleAutoFix}
        className="shrink-0 flex items-center gap-1 bg-secondary text-on-secondary px-3 py-2 rounded-xl hover:bg-secondary-fixed transition-all font-label-md text-label-md font-bold shadow-md hover:scale-105 active:scale-95 cursor-pointer"
        type="button"
      >
        <span className="material-symbols-outlined text-[16px]">auto_fix_high</span> Auto-Fix
      </button>
    </aside>
  );
};
