import React from 'react';
import { useVault } from '../../context/VaultContext';
import { Folder, UploadCloud, FileText, Shield } from 'lucide-react';

export default function BottomNav() {
  const { currentScreen, setCurrentScreen, transfers } = useVault();

  // If in camera scanner or crop review mode, bottom nav can still be accessed or user can tap back
  const activeCount = transfers.filter(t => t.status !== 'completed').length;

  const tabs = [
    {
      id: 'files',
      label: 'Files',
      icon: Folder
    },
    {
      id: 'uploads',
      label: 'Uploads',
      icon: UploadCloud,
      badge: activeCount > 0 ? activeCount : null
    },
    {
      id: 'inspector',
      label: 'Inspector',
      icon: FileText
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield
    }
  ];

  return (
    <nav className="sticky bottom-0 w-full z-40 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/20 shadow-[0_-2px_12px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around items-center h-16 px-3 max-w-lg mx-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentScreen === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentScreen(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-all rounded-xl ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-primary-container' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-secondary text-on-secondary font-mono text-[10px] leading-4 flex items-center justify-center font-bold shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-0.5 ${isActive ? 'font-semibold text-primary' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1 rounded-full bg-primary-container mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

