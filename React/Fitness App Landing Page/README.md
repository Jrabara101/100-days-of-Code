# PULSE // FIT — Interactive Workout Customizer & Acquisition Engine

> Kinetic athletic precision meets biometric telemetry luxury (synthesizing the dark-room biometric clarity of Whoop and Apple Fitness+ with the high-contrast editorial typography of Nike Training Club and Peloton).

Built with **React**, **Vite**, **Tailwind CSS v4**, and connected to **Google Stitch** (`projects/13953991955438250259`).

---

## ⚡ Core Features

1. **Kinetic Hero Stage (`#hero`)**
   * Asymmetric 2-column layout with 60fps workout reel.
   * Floating Apple Watch HUD overlays (`❤️ 164 BPM`, `312 Active kcal`, Progressive Overload tracker, and `00:45 WORK / 00:15 REST` interval timer).
   * OS-aware App Store & Google Play badges, plus "Scan-to-Pocket" QR capsule.

2. **Interactive Workout Catalog & Anatomy Explorer (`#workouts`)**
   * Real-World Constraint Matrix: `Apartment-Friendly / Zero-Jump`, `Dumbbells Only`, `Kettlebell Flow`, `Mobility & Core`, `HIIT & Conditioning`.
   * Duration Filters: `15m`, `20m`, `30m`, `45m+`.
   * Interactive Front/Back SVG Anatomical Muscle-Target Map. Clicking any zone highlights targeted workouts.
   * 60fps hover-play bento cards with heart-rate zone chips and full circuit modal.

3. **Coach Archetype & Vibe Audition Deck (`#coaches`)**
   * Audition coaches by philosophy: `Data-Driven & Biomechanical`, `High-Octane Hype`, `Metabolic Athlete`, `Calm & Restorative Mobility`.
   * 15-second audio/video preview simulation with live audio waveform bars.
   * Integrated Apple Music and Spotify curated workout playlist previews.

4. **Browser-Based "4-Week Blueprint" Builder & Deep-Link Handoff (`#plan-builder`)**
   * 3-Step Interactive Split Architect (`Primary Goal` × `Weekly Days` × `Gear`).
   * Renders a live 7-day × 4-week calendar matrix with projected caloric burn and lean mass delta.
   * Dynamic QR Code + SMS Magic Link Form to push the customized split into iOS / Android on first launch.

5. **Universal Wearable Telemetry Stage (`#wearables`)**
   * Hardware showcase for Apple Watch Ultra, Whoop 4.0, Garmin Epix, Oura Gen 3, and Apple TV 4K.

6. **Transparent Membership & "Cost-Per-Sweat" ROI Calculator (`#pricing`)**
   * Weekly frequency slider (`1x` to `7x / week`) calculating per-workout savings (`$0.62 per coached workout` vs `$540/mo studio drop-ins`).
   * 3 Pricing tiers: Monthly Flexible ($19.99/mo), Annual Flagship ($9.99/mo, Save 50% + Free Jump Rope), Household ($14.99/mo).
   * 14-Day Zero-Surprise Trial Timeline bar (`Day 1` → `Day 12 Reminder` → `Day 14 Membership`).
   * Instant TrueMed HSA/FSA Eligibility Checker (~30% pre-tax health savings).

7. **Verified Social Proof & Review Sentiment Aggregator (`#reviews`)**
   * Telemetry-backed member cards with verified before/after resting HR, deadlift, and HRV metrics.
   * Clickable sentiment chips: `Apartment-friendly`, `Apple Watch integration`, `Zero knee pain`, `Busy schedule`.

8. **Sticky Mobile Download Dock**
   * Floating frosted-glass bottom dock on mobile viewports for 1-tap store redirection.

---

## 🛠 Project Structure

```
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── KineticHeroStage.tsx
│   │   ├── InteractiveWorkoutExplorer.tsx
│   │   ├── WorkoutPreviewModal.tsx
│   │   ├── CoachAuditionDeck.tsx
│   │   ├── FourWeekPlanConfigurator.tsx
│   │   ├── WearableTelemetryStage.tsx
│   │   ├── MembershipPricingMatrix.tsx
│   │   ├── SocialProofReviews.tsx
│   │   ├── FAQSection.tsx
│   │   ├── StickyMobileDownloadDock.tsx
│   │   ├── DeepLinkModal.tsx
│   │   ├── HsaFsaModal.tsx
│   │   └── Footer.tsx
│   ├── hooks/
│   │   ├── useBlueprintArchitect.ts
│   │   └── useSmartDeviceDetection.ts
│   ├── data/
│   │   └── mockData.ts
│   ├── types.ts
│   ├── index.css
│   ├── App.tsx
│   └── main.tsx
├── backend/
│   ├── schema.sql
│   ├── server.js
│   └── README.md
├── DESIGN.md
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Getting Started

### Frontend Development
```bash
# Navigate to the project directory
cd "React/Fitness App Landing Page"

# Run local Vite dev server
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Backend API Server
```bash
cd backend
node server.js
```
The backend runs on `http://localhost:4000` with endpoints for:
* `POST /api/v1/blueprints/generate`
* `POST /api/v1/blueprints/:token/send-sms`
* `GET /api/v1/deeplink/resolve/:token`
* `GET /.well-known/apple-app-site-association`
* `GET /.well-known/assetlinks.json`
