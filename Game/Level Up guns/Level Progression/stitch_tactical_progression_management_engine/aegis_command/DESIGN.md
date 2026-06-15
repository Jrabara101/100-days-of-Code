---
name: Aegis Command
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#d8c3ac'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#a08e79'
  outline-variant: '#524433'
  surface-tint: '#ffb952'
  primary: '#ffcf91'
  on-primary: '#452b00'
  primary-container: '#ffaa00'
  on-primary-container: '#694300'
  inverse-primary: '#825500'
  secondary: '#ffffff'
  on-secondary: '#00382b'
  secondary-container: '#24ffcd'
  on-secondary-container: '#00725a'
  tertiary: '#61f291'
  on-tertiary: '#003919'
  tertiary-container: '#3fd578'
  on-tertiary-container: '#00572a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb4'
  primary-fixed-dim: '#ffb952'
  on-primary-fixed: '#291800'
  on-primary-fixed-variant: '#633f00'
  secondary-fixed: '#24ffcd'
  secondary-fixed-dim: '#00e0b3'
  on-secondary-fixed: '#002118'
  on-secondary-fixed-variant: '#00513f'
  tertiary-fixed: '#6dfe9c'
  tertiary-fixed-dim: '#4de082'
  on-tertiary-fixed: '#00210c'
  on-tertiary-fixed-variant: '#005227'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: 0.05em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: 0.05em
  body-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-lg:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Space Mono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 12px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
spacing:
  unit: 4px
  gutter: 16px
  margin: 24px
  panel-padding: 12px
  container-max-width: 1440px
---

## Brand & Style

The design system is engineered for high-stakes tactical environments where data density and rapid decision-making are paramount. The brand personality is authoritative, precise, and mission-critical, evoking the sensation of an advanced orbital command center or a futuristic field operative's head-up display (HUD).

The visual style is a fusion of **High-Tech / Futuristic** and **Tactical Minimalism**. It utilizes a "Terminal-Plus" aesthetic—retaining the raw efficiency of command-line interfaces while layering on sophisticated, translucent depth. Key characteristics include:
- **High Information Density:** Elements are packed efficiently to minimize eye travel.
- **State-Based Visuals:** Changes in operational status are communicated through aggressive color shifts and flickering transitions.
- **Structural Rigidity:** Everything adheres to a visible or felt mathematical grid, suggesting a system built on logic and hardware constraints.
- **Hardware Metaphor:** UI elements behave like physical glass panels or projected light, utilizing scanlines and micro-textures to ground the digital experience.

## Colors

The palette is optimized for low-light environments, prioritizing optical clarity and contrast. 

- **Foundation:** The background (#060913) is an ultra-deep void, ensuring that "light-emitting" elements pop with maximum intensity.
- **Tactical Slate:** Used for container backgrounds and structural panels (#0f172a), providing a subtle separation from the void.
- **HUD Amber (Primary):** Reserved for critical telemetry, primary actions, and warnings. It represents the "active" state of the engine.
- **HUD Cyan (Secondary):** Used for auxiliary data, informational readouts, and scanning states. It provides a cool-toned balance to the amber alerts.
- **Zombie Green (Tertiary):** Dedicated to "Go" states, health indicators, and successful execution logs.
- **Functional Red:** (Implicit) Use #f87171 sparingly for critical failures or ammunition depletion.

## Typography

Typography is treated as telemetry data. 

- **Display & Headlines:** Use **Space Grotesk** for high-level headers. Its geometric structure feels engineered and scales perfectly for large-scale "Tactical Displays." 
- **The Engine Core:** **JetBrains Mono** is the primary body font. Its monospaced nature ensures that columns of numbers and logs align perfectly, maintaining the terminal-style aesthetic.
- **Labels & Metadata:** **Space Mono** is used for tiny, all-caps technical labels and secondary data. The wide character spacing and monospaced layout reinforce the "instrument cluster" feel.

All text should avoid pure white; use HUD Cyan or a slightly desaturated version of the background for secondary labels to maintain the light-projection effect.

## Layout & Spacing

This design system uses a **Strict Fluid Grid** modeled after diagnostic monitors. 

- **The Grid:** A 12-column grid system with 16px gutters. Elements should feel "locked" into their positions. 
- **Spacing Rhythm:** Based on a 4px baseline unit. This allows for the precise, tight padding required for data-heavy interfaces.
- **Sectioning:** Content is divided into "Modules." Each module is a self-contained panel.
- **Adaptation:**
    - **Desktop:** Multi-pane view (3-4 columns of modules).
    - **Tablet:** 2-column stack with side-scrolling status bars.
    - **Mobile:** Single column stack. Margin decreases to 16px, and secondary modules are relegated to collapsible "drawers" to keep the main tactical feed visible.

## Elevation & Depth

In this design system, depth is not created by physical distance, but by **Digital Layering and Transparency.**

- **Z-Axis Hierarchy:** Background (#060913) > Scanline Texture Layer > Secondary Panels (#0f172a at 60% opacity) > Active HUD Elements (Full Opacity).
- **Glassmorphism:** Use backdrop blurs (8px to 12px) on all floating panels to simulate a glass projection overlaying a live feed.
- **The "Glow" (Atmospheric Depth):** High-contrast elements (Amber/Cyan) should have a very subtle `0px 0px 8px` outer glow of their own color, suggesting phosphorus screen illumination.
- **Scanlines:** A global overlay of 1px horizontal lines at 3% opacity should be applied to the entire viewport to give the interface a hardware texture.

## Shapes

The shape language is **Aggressive and Industrial.** 

- **Sharp Corners:** All primary containers, buttons, and input fields use 0px border radius. This emphasizes the military-grade, unyielding nature of the hardware.
- **Angled Accents:** Use "Dog-ear" or "Chamfered" corners (45-degree cuts) for specialized action buttons or tab indicators to further the futuristic HUD aesthetic.
- **Borders:** Every panel should have a 1px border. Use the primary color (Amber) at 30% opacity for inactive panels and 100% opacity for active/focused panels.

## Components

- **Tactical Buttons:** Rectangular, sharp-edged. Default state: 1px HUD Cyan border with transparent background. Hover state: HUD Cyan background with black text and a "flicker" animation.
- **Weapon/Unit Cards:** Complex containers with a 1px border. Use a "Status Header" (a 4px tall bar across the top) that changes color based on health/ammo. Backgrounds should use a diagonal stripe pattern (at 5% opacity).
- **Status Meters (Progress Bars):** Segmented bars rather than smooth fills. Each segment represents 5-10% of the total value.
- **Terminal Log Boxes:** Fixed-height containers with auto-scroll. Text should be monochrome Green or Cyan with a blinking cursor at the end of the latest entry.
- **Input Fields:** Labeled with Space Mono at the top-left. The input line is just a 1px bottom border that glows when focused.
- **Chips/Status Tags:** Small, all-caps labels enclosed in brackets, e.g., `[ STATUS: OPTIMAL ]`.
- **Navigation:** Vertical side-bars with icon-only or icon+abbreviated text (e.g., `CMD`, `SYS`, `MAP`). Icons should be thin-line stroke icons (1px weight).