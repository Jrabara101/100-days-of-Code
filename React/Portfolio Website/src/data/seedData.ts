import { Post, CaseStudy, Inquiry, PersonalPulse } from '../types';

export const initialPulse: PersonalPulse = {
  availability: 'available',
  availabilityLabel: 'Available for Select Q3/Q4 Projects',
  availabilityQuarter: 'Q3/Q4 2026',
  location: 'San Francisco, CA',
  timezone: 'America/Los_Angeles',
  timeOffset: 'PST / UTC-7',
  currentlyReading: {
    title: 'The Design of Everyday Things & Form Follows Code',
    author: 'Don Norman & John Maeda',
  },
  currentlyShipping: {
    title: 'Autonomous Multi-Agent Workflow Engine',
    description: 'Experimenting with deterministic local state transitions for edge AI agents.',
  },
  currentObsession: 'Zero-layout-shift typography & tactile micro-spring physics in modern browsers.',
};

export const initialCaseStudies: CaseStudy[] = [
  {
    id: 'kinetix-canvas',
    title: 'Kinetix Engine — High-Frequency Collaborative Canvas',
    client: 'Kinetix Labs',
    role: 'Principal Design Technologist & Full-Stack Architect',
    year: '2025 – 2026',
    tagline: 'Engineered a WebGL-accelerated interactive canvas handling 50k+ nodes at 60fps with real-time CRDT multi-user syncing.',
    featured: true,
    kpis: [
      { label: 'Render Throughput', value: '+340%', hint: 'From 18fps to steady 60fps under 50k nodes' },
      { label: 'Capital Raised', value: '$4.8M', hint: 'Led tech demonstration securing Series A' },
      { label: 'P99 Sync Latency', value: '38ms', hint: 'Sub-frame edge synchronization via WebSockets' },
    ],
    tags: ['Full-Stack', 'WebGL', 'CRDT', 'TypeScript', 'Design Systems'],
    overview: 'Kinetix was struggling with browser lag when distributed financial modeling teams loaded complex dependency graphs. We rebuilt the core viewport from standard SVG/DOM into an instanced WebGL rendering pipeline with an immutable local state machine.',
    challenge: 'Existing graph engines choked when rendering dense hierarchical flows exceeding 3,000 entities. The DOM reconciliation overhead caused dropped frames, jank during pan/zoom, and race conditions during simultaneous multi-cursor editing.',
    solution: 'Designed a dual-layer architecture: a GPU-accelerated canvas for non-interactive backgrounds and link topology, paired with an accessible overlaid DOM layer for interactive nodes and focus states. Backed by Yjs CRDTs and edge-routed WebSocket relays.',
    architecture: [
      'Dual-Pass WebGL Renderer: Instanced geometry batching with custom shaders',
      'Yjs CRDT State Relays: Conflict-free decentralized synchronization over TLS WebSockets',
      'Spatial QuadTree Indexing: Real-time collision detection and viewport culling in O(log N)',
      'Sub-pixel Touch & Gestures: Custom inertia solver with spring damping for fluid trackpad navigation',
    ],
    impact: 'Reduced memory footprint by 72% while supporting 15x more concurrent entities without dropping below 60fps. Adopted by Tier-1 quantitative trading firms.',
    heroImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    beforeAfter: {
      before: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80',
      after: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80',
      beforeLabel: 'Legacy DOM-Heavy Canvas (Laggy & Cluttered)',
      afterLabel: 'Streamlined WebGL Canvas (Fluid 60 FPS)',
    },
    demoUrl: 'https://example.com/demo/kinetix',
    githubUrl: 'https://github.com/example/kinetix-core',
  },
  {
    id: 'aura-design-system',
    title: 'Aura Design System — Multi-Brand Semantic Token Pipeline',
    client: 'HyperCloud Global',
    role: 'Lead Systems Designer & Front-End Architect',
    year: '2024 – 2025',
    tagline: 'Architected an automated multi-tenant design token pipeline spanning Figma, Tailwind, and React web components across 12 product lines.',
    featured: true,
    kpis: [
      { label: 'Handoff Cycle Time', value: '-68%', hint: 'From 3 weeks per release to automated continuous sync' },
      { label: 'Product Lines Unified', value: '12 Apps', hint: 'Cohesive branding across Web, Mobile & Embedded' },
      { label: 'A11y Compliance', value: '99.8%', hint: 'Automated WCAG 2.1 AAA contrast and focus parity' },
    ],
    tags: ['Design Systems', 'TypeScript', 'Tokens Studio', 'Tailwind CSS', 'Storybook'],
    overview: 'HyperCloud had accumulated 6 legacy component libraries across disparate corporate acquisitions. We unified engineering and product design under a single source of truth using semantic, multi-tier design tokens.',
    challenge: 'Design teams frequently updated Figma files without automated parity in production CSS. Developers resorted to ad-hoc hex values, leading to visual inconsistencies, dark mode bugs, and severe accessibility regressions.',
    solution: 'Engineered a GitHub Actions pipeline connecting Figma Tokens directly to Style Dictionary. Built a headless React component library with strict ARIA conformance, zero-runtime CSS variables, and automatic color contrast validation.',
    architecture: [
      '3-Tier Token Hierarchy: Global Primitives -> Semantic Aliases -> Component Scopes',
      'Automated CI Transform: Figma JSON exported, validated, and published to npm packages',
      'Radix UI Primitives: Keyboard navigation, screen-reader compliance, and focus traps out of the box',
      'Zero-Runtime CSS Variables: Seamless client-side theme switching without layout recalculation',
    ],
    impact: 'Saved approximately 450 developer-hours per quarter and eliminated visual regressions across 12 distinct cloud management dashboards.',
    heroImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    beforeAfter: {
      before: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80',
      after: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1000&q=80',
      beforeLabel: 'Disjointed Fragmented Style Sheets',
      afterLabel: 'Harmonious Semantic Token System',
    },
    demoUrl: 'https://example.com/demo/aura',
    githubUrl: 'https://github.com/example/aura-system',
  },
  {
    id: 'pulse-telemetry',
    title: 'Pulse Health — Critical Care Diagnostic Telemetry',
    client: 'BioStream Technologies',
    role: 'Staff Full-Stack Engineer',
    year: '2024',
    tagline: 'Built real-time physiological waveform stream visualizer for emergency room physicians with offline-first persistence.',
    featured: false,
    kpis: [
      { label: 'Daily Telemetry Packets', value: '1.8M/day', hint: 'Reliable ingestion with zero dropped cardiac spikes' },
      { label: 'Physician Triage Time', value: '-45%', hint: 'Instant alert categorization and vital trend projections' },
      { label: 'System Reliability', value: '99.99%', hint: 'Strict offline fallback cache on local bedside terminals' },
    ],
    tags: ['Full-Stack', 'WebSockets', 'IndexedDB', 'React', 'Healthcare'],
    overview: 'In high-pressure clinical settings, doctors need instant access to patient vital trends without network interruptions or ambiguous UI charts. Pulse provides sub-second waveform visualization.',
    challenge: 'Hospital WiFi dead zones led to broken live connections. If the bedside workstation lost internet, critical vitals would buffer or disappear from the screen.',
    solution: 'Designed an offline-first architecture utilizing IndexedDB for circular ring buffers. When the network drops, the application smoothly switches to bedside hardware Bluetooth telemetry and synchronizes once connectivity restores.',
    architecture: [
      'High-Speed Ring Buffer in IndexedDB: Retains 72 hours of uninterrupted waveform data locally',
      'HTML5 Canvas ECG Renderer: Smooth 120Hz cardiac rhythm traces without DOM overhead',
      'Web Workers Offloading: Real-time arrhythmia pattern detection without blocking UI rendering',
      'Role-Based Audit Logging: Strict HIPAA compliance tracking with cryptographic signature hashes',
    ],
    impact: 'Deployed across 4 regional medical centers, monitoring over 120 intensive care beds daily.',
    heroImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    demoUrl: 'https://example.com/demo/pulse',
  },
];

