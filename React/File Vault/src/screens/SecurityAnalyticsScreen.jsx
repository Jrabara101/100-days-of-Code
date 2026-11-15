import React from 'react';
import { useVault } from '../context/VaultContext';
import { 
  ShieldCheck, 
  RotateCw, 
  PieChart, 
  Sparkles, 
  Trash2, 
  Key, 
  Lock, 
  CheckCircle2, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Archive,
  RefreshCw
} from 'lucide-react';

export default function SecurityAnalyticsScreen() {
  const { 
    storageUsedGB, 
    totalStorageGB, 
    securityScanRunning, 
    runSecurityScan, 
    cleanVaultRunning, 
    runVaultPruning 
  } = useVault();

  const consumedPct = Math.min(100, Math.round((storageUsedGB / totalStorageGB) * 100));
  const availableGB = (totalStorageGB - storageUsedGB).toFixed(1);

  return (
    <div className="flex flex-col w-full pb-20 px-4 sm:px-5 pt-4 gap-4 font-sans text-on-surface">
      {/* 1. Top Trust Hero Card */}
      <section className="flex flex-col w-full bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 relative overflow-hidden">
        {/* Subtle Ambient Security Glow */}
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-tertiary-fixed/15 blur-2xl pointer-events-none"></div>

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            {/* Shield Badge with Pulse */}
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-tertiary-container text-tertiary-fixed shadow-inner flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-on-tertiary-container opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-on-tertiary-container border border-surface-container-lowest"></span>
              </span>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-on-tertiary-container font-semibold">
                  Active Protection
                </span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <span className="font-mono text-[10px] text-on-surface-variant font-medium">
                  HSM Enclave
                </span>
              </div>
              <h1 className="font-display text-sm sm:text-base text-primary font-bold tracking-tight truncate mt-0.5">
                Vault Status: Fully Secured
              </h1>
            </div>
          </div>

          <button
            onClick={runSecurityScan}
            disabled={securityScanRunning}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-container-low text-on-secondary-container hover:bg-surface-container transition-transform active:scale-95 flex-shrink-0"
            title="Run manual cryptographic audit"
          >
            <RefreshCw className={`w-4 h-4 ${securityScanRunning ? 'animate-spin text-secondary' : ''}`} />
          </button>
        </div>

        {/* Telemetry Status Bar */}
        <div className="flex items-center gap-2 mt-3 pt-2 bg-surface-container-low/70 rounded-xl px-3 py-2">
          <CheckCircle2 className="w-4 h-4 text-on-tertiary-container flex-shrink-0" />
          <p className="font-mono text-[11px] text-on-surface-variant flex-1 truncate">
            <span className="font-semibold text-on-surface">Zero vulnerabilities detected</span> • Audited live
          </p>
          <span className="font-mono text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-surface-container-lowest shadow-sm">
            Grade A+
          </span>
        </div>
      </section>

      {/* 2. Storage Allocation Breakdown Card */}
      <section className="flex flex-col w-full bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-secondary" />
            <h2 className="font-display text-xs sm:text-sm text-primary font-bold">
              Storage Allocation
            </h2>
          </div>
          <span className="font-mono text-xs text-on-surface-variant font-semibold">
            {storageUsedGB} GB / {totalStorageGB} GB
          </span>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="w-full flex flex-col gap-1.5 mt-1">
          <div className="w-full h-3 rounded-full bg-surface-container flex overflow-hidden p-0.5 gap-0.5">
            {/* Images: 42% */}
            <div className="h-full bg-secondary rounded-l-full transition-all duration-500" style={{ width: '42%' }} title="Images: 42%"></div>
            {/* Documents: 28% */}
            <div className="h-full bg-primary-container transition-all duration-500" style={{ width: '28%' }} title="Documents: 28%"></div>
            {/* Videos: 18% */}
            <div className="h-full bg-on-secondary-container transition-all duration-500" style={{ width: '18%' }} title="Videos: 18%"></div>
            {/* Archives: 12% */}
            <div className="h-full bg-on-primary-container rounded-r-full transition-all duration-500" style={{ width: '12%' }} title="Archives: 12%"></div>
          </div>

          <div className="flex justify-between items-center px-0.5 font-mono text-[10px]">
            <span className="text-on-surface-variant font-medium">{consumedPct}% Consumed</span>
            <span className="text-on-tertiary-container font-semibold">{availableGB} GB Available</span>
          </div>
        </div>

        {/* 4 Category Breakdown Cards */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {/* Category 1: Images */}
          <div className="p-3 bg-surface-container-low rounded-xl flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
              <span className="font-display text-xs font-bold text-primary">Images</span>
            </div>
            <div className="mt-2">
              <div className="font-mono text-xs font-bold text-primary">14.6 GB</div>
              <div className="font-mono text-[10px] text-on-surface-variant">1,420 files</div>
            </div>
          </div>

          {/* Category 2: Documents */}
          <div className="p-3 bg-surface-container-low rounded-xl flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
              <span className="font-display text-xs font-bold text-primary">Documents</span>
            </div>
            <div className="mt-2">
              <div className="font-mono text-xs font-bold text-primary">9.7 GB</div>
              <div className="font-mono text-[10px] text-on-surface-variant">340 files</div>
            </div>
          </div>

          {/* Category 3: Videos */}
          <div className="p-3 bg-surface-container-low rounded-xl flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-on-secondary-container"></span>
              <span className="font-display text-xs font-bold text-primary">Videos</span>
            </div>
            <div className="mt-2">
              <div className="font-mono text-xs font-bold text-primary">6.3 GB</div>
              <div className="font-mono text-[10px] text-on-surface-variant">48 clips</div>
            </div>
          </div>

          {/* Category 4: Archives */}
          <div className="p-3 bg-surface-container-low rounded-xl flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-on-primary-container"></span>
              <span className="font-display text-xs font-bold text-primary">Archives / Other</span>
            </div>
            <div className="mt-2">
              <div className="font-mono text-xs font-bold text-primary">4.2 GB</div>
              <div className="font-mono text-[10px] text-on-surface-variant">112 parcels</div>
            </div>
          </div>
        </div>

        {/* Vault Pruning Banner */}
        <div className="mt-3 p-3 rounded-xl bg-surface-container flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-display text-xs font-bold text-primary truncate">
                Vault Pruning Suggested
              </span>
              <span className="text-[10px] text-on-surface-variant font-mono truncate">
                1.8 GB duplicate &amp; temp chunks can be cleaned
              </span>
            </div>
          </div>

          <button
            onClick={runVaultPruning}
            disabled={cleanVaultRunning}
            className="px-3 py-1.5 rounded-lg bg-primary-container text-white font-mono text-xs font-semibold hover:bg-primary transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0 shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{cleanVaultRunning ? 'Cleaning...' : 'Clean Vault'}</span>
          </button>
        </div>
      </section>

      {/* 3. Cryptographic Envelope Master Key */}
      <section className="flex flex-col w-full bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Key className="w-4 h-4 text-secondary" />
            <h2 className="font-display text-xs sm:text-sm text-primary font-bold">
              Cryptographic Envelope
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
            Protected
          </span>
        </div>

        <div className="p-3.5 bg-surface-container-low rounded-xl flex items-center justify-between border border-surface-container">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
              <Key className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-mono text-outline uppercase tracking-wider">
                End-To-End Encryption Key
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-primary truncate">
                Master Key #V-8942
              </span>
              <span className="text-[10px] text-on-surface-variant font-mono">
                Stored in Hardware Enclave
              </span>
            </div>
          </div>

          <Lock className="w-4 h-4 text-on-tertiary-container flex-shrink-0" />
        </div>
      </section>
    </div>
  );
}
