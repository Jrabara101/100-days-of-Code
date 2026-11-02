---
name: Hollis Precision Console
colors:
  surface: '#fbf9f1'
  surface-dim: '#dcdad2'
  surface-bright: '#fbf9f1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f4ec'
  surface-container: '#f0eee6'
  surface-container-high: '#eae8e0'
  surface-container-highest: '#e4e3db'
  on-surface: '#1b1c17'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#30312c'
  inverse-on-surface: '#f3f1e9'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#4b41e1'
  on-tertiary: '#ffffff'
  tertiary-container: '#645efb'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#e2dfff'
  tertiary-fixed-dim: '#c3c0ff'
  on-tertiary-fixed: '#0f0069'
  on-tertiary-fixed-variant: '#3323cc'
  background: '#fbf9f1'
  on-background: '#1b1c17'
  surface-variant: '#e4e3db'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.125rem
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.375rem
  body-md:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.1875rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
  label-code-lg:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: -0.02em
  label-code-md:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 0.875rem
    letterSpacing: -0.02em
  label-code-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 0.75rem
    letterSpacing: 0em
  label-hotkey:
    fontFamily: JetBrains Mono
    fontSize: 0.625rem
    fontWeight: '600'
    lineHeight: 0.75rem
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system targets Trust & Safety operational teams, integrity analysts, and risk officers executing rapid, high-volume review moderation. The UI projects uncompromising operational clarity, structural rigour, and high density without visual fatigue. The aesthetic is purely functional and tool-centric: crisp borders, disciplined data alignment, and decisive status taxonomy over ornamental decoration.

The system relies on high-density structural grids and zero-noise chrome. Visual emphasis is strictly reserved for actionable signals: moderation verdict badges, fraud anomaly tags, customer sentiment metrics, and hotkey shortcuts. Every interactive element affords millisecond-level decision making through strict keyboard-first orientation and typographic stratification.

## Colors

The palette establishes an ultra-clean optical foundation with purposeful functional tinting. No decorative gradients or ambient color bleed are permitted.

### Surface System
- **Canvas (`#FFFFFF`)**: Base application shell and primary working panel background.
- **Surface (`#F8FAFC`)**: Secondary application rail, queue lists, toolbars, and inactive panels.
- **Elevated (`#FFFFFF`)**: Floating operational popovers, active decision cards, and context drawers.
- **Hairline Border (`#E2E8F0`)**: 1px crisp structural division across all panels, tables, and card containers.

### Content & Typography Tokens
- **Text Base (`#141413`)**: Primary text, review bodies, reviewer handles, and modal headings.
- **Text Muted (`#64645E`)**: Metadata keys, contextual labels, timestamps, and secondary captions.
- **Star Fill (`#F59E0B`)**: Rating indicators.
- **Star Track (`#E2E8F0`)**: Inactive star base.

### State & Moderation Badges
Badges use 10–14% alpha tint fills paired with deep saturated text for high-contrast scanning:
- **Verified / Approved**: Fill `rgba(16, 185, 129, 0.12)`, Text `#059669`
- **Gifted / Incentive**: Fill `rgba(59, 130, 246, 0.12)`, Text `#2563EB`
- **PII / Needs Redaction**: Fill `rgba(245, 158, 11, 0.14)`, Text `#B45309`
- **Fraud / Rejected**: Fill `rgba(239, 68, 68, 0.12)`, Text `#DC2626`
- **Brand Response**: Fill `rgba(79, 70, 229, 0.10)`, Text `#4F46E5`

### Primary Actions
- Primary confirmation actions use `#059669`, with hover state `#047857` and active press `#065F46`.

## Typography

Typography enforces a strict bifurcated system:
- **Inter** handles all conversational UI, review bodies, reviewer names, instructions, and standard interface labels. Weights are constrained strictly to `400` (Regular) and `600` (Semi-Bold).
- **JetBrains Mono** governs all quantitative, telemetry, and system-level values: Review IDs, Risk Scores (e.g. `98.4%`), transaction timestamps, IP addresses, SLA countdown clocks, and keyboard shortcut chips.

Numbers are rendered using tabular figures (`tnum`) across both fonts to eliminate tabular shifting during queue transitions.

## Layout & Spacing

