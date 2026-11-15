import { useEffect } from 'react';
import { useChatWorkspaceStore } from '../stores/useChatWorkspaceStore';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const store = useChatWorkspaceStore.getState();

      // Cmd/Ctrl + K -> Command Switcher
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        store.setCommandOpen(!store.isCommandOpen);
        return;
      }

      // Cmd/Ctrl + N -> New Chat / Group Modal
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        store.openNewGroupModal(null);
        return;
      }

      // Escape -> Close open overlays / drawers cleanly
      if (e.key === 'Escape') {
        if (store.lightboxMedia) {
          store.setLightboxMedia(null);
          return;
        }
        if (store.isCommandOpen) {
          store.setCommandOpen(false);
          return;
        }
        if (store.isNewGroupModalOpen) {
          store.closeNewGroupModal();
          return;
        }
        if (store.isContactExchangeOpen) {
          store.setContactExchangeOpen(false);
          return;
        }
        if (store.isPollModalOpen) {
          store.setPollModalOpen(false);
          return;
        }
        if (store.rightPaneMode !== 'closed') {
          store.closeRightPane();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

