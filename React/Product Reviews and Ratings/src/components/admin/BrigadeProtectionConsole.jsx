import React, { useState } from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';
import { INITIAL_ANOMALY_SIGNALS } from '../../lib/initialData';

export function BrigadeProtectionConsole() {
  const { products, toggleVerifiedLockdown, reviews, rejectReview } = useTrustStore();

  const [activeTargetSku, setActiveTargetSku] = useState('SKU-99214'); // Ceramic Mug
  const [anomalySignals, setAnomalySignals] = useState(INITIAL_ANOMALY_SIGNALS);

  const mugProduct = products.find(p => p.sku === activeTargetSku) || products[2] || products[0];
  const isLockdown = mugProduct.isBrigadeLocked;

  // Correlated held samples from initial reviews
  const heldClusterReviews = [
    { id: '#REV-98240', rating: '★ 1.0', age: '0 d', subnet: '198.51.100.0/24', device: 'dev_9f4a1', phash: 'Match (hash #a8f2)' },
    { id: '#REV-98239', rating: '★ 1.0', age: '0 d', subnet: '198.51.100.0/24', device: 'dev_88bc2', phash: 'Match (hash #a8f2)' },
    { id: '#REV-98238', rating: '★ 1.0', age: '1 d', subnet: '203.0.113.0/24', device: 'dev_9f4a1', phash: 'None' },
    { id: '#REV-98235', rating: '★ 1.0', age: '0 d', subnet: '198.51.100.0/24', device: 'dev_71ee4', phash: 'Match (hash #a8f2)' },
    { id: '#REV-98231', rating: '★ 1.0', age: '0 d', subnet: '192.0.2.0/24', device: 'dev_9f4a1', phash: 'None' },
    { id: '#REV-98228', rating: '★ 1.0', age: '1 d', subnet: '203.0.113.0/24', device: 'dev_33ac9', phash: 'Match (hash #b410)' }
  ];

  const handleBatchRejectCluster = () => {
    if (confirm('Batch reject and quarantine all 38 bot cluster submissions for SKU-99214?')) {
      reviews
        .filter(r => r.priorityQueue === 'fraud-hold' || r.riskScore >= 70)
        .forEach(r => rejectReview(r.id, 'Bot Brigading Circuit Breaker Quarantine'));
      alert('All 38 brigaded reviews quarantined. Storefront rating protected.');
    }
  };

  return (
    <div className="flex-1 bg-surface flex flex-col p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto flex flex-col gap-6">
        {/* Header Bar */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isLockdown ? 'bg-error text-white' : 'bg-primary text-white'
            }`}>
              <span className="material-symbols-outlined text-[28px]">shield</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                  Review-Bomb &amp; Bot-Brigading Circuit Breaker
                </h1>
                <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold ${
                  isLockdown ? 'bg-error text-white animate-pulse' : 'bg-primary/10 text-primary'
                }`}>
                  {isLockdown ? 'LOCKDOWN ACTIVE' : 'MONITORING'}
                </span>
              </div>
              <p className="font-body-sm text-outline">
                Automated velocity anomaly detection, IP subnet clustering, and perceptual photo deduplication.
              </p>
            </div>
          </div>

          {/* Master Lockdown Switch */}
          <div className="flex items-center gap-4 bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
            <div className="flex flex-col">
              <span className="font-mono text-xs font-bold text-on-surface">
                Verified-Purchase Lockdown
              </span>
              <span className="font-mono text-[10px] text-outline">
                Target: {mugProduct.title}
              </span>
            </div>

            <button
              onClick={() => toggleVerifiedLockdown(mugProduct.id)}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 ${
                isLockdown
                  ? 'bg-error text-white hover:bg-error/90'
                  : 'bg-surface-container-lowest border border-outline-variant/50 text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isLockdown ? 'lock' : 'lock_open'}
              </span>
              <span>{isLockdown ? 'Disable Lockdown' : 'Engage Lockdown'}</span>
            </button>
          </div>
        </div>

        {/* 14-Day Submission Velocity Chart */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">analytics</span>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                14-Day Submission Velocity &amp; Anomaly Detection
              </h2>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-primary" />
                <span>Verified Purchases (Baseline)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-error" />
                <span>Unverified Submissions (Bot Spike)</span>
              </div>
            </div>
          </div>

          {/* SVG Velocity Chart matching Stitch prototype lines 150-189 */}
          <div className="w-full bg-surface-container-low rounded-xl p-4 overflow-x-auto border border-outline-variant/20">
            <svg viewBox="0 0 740 215" className="w-full min-w-[650px] h-48 select-none">
              {/* Baseline Grid lines */}
              <line x1="40" y1="180" x2="720" y2="180" stroke="#bccac0" strokeWidth="1" opacity="0.4" />
              <line x1="40" y1="120" x2="720" y2="120" stroke="#bccac0" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
              <line x1="40" y1="60" x2="720" y2="60" stroke="#bccac0" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />

              {/* Verified baseline bars (green) & normal unverified (small) */}
              {/* Day 1..13 */}
              <rect x="55" y="165" width="12" height="15" rx="1.5" className="fill-primary" />
              <rect x="105" y="160" width="12" height="20" rx="1.5" className="fill-primary" />
              <rect x="155" y="168" width="12" height="12" rx="1.5" className="fill-primary" />
              <rect x="205" y="162" width="12" height="18" rx="1.5" className="fill-primary" />
              <rect x="255" y="158" width="12" height="22" rx="1.5" className="fill-primary" />
              <rect x="305" y="164" width="12" height="16" rx="1.5" className="fill-primary" />
              <rect x="355" y="160" width="12" height="20" rx="1.5" className="fill-primary" />
              <rect x="405" y="166" width="12" height="14" rx="1.5" className="fill-primary" />
              <rect x="455" y="159" width="12" height="21" rx="1.5" className="fill-primary" />
              <rect x="505" y="163" width="12" height="17" rx="1.5" className="fill-primary" />
              <rect x="555" y="165" width="12" height="15" rx="1.5" className="fill-primary" />
              <rect x="605" y="167" width="12" height="13" rx="1.5" className="fill-primary" />
              <rect x="655" y="159" width="12" height="21" rx="1.5" className="fill-primary" />

              {/* Day 14 (Today - Spike Event) */}
              <rect x="690" y="163" width="12" height="17" rx="1.5" className="fill-primary" />
              {/* Spike Unverified: 38 reviews! */}
              <rect x="705" y="24" width="14" height="156" rx="1.5" className="fill-error" />

              {/* Lockdown Marker Vertical Line */}
              <line x1="685" y1="8" x2="685" y2="185" stroke="#ba1a1a" strokeWidth="1.5" strokeDasharray="3 3" />
              <rect x="575" y="10" width="105" height="20" rx="4" fill="#eae8e0" />
              <circle cx="585" cy="20" r="3.5" fill="#ba1a1a" />
              <text x="594" y="24" fill="#1b1c17" className="font-mono text-[10px] font-bold">
                Lockdown 14:20
              </text>

              <text x="712" y="16" fill="#ba1a1a" textAnchor="middle" className="font-mono text-[11px] font-bold">
                +38 Spike
              </text>

              {/* X Axis Dates */}
              <g className="fill-outline font-mono text-[10px]" textAnchor="middle">
                <text x="61" y="200">Oct 9</text>
                <text x="111" y="200">Oct 10</text>
                <text x="161" y="200">Oct 11</text>
                <text x="211" y="200">Oct 12</text>
                <text x="261" y="200">Oct 13</text>
                <text x="311" y="200">Oct 14</text>
                <text x="361" y="200">Oct 15</text>
                <text x="411" y="200">Oct 16</text>
                <text x="461" y="200">Oct 17</text>
                <text x="511" y="200">Oct 18</text>
                <text x="561" y="200">Oct 19</text>
                <text x="611" y="200">Oct 20</text>
                <text x="661" y="200">Oct 21</text>
                <text x="705" y="200" fill="#ba1a1a" className="font-bold">Today</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Bottom Split: Correlated Cluster Table & Anomaly Signals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Correlated Cluster Table (8 cols) */}
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/30 shadow-xs flex flex-col">
            <div className="p-4 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-error">hub</span>
                <span className="font-headline-sm text-sm font-bold text-on-surface">
                  Correlated Bot Cluster
                </span>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
                38 held items (showing 6 top samples)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-high text-outline uppercase tracking-wider h-9">
                    <th className="px-4 font-semibold">Review ID</th>
                    <th className="px-3 font-semibold">Rating</th>
                    <th className="px-3 font-semibold">Account age</th>
                    <th className="px-4 font-semibold">IP subnet hash</th>
                    <th className="px-4 font-semibold">Device hash</th>
                    <th className="px-4 font-semibold">Photo hash</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface divide-y divide-outline-variant/20">
                  {heldClusterReviews.map((item, idx) => (
                    <tr key={idx} className="h-10 hover:bg-surface-container-low transition-colors">
                      <td className="px-4 font-bold">{item.id}</td>
                      <td className="px-3 font-bold text-error">{item.rating}</td>
                      <td className="px-3 text-on-surface-variant">{item.age}</td>
                      <td className="px-4">
                        <span className="text-error bg-error-container/60 px-1.5 py-0.5 rounded font-medium">
                          {item.subnet}
                        </span>
                      </td>
                      <td className="px-4 text-on-surface-variant font-medium">
                        {item.device}
                      </td>
                      <td className="px-4">
                        {item.phash.includes('Match') ? (
                          <span className="text-error font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">burst_mode</span>
                            <span>{item.phash}</span>
                          </span>
                        ) : (
                          <span className="text-outline">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-between">
              <span className="font-mono text-xs text-outline">
                All 38 reviews currently held in Fraud Queue
              </span>
              <button
                onClick={handleBatchRejectCluster}
                className="px-4 py-2 bg-error hover:bg-error/90 text-white font-mono text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">gavel</span>
                <span>Batch Reject Quarantined Cluster (38)</span>
              </button>
            </div>
          </div>

          {/* Anomaly Detection Signals Card (4 cols) */}
          <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <span className="font-mono text-xs uppercase tracking-wider font-bold text-outline">
                Anomaly Detection Signals
              </span>
              <span className="px-2 py-0.5 rounded bg-error text-white font-mono text-[10px] font-bold">
                CONFIRMED
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {anomalySignals.map((sig) => (
                <div key={sig.id} className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-xs font-bold text-on-surface">
                      {sig.title}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-error">
                      {sig.metric}
                    </span>
                  </div>
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    {sig.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

