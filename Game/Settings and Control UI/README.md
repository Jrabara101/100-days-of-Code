# Tactical Avionics Deck — Settings & Controls Menu Engine

> A production-ready, ultra-responsive calibration deck and controls remap suite built with React 18, Vite, TypeScript, Tailwind CSS, and Web Audio/Haptic synthesis.

---

## ⚡ Non-Technical Vision & Key Capabilities

- **Intelligent Keybind Conflict & Re-Map Matrix:** Input collisions never silently break the player's control scheme. Attempting to assign an occupied key prompts an intelligent condition-driven resolution sheet—offering instant one-click swap, cascading assignment shifts, or secondary modifier attachments (`Ctrl + Key`) with immediate warning validation.
- **Live Input Calibration & Deadzone Test Arena:** Embedded interactive 60 FPS sandbox widget displaying real-time 3D stick deflection graphs, analog trigger squeeze percentages, mouse DPI velocity curves, and a micro-avatar that executes jump, sprint, aim, and weapon fire actions directly inside the settings menu.
- **Automatic Hardware Detection & Dynamic Glyph Swapping:** The UI detects active input hardware in real time. Nudging an analog stick on an Xbox, DualSense (PlayStation), or Nintendo Switch controller instantly morphs all on-screen button prompts and menu legends into authentic platform-specific icons without page refresh or manual mode toggles.
- **Universal Accessibility & Ergonomic Archetypes:** Beyond basic remapping, the system provides one-click control presets tailored for varied physical capabilities—including single-handed modes (left/right bias), toggle-versus-hold overrides for high-fatigue actions (Sprint, ADS, Crouch), stick-swap axes, and high-contrast UI focus markers.
- **Granular Change Tracking & Differential Reset:** Every modified slider, toggle, or control key displays a persistent "Altered" status pip, allowing players to audit tweaked values at a glance or selectively roll back single parameters without wiping out their entire configuration.
- **Encrypted Cross-Device Profile Sync & Macro Sanitizer:** Key configurations and accessibility profiles sync seamlessly via compressed URL hashes or `.json` backups for tournament play. The built-in rule validator neutralizes illegal hardware macro scripts or impossible turbo configurations on competitive leaderboards.

---

## 🛠️ Architecture & System Design

```
src/
├── types/
│   └── settings.ts               # Core state interfaces & FSM types
├── constants/
│   ├── defaultSettings.ts        # Factory bindings & baseline state
│   ├── glyphs.ts                 # Cross-platform glyph dictionaries (Xbox, PS, Switch, KBM)
│   └── reservedKeys.ts           # System protected keys & restriction validator
├── services/
│   ├── audioService.ts           # Synthesized Web Audio API sound engine (zero audio asset dependencies)
│   ├── hapticsService.ts         # Gamepad vibrationActuator dual-rumble + navigator.vibrate
│   ├── storageService.ts         # LocalStorage with schema migration & URL hash compression
│   └── macroSanitizer.ts         # Tournament macro boundary rule inspector
├── hooks/
│   ├── useInputDeviceDetector.ts # Real-time hardware scheme listener (KBM, Xbox, PS, Switch, Touch)
│   ├── useGamepadInput.ts        # Sub-frame rAF Gamepad polling & deadzone vector math
│   └── useKeybindManager.ts      # Rebind State Machine (IDLE -> LISTENING -> CONFLICT -> SAVED)
├── components/
│   ├── ui/                       # Tactile industrial primitives (Button, Slider, Switch)
│   ├── controls/
│   │   ├── KeycapButton.tsx      # Tactile button (idle, hover, listening pulse, conflict shake)
│   │   ├── KeybindRow.tsx        # Action row with altered pip & differential rollback
│   │   └── ConflictDialog.tsx    # Intelligent conflict resolution modal sheet
│   ├── calibration/
│   │   ├── DeadzoneVisualizer.tsx# SVG circular vector tracking radar with draggable thumbstick pad
│   │   ├── SandboxArena.tsx      # Live micro-avatar test arena with target collision and projectiles
│   │   └── HardwareWorkbench.tsx # Sticky calibration bench with trigger squeeze & switch bus
│   ├── tabs/
│   │   ├── ControlsTab.tsx       # Matrix grouped by category with search & preset selectors
│   │   ├── GameplayTab.tsx       # Mouse sensitivity, deadzone, response curves, and toggles
│   │   ├── AudioTab.tsx          # Channel volume mix with synthesized audio test triggers
│   │   ├── VideoTab.tsx          # Resolution, display mode, FOV, frame rate cap
│   │   ├── AccessibilityTab.tsx  # Ergonomic archetypes, stick swap, high-contrast markers
│   │   └── ProfileSyncTab.tsx    # Compressed URL hash sync and esports macro audit
│   ├── demo/
│   │   └── GameBackground.tsx    # Sci-fi tactical combat simulator background with ESC toggle
│   ├── SettingsModal.tsx         # Central 1080p Tactical Avionics Deck Chassis
│   └── App.tsx                   # Master orchestration entrypoint
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## 🎮 How to Test Without a Physical Gamepad
The interface includes built-in hardware profile emulation in the right workbench:
1. Click **KBM**, **XBOX**, **PS5**, or **SWITCH** in the **Hardware Profile Emulation** dock to instantly switch glyphs and layout styles.
2. Drag inside the **Deflection Radar** or **Sandbox Arena** to test stick deadzone vectors and move the micro-avatar.
3. Press **[ESC]** at any time to return to the combat backdrop or reopen the settings console.
