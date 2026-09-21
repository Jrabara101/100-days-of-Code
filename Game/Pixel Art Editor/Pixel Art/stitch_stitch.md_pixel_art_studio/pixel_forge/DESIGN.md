---
name: Pixel Forge
colors:
  surface: '#15121b'
  surface-dim: '#15121b'
  surface-bright: '#3b3742'
  surface-container-lowest: '#0f0d15'
  surface-container-low: '#1d1a23'
  surface-container: '#211e27'
  surface-container-high: '#2c2832'
  surface-container-highest: '#37333d'
  on-surface: '#e7e0ed'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e7e0ed'
  inverse-on-surface: '#322f39'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#ffb869'
  on-tertiary: '#482900'
  tertiary-container: '#ca801e'
  on-tertiary-container: '#3f2300'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffdcbb'
  tertiary-fixed-dim: '#ffb869'
  on-tertiary-fixed: '#2c1700'
  on-tertiary-fixed-variant: '#673d00'
  background: '#15121b'
  on-background: '#e7e0ed'
  surface-variant: '#37333d'
  bg-canvas: '#090A0F'
  surface-panel: '#12131A'
  surface-elevated: '#1A1C26'
  border-subtle: '#262838'
  text-main: '#F4F4F5'
  text-muted: '#71717A'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  headline-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

# Stitch.md: Pixel Art Studio UI Design System & Specification
## 1. Design Theme & Aesthetic
- Concept: Retro-Modern Studio / Pixel Forge (Dark-mode creative ergonomics reminiscent of Aseprite and Linear, pairing high-contrast work surfaces with tactile micro-interactions).
- Surface Textures: Deep obsidian and slate matte panels (bg-zinc-950), clean 1px borders (border-zinc-800), frosted glass dialog overlays, and crisp neon accents to spotlight active tools and selection boundaries.
## 2. Color Palette Tokens
- --bg-canvas: #090A0F (Ultra-deep void background framing the artwork)
- --surface-panel: #12131A (Docked toolbars, timelines, and inspector panels)
- --surface-elevated: #1A1C26 (Hover states, active buttons, popovers)
- --border-subtle: #262838 (Structured panel separations)
- --primary-accent: #8B5CF6 (Vibrant electric violet for primary actions and active toggles)
- --secondary-accent: #06B6D4 (Cyan for selection outlines and timeline playback heads)
- --text-main: #F4F4F5 (High-contrast white for tool labels and coordinates)
- --text-muted: #71717A (Muted zinc for shortcut keys, status info, and frame indices)
## 3. Typography
- Primary Font: 'Inter', sans-serif
- Monospace Font: 'JetBrains Mono', monospace
## 4. Component Layout Guidelines
- Desktop Workspace:
  - Left Dock: Slim vertical tool strip featuring 40x40px icon buttons with responsive tooltips and shortcut badges.
  - Center Workspace: Scaled canvas viewport with floating canvas-hud (Zoom in/out, grid toggle, center view) and collapsible bottom frame sequencer.
  - Right Dock: Tabbed inspector housing color swatch palettes, layer stack manager, and mini-previewer window.