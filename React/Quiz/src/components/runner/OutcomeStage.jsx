import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, XCircle, RotateCcw, ArrowRight, ShieldCheck, Share2 } from 'lucide-react';
import { sound } from '../../utils/audio';
import CertificateModal from '../certificate/CertificateModal';

export default function OutcomeStage({
  survey,
  answers = {},
  totalScore = 0,
  outcome = null,
  categoryScores = {},
  onRestart,
  onExit
}) {
  const [showCertificate, setShowCertificate] = useState(false);
  const [radialProgress, setRadialProgress] = useState(0);

  const isQuiz = survey.type === 'scored_quiz';
  const isPersonality = survey.type === 'personality_assessment';
  const passingScore = survey.settings?.passing_score || 75;
  const isPassed = totalScore >= passingScore;

  // Trigger celebratory confetti and fanfare on mount
  useEffect(() => {
    sound.playCompletion();

    if (isQuiz && isPassed) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } else if (isPersonality) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.65 }
      });
    }

    // Animate radial score progress
    const timer = setTimeout(() => {
      setRadialProgress(totalScore);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  // Determine candidate name for certificate
  const candidateName = answers['q-quiz-1'] || answers['q-pmf-1'] || answers['q-lead-1'] || 'Candidate';

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-12 flex flex-col items-center text-center animate-fade-slide-up">
      {/* 1. Scored Quiz Outcome Mode */}
      {isQuiz && (
        <div className="w-full flex flex-col items-center">
          {/* Radial SVG Progress Circle */}
          <div className="relative w-44 h-44 mb-6 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-white/10"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="326.72"
                strokeDashoffset={326.72 - (326.72 * radialProgress) / 100}
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-out ${
                  isPassed ? 'text-emerald-500' : 'text-rose-500'
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-4xl font-extrabold text-white">
                {radialProgress}%
              </span>
              <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase mt-0.5">
                {isPassed ? 'Passed' : 'Needs Review'}
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 border font-mono uppercase tracking-wide shadow-sm"
            style={{
              backgroundColor: isPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              borderColor: isPassed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
              color: isPassed ? '#10B981' : '#EF4444'
            }}
          >
            {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>Passing threshold: {passingScore}%</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {outcome?.title || (isPassed ? 'Certified Master of Architecture' : 'Assessment Completed')}
          </h2>
          <p className="text-base text-slate-300 max-w-lg mb-8 leading-relaxed">
            {outcome?.description ||
              (isPassed
                ? 'Outstanding achievement! Your answers met the highest tier of architecture proficiency.'
                : 'You were close! Revisit the question breakdown below to review key concepts.')}
          </p>

          {/* Certificate Action */}
          {isPassed && (
            <div className="mb-10 flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowCertificate(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Award className="w-5 h-5" />
                <span>View Official Certificate</span>
              </button>
            </div>
          )}

          {/* Detailed Question Review Accordion */}
          <div className="w-full text-left border border-white/10 rounded-2xl bg-[#121418] p-6 mb-8">
            <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 font-bold mb-4">
              Detailed Question Analysis
            </h3>
            <div className="space-y-4">
              {survey.questions.filter(q => q.properties?.correct_answer).map((q, idx) => {
                const userAnswer = answers[q.id];
                const isCorrect = userAnswer === q.properties.correct_answer;

                return (
                  <div key={q.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-sm font-semibold text-white">
                        {idx + 1}. {q.title}
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">
                          <CheckCircle2 className="w-3 h-3" /> Correct (+{q.properties.points || 0})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30 whitespace-nowrap">
                          <XCircle className="w-3 h-3" /> Incorrect (0 pts)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>Your answer: <span className={isCorrect ? 'text-emerald-300 font-medium' : 'text-rose-300 font-medium'}>{String(userAnswer || 'Skipped')}</span></div>
                      {!isCorrect && (
                        <div>Correct answer: <span className="text-emerald-400 font-medium">{String(q.properties.correct_answer)}</span></div>
                      )}
                      {q.properties.explanation && (
                        <div className="text-slate-400 text-[11px] pt-1 italic">{q.properties.explanation}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Personality Assessment Outcome Mode */}
      {isPersonality && (
        <div className="w-full flex flex-col items-center">
          {outcome?.image_url && (
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-brand/50 shadow-glow-brand mb-6">
              <img src={outcome.image_url} alt={outcome.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-brand/20 text-brand-light border border-brand/30 mb-3">
            {outcome?.badge || 'Dominant Archetype'}
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            {outcome?.title || 'The Visionary Architect'}
          </h2>

          <p className="text-base text-slate-300 max-w-lg mb-8 leading-relaxed">
            {outcome?.description}
          </p>

          {/* Archetype Breakdown Radar/Bars */}
          <div className="w-full max-w-md border border-white/10 rounded-2xl bg-[#121418] p-5 mb-8 text-left">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-3">
              Leadership Dimension Distribution
            </h3>
            <div className="space-y-3">
              {[
                { key: 'architect', label: 'Visionary Architecture', color: 'bg-brand' },
                { key: 'coach', label: 'Empathetic Mentorship', color: 'bg-emerald-500' },
                { key: 'operator', label: 'Pragmatic Reliability', color: 'bg-cyan-500' },
                { key: 'maestro', label: 'Relentless Execution', color: 'bg-amber-500' }
              ].map(dim => {
                const rawScore = categoryScores[dim.key] || 2;
                const percentage = Math.min(100, Math.round((rawScore / 10) * 100));
                return (
                  <div key={dim.key}>
                    <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                      <span>{dim.label}</span>
                      <span className="font-mono text-slate-400">{percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${dim.color} transition-all duration-700`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. General Survey Outcome Mode */}
      {!isQuiz && !isPersonality && (
        <div className="w-full flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-brand/20 border border-brand/40 text-brand-light flex items-center justify-center mb-6 shadow-glow-brand">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {outcome?.title || 'Thank You! Submission Received'}
          </h2>
          <p className="text-base text-slate-300 max-w-lg mb-8 leading-relaxed">
            {outcome?.description || 'Your responses have been recorded and synchronized with our analytics engine.'}
          </p>
        </div>
      )}

      {/* Common Footer Actions */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
        <button
          type="button"
          onClick={onRestart}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retake Experience</span>
        </button>

        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-light text-white font-semibold text-sm transition-all shadow-glow-brand"
          >
            <span>Return to Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        candidateName={candidateName}
        quizTitle={survey.title}
        score={radialProgress}
      />
    </div>
  );
}
