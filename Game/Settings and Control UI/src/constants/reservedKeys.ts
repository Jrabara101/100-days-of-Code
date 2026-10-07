// Reserved keys that cannot be mapped or have special system restrictions
export const SYSTEM_BLOCKED_CODES = new Set([
  'F5',
  'F11',
  'F12',
  'ControlLeft+AltLeft+Delete',
  'MetaLeft',
  'MetaRight',
]);

// Actions with specific restriction rules (e.g. Pause cannot be bound to Left Click)
export const ACTION_RESTRICTIONS: Record<string, { blockedCodes?: string[]; warningMessage?: string }> = {
  pause_menu: {
    blockedCodes: ['Mouse0', 'Mouse1'],
    warningMessage: 'Pause / Menu cannot be bound to Primary or Secondary Mouse Click.',
  },
  fire: {
    blockedCodes: ['Escape'],
    warningMessage: 'Combat Fire cannot be mapped to Escape.',
  },
};

export function isCodeReserved(code: string, actionId?: string): { reserved: boolean; reason?: string } {
  if (SYSTEM_BLOCKED_CODES.has(code)) {
    return {
      reserved: true,
      reason: `Key "${code}" is a reserved operating system shortcut and cannot be bound.`,
    };
  }

  if (actionId && ACTION_RESTRICTIONS[actionId]?.blockedCodes?.includes(code)) {
    return {
      reserved: true,
      reason: ACTION_RESTRICTIONS[actionId].warningMessage || `Code "${code}" is prohibited for this action.`,
    };
  }

  return { reserved: false };
}
