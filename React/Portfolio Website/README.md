# Atelier — Personal Portfolio, Digital Garden & Contact CRM

An editorial-grade personal portfolio website, living digital garden, and high-intent client CRM built with **React**, **Vite**, **Tailwind CSS**, and a resilient **Supabase / PostgreSQL** architecture.

Designed according to modern Swiss editorial principles: balancing monospaced metadata precision with generous white space, subtle micro-borders, and tactile interaction surfaces.

---

## 🌟 Key Highlights & High-Impact Features

### 1. Digital Garden & Storytelling Engine
* **Stateful Article Lifecycle:** Categorizes ideas across progressive editorial stages:
  * `🌱 Seedling`: Quick thoughts, exploratory field notes.
  * `🌿 Budding`: Developing essays, actively expanding research.
  * `🌲 Evergreen`: Definitive long-form technical guides.
* **Reading Ergonomics & Engagement:**
  * Fixed 2px top scroll-depth indicator tracking reading position.
  * Sticky interactive Table of Contents with scroll-spy highlighting.
  * Inline text selection quote-sharing: highlight any text to immediately tweet to X or copy quote to clipboard.
  * Headless Markdown parser with syntax-highlighted code blocks, copyable snippets with checkmark confirmation, and KaTeX mathematical equation rendering ($\mathcal{O}(N \log N)$ and block formulas).
* **Micro-Reactions & Appreciation:**
  * Floating bottom engagement dock with clapping button (1–50 claps per reader).
  * Optimistic counts with floating, bouncing `+1`, `+2` particle animations drifting upward.
  * Contextual inline newsletter micro-subscription embedded directly inside articles.
* **SEO & Social Syndication:**
  * Standard RSS 2.0 feed generator (`/rss.xml`) viewable and downloadable directly in-app.
  * Dynamic OpenGraph 1200x630 social card generator preview for Twitter, LinkedIn, and Slack.

### 2. Interactive Opportunity & Contact Gateway
* **Intent-Driven Inquiry Triage:** Smart intake selector that adapts based on intent:
  * `🚀 New Venture / Full-Stack Build`
  * `🛠 Design System & Architecture`
  * `🎙 Advisory / Speaking`
  * `☕ Casual Coffee / Mentorship`
* **Scope & Budget Qualifier:** Dynamic budget tiers (`< $10k`, `$10k - $25k`, `$25k+`) and target timeline inputs that qualify high-intent outreach.
* **Anti-Spam Sentinel:** Transparent honeypot traps and sliding rate limits to prevent bot spam without intrusive CAPTCHAs.
* **Immediate Acknowledgement:** Zero-page-reload submission with confetti celebration, optimistic visual receipt, and typical 24-hour response SLA reminder.

### 3. Dynamic Proof of Work & Showcase Ergonomics
* **Headline KPI Badges:** Case study modules highlighting measurable real-world outcomes upfront (e.g. `+340% Render Throughput`, `$4.8M Capital Raised`, `38ms P99 Sync Latency`).
* **Tactile Before-and-After Slider:** Interactive split-screen visual comparison slider comparing legacy architectures with engineered solutions.
* **Filterable Skill Taxonomy:** Cross-reference case studies across Full-Stack, Design Systems, WebGL, CRDT, and FinTech.
* **Deep-Dive Modals:** Comprehensive architecture topology, technical bottlenecks, engineered solutions, and source repository links.

### 4. Live Personal Context & "Now" Pulse
* **The "Now" Indicator:** Contextual live status pill indicating current availability (`🟢 Available for Select Q3/Q4 Projects`), live ticking local clock (PST), and what is currently being read, shipped, and researched.
* **Minimalist Admin Cockpit (`/admin` or lock icon):**
  * Protected with PIN (Default: `studio2026`).
  * **Tab 1: Essay Publisher:** Dual-pane live Markdown editor (raw input on left, formatted live preview on right) with stage and status controls.
  * **Tab 2: Lead CRM:** Dense table of all client dispatches with status triage (`New`, `Reviewed`, `Replied`, `Archived`) and one-click `mailto:` generator with pre-filled context.
  * **Tab 3: System & DB Sync:** Supabase connectivity inspector, export/import JSON backup, and PostgreSQL schema copy.

---

## 🎨 Design Tokens (Stitch.md Specification)

* **Canvas Primary:** `#FAFAF8` (Warm Editorial Linen) / `#0A0A0C` (Deep Obsidian)
* **Surface Secondary:** `#F4F4F0` (Light) / `#131316` (Dark)
* **Surface Elevated:** `#FFFFFF` (Light) / `#1A1A1F` (Dark)
* **Border / Dividers:** `#E5E5DF` (Light) / `#24242A` (Dark)
* **Text Primary:** `#18181B` (Light) / `#F4F4F6` (Dark)
* **Text Muted:** `#71717A` (Light) / `#A1A1AA` (Dark)
* **Accent Focus:** `#10B981` (Availability Emerald) & `#6366F1` (Editorial Indigo)
* **Typography:**
  * Editorial Headlines: `Newsreader`, `Charter`, `Playfair Display`
  * UI Chrome & Body: `Inter`, `Geist`
  * Code & Metadata: `JetBrains Mono`

---

## 🗄 Database & Supabase Architecture

The project is built with a resilient dual-mode data layer:
1. **Local-First Sandbox Mode (Default):** Zero-config persistence using browser `localStorage` with initial seeds for immediate exploration and offline resilience.
2. **Supabase / PostgreSQL Cloud Mode:** Set your environment variables in `.env` or production deployment:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_ADMIN_PIN=studio2026
   ```

A complete SQL schema is located in `supabase/schema.sql`, featuring:
* `posts`: Post lifecycle, view and clap counters, tags.
* `tags` & `post_tags`: Normalized many-to-many relationship.
* `inquiries`: Lead CRM dispatches with intent, budget tier, and status.
* `newsletter_subscribers`: Email subscriber list.
* `claps_log`: Clap rate-limiting and audit log.
* Stored RPC functions (`increment_post_claps`) and Row-Level Security (RLS) policies.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
