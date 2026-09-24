---
name: Cyber-Darkroom Canvas
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#bdc8d1'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#87929a'
  outline-variant: '#3e484f'
  surface-tint: '#7bd0ff'
  primary: '#8ed5ff'
  on-primary: '#00354a'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#00668a'
  secondary: '#c8c5ca'
  on-secondary: '#303033'
  secondary-container: '#47464a'
  on-secondary-container: '#b6b4b8'
  tertiary: '#cdcbd6'
  on-tertiary: '#2f3038'
  tertiary-container: '#b1b0ba'
  on-tertiary-container: '#43434b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#e4e1e6'
  secondary-fixed-dim: '#c8c5ca'
  on-secondary-fixed: '#1b1b1e'
  on-secondary-fixed-variant: '#47464a'
  tertiary-fixed: '#e3e1ec'
  tertiary-fixed-dim: '#c6c5cf'
  on-tertiary-fixed: '#1a1b22'
  on-tertiary-fixed-variant: '#46464e'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  label-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-mono-xs:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.04em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes a high-performance spatial exhibition canvas engineered for creative technologists, fine-art photographers, and digital artists. Blending the ritualistic atmosphere of a traditional chemical darkroom with the hyper-precise ergonomics of advanced computational visualization tools, the interface operates as an invisible, non-destructive stage that lets master-level imagery command focal precedence.

The aesthetic philosophy draws heavily on **Glassmorphism married with Minimal Precision Engineering**:
- Deep obsidian and charcoal tonal planes eliminate peripheral ocular fatigue and color bias during sensitive grading tasks.
- Floating translucent surfaces with structural hairline borders simulate physical optical stages.
- Focused laser-etched neon accents create visceral, responsive affordances without distracting from color-critical visual assets.

## Colors

Color functions with technical restraint to preserve perceptual neutral-point adaptation across varied monitor calibrations:

- **Obsidian Black Canvas (`#09090b`)**: The primary deep darkroom background. Nullifies ambient glare and delivers maximum dynamic range for displayed assets.
- **Deep Zinc Surface (`#18181b`)**: Deployed across floating control docks, inspector panes, and modal sheets, layered at varying opacities (`rgba(24, 24, 27, 0.70)` to `rgba(24, 24, 27, 0.85)`) over background blurs.
- **Solid Zinc Backing (`#18181b` / `#27272a`)**: Provides structural grounding behind unloaded imagery, high-resolution textures, and canvas viewports.
- **Electric Neon Sky (`#38bdf8`)**: The definitive state-change anchor. Reserved strictly for active selection bounding boxes, focus states, scrub heads, and primary execution paths. Accompanied by a tuned photonic halo (`0 0 15px rgba(56, 189, 248, 0.40)`).
- **Crisp Light Neutral (`#f4f4f5`)**: High-contrast, optical foreground for active titles, selected states, and iconography.
- **Muted Slate (`#71717a`)**: Secondary telemetry value reserved for inactive tools, structural dividers, aperture settings, shutter speeds, and sensor metadata.

## Typography

The typography couples the functional clarity of a modern geometric sans-serif with the computational precision of a developer monospaced face:

- **Inter**: Drives all administrative, navigational, and narrative typographic hierarchy. Tight negative letter-spacing ensures a solid, architectural appearance, preventing visual drift on ultra-wide gamut monitors.
- **JetBrains Mono**: Exclusively handles camera metadata, EXIF parameters (ISO, focal lengths, apertures, stops), color spaces, coordinates, and real-time rendering statistics. It introduces visual cadence and tabular alignment across inspector drawers and dynamic image overlays.

## Layout & Spacing

The canvas leverages a dynamic, fluid layout model designed around infinite canvas panning, masonry mosaic arrangements, and persistent floating utility islands:

- **Breakpoints**: Mobile (<640px), Tablet (640px - 1024px), Desktop (1024px - 1440px), and Ultrawide Display (>1440px).
- **Responsive Behavior**: 
  - On mobile screens, inspector panels dock to bottom sheets with safe-area padding; grids collapse to single- or dual-column streams with fixed margins (`1rem`).
  - On desktop and ultrawide viewports, margins expand to `2.5rem`, allowing the central darkroom canvas to breathe freely while floating tools anchor seamlessly to corner orbits or persistent bottom docks.
