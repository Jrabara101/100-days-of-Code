import React, { useEffect, useRef } from 'react';
import {
  Gamepad2,
  Sliders,
  Volume2,
  Monitor,
  Accessibility,
  Share2,
  X,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Keyboard,
  Mouse,
  Smartphone,
} from 'lucide-react';
import { SettingsState, ControllerType, ActiveControlScheme } from '@/types/settings';
import { Button } from '@/components/ui/Button';
import { ControlsTab } from '@/components/tabs/ControlsTab';
import { GameplayTab } from '@/components/tabs/GameplayTab';
import { AudioTab } from '@/components/tabs/AudioTab';
import { VideoTab } from '@/components/tabs/VideoTab';
import { AccessibilityTab } from '@/components/tabs/AccessibilityTab';
import { ProfileSyncTab } from '@/components/tabs/ProfileSyncTab';
import { HardwareWorkbench } from '@/components/calibration/HardwareWorkbench';
import { ConflictDialog } from '@/components/controls/ConflictDialog';
import { GamepadStateSnapshot } from '@/types/settings';
import { soundEngine } from '@/services/audioService';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsState;
  activeScheme: ActiveControlScheme;
  activeGamepadName: string;
  gamepadState: GamepadStateSnapshot;
  onSimulateDevice: (scheme: ActiveControlScheme) => void;
  onSimulateStick: (x: number, y: number) => void;
  onStartListening: (actionId: string, slot: 'primary' | 'secondary') => void;
  onCancelListening: () => void;
  onConflictSwap: () => void;
  onConflictShift: () => void;
  onConflictModifier: () => void;
  onConflictOverride: () => void;
  onResetSingleAction: (actionId: string) => void;
  onResetCategory: (category: string) => void;
  onResetAll: () => void;
  onApplyPreset: (preset: any) => void;
  onSave: () => void;
  onTabChange: (tab: SettingsState['activeTab'] | 'sync') => void;
  currentTab: SettingsState['activeTab'] | 'sync';
  onUpdateGameplay: any;
  onUpdateAudio: any;
  onUpdateVideo: any;
  onUpdateAccessibility: any;
  onApplyImportedProfile: (imported: Partial<SettingsState>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  activeScheme,
  activeGamepadName,
  gamepadState,
  onSimulateDevice,
  onSimulateStick,
  onStartListening,
  onCancelListening,
  onConflictSwap,
  onConflictShift,
  onConflictModifier,
  onConflictOverride,
  onResetSingleAction,
  onResetCategory,
  onResetAll,
  onApplyPreset,
  onSave,
  onTabChange,
  currentTab,
  onUpdateGameplay,
  onUpdateAudio,
  onUpdateVideo,
  onUpdateAccessibility,
  onApplyImportedProfile,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation & ESC handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        // If listening, cancel listening
        if (settings.rebindingState.isListening) {
          onCancelListening();
          return;
        }
        // If conflict dialog open, cancel conflict
        if (settings.rebindingState.fsmState === 'CONFLICT_DETECTED') {
          onCancelListening();
          return;
        }
        // Otherwise close modal
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, settings.rebindingState, onCancelListening, onClose]);

  if (!isOpen) return null;

  // Active Device Pill Icon and Text
  const getActiveDeviceDetails = () => {
    switch (activeScheme) {
      case 'GAMEPAD_PLAYSTATION':
        return {
          icon: <Gamepad2 className="w-4 h-4 text-blue-400" />,
          label: 'DUALSENSE / PLAYSTATION DETECTED',
          border: 'border-blue-500/40 text-blue-300 bg-blue-950/40',
        };
      case 'GAMEPAD_SWITCH':
        return {
          icon: <Gamepad2 className="w-4 h-4 text-red-400" />,
          label: 'NINTENDO SWITCH PRO DETECTED',
          border: 'border-red-500/40 text-red-300 bg-red-950/40',
        };
      case 'GAMEPAD_XBOX':
        return {
          icon: <Gamepad2 className="w-4 h-4 text-emerald-400" />,
          label: 'XBOX CONTROLLER DETECTED',
          border: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40',
        };
      case 'TOUCH':
        return {
          icon: <Smartphone className="w-4 h-4 text-purple-400" />,
          label: 'TOUCHSCREEN CONTROLS DETECTED',
          border: 'border-purple-500/40 text-purple-300 bg-purple-950/40',
        };
      case 'KBM':
      default:
        return {
          icon: <Keyboard className="w-4 h-4 text-cyan-400" />,
          label: 'KEYBOARD & OPTICAL MOUSE DETECTED',
          border: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/40',
        };
    }
  };

  const deviceBadge = getActiveDeviceDetails();

  // Count modified bindings across controls
  const totalModified = Object.values(settings.controls).filter((b) => b.isModified).length;

  const tabs: { id: SettingsState['activeTab'] | 'sync'; label: string; icon: React.ReactNode }[] = [
    { id: 'controls', label: 'Controls Matrix', icon: <Keyboard className="w-4 h-4" /> },
    { id: 'gameplay', label: 'Gameplay', icon: <Sliders className="w-4 h-4" /> },
    { id: 'audio', label: 'Audio Mix', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'video', label: 'Video & Display', icon: <Monitor className="w-4 h-4" /> },
    { id: 'accessibility', label: 'Accessibility', icon: <Accessibility className="w-4 h-4" /> },
    { id: 'sync', label: 'Profile Sync', icon: <Share2 className="w-4 h-4" /> },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings and Controls Suite"
      className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#050608E6] backdrop-blur-xl animate-in fade-in duration-200"
    >
      {/* 1080p Tactical Avionics Deck Chassis */}
      <div
        ref={modalRef}
        className="relative w-full max-w-7xl h-[92vh] max-h-[960px] flex flex-col rounded-2xl bg-[#0C0E14] border border-[#1E2538] shadow-2xl overflow-hidden"
      >
        {/* ================================= HEADER RIBBON (64px) ================================= */}
        <header className="h-16 px-6 border-b border-[#1E2538] bg-[#0E1118] flex items-center justify-between flex-shrink-0 z-20">
          {/* Left: Active Hardware Detection Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-bold tracking-wider shadow-sm transition-all"
                 style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}
            >
              <span className="flex items-center gap-2">
                {deviceBadge.icon}
                <span className="hidden sm:inline text-[#F8FAFC]">{deviceBadge.label}</span>
                <span className="sm:hidden text-[#F8FAFC]">ACTIVE</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-glow-emerald" />
            </div>
          </div>

          {/* Center: Category Navigation Bar */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-[#08090D] border border-[#1E2538]">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wide transition-all ${
                    isActive
                      ? 'bg-[#1C2232] text-[#38BDF8] border border-[#38BDF8]/50 shadow-glow-cyan'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#131722]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.id === 'controls' && totalModified > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-glow-emerald" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Close Trigger */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1C2232] hover:bg-[#283145] text-slate-300 hover:text-white border border-[#1E2538] font-mono text-xs font-bold transition-all active:scale-95"
            >
              <span className="hidden md:inline">[ESC]</span>
              <span>Back to Game</span>
              <X className="w-4 h-4 ml-1 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Pill Slider (Visible under lg) */}
        <div className="lg:hidden flex items-center gap-1.5 px-4 py-2 bg-[#0E1118] border-b border-[#1E2538] overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#38BDF8] text-slate-950 shadow-glow-cyan'
                    : 'bg-[#1C2232] text-slate-400 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================================= CENTRAL 2-COLUMN SPLIT ================================= */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column (65% width): Main Category Virtualized/Scrollable Container */}
          <main className="w-full xl:w-[65%] flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[#0C0E14] tactical-grid">
            {currentTab === 'controls' && (
              <ControlsTab
                settings={settings}
                onStartListening={onStartListening}
                onResetSingle={onResetSingleAction}
                onResetCategory={onResetCategory}
                onApplyPreset={onApplyPreset}
              />
            )}
            {currentTab === 'gameplay' && (
              <GameplayTab
                settings={settings}
                onUpdateSetting={onUpdateGameplay}
              />
            )}
            {currentTab === 'audio' && (
              <AudioTab
                settings={settings}
                onUpdateSetting={onUpdateAudio}
              />
            )}
            {currentTab === 'video' && (
              <VideoTab
                settings={settings}
                onUpdateSetting={onUpdateVideo}
              />
            )}
            {currentTab === 'accessibility' && (
              <AccessibilityTab
                settings={settings}
                onUpdateSetting={onUpdateAccessibility}
                onApplyPreset={onApplyPreset}
              />
            )}
            {currentTab === 'sync' && (
              <ProfileSyncTab
                settings={settings}
                onApplyImportedProfile={onApplyImportedProfile}
              />
            )}
          </main>

          {/* Right Column (35% width): Sticky Hardware Calibration Workbench */}
          <aside className="hidden xl:flex xl:w-[35%] border-l border-[#1E2538] bg-[#0A0C11] p-4 flex-col overflow-y-auto custom-scrollbar">
            <HardwareWorkbench
              settings={settings}
              gamepadState={gamepadState}
              activeScheme={activeScheme}
              onSimulateDevice={onSimulateDevice}
              onSimulateStick={onSimulateStick}
              onDeadzoneChange={(val) => onUpdateGameplay('stickDeadzone', val)}
            />
          </aside>
        </div>

        {/* ================================= FOOTER ACTION RIBBON ================================= */}
        <footer className="h-16 px-6 border-t border-[#1E2538] bg-[#0E1118] flex items-center justify-between flex-shrink-0 z-20">
          {/* Left: Section and Global Reset */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={onResetAll}
              className="font-mono text-xs gap-1.5 text-slate-400 hover:text-amber-400"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              RESTORE ALL DEFAULTS
            </Button>
          </div>

          {/* Center: Altered Pips Telemetry */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
            {totalModified > 0 ? (
              <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-700/60 shadow-glow-emerald">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {totalModified} PARAMETERS CUSTOMIZED
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                FACTORY PRESET ACTIVE
              </span>
            )}
          </div>

          {/* Right: Dirty Status & Save CTA */}
          <div className="flex items-center gap-3">
            {settings.isDirty && (
              <span className="hidden md:inline font-mono text-[11px] text-amber-400 animate-pulse">
                UNSAVED CALIBRATIONS
              </span>
            )}

            <Button
              size="md"
              variant="primary"
              onClick={onSave}
              className="font-mono text-xs font-bold gap-2 px-5 py-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              SAVE & APPLY CHANGES
            </Button>
          </div>
        </footer>
      </div>

      {/* Intelligent Conflict Resolution Sheet Modal */}
      {settings.rebindingState.fsmState === 'CONFLICT_DETECTED' && (
        <ConflictDialog
          details={settings.rebindingState.conflictDetails}
          onSwap={onConflictSwap}
          onShift={onConflictShift}
          onModifier={onConflictModifier}
          onOverride={onConflictOverride}
          onCancel={onCancelListening}
        />
      )}
    </div>
  );
};
