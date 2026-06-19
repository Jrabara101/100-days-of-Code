---
name: Imperial Command
colors:
  surface: '#111417'
  surface-dim: '#111417'
  surface-bright: '#37393d'
  surface-container-lowest: '#0b0e11'
  surface-container-low: '#191c1f'
  surface-container: '#1d2023'
  surface-container-high: '#272a2e'
  surface-container-highest: '#323538'
  on-surface: '#e1e2e7'
  on-surface-variant: '#d8c3ad'
  inverse-surface: '#e1e2e7'
  inverse-on-surface: '#2e3134'
  outline: '#a08e7a'
  outline-variant: '#534434'
  surface-tint: '#ffb95f'
  primary: '#ffc174'
  on-primary: '#472a00'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#855300'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#d7cac0'
  on-tertiary: '#372f28'
  tertiary-container: '#bbafa5'
  on-tertiary-container: '#4b423b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#eee0d6'
  tertiary-fixed-dim: '#d1c4ba'
  on-tertiary-fixed: '#211a14'
  on-tertiary-fixed-variant: '#4e453e'
  background: '#111417'
  on-background: '#e1e2e7'
  surface-variant: '#323538'
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-sm:
    fontFamily: EB Garamond
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.08em
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 48px
  margin-mobile: 16px
  container-max: 1440px
---

## Brand & Style
The design system evokes the atmosphere of a high-stakes imperial war room. It is designed for strategic decision-making, blending the weight of history with the precision of modern tactical interfaces. The target audience is elite commanders and high-level administrators who require an environment that feels authoritative, permanent, and physically grounded.

The style is **Tactile / Skeuomorphic** with a heavy influence of **Modern Brutalism**. It utilizes deep, "felt" surfaces reminiscent of a war table, weathered textures that suggest endurance, and high-contrast accents that signal critical intelligence. The emotional response is one of gravitas, urgency, and absolute control.

## Colors
The palette is rooted in the "War Room" aesthetic. The primary surface is a deep, non-reflective Charcoal (#0c0f12), providing a void-like backdrop for tactical data. Imperial Gold (#f59e0b) is used exclusively for primary actions, critical alerts, and high-ranking status indicators. 

Royal Purple (#a855f7) serves as a secondary accent for specialized intelligence, clandestine operations, or high-level strategic layers. Weathered Oak and Iron (#1e1b18, #3d352e) provide the structural framework, used for containers, borders, and recessed areas to give the UI a sense of physical construction.

## Typography
The typography system balances tradition with technical precision. 
- **EB Garamond** is used for all narrative and authoritative headings, conveying the "Imperial" weight of the command.
- **Hanken Grotesk** provides a clean, highly legible sans-serif for body text, ensuring instructions are clear and efficient.
- **JetBrains Mono** is utilized for tactical readouts, coordinates, and functional labels, suggesting a layer of modern data processing beneath the classical aesthetic.

All labels should be set in uppercase when used for navigation or status headers to enhance the military feel.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy, mirroring a physical map spread across a command table. 
- **Desktop:** A 12-column grid with generous 48px margins to emphasize the "contained" nature of the war room.
- **Tactical Modules:** Components should use a modular spacing system based on 4px increments.
- **Safe Zones:** High-priority data (tactical maps) should occupy the central 8 columns, with "intelligence feeds" and "status panels" docked in the flanking columns.

On mobile, the layout collapses into a single-column stack, prioritizing the "Map" or "Primary Feed" with secondary controls hidden behind an "Orders" menu.

## Elevation & Depth
Depth is created through **Tonal Layers** and **Physical Metaphor** rather than standard drop shadows.
- **Base Layer:** Charcoal felt texture (#0c0f12).
- **Surface Layer:** Weathered Oak containers (#1e1b18) with subtle inner bevels to look recessed into the table.
- **Active Nodes:** Use a "Subtle Glow" (Inner and Outer) in Imperial Gold or Royal Purple to indicate active selection or a state of emergency. 
- **Overlays:** Parchment-textured modals with high-contrast iron borders (#3d352e) represent documents physically placed onto the table.

## Shapes
The shape language is **Sharp (0)**. In an imperial war room, there is no room for softness. Rectilinear forms dominate the UI to reflect architectural stability and military discipline. 
- **Buttons and Inputs:** Strict 90-degree corners.
- **Framing:** Use double-lined borders or "bracket" corners for cards to evoke technical blueprints or historical ledger framing.
- **Status Indicators:** Use geometric primitives—diamonds for high-value targets, squares for infantry/base units.

## Components
- **Buttons:** Primary buttons use Imperial Gold backgrounds with black text. Hover states should introduce a "flicker" or "steady glow" effect. Secondary buttons are Iron-outlined with no fill.
- **Cards/Panels:** These should feature a "header" bar in Weathered Oak with an Iron border. Use a subtle parchment grain texture for the content area.
- **Input Fields:** Recessed into the surface with a "letterpress" effect. Text entry should use the monospace font (JetBrains Mono).
- **Tactical Nodes:** Small circular or diamond indicators that pulse when "Active." Use the Royal Purple for clandestine/intel-heavy nodes and Gold for combat/command nodes.
- **Checkboxes:** Stylized as "stamps" or "wax seals"—when active, they fill with a solid, dark purple or gold sigil.
- **Lists:** Structured as a "Manifest" or "Log," using alternating subtle background shades to maintain legibility in dense data.