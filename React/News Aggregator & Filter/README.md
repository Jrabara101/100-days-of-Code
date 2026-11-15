# Meridian Signal — News Aggregator & Signal-Filtering Platform

A calm, multi-perspective news intelligence interface built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**, following a Swiss broadsheet visual system (`#F8F6F1` newsprint daylight canvas and OLED dark mode).

## Key Capabilities

### Frontend Experience
- **Noise-Canceling Filter Ribbon & Time-Boxed Editions:** Switch between `5-Min Morning Brief (6 Stories)`, `15-Min Deep Catch-Up`, and `Live Wire Stream` with a circular progress ring and `"You're Caught Up"` completion state.
- **Signal-to-Noise Toggles:** One-click toggles for `Calm Headlines` (smoothly morphs clickbait into factual summaries with a hover tooltip revealing the raw clickbait), `Primary Sources Only`, `Hide Opinion & Punditry`, `Blindspot Radar`, and `New Developments Only`.
- **Multi-Perspective Story Cluster Cards:** Consolidates duplicate rewrites into a 3-bullet *Core Fact / What's New Today / Key Tension* brief, Coverage Spectrum Bar with hover spotlight preview, `"Origin"` primary-source badge, and Hype vs. Reality caveat meter.
- **Side-by-Side Framing Comparison & Spin Highlighter:** Inspect 3 outlets across contrasting lenses (`Market`, `Technical`, `Policy`) with an inline **Language & Spin Highlighter** that underlines loaded adjectives.
- **Granular Feed Hygiene:** Temporary **Topic Snooze** (`24 Hours`, `7 Days`, `30 Days`, `Until Major Resolution`) with bottom glass Undo toast, **Custom Saved Lens Builder** (`+include` / `-exclude` pills + source-tier rules), and **Source Transparency Popovers** (ownership, revenue model, factual score).
- **Reader Utilities:** Distraction-free **Clean Reader & Fact Check Drawer** with 3-step Historical Timeline, **Prediction & Follow-Up Accountability Ledger**, **1-Click Briefing Clip Exporter** (Markdown, Slack, Newsletter), and **Information Diet Receipt**.

### Smart Aggregation & Framing Engine (`src/engine/`)
- `clustering.ts`: Token + entity + time-proximity clustering, Primary Origin scoring, and `lastReadTimestamp` story delta detection.
- `sensationalism.ts`: Lexical & punctuation clickbait scoring (`0–100`), neutral headline rewriting, and Hype vs. Reality caveat divergence analysis.
- `framing.ts`: Domain-lens spectrum calculation, lopsided Blindspot detection, and contrasting 3-lens perspective selection.
- `filtering.ts`: Temporal TTL snooze evaluation, Saved Lens evaluation, `-keyword` search exclusions, and bounded edition slicing.
- `exporter.ts` & `dietAndPredictions.ts`: Formatted digest generation and information diet balance metrics.

## Scripts

```bash
npm install
npm run dev      # Start Vite dev server
npm test         # Run Vitest unit & integration tests for the engine
npm run build    # Type-check with tsc and build production bundle
```

