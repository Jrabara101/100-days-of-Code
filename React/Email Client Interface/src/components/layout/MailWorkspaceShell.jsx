import React, { useEffect, useState } from 'react';
import { LeftNavigation } from './LeftNavigation';
import { SplitInboxThreadList } from '../threads/SplitInboxThreadList';
import { ThreadReaderStage } from '../reader/ThreadReaderStage';
import { SenderInspector } from '../reader/SenderInspector';
import { SmartComposeDock } from '../compose/SmartComposeDock';
import { UndoSendToast } from '../compose/UndoSendToast';
import { TokenizedSearchPalette } from '../search/TokenizedSearchPalette';
import { ScreenerModal } from '../screener/ScreenerModal';
import { RuleStudioModal } from '../modals/RuleStudioModal';
import { KeyboardShortcutsModal } from '../keyboard/KeyboardShortcutsModal';
import { KeyboardListener } from '../keyboard/KeyboardListener';
import { useMailStore } from '../../store/useMailStore';
import { initializeDatabase } from '../../db/initDb';

export function MailWorkspaceShell() {
  const { isRightRailOpen } = useMailStore();
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    initializeDatabase().then(() => {
      setIsDbReady(true);
    });
  }, []);

  if (!isDbReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#090A0D] text-white">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono text-slate-400">Mounting AeroMail Sub-16ms Local Engine...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-white dark:bg-[#090A0D] text-slate-900 dark:text-slate-100 font-sans">
      {/* 4-Zone Master Responsive Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Zone 1: Left Navigation & Label Rail */}
        <LeftNavigation />

        {/* Zone 2: Split-Horizon Thread List */}
        <SplitInboxThreadList />

        {/* Zone 3: Thread Reading Stage & Conversation Stream */}
        <ThreadReaderStage />

        {/* Zone 4: Sender 360° Context & Shared Files Inspector (Collapsible) */}
        {isRightRailOpen && <SenderInspector />}
      </div>

      {/* Floating & Modal Overlays */}
      <SmartComposeDock />
      <UndoSendToast />
      <TokenizedSearchPalette />
      <ScreenerModal />
      <RuleStudioModal />
      <KeyboardShortcutsModal />
      <KeyboardListener />
    </div>
  );
}

