import React, { useState, useEffect } from 'react';
import { vault } from './storage/vaultStore';
import DecoyGate from './components/DecoyGate';
import DecoyVaultView from './components/DecoyVaultView';
import SecureChatLayout from './components/SecureChatLayout';
import OnboardingModal from './components/OnboardingModal';
import PanicWipeOverlay from './components/PanicWipeOverlay';

export default function App() {
  const [, setTick] = useState(0);
  const [panicActive, setPanicActive] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Initialize vault & subscribe to real-time reactive updates
  useEffect(() => {
    vault.init().then(() => {
      if (!vault.user) {
        setShowOnboarding(true);
      }
    });

    const unsubscribe = vault.subscribe(() => {
      setTick(t => t + 1);
    });

    return unsubscribe;
  }, []);

  // Global Panic Wipe Hotkey: Cmd+Shift+X or Ctrl+Shift+X
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        handleTriggerPanic();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTriggerPanic = () => {
    vault.instantPanicWipe();
    setPanicActive(true);
  };

  const handleDismissPanic = async () => {
    setPanicActive(false);
    await vault.createNewVault();
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = (alias) => {
    if (vault.user) {
      vault.user.alias = alias;
      vault.persist();
      vault.notify();
    }
    setShowOnboarding(false);
  };

  // State Routing:
  // 1. If Panic Wipe was fired, show fullscreen hazard wipe overlay
  // 2. If no user, show Onboarding Modal
  // 3. If App Locked, show DecoyGate
  // 4. If in Decoy Mode, show DecoyVaultView
  // 5. Otherwise show SecureChatLayout

  return (
    <div className="h-screen w-screen bg-[#07080A] text-[#F3F4F6] overflow-hidden select-none">
      {/* Panic Overlay */}
      <PanicWipeOverlay
        isTriggered={panicActive}
        onDismiss={handleDismissPanic}
      />

      {/* Onboarding Dialog */}
      {showOnboarding && vault.user && (
        <OnboardingModal
          user={vault.user}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* App Views */}
      {vault.isAppLocked ? (
        <DecoyGate
          user={vault.user}
          onUnlock={(pin) => vault.unlockWithPin(pin)}
        />
      ) : vault.isDecoyMode ? (
        <DecoyVaultView
          onExitDecoy={() => vault.lockApp()}
        />
      ) : (
        <SecureChatLayout
          vault={vault}
          onPanicTrigger={handleTriggerPanic}
          onLockApp={() => vault.lockApp()}
        />
      )}
    </div>
  );
}
