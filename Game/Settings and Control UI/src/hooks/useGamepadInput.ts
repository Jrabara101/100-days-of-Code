import { useState, useEffect, useRef } from 'react';
import { GamepadStateSnapshot, ControllerType } from '@/types/settings';
import { detectControllerBrand } from './useInputDeviceDetector';

const EMPTY_GAMEPAD_STATE: GamepadStateSnapshot = {
  connected: false,
  id: 'None',
  controllerType: 'xbox',
  buttons: Array.from({ length: 17 }, (_, i) => ({
    index: i,
    pressed: false,
    value: 0,
    label: `B${i}`,
  })),
  axes: {
    leftStickX: 0,
    leftStickY: 0,
    rightStickX: 0,
    rightStickY: 0,
  },
  leftTrigger: 0,
  rightTrigger: 0,
};

export function useGamepadInput(deadzoneThreshold: number = 0.12) {
  const [gamepadState, setGamepadState] = useState<GamepadStateSnapshot>(EMPTY_GAMEPAD_STATE);
  const animFrameRef = useRef<number | null>(null);

  // Simulated stick positions if user is moving sticks via mouse/test buttons
  const simulatedAxesRef = useRef({
    leftStickX: 0,
    leftStickY: 0,
    rightStickX: 0,
    rightStickY: 0,
    leftTrigger: 0,
    rightTrigger: 0,
  });

  useEffect(() => {
    const pollGamepad = () => {
      let activeGamepad: Gamepad | null = null;

      if (typeof navigator !== 'undefined' && 'getGamepads' in navigator) {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (const gp of gamepads) {
          if (gp && gp.connected) {
            activeGamepad = gp;
            break;
          }
        }
      }

      if (activeGamepad) {
        const brand = detectControllerBrand(activeGamepad.id);
        const axes = activeGamepad.axes;
        const buttons = activeGamepad.buttons;

        // Raw stick values
        const rawLx = axes[0] ?? 0;
        const rawLy = axes[1] ?? 0;
        const rawRx = axes[2] ?? 0;
        const rawRy = axes[3] ?? 0;

        // Triggers (Standard Gamepad mapping: index 6 = LT, index 7 = RT)
        const ltVal = buttons[6]?.value ?? 0;
        const rtVal = buttons[7]?.value ?? 0;

        setGamepadState({
          connected: true,
          id: activeGamepad.id,
          controllerType: brand,
          buttons: buttons.map((b, idx) => ({
            index: idx,
            pressed: b.pressed,
            value: b.value,
            label: `B${idx}`,
          })),
          axes: {
            leftStickX: Math.abs(rawLx) < 0.02 ? 0 : rawLx,
            leftStickY: Math.abs(rawLy) < 0.02 ? 0 : rawLy,
            rightStickX: Math.abs(rawRx) < 0.02 ? 0 : rawRx,
            rightStickY: Math.abs(rawRy) < 0.02 ? 0 : rawRy,
          },
          leftTrigger: ltVal,
          rightTrigger: rtVal,
        });
      } else {
        // Fallback to simulated input state if user tested deflection sliders
        const sim = simulatedAxesRef.current;
        setGamepadState((prev) => ({
          ...prev,
          connected: false,
          axes: {
            leftStickX: sim.leftStickX,
            leftStickY: sim.leftStickY,
            rightStickX: sim.rightStickX,
            rightStickY: sim.rightStickY,
          },
          leftTrigger: sim.leftTrigger,
          rightTrigger: sim.rightTrigger,
        }));
      }

      animFrameRef.current = requestAnimationFrame(pollGamepad);
    };

    animFrameRef.current = requestAnimationFrame(pollGamepad);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [deadzoneThreshold]);

  // Methods to manually test/simulate stick movement in sandbox if no physical controller is plugged in
  const setSimulatedStick = (stick: 'left' | 'right', x: number, y: number) => {
    if (stick === 'left') {
      simulatedAxesRef.current.leftStickX = Math.max(-1, Math.min(1, x));
      simulatedAxesRef.current.leftStickY = Math.max(-1, Math.min(1, y));
    } else {
      simulatedAxesRef.current.rightStickX = Math.max(-1, Math.min(1, x));
      simulatedAxesRef.current.rightStickY = Math.max(-1, Math.min(1, y));
    }
  };

  const setSimulatedTrigger = (trigger: 'left' | 'right', val: number) => {
    if (trigger === 'left') {
      simulatedAxesRef.current.leftTrigger = Math.max(0, Math.min(1, val));
    } else {
      simulatedAxesRef.current.rightTrigger = Math.max(0, Math.min(1, val));
    }
  };

  // Helper: compute effective post-deadzone deflection
  const computeDeflection = (x: number, y: number, deadzone: number) => {
    const rawMag = Math.hypot(x, y);
    if (rawMag <= deadzone) {
      return { x: 0, y: 0, magnitude: 0, insideDeadzone: true };
    }
    const scaledMag = Math.min(1, (rawMag - deadzone) / (1 - deadzone));
    const angle = Math.atan2(y, x);
    return {
      x: Math.cos(angle) * scaledMag,
      y: Math.sin(angle) * scaledMag,
      magnitude: scaledMag,
      insideDeadzone: false,
    };
  };

  return {
    gamepadState,
    computeDeflection,
    setSimulatedStick,
    setSimulatedTrigger,
  };
}