- **Rhythm**: All paddings and internal gaps operate on an exact 4px-based fractional scale to lock UI components to strict sub-pixel alignments.

## Elevation & Depth

Spatial depth is engineered through physical optical layers rather than high-contrast dropshadows:

1. **Base Layer (Canvas Ground)**: `#09090b` zero-elevation surface. Pure void designed to receive assets without chromatic interference.
2. **Structural Mid-ground (Asset Cards & Group Bounds)**: Solid `#18181b` backing. Separated from base via a hairline outline of `1px solid rgba(39, 39, 42, 0.8)`.
3. **Floating Foreground (HUD Docks, Floating Palettes, Menus)**: `rgba(24, 24, 27, 0.72)` combined with `backdrop-filter: blur(24px) saturate(180%)`. Bordered by a delicate optical rim: `1px solid rgba(63, 63, 70, 0.4)`.
4. **Active Selection & Hover States**: Transitioning elements trigger a subtle physical lift (`scale(1.02)`) accompanied by a distinct luminous back-glow: `box-shadow: 0 0 20px -2px rgba(56, 189, 248, 0.35), 0 0 0 1px #38bdf8`.

## Shapes

The design system enforces a disciplined geometric curvature hierarchy:

- **Standard Containers (`rounded-md` / 0.5rem)**: Contextual dropdowns, form inputs, tool tips, and inline action buttons.
- **Gallery Assets (`rounded-xl` / 1rem)**: Visual asset cards, spatial nodes, and lightbox preview framing to preserve natural picture boundaries without clipping edge information.
- **Floating Docks & Modals (`rounded-2xl` / 1.5rem)**: Shell-level panels, global control docks, and primary dialogue canvases, establishing a softer, ergonomic silhouette that floats effortlessly above the strict media below.

## Components

### Action Buttons
- **Primary Cyber-Action**: Background of solid `#38bdf8`, foreground text `#09090b` (Inter Medium). On hover, activates a photonic aura (`box-shadow: 0 0 16px rgba(56, 189, 248, 0.5)`).
- **Secondary Darkroom Action**: Translucent zinc surface (`rgba(24, 24, 27, 0.8)`), text `#f4f4f5`, border `1px solid rgba(63, 63, 70, 0.5)`. Hover elevates border to `rgba(113, 113, 122, 0.8)` and background to `#27272a`.
- **Ghost Tool Buttons**: Transparent background, text `#71717a`. Hover switches text to `#f4f4f5` and fills with `rgba(255, 255, 255, 0.05)`.

### Asset Cards & Viewport Tiles
- Built with a solid `#18181b` substrate to prevent optical bleeding during lazy-loading.
- Border radius fixed at `rounded-xl`.
- Dynamic overlay on hover reveals EXIF metadata badge (JetBrains Mono) and quick-action tool row against an anchored bottom gradient scrim.
- Selected state asserts an electric outline (`1px solid #38bdf8`) with an ambient drop glow (`shadow-sky-500/20 scale-[1.02]`).

### EXIF & Telemetry Chips
- Pill-shaped or subtle `rounded-md` tags carrying camera parameters (e.g., `50mm f/1.2 1/1000s ISO 100`).
- Background: `rgba(9, 9, 11, 0.75)`, backdrop blur of `8px`.
- Typography: `label-mono-xs` in `#71717a`, key parameters highlighted in `#f4f4f5`.

### Input Fields & Sliders
- **Text Inputs**: Flat `#09090b` field with `1px solid rgba(63, 63, 70, 0.4)` border, transitioning to `#38bdf8` on focus with a zero-offset ring glow.
- **Parameter Sliders (Grade / Exposure / Spatial Coordinate)**: Ultra-thin 2px track in `#27272a`, active fill in `#38bdf8`, and a crisp 10px circular thumb with internal dark core. JetBrains Mono value label dynamically pinned above the thumb.

### Floating Command Dock
- Positioned floating centrally along the canvas boundary.
- Radius: `rounded-2xl`.
- Background: `rgba(24, 24, 27, 0.75)` with `backdrop-blur-xl`.
- Inner hairline border: `1px solid rgba(255, 255, 255, 0.08)`.
- Iconography sized to 18px with `space-sm` separation, providing tactile, responsive feedback on click.