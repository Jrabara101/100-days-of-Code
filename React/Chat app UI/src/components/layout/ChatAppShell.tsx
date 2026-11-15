import { useEffect, useRef } from 'react';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { useBootstrap } from '../../hooks/useBootstrap';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { cn } from '../../lib/utils';
import { ModeRail } from './ModeRail';
import { ActiveChatsSidebar } from '../sidebar/ActiveChatsSidebar';
import { ActiveChatStage } from '../chat/ActiveChatStage';
import { ThreadDrawerPane } from '../drawers/ThreadDrawerPane';
import { ContactInspectorPane } from '../drawers/ContactInspectorPane';
import { ContactsDirectoryView } from '../views/ContactsDirectoryView';
import { MyThreadsView } from '../views/MyThreadsView';
import { BookmarksView } from '../views/BookmarksView';
import { GlobalVaultView } from '../views/GlobalVaultView';
import { CommandSwitcherModal } from '../modals/CommandSwitcherModal';
import { NewChatGroupModal } from '../modals/NewChatGroupModal';
import { ContactExchangeModal } from '../modals/ContactExchangeModal';
import { PollCreatorModal } from '../modals/PollCreatorModal';
import { CallOverlayModal } from '../modals/CallOverlayModal';
import { MediaLightbox } from '../modals/MediaLightbox';
import { ToastBanner } from '../ui/ToastBanner';

export function ChatAppShell() {
  useBootstrap();
  useKeyboardShortcuts();

  const theme = useChatWorkspaceStore((s) => s.theme);
  const activeZone = useChatWorkspaceStore((s) => s.activeZone);
  const rightPaneMode = useChatWorkspaceStore((s) => s.rightPaneMode);
  const mobileStage = useChatWorkspaceStore((s) => s.mobileStage);
  const setSidebarWidth = useChatWorkspaceStore((s) => s.setSidebarWidth);

  const resizingRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      setSidebarWidth(e.clientX - 64);
    };
    const onUp = () => {
      resizingRef.current = false;
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [setSidebarWidth]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-canvas text-txt-primary flex">
      {/* Zone 1: Far-Left Mode Switcher Rail (64px fixed) */}
      <ModeRail />

      {/* Zones 2, 3, 4 */}
      {activeZone === 'chats' && (
        <div className="flex-1 min-w-0 h-full flex relative overflow-hidden">
          {/* Zone 2: Active Chats Sidebar */}
          <div
            className={cn(
              'h-full shrink-0 flex',
              mobileStage === 'list' ? 'flex w-full md:w-auto' : 'hidden md:flex'
            )}
          >
            <ActiveChatsSidebar />
            {/* Resizable Handle (Desktop) */}
            <div
              onMouseDown={() => {
                resizingRef.current = true;
                document.body.style.cursor = 'col-resize';
              }}
              className="hidden md:block w-1 -ml-0.5 cursor-col-resize hover:bg-blue-500/50 transition-colors z-20"
              title="Drag to resize sidebar"
            />
          </div>

          {/* Zone 3: Center Active Chat Stage */}
          <div
            className={cn(
              'flex-1 min-w-0 h-full',
              mobileStage === 'chat' ? 'flex' : 'hidden md:flex'
            )}
          >
            <ActiveChatStage />
          </div>

          {/* Zone 4: Contextual Thread Drawer or Contact Inspector */}
          {rightPaneMode !== 'closed' && (
            <div
              className={cn(
                'h-full shrink-0 transition-all duration-200',
                mobileStage === 'drawer' ? 'flex w-full md:w-auto' : 'hidden md:flex'
              )}
            >
              {rightPaneMode === 'thread' ? (
                <ThreadDrawerPane />
              ) : (
                <ContactInspectorPane />
              )}
            </div>
          )}
        </div>
      )}

      {activeZone === 'contacts' && <ContactsDirectoryView />}
      {activeZone === 'threads' && <MyThreadsView />}
      {activeZone === 'bookmarks' && <BookmarksView />}
      {activeZone === 'vault' && <GlobalVaultView />}

      {/* Modals, Lightbox, Call Overlay & Toasts */}
      <CommandSwitcherModal />
      <NewChatGroupModal />
      <ContactExchangeModal />
      <PollCreatorModal />
      <CallOverlayModal />
      <MediaLightbox />
      <ToastBanner />
    </div>
  );
}