export const initialPosts: Post[] = [
  {
    id: 'post-local-first-state',
    slug: 'architecting-zero-latency-offline-first-interfaces',
    title: 'Architecting Zero-Latency Offline-First Interfaces: Local-First State Machines & CRDTs',
    excerpt: 'The cloud-centric web model is showing its age. Why moving authoritative state to the client edge creates resilient, instantly responsive user experiences that work even in an airplane cabin.',
    stage: 'evergreen',
    status: 'published',
    view_count: 1420,
    claps_count: 184,
    published_at: '2026-08-15T10:00:00Z',
    updated_at: '2026-09-20T14:30:00Z',
    tags: ['Architecture', 'Local-First', 'CRDT', 'State Machines', 'TypeScript'],
    readTimeMinutes: 7,
    coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    content: `
## The Fallacy of the Perpetual Network

For nearly two decades, modern web applications operated under a fragile assumption: that the network is an invisible, infinite, and perpetually reliable wire. We designed software that renders spinners on every click, awaits round-trips to distant data centers before confirming a toggle switch, and leaves users staring at blank sheets when their connection stutters in a train tunnel.

In contrast, **local-first software** treats the client device as the primary, authoritative source of truth. The network is relegated to an asynchronous synchronization transport layer.

> "A local-first application is not merely an app with an offline fallback cache. It is software that owns its data locally, reads and writes instantly to persistent local storage, and syncs peer-to-peer or via light relays whenever connectivity is present."

---

## 1. The Core Mechanical Inversion

In traditional client-server REST or GraphQL architectures, state flow is unidirectional and blocked on network confirmation:

\`\`\`typescript
// Traditional blocking pattern: The UI freezes awaiting server blessing
async function handleUpdateTitle(documentId: string, newTitle: string) {
  setSaving(true);
  try {
    const response = await api.patch(\`/documents/\${documentId}\`, { title: newTitle });
    setDocument(response.data);
  } catch (err) {
    showToast("Failed to save changes. Please retry.");
  } finally {
    setSaving(false);
  }
}
\`\`\`

In an offline-first, local-state model, mutations execute synchronously into an in-memory reactive graph backed by persistent storage:

\`\`\`typescript
// Local-first pattern: Mutation is instant, persistent, and queued for sync
function handleUpdateTitle(documentId: string, newTitle: string) {
  // 1. Immediately apply mutation to local CRDT document
  doc.getText('title').delete(0, doc.getText('title').length);
  doc.getText('title').insert(0, newTitle);

  // 2. Persist binary update to local IndexedDB (zero network latency)
  localStore.persistUpdate(documentId, Y.encodeStateAsUpdate(doc));

  // 3. Background sync worker handles synchronization asynchronously
  syncManager.broadcastState(documentId);
}
\`\`\`

The perceptual latency of this operation drops from **350ms** (typical round-trip) to **< 2ms** (local memory manipulation).

---

## 2. Resolving Multi-User Concurrency with CRDTs

When multiple collaborators edit concurrently without a central locking server, how do we prevent divergence? Conflict-free Replicated Data Types (CRDTs) provide mathematically proven convergence guarantees.

Whether two clients edit in different timezones or reconnect after a 12-hour flight, their state vectors merge deterministically without requiring human conflict resolution dialogs.

The state convergence function satisfies idempotence and commutativity:

$$\\text{Merge}(A, B) = \\text{Merge}(B, A)$$

$$\\text{Merge}(A, \\text{Merge}(B, C)) = \\text{Merge}(\\text{Merge}(A, B), C)$$

### The Practical Rule of Thumb
- Use **LWW (Last-Write-Wins)** registers only for scalar, atomic metadata (e.g. status flags, user display names).
- Use **RGA or Sequence CRDTs (like Yjs)** for rich-text, arrays, and continuous streams where character preservation is critical.

---

## 3. Storage Hierarchy in Modern Browsers

Building reliable local-first web applications requires an intentional storage strategy:

| Storage Layer | Access Latency | Max Capacity | Durability |
| :--- | :--- | :--- | :--- |
| **In-Memory Heap (Yjs Doc)** | < 0.1ms | ~1-2 GB | Volatile (lost on tab close) |
| **IndexedDB (IDB-Keyval / Dexie)** | 1.5ms – 5ms | Up to 80% free disk | High (persistent across sessions) |
| **OPFS (Origin Private File System)** | 0.8ms – 3ms | Hundreds of GBs | Highest (direct block storage access) |
| **Remote Edge Relay (Postgres/Supabase)**| 40ms – 120ms | Unlimited | Authoritative cloud mirror |

By pairing **IndexedDB** with **Origin Private File System (OPFS)**, browser applications can manage complex SQLite databases client-side, executing relational queries in milliseconds without sending a single byte over the wire.

---

## 4. Key Takeaways for Product Architects

1. **Stop Rendering Spinners on User Input:** Mutate the local model immediately. Reflect the change in the UI with zero delay.
2. **Treat Network Sync as a Background Routine:** Network status should be communicated through a discreet indicator, never an application-blocking modal.
3. **Decouple Reading from Network Availability:** A user should always be able to open your application on a mountaintop and browse their history unimpeded.

When software feels as immediate and tactile as a physical notebook, user trust and engagement scale exponentially.
`,
  },
  {
    id: 'post-tactile-digital-design',
    slug: 'the-return-of-tactile-digital-design',
    title: 'The Return of Tactile Digital Design: Why Micro-Spring Physics Prevail',
    excerpt: 'Flat design stripped our interfaces of spatial weight. The modern renaissance is not skeuomorphic nostalgia—it is grounded in physical spring kinetics and perceptual ergonomics.',
    stage: 'budding',
    status: 'published',
    view_count: 890,
    claps_count: 96,
    published_at: '2026-09-02T16:00:00Z',
    updated_at: '2026-09-18T11:00:00Z',
    tags: ['Design Systems', 'Micro-Interactions', 'UI Ergonomics', 'CSS'],
    readTimeMinutes: 5,
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    content: `
## Beyond the Flatland Desert

A decade ago, the tech industry reacted violently against early skeuomorphism. Wood grain textures, stitched leather calendar headers, and glossy bubble buttons were banished overnight in favor of ultra-flat, sterile rectangular cards.

While this flat aesthetic brought needed visual simplification and responsiveness, it threw out the baby with the bathwater: **spatial intuition and tactile feedback**.

When every element is a borderless pastel rectangle with zero depth cues, users hesitate. Is this clickable? Did my tap register? Is this pane draggable or static?

---

## The New Tactility: Physics Over Texture

The modern resurgence of tactility has nothing to do with fake textures. Instead, it is rooted in **perceptual physics**:

1. **Spring Dynamics:** Natural damping rather than robotic linear cubic-bezier curves.
2. **Micro-Borders & Specular Highlights:** 1px hairline borders that mimic subtle edge light refraction.
3. **Layer Elevation Hierarchy:** Using subtle atmospheric blur (glassmorphism) and dual-tone ambient shadows.

\`\`\`css
/* The formula for an editorial tactile card */
.tactile-card {
  background: #FFFFFF;
  border: 1px solid rgba(24, 24, 27, 0.08);
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 4px 12px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.tactile-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.04),
    0 12px 28px rgba(0, 0, 0, 0.08);
}
\`\`\`

---

## Why Spring Physics Feel Organic

Human limbs move with inertia and muscular damping. When an interface element animates with linear timing, our visual cortex perceives it as artificial.

When an element responds with **critically damped spring physics**, the interaction feels physical—as if you pushed a physical brass switch or dropped a pebble into a calm pond.

Try hovering over the interactive case studies on this portfolio: notice how the scale changes respond to the speed and presence of your pointer.
`,
  },
  {
    id: 'post-infinite-canvas-critique',
    slug: 'on-the-death-of-infinite-canvas-interfaces',
    title: 'On the Pitfalls of the Infinite Canvas: Why Spatial Boundaries Beat Boundless Pan',
    excerpt: 'Infinite whiteboards promised total cognitive liberation. In practice, they create sprawling junkyards of unorganized thoughts. A brief case for intentional constraints.',
    stage: 'seedling',
    status: 'published',
    view_count: 512,
    claps_count: 42,
    published_at: '2026-09-28T09:15:00Z',
    updated_at: '2026-09-28T09:15:00Z',
    tags: ['Product Design', 'Cognitive Load', 'Productivity'],
    readTimeMinutes: 3,
    coverImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    content: `
## The Illusion of Infinite Freedom

Every couple of years, software design re-discovers the infinite 2D canvas. The pitch is always seductive:

> "Your mind doesn't think in pages or linear text. Spread your thoughts across an infinite, unbounded spatial universe!"

Yet after observing hundreds of design and engineering teams use Miro, FigJam, and spatial note-taking tools, a consistent pattern emerges:

1. **The Sprawl Trap:** Without edges, there is no pressure to summarize, edit, or conclude. Ideas metastasize into sprawling spider-webs.
2. **The Zoom Disorientation:** Finding a specific diagram requires 10 seconds of zoom-out, pan-left, zoom-in guesswork.
3. **The Collaboration Fog:** New teammates opening the board experience immediate cognitive paralysis.

### The Power of the Bounded Container

Physical index cards, book pages, and slides force an essential editorial discipline: **the constraint of the frame**.

When you have a finite vertical column or a bounded slide, you must decide what matters most. Constraints breed clarity. Perhaps the future of digital knowledge isn't boundless 2D zoom, but structured, linked hyper-documents that honor human attention limits.
`,
  },
  {
    id: 'post-high-intent-gateways',
    slug: 'designing-high-intent-contact-gateways',
    title: 'Designing High-Intent Contact Gateways: Converting Inquiries Without Friction',
    excerpt: 'Most contact forms are either an intimidating 20-field interrogation or a hollow "hello@example.com" link. Here is how we design adaptive opportunity consoles that respect both client and creator time.',
    stage: 'evergreen',
    status: 'published',
    view_count: 940,
    claps_count: 112,
    published_at: '2026-07-10T12:00:00Z',
    updated_at: '2026-08-01T08:00:00Z',
    tags: ['Conversion', 'CRM', 'UI Design', 'Freelance & Advisory'],
    readTimeMinutes: 6,
    coverImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    content: `
## The Two Extremes of Inbound Contact

When high-caliber clients or collaborators visit a personal portfolio, they are evaluating two signals:
1. **Competence:** Can this person solve my high-stakes problem?
2. **Accessibility & Clarity:** How easy is it to initiate a structured conversation?

Most websites botch this in one of two ways:

- **The Void Link:** A bare \`mailto:hello@... \` link. This forces the sender to write a cold email from scratch with no structure, resulting in vague inquiries that require three back-and-forth emails just to clarify timeline and budget.
- **The Corporate Interrogation:** A rigid 15-field Salesforce form with company size, tax ID, and phone number, alienating high-intent founders who just want to explore a Q3 collaboration.

---

## The Adaptive Intent Architecture

An **Opportunity Gateway** should adapt dynamically to the visitor's goal:

- **New Venture / Full-Stack Build:** Ask about timeline and budget tier upfront so expectations are aligned before the first call.
- **Advisory / Speaking:** Skip budget tiers and ask for event date, topic focus, and audience format.
- **Casual Coffee / Mentorship:** Keep it light and friendly with just name, email, and one thoughtful question.

By categorizing intent at the very first step, the form fields configure themselves contextually, lowering cognitive barrier while improving lead qualification.
`,
  },
];

