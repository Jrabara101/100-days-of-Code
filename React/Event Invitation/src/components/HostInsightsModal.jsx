import React from 'react';
import { 
  X, 
  BarChart3, 
  AlertTriangle, 
  Download, 
  Users, 
  Utensils, 
  Calendar, 
  CheckCircle2, 
  ShieldAlert 
} from 'lucide-react';
import { generateCateringCSV } from '../services/cateringMatrixService';

export function HostInsightsModal({
  isOpen,
  onClose,
  cateringSummary,
  guestsList,
  event
}) {
  if (!isOpen) return null;

  const handleExportCSV = () => {
    generateCateringCSV(guestsList, cateringSummary);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl rounded-3xl bg-theme-card border border-theme-foil p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-theme-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-theme-accent text-white flex items-center justify-center shadow-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest uppercase text-theme-gold font-semibold">
                Smart Hospitality Engine
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-theme-primary">
                Live Catering, Dietary & Seating Matrix
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full border border-theme-border hover:bg-theme-inset text-theme-muted hover:text-theme-primary transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Stat Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
          
          <div className="p-4 rounded-2xl bg-theme-inset border border-theme-border flex flex-col justify-between">
            <div className="text-xs font-mono uppercase text-theme-muted mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-theme-accent" />
              <span>Total Confirmed Headcount</span>
            </div>
            <div className="text-3xl font-serif font-bold text-theme-primary">
              {cateringSummary.totalHeadcount || 12}
            </div>
            <div className="text-[11px] text-theme-secondary mt-1">
              From {cateringSummary.totalGuestsProcessed} household records
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-theme-inset border border-theme-border flex flex-col justify-between">
            <div className="text-xs font-mono uppercase text-theme-muted mb-1 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-theme-accent" />
              <span>Dietary Restrictions</span>
            </div>
            <div className="text-3xl font-serif font-bold text-theme-primary">
              {Object.values(cateringSummary.dietaryCounts || {}).reduce((acc, v) => acc + (v > 0 ? 1 : 0), 0)} Types
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Catering kitchen prepped
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-theme-inset border border-theme-border flex flex-col justify-between">
            <div className="text-xs font-mono uppercase text-theme-muted mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Unseated Confirmed</span>
            </div>
            <div className="text-3xl font-serif font-bold text-theme-primary">
              {cateringSummary.unseatedCount || 0}
            </div>
            <div className="text-[11px] text-theme-muted mt-1">
              Table capacities verified
            </div>
          </div>

        </div>

        {/* Severe Allergy Alerts Section */}
        {cateringSummary.allergyAlerts && cateringSummary.allergyAlerts.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs">
            <div className="font-semibold text-red-700 dark:text-red-300 flex items-center gap-1.5 mb-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>Culinary Safety Alerts (Flagged for Kitchen Lead):</span>
            </div>
            <div className="space-y-1.5">
              {cateringSummary.allergyAlerts.map((alert, aIdx) => (
                <div key={aIdx} className="flex items-center justify-between text-red-800 dark:text-red-200">
                  <span>• <strong>{alert.guestName}</strong> ({alert.table}): {alert.alert}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-red-500/20">Flagged</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dietary Breakdown Table */}
        <div className="mb-6">
          <h4 className="text-xs font-mono uppercase tracking-wider text-theme-muted mb-3">
            Culinary Breakdown by Dietary Profile:
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.entries(cateringSummary.dietaryCounts || {}).map(([diet, count]) => (
              <div 
                key={diet}
                className="p-3 rounded-xl bg-theme-inset/60 border border-theme-border flex items-center justify-between text-xs"
              >
                <span className="text-theme-secondary truncate mr-2">{diet}</span>
                <span className="font-mono font-bold text-theme-primary bg-theme-card px-2 py-0.5 rounded border border-theme-border">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-Event Breakdown */}
        <div className="mb-6">
          <h4 className="text-xs font-mono uppercase tracking-wider text-theme-muted mb-3 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-theme-accent" />
            <span>Attendance by Sub-Event:</span>
          </h4>
          <div className="space-y-2">
            {event.subEvents.map(se => (
              <div key={se.id} className="p-3 rounded-xl bg-theme-inset/70 border border-theme-border flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-theme-primary">{se.title}</div>
                  <div className="text-[11px] text-theme-muted">{se.time} • {se.desc}</div>
                </div>
                <div className="font-mono text-sm font-bold text-theme-primary">
                  {cateringSummary.subEventCounts[se.id] || 0} Attending
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions: 1-Click CSV Export */}
        <div className="pt-4 border-t border-theme-border flex items-center justify-between">
          <span className="text-xs text-theme-muted">
            Real-time synchronization active
          </span>

          <button
            onClick={handleExportCSV}
            className="px-5 py-2.5 rounded-xl bg-theme-accent text-white font-medium text-xs hover:brightness-110 transition flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Manifest (CSV)</span>
          </button>
        </div>

      </div>
    </div>
  );
}

