import { useState, useEffect, useCallback } from 'react';
import { InputDevice, ControllerType, ActiveControlScheme } from '@/types/settings';

export function detectControllerBrand(id: string): ControllerType {
  const lower = id.toLowerCase();
  if (lower.includes('playstation') || lower.includes('dualsense') || lower.includes('dualshock') || lower.includes('sony') || lower.includes('054c')) {
    return 'playstation';
  }
  if (lower.includes('switch') || lower.includes('pro controller') || lower.includes('joy-con') || lower.includes('nintendo') || lower.includes('057e')) {
    return 'switch';
  }
  if (lower.includes('xbox') || lower.includes('microsoft') || lower.includes('x-input') || lower.includes('045e')) {
    return 'xbox';
  }
  return 'generic';
}

export function useInputDeviceDetector() {
  const [lastActiveDevice, setLastActiveDevice] = useState<InputDevice>('keyboard');
  const [controllerType, setControllerType] = useState<ControllerType>('xbox');
  const [activeScheme, setActiveScheme] = useState<ActiveControlScheme>('KBM');
  const [gamepadConnected, setGamepadConnected] = useState<boolean>(false);
  const [activeGamepadName, setActiveGamepadName] = useState<string>('Standard Keyboard & Mouse');

  // Keyboard and mouse listeners
  useEffect(() => {
    const handleKeyDown = () => {
      setLastActiveDevice('keyboard');
      setActiveScheme('KBM');
      setActiveGamepadName('Mechanical Keyboard');
    };

    const handleMouseDown = () => {
      setLastActiveDevice('mouse');
      setActiveScheme('KBM');
      setActiveGamepadName('Precision Optical Mouse');
    };

    const handleTouchStart = () => {
      setActiveScheme('TOUCH');
      setActiveGamepadName('Touch Interface');
    };

    window.addEventListener('keydown', handleKeyDown, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  // Gamepad connection event listeners & rAF activity watcher
  useEffect(() => {
    let animId: number;

    const checkGamepadActivity = () => {
      if (typeof navigator !== 'undefined' && 'getGamepads' in navigator) {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        let anyConnected = false;

        for (const gp of gamepads) {
          if (!gp) continue;
          anyConnected = true;

          // Check if any button is pressed or stick moved significantly
          const isButtonPressed = gp.buttons.some((btn) => btn.pressed || btn.value > 0.2);
          const isStickMoved = gp.axes.some((axis) => Math.abs(axis) > 0.25);

          if (isButtonPressed || isStickMoved) {
            const brand = detectControllerBrand(gp.id);
            setLastActiveDevice('gamepad');
            setControllerType(brand);
            setActiveGamepadName(gp.id || `${brand.toUpperCase()} Controller`);

            if (brand === 'playstation') setActiveScheme('GAMEPAD_PLAYSTATION');
            else if (brand === 'switch') setActiveScheme('GAMEPAD_SWITCH');
            else setActiveScheme('GAMEPAD_XBOX');
          }
        }
        setGamepadConnected(anyConnected);
      }

      animId = requestAnimationFrame(checkGamepadActivity);
    };

    animId = requestAnimationFrame(checkGamepadActivity);

    const onGamepadConnected = (e: GamepadEvent) => {
      setGamepadConnected(true);
      const brand = detectControllerBrand(e.gamepad.id);
      setControllerType(brand);
      setActiveGamepadName(e.gamepad.id);
    };

    const onGamepadDisconnected = () => {
      if (typeof navigator !== 'undefined' && 'getGamepads' in navigator) {
        const gps = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
        setGamepadConnected(gps.length > 0);
      }
    };

    window.addEventListener('gamepadconnected', onGamepadConnected);
    window.addEventListener('gamepaddisconnected', onGamepadDisconnected);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('gamepadconnected', onGamepadConnected);
      window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
    };
  }, []);

  // Allow manual hardware test toggle for demo/testing without a physical controller
  const simulateDevice = useCallback((scheme: ActiveControlScheme) => {
    setActiveScheme(scheme);
    if (scheme === 'KBM') {
      setLastActiveDevice('keyboard');
      setActiveGamepadName('Mechanical Keyboard & Mouse');
    } else if (scheme === 'GAMEPAD_XBOX') {
      setLastActiveDevice('gamepad');
      setControllerType('xbox');
      setActiveGamepadName('Xbox Wireless Controller');
      setGamepadConnected(true);
    } else if (scheme === 'GAMEPAD_PLAYSTATION') {
      setLastActiveDevice('gamepad');
      setControllerType('playstation');
      setActiveGamepadName('DualSense Wireless Controller');
      setGamepadConnected(true);
    } else if (scheme === 'GAMEPAD_SWITCH') {
      setLastActiveDevice('gamepad');
      setControllerType('switch');
      setActiveGamepadName('Nintendo Switch Pro Controller');
      setGamepadConnected(true);
    } else if (scheme === 'TOUCH') {
      setActiveGamepadName('Virtual Touchscreen Controls');
    }
  }, []);

  return {
    lastActiveDevice,
    controllerType,
    activeScheme,
    gamepadConnected,
    activeGamepadName,
    simulateDevice,
  };
}
