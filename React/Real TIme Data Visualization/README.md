# ⚡ Luminous Telemetry — Human-Centric Real-Time Data Visualization Dashboard

A modern, high-signal, zero-clutter Real-Time Data Visualization Dashboard and Telemetry Command Center built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**.

Inspired by *Linear Insights*, *Stripe Sigma*, *Vercel Analytics*, and *F1 Pit-Wall Telemetry*, this dashboard prioritizes **plain-language insight synthesis**, **causal event annotations on charts**, **pause-on-hover stream ergonomics**, and **interactive "What-If" scenario modeling** over sterile wall-to-wall gauge clutter and jarring screen refreshes.

---

## 🌟 Key Features & Ergonomics

### 1. Calm Real-Time Stream Control & "Time-Travel" Playback Bar
- **Auto-Freeze on Hover (Inspection Lock):** The moment your cursor enters any chart canvas to inspect a data point, the X-axis viewport softly locks (`[⏸️ Stream Paused for Inspection — +N ticks buffered]`), preventing tooltips from ripping away as new data arrives. When the cursor leaves, the view smoothly glides forward to the live head.
- **Live DVR Time-Travel Scrubber:** Scrub through the last 30–60 minutes of telemetry to replay how a surge or anomaly unfolded across all dashboard widgets simultaneously. Includes a quick `[⏪ Rewind 15 Mins]` button.
- **Contextual Baseline Ghost Lines:** Every chart overlays a subtle dashed shadow curve representing a rolling 4-week seasonal diurnal baseline (*"Typical Tuesday at 9:00 AM"*) with a shaded `±2.2σ` normal corridor band.
- **Speed Multiplier:** Accelerate or decelerate real-time stream simulation at `1x`, `2x`, or `5x` speed.

### 2. Narrative-Driven Chart Stages & Causal Event Pins
- **"So What?" Headline Synthesis:** Every metric card and primary stage features an auto-generated 1-line human takeaway above the visual (e.g., *"Checkout conversion is up 14.2% above normal—driven by mobile Apple Pay traffic"*).
- **Interactive Causal Event Pins:** Clickable milestone pills directly on the timeline (`[🚀 10:15 v2.4 Deploy]`, `[📣 10:20 Promo Email]`, `[⚡ 10:24 EU Gateway Spike]`). Hovering or clicking an event pin illuminates a vertical highlight band showing the exact metric trajectory after that event.
- **Drag-to-Measure "Delta Ruler":** Click and drag horizontally across any two points on a chart to draw a luminous measurement span showing the exact delta (`Δ +18.4% • +1,420 units over 14 mins`), duration, and all causal events inside that span.
- **"Pin Your Own Hypothesis" Collaborative Notes:** Team members can drop sticky hypothesis notes directly at any timestamp on the live chart (`+ Pin Hypothesis`) to track copy changes, canary tests, or configuration changes.
- **Multi-Lens Chart Switcher:** Morph between `[📈 Continuous Trend]`, `[📊 Cohort Breakdown]`, `[🌡️ Hourly Heatmap]`, and `[📋 Clean Data Table]` in one click without losing your active time filter.

### 3. Modular Bento Canvas & Perspective Lenses
- **1-Click Role & Mindset Lenses:**
  - `[☕ 60-Second Executive Pulse]`: Oversized morning executive briefing, 4 high-signal KPI story cards, and macro revenue health.
  - `[📡 Live Operations & Radar]`: Global edge PoP latency radar (US-East, US-West, EU-Central, APAC-East), throughput indicators, and live event ticker.
  - `[🔬 Deep-Dive Analyst Canvas]`: Multi-axis Pearson correlation scatter stage (Active Sessions vs. API Latency), regression trendlines, and statistical confidence readouts.
- **Magnetic Cross-Widget Crosshair:** Hovering across any chart illuminates the exact timestamp data point across every sibling chart on the dashboard with zero lag.
- **Tactile Widget Size Controls:** 1-click cycle between **Compact Spark-Tile (1x1)**, **Standard Story Card (2x1)**, and **Full-Stage Spotlight Modal (4x2)**.

