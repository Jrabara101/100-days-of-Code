import { ControlBinding } from '@/types/settings';
import { isCodeReserved } from '@/constants/reservedKeys';

export interface SanitizerReport {
  isValid: boolean;
  violations: string[];
  sanitizedBindings: Record<string, ControlBinding>;
  flags: {
    turboDetected: boolean;
    compoundMacroViolations: number;
    illegalKeysNeutralized: number;
  };
}

export function sanitizeProfileControls(
  rawControls: Record<string, ControlBinding>
): SanitizerReport {
  const violations: string[] = [];
  const sanitizedBindings: Record<string, ControlBinding> = {};
  let illegalKeysNeutralized = 0;
  let compoundMacroViolations = 0;

  for (const [actionId, binding] of Object.entries(rawControls)) {
    const cleanBinding: ControlBinding = { ...binding };

    // 1. Validate primary bind
    const primaryCheck = isCodeReserved(cleanBinding.primary.code, actionId);
    if (primaryCheck.reserved) {
      violations.push(`Primary binding for "${binding.actionLabel}" violates tournament policy: ${primaryCheck.reason}`);
      cleanBinding.primary = { ...cleanBinding.defaultPrimary };
      illegalKeysNeutralized++;
    }

    // 2. Validate secondary bind if present
    if (cleanBinding.secondary) {
      const secondaryCheck = isCodeReserved(cleanBinding.secondary.code, actionId);
      if (secondaryCheck.reserved) {
        violations.push(`Secondary binding for "${binding.actionLabel}" violates tournament policy: ${secondaryCheck.reason}`);
        cleanBinding.secondary = cleanBinding.defaultSecondary ? { ...cleanBinding.defaultSecondary } : undefined;
        illegalKeysNeutralized++;
      }

      // Check for compound turbo scripts (e.g. macro chaining with '+' exceeding 2 modifiers)
      if (cleanBinding.secondary && cleanBinding.secondary.code.split('+').length > 2) {
        violations.push(`Secondary binding "${cleanBinding.secondary.code}" exceeds multi-modifier tournament macro threshold.`);
        cleanBinding.secondary = cleanBinding.defaultSecondary ? { ...cleanBinding.defaultSecondary } : undefined;
        compoundMacroViolations++;
      }
    }

    sanitizedBindings[actionId] = cleanBinding;
  }

  return {
    isValid: violations.length === 0,
    violations,
    sanitizedBindings,
    flags: {
      turboDetected: false,
      compoundMacroViolations,
      illegalKeysNeutralized,
    },
  };
}
