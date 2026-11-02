import React from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';

export function ModerationSidebar({ onOpenDefectRadar }) {
  const { activeQueueTab, setActiveQueueTab, queueCounts, products } = useTrustStore();

  const isBrigadeActive = products.some(p => p.isBrigadeLocked);

  const navItems = [
    {
      id: 'triage-inbox',
      label: 'Triage Inbox',
      icon: 'inbox',
      count: queueCounts['triage-inbox'],
      badgeClass: 'bg-surface-variant text-on-surface-variant'
    },
    {
      id: 'needs-redaction',
      label: 'Needs Redaction',
      icon: 'visibility_off',
      count: queueCounts['needs-redaction'],
      badgeClass: 'bg-secondary-fixed text-on-secondary-fixed font-bold'
    },
    {
      id: 'media-blur',
      label: 'Media Blur',
      icon: 'blur_on',
      count: queueCounts['media-blur'],
      badgeClass: 'bg-surface-variant text-on-surface-variant'
    },
    {
      id: 'low-star-escalations',
      label: 'Low-Star Escalations',
      icon: 'flag',
      count: queueCounts['low-star-escalations'],
      badgeClass: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'fraud-hold',
      label: 'Fraud Hold',
      icon: 'gavel',
      count: queueCounts['fraud-hold'],
      badgeClass: 'bg-error-container text-on-error-container font-bold'
    },
    {
      id: 'brigade-protection',
      label: 'Brigade Protection',
      icon: 'shield',
      count: null,
      isDot: true
    },
    {
      id: 'published',
      label: 'Published',
      icon: 'check_circle',
      count: queueCounts['published'],
      badgeClass: 'bg-surface-variant text-on-surface-variant'
    }
  ];

  return (
    <aside className="w-60 bg-surface-container-low border-r border-outline-variant/30 flex flex-col justify-between select-none shrink-0 h-[calc(100vh-56px)] sticky top-14">
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
          <span className="font-mono text-label-code-sm font-bold uppercase tracking-wider text-outline">
            Queues Taxonomy
          </span>
          <span className="font-mono text-label-code-sm text-primary font-semibold">
            6 Active
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col py-1.5">
          {navItems.map((item) => {
            const isActive = activeQueueTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveQueueTab(item.id)}
                className={`flex items-center justify-between px-4 py-2 text-left transition-colors text-body-sm font-sans ${
                  isActive
                    ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs border-l-3 border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`material-symbols-outlined text-[17px] ${isActive ? 'text-primary' : 'text-outline'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.isDot ? (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isBrigadeActive ? 'bg-error animate-pulse' : 'bg-primary'
                    }`}
                  />
                ) : (
                  item.count !== null && (
                    <span
                      className={`font-mono text-label-code-sm px-1.5 py-0.5 rounded font-medium ${
                        item.badgeClass || 'bg-surface-variant text-on-surface'
                      }`}
                    >
                      {item.count}
                    </span>
                  )
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Defect Radar Alert Widget at bottom */}
      <div className="p-3">
        <div
          onClick={onOpenDefectRadar}
          className="p-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl flex flex-col gap-1.5 shadow-xs cursor-pointer hover:border-amber-400 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider font-bold text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">radar</span>
                <span>Defect Radar</span>
              </span>
            </div>
            <span className="font-mono text-[10px] text-outline bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-semibold">
              72h Alert
            </span>
          </div>

          <p className="font-body-sm text-xs text-on-surface leading-tight font-medium">
            Wool Coat · Charcoal L — 4 mentions of "seam torn"
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20 font-mono text-[10px] text-outline">
            <span className="text-on-surface font-semibold">SKU-89211</span>
            <span className="text-primary font-bold group-hover:underline">Inspect Batch →</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

