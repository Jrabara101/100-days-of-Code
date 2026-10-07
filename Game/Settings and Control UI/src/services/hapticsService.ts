// Gamepad Vibration and Mobile Haptic feedback service

export interface VibrationOptions {
  duration?: number;
  weakMagnitude?: number;
  strongMagnitude?: number;
}

class HapticsService {
  private enabled: boolean = true;
  private intensity: number = 0.85;

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public setIntensity(val: number) {
    this.intensity = Math.max(0, Math.min(1, val / 100));
  }

  /**
   * Triggers haptic pulse on gamepad and navigator vibration
   */
  public pulse(options: VibrationOptions = {}) {
    if (!this.enabled || this.intensity <= 0) return;

    const duration = options.duration ?? 80;
    const weakMagnitude = (options.weakMagnitude ?? 0.5) * this.intensity;
    const strongMagnitude = (options.strongMagnitude ?? 0.3) * this.intensity;

    // 1. Try Gamepad Vibration Actuator
    if (typeof navigator !== 'undefined' && 'getGamepads' in navigator) {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const gp of gamepads) {
        if (gp && gp.connected && (gp as unknown as { vibrationActuator?: { playEffect: Function } }).vibrationActuator) {
          try {
            (gp as unknown as { vibrationActuator: { playEffect: Function } }).vibrationActuator.playEffect('dual-rumble', {
              startDelay: 0,
              duration,
              weakMagnitude,
              strongMagnitude,
            });
          } catch {
            // Ignore vibration actuator failures
          }
        }
      }
    }

    // 2. Mobile touch navigator fallback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(Math.min(duration, 50));
      } catch {
        // Ignore fallback errors
      }
    }
  }

  public lightClick() {
    this.pulse({ duration: 30, weakMagnitude: 0.3, strongMagnitude: 0.1 });
  }

  public successPulse() {
    this.pulse({ duration: 150, weakMagnitude: 0.8, strongMagnitude: 0.6 });
  }

  public conflictWarning() {
    this.pulse({ duration: 180, weakMagnitude: 1.0, strongMagnitude: 0.9 });
  }
}

export const hapticsService = new HapticsService();
