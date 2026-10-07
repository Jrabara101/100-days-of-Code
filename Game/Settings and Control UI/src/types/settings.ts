export type InputDevice = 'keyboard' | 'mouse' | 'gamepad';
export type ControllerType = 'xbox' | 'playstation' | 'switch' | 'generic';
export type ActiveControlScheme = 'KBM' | 'GAMEPAD_XBOX' | 'GAMEPAD_PLAYSTATION' | 'GAMEPAD_SWITCH' | 'TOUCH';

export type RebindFSMState = 'IDLE' | 'LISTENING_FOR_BIND' | 'CONFLICT_DETECTED' | 'APPLYING' | 'SAVED';

export type ActionCategory = 'movement' | 'combat' | 'interaction' | 'ui';

export interface BindingSlot {
  device: InputDevice;
  code: string; // e.g. 'KeyW', 'GamepadButton0', 'Mouse0', 'ControlLeft+KeyF'
  displayGlyph: string;
}

export interface ControlBinding {
  actionId: string;
  actionLabel: string;
  category: ActionCategory;
  primary: BindingSlot;
  secondary?: BindingSlot;
  isModified: boolean;
  reserved?: boolean;
  description?: string;
  defaultPrimary: BindingSlot;
  defaultSecondary?: BindingSlot;
}

export interface ConflictDetails {
  attemptedCode: string;
  attemptedDevice: InputDevice;
  attemptedGlyph: string;
  incomingActionId: string;
  incomingSlot: 'primary' | 'secondary';
  conflictingActionId: string;
  conflictingActionLabel: string;
  conflictingSlot: 'primary' | 'secondary';
}

export interface GameplaySettings {
  mouseSensitivity: number; // 0.1 to 10.0
  invertYAxis: boolean;
  toggleSprint: boolean;
  toggleCrouch: boolean;
  stickDeadzone: number; // 0.0 to 0.5
  responseCurve: 'linear' | 'exponential' | 's-curve';
  adsHold: boolean;
  vibrationEnabled: boolean;
  vibrationIntensity: number; // 0 to 100
}

export interface AudioSettings {
  masterVolume: number; // 0 to 100
  sfxVolume: number;
  musicVolume: number;
  voiceVolume: number;
  uiVolume: number;
  audioOutput: 'stereo' | 'surround' | 'headphones';
  muteWhenUnfocused: boolean;
}

export interface VideoSettings {
  resolution: string;
  displayMode: 'fullscreen' | 'borderless' | 'windowed';
  vSync: boolean;
  fov: number; // 60 to 120
  frameRateLimit: number; // 30, 60, 120, 144, 240, 0 (unlimited)
  motionBlur: boolean;
  brightness: number; // 0 to 100
}

export type ErgonomicPreset = 'standard' | 'single-handed-left' | 'single-handed-right' | 'reduced-fatigue' | 'high-contrast';

export interface AccessibilitySettings {
  presetArchetype: ErgonomicPreset;
  highContrastFocusMarkers: boolean;
  cameraShakeReduction: boolean;
  stickSwapAxes: boolean;
  toggleVsHoldOverrides: boolean;
  uiScale: number; // 80 to 120
}

export interface SettingsState {
  activeTab: 'controls' | 'audio' | 'video' | 'gameplay' | 'accessibility';
  deviceContext: {
    lastActiveDevice: InputDevice;
    controllerType: ControllerType;
    gamepadConnected: boolean;
  };
  controls: Record<string, ControlBinding>;
  gameplaySettings: GameplaySettings;
  audioSettings: AudioSettings;
  videoSettings: VideoSettings;
  accessibilitySettings: AccessibilitySettings;
  rebindingState: {
    isListening: boolean;
    fsmState: RebindFSMState;
    targetActionId: string | null;
    targetSlot: 'primary' | 'secondary' | null;
    conflictActionId: string | null;
    conflictDetails: ConflictDetails | null;
  };
  isDirty: boolean;
}

export interface GamepadStateSnapshot {
  connected: boolean;
  id: string;
  controllerType: ControllerType;
  buttons: {
    index: number;
    pressed: boolean;
    value: number; // 0 to 1, useful for analog triggers
    label: string;
  }[];
  axes: {
    leftStickX: number;
    leftStickY: number;
    rightStickX: number;
    rightStickY: number;
  };
  leftTrigger: number; // 0 to 1
  rightTrigger: number; // 0 to 1
}
