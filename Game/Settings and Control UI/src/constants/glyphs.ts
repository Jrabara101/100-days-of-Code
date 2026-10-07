import { InputDevice, ControllerType } from '@/types/settings';

export const KEYBOARD_GLYPH_MAP: Record<string, string> = {
  KeyW: 'W',
  KeyA: 'A',
  KeyS: 'S',
  KeyD: 'D',
  KeyE: 'E',
  KeyQ: 'Q',
  KeyR: 'R',
  KeyF: 'F',
  KeyC: 'C',
  KeyV: 'V',
  KeyG: 'G',
  KeyT: 'T',
  KeyZ: 'Z',
  KeyX: 'X',
  KeyM: 'M',
  KeyI: 'I',
  KeyB: 'B',
  KeyP: 'P',
  Space: 'SPACE',
  ShiftLeft: 'L-SHIFT',
  ShiftRight: 'R-SHIFT',
  ControlLeft: 'L-CTRL',
  ControlRight: 'R-CTRL',
  AltLeft: 'L-ALT',
  AltRight: 'R-ALT',
  Tab: 'TAB',
  CapsLock: 'CAPS',
  Escape: 'ESC',
  Enter: 'ENTER',
  Backspace: 'BKSP',
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
  Digit4: '4',
  Digit5: '5',
};

export const MOUSE_GLYPH_MAP: Record<string, string> = {
  Mouse0: 'M1 [LEFT]',
  Mouse1: 'M2 [RIGHT]',
  Mouse2: 'M3 [MIDDLE]',
  Mouse3: 'M4 [SIDE 1]',
  Mouse4: 'M5 [SIDE 2]',
  WheelUp: 'WHEEL UP',
  WheelDown: 'WHEEL DOWN',
};

export const XBOX_GLYPH_MAP: Record<string, string> = {
  GamepadButton0: 'A',
  GamepadButton1: 'B',
  GamepadButton2: 'X',
  GamepadButton3: 'Y',
  GamepadButton4: 'LB',
  GamepadButton5: 'RB',
  GamepadButton6: 'LT',
  GamepadButton7: 'RT',
  GamepadButton8: 'VIEW',
  GamepadButton9: 'MENU',
  GamepadButton10: 'LS CLICK',
  GamepadButton11: 'RS CLICK',
  GamepadButton12: 'D-PAD UP',
  GamepadButton13: 'D-PAD DOWN',
  GamepadButton14: 'D-PAD LEFT',
  GamepadButton15: 'D-PAD RIGHT',
  GamepadButton16: 'XBOX',
};

export const PLAYSTATION_GLYPH_MAP: Record<string, string> = {
  GamepadButton0: '✕ CROSS',
  GamepadButton1: '○ CIRCLE',
  GamepadButton2: '□ SQUARE',
  GamepadButton3: '△ TRIANGLE',
  GamepadButton4: 'L1',
  GamepadButton5: 'R1',
  GamepadButton6: 'L2',
  GamepadButton7: 'R2',
  GamepadButton8: 'SHARE',
  GamepadButton9: 'OPTIONS',
  GamepadButton10: 'L3',
  GamepadButton11: 'R3',
  GamepadButton12: 'D-PAD UP',
  GamepadButton13: 'D-PAD DOWN',
  GamepadButton14: 'D-PAD LEFT',
  GamepadButton15: 'D-PAD RIGHT',
  GamepadButton16: 'PS',
};

export const SWITCH_GLYPH_MAP: Record<string, string> = {
  GamepadButton0: 'B',
  GamepadButton1: 'A',
  GamepadButton2: 'Y',
  GamepadButton3: 'X',
  GamepadButton4: 'L',
  GamepadButton5: 'R',
  GamepadButton6: 'ZL',
  GamepadButton7: 'ZR',
  GamepadButton8: 'MINUS (-)',
  GamepadButton9: 'PLUS (+)',
  GamepadButton10: 'LS CLICK',
  GamepadButton11: 'RS CLICK',
  GamepadButton12: 'D-PAD UP',
  GamepadButton13: 'D-PAD DOWN',
  GamepadButton14: 'D-PAD LEFT',
  GamepadButton15: 'D-PAD RIGHT',
  GamepadButton16: 'HOME',
};

export function getDisplayGlyph(
  code: string,
  device: InputDevice,
  controllerType: ControllerType = 'xbox'
): string {
  // If it's a compound modifier bind like 'ControlLeft+KeyF'
  if (code.includes('+')) {
    return code
      .split('+')
      .map((part) => getDisplayGlyph(part, device, controllerType))
      .join(' + ');
  }

  if (device === 'mouse') {
    return MOUSE_GLYPH_MAP[code] || code.toUpperCase();
  }

  if (device === 'gamepad') {
    if (controllerType === 'playstation') {
      return PLAYSTATION_GLYPH_MAP[code] || code.replace('GamepadButton', 'BTN ');
    }
    if (controllerType === 'switch') {
      return SWITCH_GLYPH_MAP[code] || code.replace('GamepadButton', 'BTN ');
    }
    return XBOX_GLYPH_MAP[code] || code.replace('GamepadButton', 'BTN ');
  }

  // Keyboard
  return KEYBOARD_GLYPH_MAP[code] || code.replace('Key', '').replace('Digit', '').toUpperCase();
}
