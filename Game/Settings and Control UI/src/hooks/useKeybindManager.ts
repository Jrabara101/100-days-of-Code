import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SettingsState,
  ControlBinding,
  InputDevice,
  RebindFSMState,
  ConflictDetails,
  ErgonomicPreset,
  BindingSlot,
} from '@/types/settings';
import { INITIAL_SETTINGS_STATE, INITIAL_CONTROLS } from '@/constants/defaultSettings';
import { getDisplayGlyph } from '@/constants/glyphs';
import { isCodeReserved } from '@/constants/reservedKeys';
import { soundEngine } from '@/services/audioService';
import { hapticsService } from '@/services/hapticsService';
import { saveSettingsToStorage, loadSettingsFromStorage } from '@/services/storageService';

export function useKeybindManager() {
  const [settings, setSettings] = useState<SettingsState>(() => loadSettingsFromStorage());
  const activeListeningRef = useRef<{
    actionId: string;
    slot: 'primary' | 'secondary';
  } | null>(null);

  // Sync activeListeningRef with state
  useEffect(() => {
    if (settings.rebindingState.isListening && settings.rebindingState.targetActionId && settings.rebindingState.targetSlot) {
      activeListeningRef.current = {
        actionId: settings.rebindingState.targetActionId,
        slot: settings.rebindingState.targetSlot,
      };
    } else {
      activeListeningRef.current = null;
    }
  }, [settings.rebindingState]);

  // Start listening for a new bind
  const startListening = useCallback((actionId: string, slot: 'primary' | 'secondary') => {
    soundEngine.playListeningTone();
    hapticsService.lightClick();

    setSettings((prev) => ({
      ...prev,
      rebindingState: {
        isListening: true,
        fsmState: 'LISTENING_FOR_BIND',
        targetActionId: actionId,
        targetSlot: slot,
        conflictActionId: null,
        conflictDetails: null,
      },
    }));
  }, []);

  // Cancel listening
  const cancelListening = useCallback(() => {
    soundEngine.playHoverTick();
    setSettings((prev) => ({
      ...prev,
      rebindingState: {
        isListening: false,
        fsmState: 'IDLE',
        targetActionId: null,
        targetSlot: null,
        conflictActionId: null,
        conflictDetails: null,
      },
    }));
  }, []);

  // Check for conflicts across all control bindings
  const checkForConflict = useCallback(
    (attemptedCode: string, targetActionId: string, targetSlot: 'primary' | 'secondary'): { conflictingActionId: string; conflictingSlot: 'primary' | 'secondary'; conflictingLabel: string } | null => {
      for (const [actionId, binding] of Object.entries(settings.controls)) {
        // Skip comparing against itself in the same slot
        if (actionId === targetActionId) {
          // If trying to set primary same as secondary or vice versa on same action
          const otherSlot = targetSlot === 'primary' ? 'secondary' : 'primary';
          const otherBinding = targetSlot === 'primary' ? binding.secondary : binding.primary;
          if (otherBinding && otherBinding.code === attemptedCode) {
            return {
              conflictingActionId: actionId,
              conflictingSlot: otherSlot,
              conflictingLabel: binding.actionLabel,
            };
          }
          continue;
        }

        if (binding.primary.code === attemptedCode) {
          return {
            conflictingActionId: actionId,
            conflictingSlot: 'primary',
            conflictingLabel: binding.actionLabel,
          };
        }

        if (binding.secondary && binding.secondary.code === attemptedCode) {
          return {
            conflictingActionId: actionId,
            conflictingSlot: 'secondary',
            conflictingLabel: binding.actionLabel,
          };
        }
      }

      return null;
    },
    [settings.controls]
  );

  // Directly apply a validated bind
  const commitBinding = useCallback(
    (actionId: string, slot: 'primary' | 'secondary', newSlotData: BindingSlot) => {
      soundEngine.playSelectClick();
      hapticsService.lightClick();

      setSettings((prev) => {
        const existing = prev.controls[actionId];
        if (!existing) return prev;

        const updatedBinding: ControlBinding = {
          ...existing,
          [slot]: newSlotData,
          isModified: true,
        };

        const updatedControls = {
          ...prev.controls,
          [actionId]: updatedBinding,
        };

        return {
          ...prev,
          controls: updatedControls,
          rebindingState: {
            isListening: false,
            fsmState: 'SAVED',
            targetActionId: null,
            targetSlot: null,
            conflictActionId: null,
            conflictDetails: null,
          },
          isDirty: true,
        };
      });

      setTimeout(() => {
        setSettings((prev) => ({
          ...prev,
          rebindingState: {
            ...prev.rebindingState,
            fsmState: 'IDLE',
          },
        }));
      }, 500);
    },
    []
  );

  // Process an incoming raw hardware input while listening
  const processIncomingInput = useCallback(
    (code: string, device: InputDevice) => {
      const active = activeListeningRef.current;
      if (!active) return;

      const { actionId, slot } = active;

      // Check if user hit Escape -> cancel rebinding
      if (code === 'Escape' && device === 'keyboard') {
        cancelListening();
        return;
      }

      // Check system reserved keys
      const reservedCheck = isCodeReserved(code, actionId);
      if (reservedCheck.reserved) {
        soundEngine.playConflictBuzz();
        hapticsService.conflictWarning();
        alert(reservedCheck.reason || 'This key is reserved by the system.');
        cancelListening();
        return;
      }

      const glyph = getDisplayGlyph(code, device, settings.deviceContext.controllerType);

      // Check if conflicting with another action
      const conflict = checkForConflict(code, actionId, slot);

      if (conflict) {
        soundEngine.playConflictBuzz();
        hapticsService.conflictWarning();

        const conflictDetails: ConflictDetails = {
          attemptedCode: code,
          attemptedDevice: device,
          attemptedGlyph: glyph,
          incomingActionId: actionId,
          incomingSlot: slot,
          conflictingActionId: conflict.conflictingActionId,
          conflictingActionLabel: conflict.conflictingLabel,
          conflictingSlot: conflict.conflictingSlot,
        };

        setSettings((prev) => ({
          ...prev,
          rebindingState: {
            ...prev.rebindingState,
            isListening: false,
            fsmState: 'CONFLICT_DETECTED',
            conflictActionId: conflict.conflictingActionId,
            conflictDetails,
          },
        }));
        return;
      }

      // No conflict: commit directly
      commitBinding(actionId, slot, {
        device,
        code,
        displayGlyph: glyph,
      });
    },
    [cancelListening, checkForConflict, commitBinding, settings.deviceContext.controllerType]
  );

  // Keyboard and Mouse listener when in listening mode
  useEffect(() => {
    if (!settings.rebindingState.isListening) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block default actions (e.g. Space scrolling, Tab navigating, Arrow scrolling)
      e.preventDefault();
      e.stopPropagation();

      let code = e.code;

      // Support modifier attachments if user presses combo like Control + KeyF
      if (e.ctrlKey && code !== 'ControlLeft' && code !== 'ControlRight') {
        code = `ControlLeft+${code}`;
      } else if (e.shiftKey && code !== 'ShiftLeft' && code !== 'ShiftRight') {
        code = `ShiftLeft+${code}`;
      } else if (e.altKey && code !== 'AltLeft' && code !== 'AltRight') {
        code = `AltLeft+${code}`;
      }

      processIncomingInput(code, 'keyboard');
    };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const code = `Mouse${e.button}`;
      processIncomingInput(code, 'mouse');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const code = e.deltaY < 0 ? 'WheelUp' : 'WheelDown';
      processIncomingInput(code, 'mouse');
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('mousedown', handleMouseDown, { capture: true });
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('wheel', handleWheel, { capture: true, passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('mousedown', handleMouseDown, { capture: true });
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [settings.rebindingState.isListening, processIncomingInput]);

  // Gamepad listener when in listening mode
  useEffect(() => {
    if (!settings.rebindingState.isListening) return;
    let animId: number;

    const pollGamepadForBind = () => {
      if (typeof navigator !== 'undefined' && 'getGamepads' in navigator) {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (const gp of gamepads) {
          if (!gp) continue;
          for (let i = 0; i < gp.buttons.length; i++) {
            const btn = gp.buttons[i];
            // Threshold for buttons or trigger squeeze
            if (btn.pressed || btn.value > 0.6) {
              const code = `GamepadButton${i}`;
              processIncomingInput(code, 'gamepad');
              return;
            }
          }
        }
      }
      animId = requestAnimationFrame(pollGamepadForBind);
    };

    animId = requestAnimationFrame(pollGamepadForBind);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [settings.rebindingState.isListening, processIncomingInput]);

  // Conflict Resolution Action 1: SWAP
  const resolveConflictWithSwap = useCallback(() => {
    const details = settings.rebindingState.conflictDetails;
    if (!details) return;

    soundEngine.playSelectClick();
    hapticsService.lightClick();

    setSettings((prev) => {
      const incoming = prev.controls[details.incomingActionId];
      const conflicting = prev.controls[details.conflictingActionId];
      if (!incoming || !conflicting) return prev;

      // Current slot value on incoming
      const incomingCurrentSlot = details.incomingSlot === 'primary' ? incoming.primary : incoming.secondary;
      const fallbackGlyph = incomingCurrentSlot ? incomingCurrentSlot.displayGlyph : 'NONE';
      const fallbackCode = incomingCurrentSlot ? incomingCurrentSlot.code : 'None';
      const fallbackDevice = incomingCurrentSlot ? incomingCurrentSlot.device : details.attemptedDevice;

      const newIncomingSlotData: BindingSlot = {
        device: details.attemptedDevice,
        code: details.attemptedCode,
        displayGlyph: details.attemptedGlyph,
      };

      const newConflictingSlotData: BindingSlot = {
        device: fallbackDevice,
        code: fallbackCode,
        displayGlyph: fallbackGlyph,
      };

      const updatedIncoming: ControlBinding = {
        ...incoming,
        [details.incomingSlot]: newIncomingSlotData,
        isModified: true,
      };

      const updatedConflicting: ControlBinding = {
        ...conflicting,
        [details.conflictingSlot]: newConflictingSlotData,
        isModified: true,
      };

      return {
        ...prev,
        controls: {
          ...prev.controls,
          [details.incomingActionId]: updatedIncoming,
          [details.conflictingActionId]: updatedConflicting,
        },
        rebindingState: {
          isListening: false,
          fsmState: 'IDLE',
          targetActionId: null,
          targetSlot: null,
          conflictActionId: null,
          conflictDetails: null,
        },
        isDirty: true,
      };
    });
  }, [settings.rebindingState.conflictDetails]);

  // Conflict Resolution Action 2: SHIFT (Move conflicting bind to its secondary or clear it)
  const resolveConflictWithShift = useCallback(() => {
    const details = settings.rebindingState.conflictDetails;
    if (!details) return;

    soundEngine.playSelectClick();

    setSettings((prev) => {
      const incoming = prev.controls[details.incomingActionId];
      const conflicting = prev.controls[details.conflictingActionId];
      if (!incoming || !conflicting) return prev;

      // Assign bind to incoming
      const newIncoming: ControlBinding = {
        ...incoming,
        [details.incomingSlot]: {
          device: details.attemptedDevice,
          code: details.attemptedCode,
          displayGlyph: details.attemptedGlyph,
        },
        isModified: true,
      };

      // Shift conflicting: if primary conflicted, shift to secondary; if secondary conflicted, clear secondary
      let newConflicting: ControlBinding;
      if (details.conflictingSlot === 'primary') {
        newConflicting = {
          ...conflicting,
          primary: conflicting.secondary || {
            device: 'keyboard',
            code: 'Unbound',
            displayGlyph: '[UNBOUND]',
          },
          secondary: undefined,
          isModified: true,
        };
      } else {
        newConflicting = {
          ...conflicting,
          secondary: undefined,
          isModified: true,
        };
      }

      return {
        ...prev,
        controls: {
          ...prev.controls,
          [details.incomingActionId]: newIncoming,
          [details.conflictingActionId]: newConflicting,
        },
        rebindingState: {
          isListening: false,
          fsmState: 'IDLE',
          targetActionId: null,
          targetSlot: null,
          conflictActionId: null,
          conflictDetails: null,
        },
        isDirty: true,
      };
    });
  }, [settings.rebindingState.conflictDetails]);

  // Conflict Resolution Action 3: ADD MODIFIER (Attach Ctrl+ to preserve both)
  const resolveConflictWithModifier = useCallback(() => {
    const details = settings.rebindingState.conflictDetails;
    if (!details) return;

    const modifierCode = `ControlLeft+${details.attemptedCode}`;
    const modifierGlyph = `L-CTRL + ${details.attemptedGlyph}`;

    commitBinding(details.incomingActionId, details.incomingSlot, {
      device: details.attemptedDevice,
      code: modifierCode,
      displayGlyph: modifierGlyph,
    });
  }, [commitBinding, settings.rebindingState.conflictDetails]);

  // Conflict Resolution Action 4: OVERRIDE / UNBIND CONFLICTING
  const resolveConflictWithOverride = useCallback(() => {
    const details = settings.rebindingState.conflictDetails;
    if (!details) return;

    soundEngine.playSelectClick();

    setSettings((prev) => {
      const incoming = prev.controls[details.incomingActionId];
      const conflicting = prev.controls[details.conflictingActionId];
      if (!incoming || !conflicting) return prev;

      const newIncoming: ControlBinding = {
        ...incoming,
        [details.incomingSlot]: {
          device: details.attemptedDevice,
          code: details.attemptedCode,
          displayGlyph: details.attemptedGlyph,
        },
        isModified: true,
      };

      const newConflicting: ControlBinding = {
        ...conflicting,
        [details.conflictingSlot]: details.conflictingSlot === 'primary'
          ? { device: 'keyboard', code: 'Unbound', displayGlyph: '[UNBOUND]' }
          : undefined,
        isModified: true,
      };

      return {
        ...prev,
        controls: {
          ...prev.controls,
          [details.incomingActionId]: newIncoming,
          [details.conflictingActionId]: newConflicting,
        },
        rebindingState: {
          isListening: false,
          fsmState: 'IDLE',
          targetActionId: null,
          targetSlot: null,
          conflictActionId: null,
          conflictDetails: null,
        },
        isDirty: true,
      };
    });
  }, [settings.rebindingState.conflictDetails]);

  // Differential Reset: Reset a single action to its default
  const resetSingleAction = useCallback((actionId: string) => {
    soundEngine.playHoverTick();
    setSettings((prev) => {
      const defaultBinding = INITIAL_CONTROLS[actionId];
      if (!defaultBinding) return prev;

      return {
        ...prev,
        controls: {
          ...prev.controls,
          [actionId]: {
            ...defaultBinding,
            isModified: false,
          },
        },
        isDirty: true,
      };
    });
  }, []);

  // Reset an entire category to default
  const resetCategory = useCallback((category: string) => {
    soundEngine.playHoverTick();
    setSettings((prev) => {
      const updatedControls = { ...prev.controls };
      for (const [actionId, binding] of Object.entries(INITIAL_CONTROLS)) {
        if (binding.category === category) {
          updatedControls[actionId] = {
            ...binding,
            isModified: false,
          };
        }
      }
      return {
        ...prev,
        controls: updatedControls,
        isDirty: true,
      };
    });
  }, []);

  // Global reset to default
  const resetAllToDefaults = useCallback(() => {
    soundEngine.playHoverTick();
    setSettings({
      ...INITIAL_SETTINGS_STATE,
      deviceContext: settings.deviceContext,
      isDirty: true,
    });
  }, [settings.deviceContext]);

  // Apply ergonomic archetype presets
  const applyErgonomicPreset = useCallback((preset: ErgonomicPreset) => {
    soundEngine.playSelectClick();
    hapticsService.lightClick();

    setSettings((prev) => {
      const updatedControls = { ...prev.controls };
      let newGameplay = { ...prev.gameplaySettings };
      let newAccessibility = { ...prev.accessibilitySettings, presetArchetype: preset };

      if (preset === 'single-handed-left') {
        // Left hand on keyboard only (WASD + Q/E/R/F/Space/Shift/C)
        updatedControls.fire = {
          ...updatedControls.fire,
          primary: { device: 'keyboard', code: 'KeyE', displayGlyph: 'E' },
          isModified: true,
        };
        updatedControls.aim_down_sights = {
          ...updatedControls.aim_down_sights,
          primary: { device: 'keyboard', code: 'KeyQ', displayGlyph: 'Q' },
          isModified: true,
        };
        newGameplay.toggleSprint = true;
        newGameplay.toggleCrouch = true;
        newGameplay.adsHold = false;
      } else if (preset === 'single-handed-right') {
        // Right hand on numpad/arrow keys
        updatedControls.move_forward = {
          ...updatedControls.move_forward,
          primary: { device: 'keyboard', code: 'ArrowUp', displayGlyph: 'UP' },
          isModified: true,
        };
        updatedControls.move_backward = {
          ...updatedControls.move_backward,
          primary: { device: 'keyboard', code: 'ArrowDown', displayGlyph: 'DOWN' },
          isModified: true,
        };
        updatedControls.move_left = {
          ...updatedControls.move_left,
          primary: { device: 'keyboard', code: 'ArrowLeft', displayGlyph: 'LEFT' },
          isModified: true,
        };
        updatedControls.move_right = {
          ...updatedControls.move_right,
          primary: { device: 'keyboard', code: 'ArrowRight', displayGlyph: 'RIGHT' },
          isModified: true,
        };
        newGameplay.toggleSprint = true;
        newGameplay.toggleCrouch = true;
      } else if (preset === 'reduced-fatigue') {
        // Toggle over hold for all high-fatigue interactions
        newGameplay.toggleSprint = true;
        newGameplay.toggleCrouch = true;
        newGameplay.adsHold = false;
        newAccessibility.toggleVsHoldOverrides = true;
      } else if (preset === 'high-contrast') {
        newAccessibility.highContrastFocusMarkers = true;
      } else {
        // Standard
        newAccessibility = {
          ...newAccessibility,
          presetArchetype: 'standard',
          stickSwapAxes: false,
          toggleVsHoldOverrides: false,
        };
      }

      return {
        ...prev,
        controls: updatedControls,
        gameplaySettings: newGameplay,
        accessibilitySettings: newAccessibility,
        isDirty: true,
      };
    });
  }, []);

  // Save changes to storage
  const saveChanges = useCallback(() => {
    saveSettingsToStorage(settings);
    soundEngine.playSaveSuccess();
    hapticsService.successPulse();
    setSettings((prev) => ({
      ...prev,
      isDirty: false,
    }));
  }, [settings]);

  // Update tabs
  const setActiveTab = useCallback((tab: SettingsState['activeTab']) => {
    soundEngine.playHoverTick();
    setSettings((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  // Update gameplay settings
  const updateGameplaySetting = useCallback(<K extends keyof SettingsState['gameplaySettings']>(key: K, value: SettingsState['gameplaySettings'][K]) => {
    setSettings((prev) => ({
      ...prev,
      gameplaySettings: {
        ...prev.gameplaySettings,
        [key]: value,
      },
      isDirty: true,
    }));
  }, []);

  // Update audio settings
  const updateAudioSetting = useCallback(<K extends keyof SettingsState['audioSettings']>(key: K, value: SettingsState['audioSettings'][K]) => {
    setSettings((prev) => ({
      ...prev,
      audioSettings: {
        ...prev.audioSettings,
        [key]: value,
      },
      isDirty: true,
    }));
  }, []);

  // Update video settings
  const updateVideoSetting = useCallback(<K extends keyof SettingsState['videoSettings']>(key: K, value: SettingsState['videoSettings'][K]) => {
    setSettings((prev) => ({
      ...prev,
      videoSettings: {
        ...prev.videoSettings,
        [key]: value,
      },
      isDirty: true,
    }));
  }, []);

  // Update accessibility settings
  const updateAccessibilitySetting = useCallback(<K extends keyof SettingsState['accessibilitySettings']>(key: K, value: SettingsState['accessibilitySettings'][K]) => {
    setSettings((prev) => ({
      ...prev,
      accessibilitySettings: {
        ...prev.accessibilitySettings,
        [key]: value,
      },
      isDirty: true,
    }));
  }, []);

  // Update device context dynamically
  const updateDeviceContext = useCallback((context: Partial<SettingsState['deviceContext']>) => {
    setSettings((prev) => ({
      ...prev,
      deviceContext: {
        ...prev.deviceContext,
        ...context,
      },
    }));
  }, []);

  // Import whole profile
  const applyImportedProfile = useCallback((partialState: Partial<SettingsState>) => {
    soundEngine.playSaveSuccess();
    setSettings((prev) => ({
      ...prev,
      ...partialState,
      controls: partialState.controls ? { ...prev.controls, ...partialState.controls } : prev.controls,
      isDirty: true,
    }));
  }, []);

  return {
    settings,
    startListening,
    cancelListening,
    resolveConflictWithSwap,
    resolveConflictWithShift,
    resolveConflictWithModifier,
    resolveConflictWithOverride,
    resetSingleAction,
    resetCategory,
    resetAllToDefaults,
    applyErgonomicPreset,
    saveChanges,
    setActiveTab,
    updateGameplaySetting,
    updateAudioSetting,
    updateVideoSetting,
    updateAccessibilitySetting,
    updateDeviceContext,
    applyImportedProfile,
  };
}