export const initialInquiries: Inquiry[] = [
  {
    id: 'inq-001',
    sender_name: 'Elena Rostova',
    sender_email: 'elena@apollotech.io',
    intent: 'project_engagement',
    budget_tier: '25k_plus',
    timeline: 'Q4 2026 (Starting in ~4 weeks)',
    message: 'We are building a collaborative CAD preview tool in WebAssembly and need an expert to architect the local-first state synchronization engine and design system. Loved your Kinetix case study.',
    status: 'new',
    ip_hash: '9f83...bc12',
    created_at: '2026-10-02T14:22:00Z',
    notes: 'High-intent lead. Founder of Apollo Tech. Mentioned Kinetix case study specifically.',
  },
  {
    id: 'inq-002',
    sender_name: 'Marcus Chen',
    sender_email: 'marcus@designsystems.world',
    intent: 'advisory_speaking',
    timeline: 'November 2026',
    message: 'Inviting you to give a keynote at the Global Design Tokens Summit on "Zero-Runtime CSS Variables and Automated Figma CI Pipelines". 45 min slot + Q&A.',
    status: 'reviewed',
    ip_hash: '71a4...90d1',
    created_at: '2026-09-29T18:05:00Z',
    notes: 'Speaker honorarium included. Check November schedule availability.',
  },
  {
    id: 'inq-003',
    sender_name: 'Sophia Lindqvist',
    sender_email: 'sophia@nordicfintech.se',
    intent: 'design_systems',
    budget_tier: '10k_25k',
    timeline: 'Next 2 months',
    message: 'Looking to audit and refactor our multi-tenant banking dashboard design tokens for WCAG AAA compliance and unified mobile web delivery.',
    status: 'replied',
    ip_hash: '3e21...8a9f',
    created_at: '2026-09-25T09:12:00Z',
    notes: 'Sent initial discovery scope and calendar link. Waiting for their team review.',
  },
  {
    id: 'inq-004',
    sender_name: 'David K.',
    sender_email: 'david@stanford.edu',
    intent: 'coffee_chat',
    message: 'PhD candidate studying human-computer interaction and CRDT ergonomics. Read your digital garden essay on offline-first state machines—would love to buy you a coffee in Hayes Valley!',
    status: 'new',
    ip_hash: '55bc...112e',
    created_at: '2026-10-03T11:40:00Z',
  },
];
