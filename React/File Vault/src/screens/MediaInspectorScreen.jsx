import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import FileViewerContainer from '../components/viewers/FileViewerContainer';
import { 
  Fingerprint, 
  Share2, 
  Download, 
  Link, 
  Copy, 
  QrCode, 
  ShieldCheck, 
  Eye, 
  Lock, 
  KeyRound, 
  Clock, 
  Check, 
  FileCheck,
  AlertCircle
} from 'lucide-react';

export default function MediaInspectorScreen() {
  const { activeInspectFile, showToast } = useVault();
  const [activeTab, setActiveTab] = useState('perms'); // 'meta' | 'perms'

  // Share permissions state
  const [publicShareEnabled, setPublicShareEnabled] = useState(activeInspectFile?.publicShare || true);
  const [accessPrivilege, setAccessPrivilege] = useState(activeInspectFile?.accessPrivilege || 'view_only');
  const [zeroLeakShield, setZeroLeakShield] = useState(true);
  const [passwordProtection, setPasswordProtection] = useState(false);
  const [passwordValue, setPasswordValue] = useState('Vault#Secure2026');
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  if (!activeInspectFile) {
    return (
      <div className="p-8 text-center text-on-surface-variant font-mono text-xs">
        No active file selected. Choose a file from the Files tab.
      </div>
    );
  }

  const shareUrl = activeInspectFile.shareUrl || `https://vault.stream/s/e${activeInspectFile.id}-blob`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    showToast('Secure zero-knowledge link copied to clipboard', 'link');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownload = () => {
    showToast(`Downloading verified decrypted copy of ${activeInspectFile.name}`, 'download');
  };

  return (
    <div className="flex flex-col w-full pb-20 px-4 sm:px-5 pt-4 gap-4 font-sans text-on-surface">
      {/* 1. Document Preview & Interactive File Viewer */}
      <div className="relative w-full bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        {/* Dynamic Reader Component (PDF / CSV / Image / Code / Video) */}
        <FileViewerContainer file={activeInspectFile} />

        {/* File Identity Card Header */}
        <div className="p-4 flex flex-col gap-2 bg-surface-container-lowest">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col min-w-0">
              <h2 className="font-display text-sm sm:text-base font-bold text-primary truncate" title={activeInspectFile.name}>
                {activeInspectFile.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-on-surface-variant font-mono flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold">
                  {activeInspectFile.typeName || 'PDF Document'}
                </span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <span>{activeInspectFile.sizeDisplay}</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <span className="text-on-tertiary-container font-semibold">
                  {activeInspectFile.securityStatus || 'Sealed & Signed'}
                </span>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low text-secondary hover:bg-surface-container transition-colors flex-shrink-0"
              title="Download Verified File"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Segmented Tab Selector */}
      <div className="w-full p-1 bg-surface-container-low rounded-xl flex items-center">
        <button
          onClick={() => setActiveTab('meta')}
          className={`flex-1 py-2 px-3 rounded-lg text-center font-display text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'meta'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <Fingerprint className="w-4 h-4" />
          <span>Metadata &amp; Integrity</span>
        </button>

        <button
          onClick={() => setActiveTab('perms')}
          className={`flex-1 py-2 px-3 rounded-lg text-center font-display text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'perms'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <Share2 className="w-4 h-4 text-secondary" />
          <span>Share Permissions</span>
        </button>
      </div>

      {/* 3. Tab Content */}
      {activeTab === 'meta' ? (
        /* Metadata & Cryptographic Integrity Panel */
        <div className="flex flex-col gap-3">
          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm flex flex-col gap-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <span className="font-display font-bold text-primary">Cryptographic Hashes</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                <ShieldCheck className="w-3 h-3" />
                Bit-Rot Verified
              </span>
            </div>

            <div>
              <span className="text-[10px] text-outline uppercase tracking-wider">SHA-256 Checksum</span>
              <p className="p-2 mt-1 rounded bg-surface-container-low font-mono text-[11px] break-all select-all text-primary font-medium">
                {activeInspectFile.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-outline uppercase tracking-wider">Cryptographic Initialization Nonce</span>
              <p className="p-2 mt-1 rounded bg-surface-container-low font-mono text-[11px] text-on-surface-variant">
                {activeInspectFile.nonce || '4A:8C:F9:01:22:EE:99:31:00:DF:14:B2'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded bg-surface-container-low">
                <span className="text-[10px] text-outline block">Cipher Suite</span>
                <span className="font-semibold text-primary">{activeInspectFile.cipher || 'AES-256-GCM'}</span>
              </div>
              <div className="p-2 rounded bg-surface-container-low">
                <span className="text-[10px] text-outline block">Key Derivation</span>
                <span className="font-semibold text-primary">Argon2id + PBKDF2</span>
              </div>
              <div className="p-2 rounded bg-surface-container-low">
                <span className="text-[10px] text-outline block">EXIF Telemetry</span>
                <span className="font-semibold text-emerald-700">Scrubbed (Zero Geotag)</span>
              </div>
              <div className="p-2 rounded bg-surface-container-low">
                <span className="text-[10px] text-outline block">Signer Module</span>
                <span className="font-semibold text-primary truncate block" title={activeInspectFile.signer}>
                  {activeInspectFile.signer || 'Key #V-8942'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Share Permissions Panel */
        <div className="flex flex-col gap-3 font-sans">
          {/* Public Share Link Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
                  <Link className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-xs sm:text-sm font-bold text-primary">
                    Public Share Link
                  </h3>
                  <p className="text-[11px] text-on-surface-variant">
                    Instant zero-knowledge external access
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <input
                type="checkbox"
                checked={publicShareEnabled}
                onChange={(e) => {
                  setPublicShareEnabled(e.target.checked);
                  showToast(e.target.checked ? 'Public link enabled' : 'Public link disabled');
                }}
                className="w-5 h-5 text-secondary rounded focus:ring-secondary cursor-pointer"
              />
            </div>

            {publicShareEnabled && (
              <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                <div className="flex-1 p-2 rounded-xl bg-surface-container-low border border-surface-container truncate text-on-surface select-all">
                  {shareUrl}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-secondary font-semibold transition-colors flex-shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setQrModalOpen(!qrModalOpen)}
                  className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high text-secondary flex items-center justify-center transition-colors flex-shrink-0"
                  title="View QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* QR Code expansion */}
            {qrModalOpen && (
              <div className="p-4 bg-surface-container-low rounded-xl flex flex-col items-center justify-center text-center gap-2 mt-1">
                <div className="w-32 h-32 bg-white p-2 rounded-xl shadow-sm border border-surface-container flex items-center justify-center">
                  {/* High visual fidelity QR Code SVG pattern */}
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <rect width="100" height="100" fill="white" />
                    <rect x="10" y="10" width="25" height="25" fill="#0b2545" />
                    <rect x="15" y="15" width="15" height="15" fill="white" />
                    <rect x="18" y="18" width="9" height="9" fill="#0b2545" />
                    <rect x="65" y="10" width="25" height="25" fill="#0b2545" />
                    <rect x="70" y="15" width="15" height="15" fill="white" />
                    <rect x="73" y="18" width="9" height="9" fill="#0b2545" />
                    <rect x="10" y="65" width="25" height="25" fill="#0b2545" />
                    <rect x="15" y="70" width="15" height="15" fill="white" />
                    <rect x="18" y="73" width="9" height="9" fill="#0b2545" />
                    <rect x="42" y="20" width="6" height="6" fill="#0b2545" />
                    <rect x="52" y="30" width="6" height="6" fill="#0b2545" />
                    <rect x="42" y="50" width="16" height="6" fill="#0b2545" />
                    <rect x="65" y="65" width="8" height="8" fill="#0b2545" />
                    <rect x="80" y="75" width="10" height="15" fill="#0b2545" />
                  </svg>
                </div>
                <p className="text-[11px] font-mono text-on-surface-variant">
                  Scan with mobile camera to view encrypted stream
                </p>
              </div>
            )}
          </div>

          {/* Access Privilege Level */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm flex flex-col gap-2.5">
            <span className="font-display text-xs font-bold text-primary uppercase tracking-wider">
              Access Privilege Level
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAccessPrivilege('view_only')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  accessPrivilege === 'view_only'
                    ? 'border-secondary bg-surface-container-low text-primary shadow-sm font-semibold'
                    : 'border-surface-container text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <Eye className="w-4 h-4 text-secondary" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs">View Only</span>
                  <span className="text-[10px] text-on-surface-variant">(Watermark)</span>
                </div>
              </button>

              <button
                onClick={() => setAccessPrivilege('allow_download')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  accessPrivilege === 'allow_download'
                    ? 'border-secondary bg-surface-container-low text-primary shadow-sm font-semibold'
                    : 'border-surface-container text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <Download className="w-4 h-4 text-secondary" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs">Allow Download</span>
                  <span className="text-[10px] text-on-surface-variant">(Full Decrypt)</span>
                </div>
              </button>
            </div>
          </div>

          {/* Security Guardrails */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-bold text-primary uppercase tracking-wider">
                Security Guardrails
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                ZERO LEAK SHIELD
              </span>
            </div>

            {/* Password Protection */}
            <div className="flex flex-col gap-2 pt-1 border-t border-surface-container">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-secondary" />
                  <span className="text-xs font-medium text-primary">Password Protection</span>
                </div>
                <input
                  type="checkbox"
                  checked={passwordProtection}
                  onChange={(e) => setPasswordProtection(e.target.checked)}
                  className="w-4 h-4 text-secondary rounded focus:ring-secondary cursor-pointer"
                />
              </label>

              {passwordProtection && (
                <div className="relative mt-1">
                  <input
                    type="text"
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-surface-container-low border border-surface-container text-xs font-mono text-primary focus:outline-none focus:border-secondary"
                  />
                </div>
              )}
            </div>

            {/* Auto-Expiry Timer */}
            <div className="flex items-center justify-between pt-2 border-t border-surface-container text-xs">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Clock className="w-4 h-4 text-secondary" />
                <span>Auto-Expiry Timer</span>
              </div>
              <select className="bg-surface-container px-2 py-1 rounded-lg text-xs font-mono text-primary border-none focus:ring-secondary">
                <option>24 Hours</option>
                <option>7 Days</option>
                <option>30 Days</option>
                <option>Never</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
