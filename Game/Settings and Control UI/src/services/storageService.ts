import { SettingsState } from '@/types/settings';
import { INITIAL_SETTINGS_STATE } from '@/constants/defaultSettings';
import { sanitizeProfileControls } from '@/services/macroSanitizer';

const STORAGE_KEY = 'tactical_avionics_settings_v1';

export function loadSettingsFromStorage(): SettingsState {
  if (typeof window === 'undefined') return INITIAL_SETTINGS_STATE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_SETTINGS_STATE;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return INITIAL_SETTINGS_STATE;

    // Validate controls and sanitize
    const rawControls = parsed.controls || INITIAL_SETTINGS_STATE.controls;
    const { sanitizedBindings } = sanitizeProfileControls(rawControls);

    return {
      ...INITIAL_SETTINGS_STATE,
      ...parsed,
      controls: sanitizedBindings,
      rebindingState: INITIAL_SETTINGS_STATE.rebindingState,
      isDirty: false,
    };
  } catch (err) {
    console.warn('Failed to load settings from storage; falling back to initial.', err);
    return INITIAL_SETTINGS_STATE;
  }
}

export function saveSettingsToStorage(state: SettingsState): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const exportable = {
      controls: state.controls,
      gameplaySettings: state.gameplaySettings,
      audioSettings: state.audioSettings,
      videoSettings: state.videoSettings,
      accessibilitySettings: state.accessibilitySettings,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exportable));
    return true;
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
    return false;
  }
}

export function exportSettingsToUrlHash(state: SettingsState): string {
  try {
    const payload = {
      v: 1,
      c: state.controls,
      g: state.gameplaySettings,
      a: state.audioSettings,
      acc: state.accessibilitySettings,
    };
    const json = JSON.stringify(payload);
    // Base64 encode URL-safe
    const b64 = btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return b64;
  } catch (err) {
    console.error('Failed to generate hash:', err);
    return '';
  }
}

export function importSettingsFromUrlHash(hash: string): Partial<SettingsState> | null {
  try {
    let cleanB64 = hash.replace(/-/g, '+').replace(/_/g, '/');
    while (cleanB64.length % 4) {
      cleanB64 += '=';
    }
    const json = decodeURIComponent(escape(atob(cleanB64)));
    const payload = JSON.parse(json);

    if (payload && payload.c) {
      const { sanitizedBindings } = sanitizeProfileControls(payload.c);
      return {
        controls: sanitizedBindings,
        gameplaySettings: payload.g || INITIAL_SETTINGS_STATE.gameplaySettings,
        audioSettings: payload.a || INITIAL_SETTINGS_STATE.audioSettings,
        accessibilitySettings: payload.acc || INITIAL_SETTINGS_STATE.accessibilitySettings,
      };
    }
    return null;
  } catch (err) {
    console.error('Failed to parse URL hash profile:', err);
    return null;
  }
}