### 4. High-Impact Decision Engines
- **Inline "What-If" Forecast Simulator:** Tactile sliders (*"Adjust Traffic Growth %"* and *"Adjust Conversion Lift %"*) project a live dotted forecast curve into the future and compute the exact date and time a milestone target will be reached.
- **"Explain This Spike" Root-Cause Attribution Rail:** Dimensional breakdown calculating the top 3 contributing drivers behind any statistical anomaly (e.g., *Region: US-East (+64% of surge)*, *Channel: Direct iOS App (+24%)*). Clicking any driver instantly filters the entire canvas to that cohort.
- **Goal Pace & "Run-Rate" Weather Forecast:** Human pace badge (`[🟢 Ahead of Pace — Projected 112% of Goal (3 days early)]`) weighted by day-of-week seasonality.
- **"Since You Last Checked" Delta Briefing:** Slide-over drawer surfacing calm positive and negative variance shifts since yesterday's session with 1-click jump to metric.
- **1-Click "Annotate & Clip to Story Card" Exporter:** Formats snapshot cards with takeaway summaries, tabular values, and team comments ready for Slack or executive decks.
- **Live Event Injector:** Test how the dashboard reacts to sudden traffic surges or infrastructure anomalies by injecting custom events in real time.

---

## 🛠️ Architecture & Under-the-Hood Engines

```
src/
├── types/
│   └── telemetry.ts           # Type definitions for telemetry points, events, hypotheses, lenses
├── engine/
│   ├── ringBuffer.ts          # Bounded FIFO ring buffer preventing memory leaks
│   ├── lttb.ts                # Largest-Triangle-Three-Buckets 60fps downsampler
│   ├── anomaly.ts             # Seasonal baseline & Z-score breakout detector + attribution
│   └── narrative.ts           # Dynamic "So What?" headline synthesis & What-If forecast math
├── services/
│   └── telemetryService.ts    # Streaming telemetry engine (WebSocket/SSE simulator)
├── context/
│   └── TelemetryContext.tsx   # Global reactive state, magnetic crosshair, and lens manager
├── components/
│   ├── layout/
│   │   └── StickyCommandRibbon.tsx  # Top DVR scrubber, live pulse, speed, and lens selector
│   ├── charts/
│   │   ├── InteractiveTimeSeriesChart.tsx # SVG time-series, pause-on-hover, delta ruler, causal pins
│   │   ├── CohortBreakdownChart.tsx       # Stacked cohort breakdown (Mobile, Desktop, Tablet)
│   │   ├── HourlyIntensityHeatmap.tsx     # 7-day x 24-hour diurnal seasonal heatmap
│   │   └── TelemetryDataTable.tsx         # Searchable, exportable tabular view
│   ├── widgets/
│   │   ├── NarrativeKPICard.tsx           # 1-line headline, tabular digit roll, micro-sparkline
│   │   ├── MasterChartStage.tsx           # Hero 8-column stage with multi-lens switcher
│   │   ├── AnomalyAttributionRail.tsx     # 4-column root-cause driver rail & What-If sliders
│   │   ├── ExecutivePulseBriefing.tsx     # 60s Executive pulse morning digest
│   │   ├── RegionalRadarCard.tsx          # Global edge PoPs operational status
│   │   ├── AnalystDeepDiveCanvas.tsx      # Pearson correlation scatter stage
│   │   └── GoalRunRateCard.tsx            # Run-rate pace weather card
│   └── modals/
│       ├── ClipInsightModal.tsx           # 1-click story card exporter
│       └── SinceLastCheckedDrawer.tsx     # Slide-over delta briefing
├── test/
│   └── verifyDashboard.ts     # Verification suite for all 6 telemetry algorithms
├── App.tsx                    # Main Bento spatial grid layout
└── main.tsx                   # Entry point
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+` or `v22+`
- npm `v9+` or `v10+`

### Installation & Run
```bash
# Navigate to the project directory
cd "Real TIme Data Visualization"

# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Engine Verification Tests
```bash
npx tsx src/test/verifyDashboard.ts
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 🎨 Design System Tokens
- **Canvas Base:** Obsidian Carbon `#090B0E` (Dark Mode default) / Swiss Alabaster `#F6F7F9` (Daylight Mode)
- **Cards:** Bento card container `#11141B` / elevated `#171B24` with hairline borders `rgba(255, 255, 255, 0.07)`
- **Data Series:**
  - Primary Metric (Cyan): `#38BDF8`
  - Secondary Comparison (Violet): `#A855F7`
  - Cohort C (Teal): `#2DD4BF`
  - Historical Seasonal Baseline: `rgba(148, 163, 184, 0.40)` dashed
  - Expected Corridor Band: `rgba(148, 163, 184, 0.08)` shaded corridor
- **Typography:**
  - UI & Narrative: `Plus Jakarta Sans`
  - Telemetry Counters & Timestamps: `JetBrains Mono` (`tabular-nums` enforced to prevent horizontal digit jitter)
