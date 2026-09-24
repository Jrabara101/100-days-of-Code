---
name: Whimsical Comic Atelier
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d1f27'
  surface-container-high: '#272a32'
  surface-container-highest: '#32353d'
  on-surface: '#e1e2ec'
  on-surface-variant: '#d8c3ad'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2d3038'
  outline: '#a08e7a'
  outline-variant: '#534434'
  surface-tint: '#ffb95f'
  primary: '#ffc174'
  on-primary: '#472a00'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#855300'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#56e5a9'
  on-tertiary: '#003824'
  tertiary-container: '#30c88f'
  on-tertiary-container: '#004e34'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353d'
typography:
  display-hero:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  code-timecode:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  code-sub:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
  sticker-badge:
    fontFamily: Outfit
    fontSize: 11px
    fontWeight: '800'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system synthesizes professional creative-suite ergonomics with the expressive spirit of graphic novels and indie animation ateliers. Targeted at storyboard artists, episodic scriptwriters, visual novel developers, and creative directors, the aesthetic reconciles rigorous workstation utility with tactile, ink-and-paper charm.

### Design Movement & Visual Philosophy
The aesthetic fuses **Tactile Brutalism** and **Neon Cyber-Editorial**:
- **Panelized Canvas Architecture:** Windows, inspectors, and timelines behave like comic panels with defined, high-contrast borders and sharp spatial relationships.
- **Graphic Novel Ornamentation:** Halftone dot-grids on background stages, tilted sticker-pill badges, and hand-drawn micro-accents punctuate an otherwise clean, dark-mode software interface.
- **Physicality and Play:** Interactive elements simulate physical stationery—punchy click-down offsets, matte surface sheens, and luminous neon inks layered over deep drafting boards.

## Colors

The color hierarchy balances a light-absorbing obsidian drafting stage against electric pigment accents:

- **Surface Neutral Canvas (`#0A0D14`):** The primary canvas substrate, textured subtly with faint dot-matrix halftones (`#1F2937` at 25% opacity) to evoke pre-print drafting sheets.
- **Docked Panels (`#111827` & `#1F2937`):** Tonal surface tiers for sidebars, inspector docks, and timeline shelves. Structured by crisp structural dividers (`#374151`).
- **Primary Ink - Luminous Amber (`#F59E0B`):** The beacon color for keyframes, cursor playheads, primary actions, and selected frame highlights.
- **Secondary Ink - Electric Violet (`#8B5CF6`):** The timeline runner, playback transport controls, audio track stems, and interactive scene triggers.
- **Tertiary Ink - Bright Emerald (`#10B981`):** Production statuses, export pipelines, approval badges, and live collaboration indicators.
- **Text Tiers:** Pristine ink white (`#F9FAFB`) for display headings, muted newsprint tone (`#9CA3AF`) for meta-labels and parameters, and disabled wash (`#4B5563`).

## Typography

The typographic hierarchy pairs crisp geometric modernist layouts with mechanical code precision:

- **Display & Headlines (`Outfit`):** High geometric presence with tight tracking (`-0.02em` to `-0.03em`) provides bold, graphic-novel title weight while remaining legible in software toolbars.
- **Interface & Narrative Copy (`Plus Jakarta Sans`):** Balanced, modern grotesque that brings humanized curvature to dialogue nodes, notes, scenario descriptions, and UI settings.
- **Timecode & Data Precision (`JetBrains Mono`):** Dedicated to durations, framerates, layer names, numerical inputs, and coordinate readouts (`code-timecode`, `code-sub`).
- **Expressive Narrative Notes (Contextual Accent):** For specialized script annotations, sound effect balloons ("SFX"), or rough thumbnail sticky notes, design implementations may pair titles with display accents, retaining structural clarity across standard UI chrome.

## Layout & Spacing

The spatial architecture uses a panel-docking paradigm reminiscent of drafting desks and manga page spreads:

