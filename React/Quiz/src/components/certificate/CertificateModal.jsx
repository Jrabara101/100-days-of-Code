import React, { useRef } from 'react';
import { Award, Download, Printer, X, ShieldCheck } from 'lucide-react';

export default function CertificateModal({
  isOpen,
  onClose,
  candidateName = 'Alex Mercer',
  quizTitle = 'Frontend Architecture Masterclass',
  score = 100,
  issuedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}) {
  const certificateRef = useRef(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const certId = 'CERT-PF-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-slide-up">
      <div className="relative w-full max-w-3xl bg-[#121418] border border-white/15 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Official Credential Verification</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Frame */}
        <div className="p-6 sm:p-10">
          <div
            ref={certificateRef}
            className="relative border-4 border-double border-amber-500/40 rounded-xl p-8 sm:p-12 bg-gradient-to-br from-[#161820] to-[#0D0E12] text-center shadow-inner overflow-hidden"
          >
            {/* Background watermark badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <Award className="w-96 h-96 text-amber-400" />
            </div>

            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 text-amber-500/60 font-serif text-lg">✦</div>
            <div className="absolute top-2 right-2 text-amber-500/60 font-serif text-lg">✦</div>
            <div className="absolute bottom-2 left-2 text-amber-500/60 font-serif text-lg">✦</div>
            <div className="absolute bottom-2 right-2 text-amber-500/60 font-serif text-lg">✦</div>

            {/* Organization Header */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs tracking-widest uppercase text-amber-400 font-bold">
                PulseFlow Academy of Engineering
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl text-white tracking-wide font-normal mb-2">
              Certificate of Mastery
            </h1>
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-6 font-mono">
              This credential certifies that
            </p>

            <div className="my-6">
              <span className="font-serif text-3xl sm:text-5xl font-bold bg-gradient-to-r from-amber-200 via-white to-amber-200 bg-clip-text text-transparent underline decoration-amber-500/40 underline-offset-8">
                {candidateName || 'Valued Candidate'}
              </span>
            </div>

            <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed mb-6">
              has successfully completed all rigorous technical evaluations for
            </p>

            <div className="inline-block px-5 py-2 rounded-full border border-brand/40 bg-brand/10 text-brand-light font-semibold text-base mb-8">
              {quizTitle}
            </div>

            {/* Score & Credential Metadata */}
            <div className="grid grid-cols-3 gap-4 border-t border-b border-white/10 py-4 max-w-lg mx-auto text-center font-mono text-xs">
              <div>
                <div className="text-slate-400">Score Achieved</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">{score}%</div>
              </div>
              <div>
                <div className="text-slate-400">Issued On</div>
                <div className="text-sm font-semibold text-white mt-1">{issuedDate}</div>
              </div>
              <div>
                <div className="text-slate-400">Credential ID</div>
                <div className="text-sm font-semibold text-amber-300 mt-1">{certId}</div>
              </div>
            </div>

            {/* Signatures & Seal */}
            <div className="mt-8 flex items-center justify-between max-w-md mx-auto pt-4">
              <div className="text-left">
                <div className="font-serif italic text-base text-slate-200">Elena Rostova</div>
                <div className="w-24 border-b border-slate-500 my-1"></div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                  Dean of Engineering
                </div>
              </div>

              <div className="w-16 h-16 rounded-full border-2 border-amber-500/40 bg-amber-500/10 flex flex-col items-center justify-center text-amber-400 shadow-lg">
                <Award className="w-6 h-6" />
                <span className="text-[8px] font-mono font-bold tracking-tighter uppercase mt-0.5">VERIFIED</span>
              </div>

              <div className="text-right">
                <div className="font-serif italic text-base text-slate-200">Marcus Sterling</div>
                <div className="w-24 border-b border-slate-500 my-1 ml-auto"></div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                  Principal Architect
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
