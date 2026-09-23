import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';

export const ActivitySidebar: React.FC = () => {
  const { viewMode, setViewMode } = useResumeStore();

  return (
    <aside
      aria-label="Activity Sidebar"
      className="fixed left-0 top-0 h-full w-16 bg-surface-container-lowest z-50 flex flex-col items-center py-space-md justify-between shadow-[0_1px_8px_rgba(0,0,0,0.4)] no-print"
    >
      <div className="flex flex-col items-center gap-space-lg">
        {/* App Logo / Token */}
        <div 
          className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shadow-sm hover:scale-105 transition-transform cursor-pointer"
          title="The Career Engine"
        >
          <span className="material-symbols-outlined text-[22px]">token</span>
        </div>

        {/* Navigation / Mode Icons */}
        <nav className="flex flex-col items-center gap-space-xs">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              viewMode === 'split'
                ? 'bg-surface-container-highest text-primary font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
            title="Spatial Studio (Split View)"
          >
            <span className="material-symbols-outlined text-[20px]">grid_view</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('editor')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              viewMode === 'editor'
                ? 'bg-surface-container-highest text-primary font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
            title="Editor Focus Mode"
          >
            <span className="material-symbols-outlined text-[20px]">edit_note</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              viewMode === 'preview'
                ? 'bg-surface-container-highest text-primary font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
            title="Full Spatial Canvas Preview"
          >
            <span className="material-symbols-outlined text-[20px]">visibility</span>
          </button>

          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            title="Career Timeline"
          >
            <span className="material-symbols-outlined text-[20px]">timeline</span>
          </button>

          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            title="ATS Analyzer"
          >
            <span className="material-symbols-outlined text-[20px]">fact_check</span>
          </button>
        </nav>
      </div>

      {/* Bottom Profile / Settings */}
      <div className="flex flex-col items-center gap-space-sm">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          title="Studio Settings"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
        <div
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-semibold cursor-pointer shadow-md hover:ring-2 hover:ring-primary-fixed"
          title="Alexander Chen (Active Profile)"
        >
          <span className="material-symbols-outlined text-[18px]">person</span>
        </div>
      </div>
    </aside>
  );
};