- **Layout Grid Model:** Fixed toolbar and inspector panels flank an adaptive, fluid central viewport (the stage). Surrounding tool bays snap along an 8px spatial rhythm.
- **Stage Background:** Uses a repeating 16px dot-grid texture (`radial-gradient(#1F2937 1px, transparent 1px)` with background size of `16px 16px`) behind freeform storyboard frames.
- **Breakpoints and Reflow:**
  - *Desktop (>1280px):* Three-column workspace (Assets/Scene Deck left at 280px, Canvas center fluid, Inspector/Color Wheel right at 320px, Bottom Timeline Dock collapsible).
  - *Tablet (768px - 1279px):* Two-column split with collapsible slide-over inspector; timeline switches to compact thumbnail strip.
  - *Mobile (<767px):* Single-column vertical strip; panel chrome docks into a bottom sheet drawer with swipe gestures.

## Elevation & Depth

Visual separation relies on graphic novel ink lines and tinted neon halos rather than soft, diffuse drop shadows:

- **Borders over Shadows:** Surfaces sit flush against each other separated by sharp 1px borders in `#374151` (`stroke-width: 1.5px` on highlighted containers).
- **Physical Hard-Drop Shadow:** Modals, sticker chips, and active dragging nodes use an unblurred 2px to 4px hard offset shadow: `box-shadow: 3px 3px 0px #000000`.
- **Neon Glow Ambient (Active States):** Focus rings, active playheads, and selected frames emit an ink illumination:
  - Amber Selection: `0 0 0 1px #F59E0B, 0 0 12px rgba(245, 158, 11, 0.35)`
  - Violet Transport: `0 0 0 1px #8B5CF6, 0 0 16px rgba(139, 92, 246, 0.45)`
- **Halftone Backing:** Empty canvas regions and inactive drawer wells use darkened screen tones to establish structural depth without blurring pixels.

## Shapes

The geometric silhouette combines structured engineering with playful, tangible artifacts:

- **Base Radius:** UI surfaces and docked containers use an 8px radius (`0.5rem`), creating defined, tile-like panels.
- **Pill Badges & Stickers:** Tags, status pills, and timecode chips use fully rounded radii (`9999px`) to visually separate metadata badges from structural panel frames.
- **Sticker Tilt Accents:** Keyframe tags, thumbnail flags, and version notes utilize subtle -1° to 1.5° rotational transforms to maintain the tactile studio notebook aesthetic.

## Components

### Buttons & Transport Controls
- **Primary Ink Button:** `#F59E0B` fill, `#0A0D14` bold typography (`Outfit`, 700), 8px radius, `box-shadow: 2px 2px 0px #000000`. On hover, scale to `1.02` with an amber glow; on active press, translate `1px 1px` with zero shadow.
- **Playback Triggers:** Circular violet containers (`#8B5CF6`) housing bold white play/pause glyphs. Glow intensity pulses during active playback.
- **Secondary / Panel Button:** `#1F2937` surface, `#374151` 1px border, `#F9FAFB` label. Hover activates `#374151` background.

### Sticker Pill Badges & Chips
- Fully rounded (`9999px`) pills.
- Feature high-contrast black interior borders or inverted fills (e.g., `#10B981` background with `#0A0D14` bold uppercase text).
- Include mono-spaced frame indexes or shot IDs (`JetBrains Mono`, e.g., `SC_04 : SH_12`).

### Storyboard Cards & Comic Panel Frames
- High-contrast containers (`#111827`) wrapped in a solid 1.5px border (`#374151`).
- Aspect ratio locks (16:9, 2.39:1, or 4:3) with floating timecode stamps in the top-right corner.
- Selected state shifts border color to `#F59E0B` with hard-drop black shadows and an amber cursor frame.

### Input Fields & Scrubbers
- **Text & Prompt Fields:** Recessed `#0A0D14` fields, 1px `#374151` border, 8px radius. Active input triggers `#8B5CF6` glow and crisp border highlight.
- **Numerical Time Scrubbers:** Monospace display (`JetBrains Mono`), draggable horizontal scrub handles with micro tick-marks resembling animation exposure sheets (x-sheets).

### Checkboxes & Switches
- **Checkboxes:** Squared-off 6px rounded boxes, dark background, ticking an expressive amber check mark (`#F59E0B`).
- **Switches:** Pill tracks in `#1F2937` with neon slider nubs that illuminate in emerald (`#10B981`) when enabled.

### Contextual Studio Utilities
- **Timeline Ruler:** Tick marks spaced at 12fps and 24fps cadences with draggable violet playhead ribbon.
- **Dialogue Bubble Inspector:** Bubble preview cards with simulated tail-notches and typography scale sliders.