The layout is a 100vh viewport-locked enterprise workspace structured into three distinct structural regions:
1. **Queue Nav & Filter Rail** (240px fixed width): Collapsible hierarchy containing pending, escalated, and priority queues.
2. **Review Stream / Queue List** (380px fixed width): Fast-triage list rendered with minimal vertical padding and continuous hairline boundaries.
3. **Workspace Inspection Stage** (Fluid width): Split view detailing the selected review, reviewer identity history, sentiment breakdown, machine-learning risk graph, and action dock.

Margins and gutters default to tight intervals (`0.75rem` / `1rem`), maintaining extreme information density while preserving visual grouping via spatial proximity and hairline delimiters.

## Elevation & Depth

This system avoids ambient blur shadows and skeuomorphic drop effects. Depth is articulated purely through:
- **Tonal Substrates**: Switching between Canvas (`#FFFFFF`) and Surface (`#F8FAFC`).
- **Low-Contrast Hairlines**: Crisp `1px solid #E2E8F0` borders applied systematically between all panels, structural cards, headers, and toolbars.
- **Contextual Overlays**: Modals, dropdown selectors, and floating inspection drawers use a zero-blur structural edge combined with a precise hairline offset: `0 4px 12px rgba(20, 20, 19, 0.06)`, bounded by a `1px solid #E2E8F0` border.

## Shapes

The interface embraces tight, disciplined rounding. Base interactive elements—such as buttons, text inputs, risk metric cards, and badge chips—utilize `0.25rem` (4px). Containers, master inspection cards, and dialog windows scale to `0.5rem` (8px). Hotkey tags and mono indicators default strictly to 3px to maintain block-level alignment with adjacent monospaced text.

## Components

### Iconography Standard
All icons are sourced exclusively from the **Lucide** set at `16px × 16px` with a fixed `1.75px` stroke. No emojis, fills, or multi-tone iconography are used.

### Buttons & Action Bars
- **Primary Action (Approve)**: `#059669` solid background, `#FFFFFF` text, `0.25rem` radius, 32px height, Inter Semi-Bold 13px. Contains an embedded right-aligned hotkey tag (e.g., `A`).
- **Destructive Action (Reject)**: Surface fill `rgba(239, 68, 68, 0.08)`, border `1px solid rgba(239, 68, 68, 0.25)`, text `#DC2626`. Hotkey tag `R`.
- **Secondary Action**: Elevated `#FFFFFF` fill, border `1px solid #E2E8F0`, text `#141413`. Hover brings background to `#F8FAFC`.

### Status & Taxonomy Badges
Compact height (20px), padding `2px 6px`, radius `3px`, font `JetBrains Mono` 11px medium (`label-code-sm`).
- **Verified**: Fill `rgba(16, 185, 129, 0.12)`, text `#059669`.
- **Gifted**: Fill `rgba(59, 130, 246, 0.12)`, text `#2563EB`.
- **PII Flag**: Fill `rgba(245, 158, 11, 0.14)`, text `#B45309`.
- **Fraud/Rejection**: Fill `rgba(239, 68, 68, 0.12)`, text `#DC2626`.
- **Brand Response**: Fill `rgba(79, 70, 229, 0.10)`, text `#4F46E5`.

### Hotkey Keycaps (`Kbd`)
Rendered via JetBrains Mono (`label-hotkey`). Inset background `#F8FAFC`, border `1px solid #CBD5E1`, text `#64645E`, border-radius 3px, padding `1px 4px`. Displayed alongside moderation choices (e.g. `[E]` Escalate, `[P]` Mark PII, `[A]` Approve).

### Input Fields & Search Bars
Height 32px, background `#FFFFFF`, border `1px solid #E2E8F0`, border-radius `0.25rem`, padding `0 8px`. Focus state triggers `border-color: #059669` with zero ambient ring shadow. Placeholder text uses `#64645E`.

### Star Rating Units
Composed of 5 sequential Lucide star icons at 14px size. Active stars use fill `#F59E0B` and stroke `#F59E0B`. Inactive track stars use fill `#E2E8F0` and stroke `#E2E8F0`. Half stars are optically divided via clipping paths.

### Moderation Cards
Contained with `1px solid #E2E8F0` on `#FFFFFF` canvas. Internal sections (reviewer profile, review body, automated risk breakdown) are segregated by `1px solid #E2E8F0` horizontal rules without extra margin overhead.