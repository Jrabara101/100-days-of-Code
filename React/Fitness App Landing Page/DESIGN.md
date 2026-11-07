# Design System Specification: High-Conversion Fitness App Landing Page & Workout Explorer (Stitch.md)

Production-grade UI design specification and component library for a modern Fitness App Landing Page promoting interactive workouts, personalized training plans, transparent membership tiers, and frictionless iOS/Android app download handoffs.

---

## 1. Visual Identity & Aesthetic Principles
* **Design Language:** Kinetic athletic precision meets biometric telemetry luxury (synthesizing the dark-room biometric clarity of Whoop and Apple Fitness+ with the high-contrast editorial typography of Nike Training Club and Peloton).
* **High-Contrast Performance Surfaces:** Deep obsidian carbon surfaces paired with electric volt/lime telemetry accents, frosted glass HUD overlays (`backdrop-blur-xl bg-black/65`), and razor-sharp `1px` structural borders that make 60fps workout loops, heart-rate zones, and App Store badges pop with zero visual clutter.
* **Tabular Biometric Discipline:** Every heart-rate readout (`168 BPM`), calorie estimate (`420 kcal`), workout duration (`28:00`), star rating (`4.92 ★`), and cost-per-workout figure (`$0.76 / session`) enforces strict tabular monospace numerals (`tabular-nums`) for effortless scannability.

---

## 2. Design Tokens

### Color Palette
* **Canvas Primary (Performance Dark — Default):** `#08090C` (Obsidian Carbon)
* **Canvas Secondary (Daylight Studio Mode — Optional):** `#F8FAFC` (Crisp Athletic Alabaster)
* **Surface Secondary (Bento Cards / Filter Wells / Plan Containers):** `#111318` (Dark) / `#FFFFFF` (Light)
* **Surface Elevated (HUD Overlays / QR Modals / Floating Download Bar):** `rgba(20, 23, 30, 0.85)` with `backdrop-filter: blur(16px)`
* **Hairline Borders & Specular Rings:** `rgba(255, 255, 255, 0.08)` (Default Card Border) / `rgba(212, 255, 0, 0.35)` (Active Selection / Flagship Plan Border)
* **Text Primary:** `#F8FAFC` (Pure Stadium White) / `#0F172A` (Light Mode Ink)
* **Text Muted:** `#94A3B8` (Cool Titanium) / `#64748B` (Subtle Telemetry Label)

### Athletic Telemetry & Heart-Rate Zone Accents
* **Brand Primary / Kinetic CTA Accent:** `#D4FF00` (Electric Volt Lime — Text on Volt: `#08090C`) or `#FF4D2D` (Anaerobic Infra-Red)
* **Zone 1–2 Recovery & Mobility Accent:** Fill `rgba(56, 189, 248, 0.14)`, Text `#38BDF8`, Dot `#0EA5E9` (Aerobic Sky)
* **Zone 3–4 Tempo & Hypertrophy Accent:** Fill `rgba(16, 185, 129, 0.14)`, Text `#34D399`, Dot `#10B981` (Metabolic Emerald)
* **Zone 5 Peak Output & HIIT Burn:** Fill `rgba(244, 63, 94, 0.16)`, Text `#FB7185`, Dot `#F43F5E` (Peak Crimson)
* **Verified App Store / HSA-FSA Trust Badge:** Fill `rgba(245, 158, 11, 0.14)`, Text `#FBBF24`, Star `#F59E0B` (Trophy Gold)

### Typography
* **Hero Headlines, Workout Titles & Section Headers:** `Plus Jakarta Sans`, `Cabinet Grotesk`, or `Inter Display` (`28px` to `64px`, `font-extrabold`, tracking `-0.03em`, tight `1.08` line-height).
* **UI Chrome, Coach Bios & Plan Features:** `Inter`, `-apple-system`, sans-serif (`14px` to `16px`, `font-medium`, line-height `1.55`).
* **Biometrics, BPM, Timers, Prices & Ratings:** `JetBrains Mono` (`12px` to `14px`, `font-variant-numeric: tabular-nums` mandatory across all workout clocks, macro/calorie chips, and ROI calculators).

---

## 3. Google Stitch Integration Reference
* **Stitch Project ID:** `13953991955438250259`
* **Stitch Project Name:** `projects/13953991955438250259`
* **Stitch Screen ID:** `360d05ad1d2d41388292a521b027244a`
* **Theme Name:** `Obsidian Kinetic`
* **URL:** `https://stitch.withgoogle.com`
