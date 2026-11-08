import React, { useState } from 'react';
import { 
  Award, 
  ShieldCheck, 
  Share2, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  QrCode,
  Calendar,
  Clock,
  User,
  GraduationCap
} from 'lucide-react';
import { SkillRadarChart } from '../dashboard/SkillRadarChart';
import { INITIAL_SKILL_PROFICIENCIES } from '../../data/initialUserProgress';
import { sounds } from '../../services/audioEffects';

interface VerifiableCredentialPortalProps {
  certificateId?: string;
  onBackToDashboard?: () => void;
}

export const VerifiableCredentialPortal: React.FC<VerifiableCredentialPortalProps> = ({
  certificateId = 'CERT-2026-8841',
  onBackToDashboard
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [showJsonLd, setShowJsonLd] = useState(false);

  const verificationHash = 'a7f92b4c810d5e6f3912da09c382bf2481e1948d338f01b5a610ef093a218d94';

  const handleCopyHash = () => {
    sounds.playClick();
    navigator.clipboard.writeText(verificationHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleLinkedInShare = () => {
    sounds.playSuccess();
    const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=Distributed+Systems+Architecture&organizationName=Kinesis+Active+Learning+Institute&issueYear=2026&issueMonth=11&certUrl=https://kinesis.edu/verify/${certificateId}&certId=${certificateId}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    sounds.playClick();
    window.print();
  };

  const openBadgesJsonLd = {
    "@context": "https://w3id.org/openbadges/v2",
    "type": "Assertion",
    "id": `urn:uuid:${certificateId}`,
    "recipient": {
      "type": "email",
      "identity": "scholar@kinesis.edu",
      "hashed": true
    },
    "badge": {
      "name": "Distributed Systems Architecture & High-Availability Consensus Mastery",
      "description": "Demonstrated mastery of Paxos, Raft leader election, WAL replication, and split-brain resolution.",
      "image": "https://kinesis.edu/badges/dist-sys-mastery.png",
      "criteria": "https://kinesis.edu/criteria/dist-sys",
      "issuer": {
        "name": "Kinesis Academic Verification Authority",
        "url": "https://kinesis.edu"
      }
    },
    "verification": {
      "type": "HostedBadge",
      "hash": verificationHash
    },
    "issuedOn": "2026-11-08T00:00:00Z"
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {onBackToDashboard && (
          <button
            onClick={() => { sounds.playClick(); onBackToDashboard(); }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5"
          >
            ← Back to Learning Dashboard
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Cryptographically Verified Credential
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLinkedInShare}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#084e96] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Add to LinkedIn</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VERIFIABLE CERTIFICATE PRESTIGE CARD
          ========================================================================= */}
      <div className="rounded-3xl border-2 border-indigo-500/30 bg-white dark:bg-[#171B26] p-8 lg:p-12 shadow-2xl relative overflow-hidden space-y-8">
        {/* Subtle Watermark Emblem Background */}
        <div className="absolute -top-12 -right-12 w-64 h-64 opacity-5 pointer-events-none text-indigo-500">
          <GraduationCap className="w-full h-full" />
        </div>

        {/* Certificate Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                KINESIS ACADEMIC VERIFICATION AUTHORITY
              </span>
              <p className="text-xs text-slate-500 font-mono">
                Standard of Active Recall & Practical Mastery
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono">
            <span className="text-[10px] text-slate-400 block uppercase">CREDENTIAL ID</span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{certificateId}</span>
          </div>
        </div>

        {/* Recipient & Program Statement */}
        <div className="space-y-3 text-center sm:text-left">
          <span className="text-xs font-mono uppercase text-slate-400 tracking-widest block">
            THIS IS TO OFFICIALLY ATTEST THAT
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Alex Mercer
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            has rigorously fulfilled all curriculum requirements, passed all in-video checkpoints, and successfully cleared the proctored capstone examination for:
          </p>
          <div className="pt-1">
            <span className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              Distributed Systems Architecture & High-Availability Consensus
            </span>
          </div>
        </div>

        {/* Telemetry Metrics Bento */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-surface-secondary dark:bg-[#11141C] border border-black/5 dark:border-white/5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">TOTAL STUDY TIME</span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
              <Clock className="w-4 h-4 text-indigo-500" />
              48.5 Hours
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-secondary dark:bg-[#11141C] border border-black/5 dark:border-white/5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">CAPSTONE GRADE</span>
            <span className="text-lg font-bold font-mono text-emerald-500 flex items-center gap-1.5 mt-0.5">
              <Award className="w-4 h-4" />
              94.5% (High Honors)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-secondary dark:bg-[#11141C] border border-black/5 dark:border-white/5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">ISSUE DATE</span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Nov 08, 2026
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-secondary dark:bg-[#11141C] border border-black/5 dark:border-white/5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">EXAM PROTOCOL</span>
            <span className="text-lg font-bold font-mono text-violet-500 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
              Proctored / Timed
            </span>
          </div>
        </div>

        {/* Embedded Skill Competency Radar Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
          <div className="md:col-span-6">
            <SkillRadarChart skills={INITIAL_SKILL_PROFICIENCIES} />
          </div>

          <div className="md:col-span-6 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Verified Skill Axis Proficiencies:
            </h4>
            <div className="space-y-2">
              {INITIAL_SKILL_PROFICIENCIES.map(s => (
                <div key={s.skillAxis} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300">{s.skillAxis}</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{s.scorePercent}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${s.scorePercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cryptographic SHA-256 Hash Verification Footprint */}
        <div className="p-4 rounded-2xl bg-surface-secondary dark:bg-[#11141C] border border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              CRYPTOGRAPHIC INTEGRITY HASH (SHA-256)
            </span>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all select-all">
              {verificationHash}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyHash}
              className="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-mono flex items-center gap-1.5"
            >
              {copiedHash ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Hash</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setShowJsonLd(!showJsonLd);
              }}
              className="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-mono text-indigo-500"
            >
              OpenBadges JSON-LD
            </button>
          </div>
        </div>

        {/* OpenBadges JSON-LD Drawer */}
        {showJsonLd && (
          <div className="rounded-2xl bg-black p-4 border border-white/10 text-xs font-mono text-emerald-400 overflow-x-auto space-y-2">
            <div className="text-[10px] text-slate-400">OpenBadges 3.0 Machine-Readable Assertion:</div>
            <pre className="whitespace-pre">{JSON.stringify(openBadgesJsonLd, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

