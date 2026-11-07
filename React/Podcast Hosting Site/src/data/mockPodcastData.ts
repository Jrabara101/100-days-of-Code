import { Episode, CuratedPlaylist, VoicemailQuestion } from '../types';

export const SHOW_METADATA = {
  title: "RESONANCE STUDIO",
  tagline: "The Audio Architecture of Modern Building",
  host: "Marcus Sterling",
  hostRole: "Lead Creator & Studio Engineer",
  hostAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80",
  coverArt: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80",
  feedUrl: "https://feeds.resonance.fm/episodes.rss",
  totalSubscribers: "148,200",
  weeklyDownloads: "64,800",
  rating: "4.97 ★ (2.4k reviews)",
  description: "Tactile conversations at the intersection of solo software economics, engineering crafts, and human-first digital tools. Zero fluff, synchronized transcripts, and actionable takeaways."
};

export const MOCK_CURATED_PLAYLISTS: CuratedPlaylist[] = [
  {
    id: "playlist-onboarding",
    title: "New to the Show? Start with These 3 Classics",
    subtitle: "The foundational starter tracks covering pricing, architecture, and sustainable craft.",
    badge: "Essential Onboarding",
    description: "Hand-picked episodes designed for first-time listeners to quickly absorb the core philosophy of Resonance.",
    episodeIds: ["ep-142", "ep-140", "ep-139"],
    totalDurationSec: 4920, // ~1h 22m
    accentColor: "#F59E0B"
  },
  {
    id: "playlist-founder-arc",
    title: "The Solo Builder Economics Arc",
    subtitle: "Tactical blueprints for shipping high-margin software with single-person teams.",
    badge: "Founder Sprint",
    description: "Deep explorations on escaping freemium traps, pricing psychology, and micro-SaaS cashflow resilience.",
    episodeIds: ["ep-142", "ep-141"],
    totalDurationSec: 5400,
    accentColor: "#FB7185"
  },
  {
    id: "playlist-coffee-breaks",
    title: "15-Minute Coffee Break Sprints",
    subtitle: "Bite-sized, high-signal conversations perfect for quick walks and espresso pauses.",
    badge: "Quick Sips",
    description: "Rapid tactical breakdowns you can finish in under 15 minutes at standard speed.",
    episodeIds: ["ep-140"],
    totalDurationSec: 840,
    accentColor: "#10B981"
  }
];

export const MOCK_EPISODES: Episode[] = [
  {
    id: "ep-142",
    number: 142,
    season: 4,
    title: "Solo Builder Economics & The Death of Freemium",
    takeawaySummary: "Why giving away free software bankrupts single-person builders, how to construct a 3-tier value ladder, and the exact $50k MRR bootstrap stack.",
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    coverGradient: "from-amber-600/30 via-orange-950/20 to-neutral-950",
    publishDate: "Yesterday • S04 E12",
    durationSec: 1920, // 32m 00s
    commuteCategory: 'commute',
    sampleBestMoment: {
      startTimeSec: 252, // 04:12
      durationSec: 45,
      hookSummary: "Why 90% of solo founders miscalculate support debt and how freemium attracts churn instead of advocates."
    },
    skipIntroTimestampSec: 160, // 02:40
    introBanterEndSec: 160,
    speakers: [
      {
        id: "spk-marcus",
        name: "Marcus Sterling",
        role: "host",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        title: "Creator & Host",
        handle: "@msterling"
      },
      {
        id: "spk-maya",
        name: "Maya Lin",
        role: "guest",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80",
        title: "Founder, HyperCraft • ex-Stripe",
        handle: "@mayalin_tech"
      }
    ],
    tags: ["🎙️ w/ Maya Lin", "Solo Builder Economics", "🛠️ Tactical Breakdown", "Pricing Psychology"],
    chapters: [
      {
        id: "ch-142-1",
        title: "Studio Check-in & Housekeeping",
        startTimeSec: 0,
        endTimeSec: 160,
        summary: "Weekly microphone checks, listener shout-outs, and sponsor announcements.",
        isIntroBanter: true
      },
      {
        id: "ch-142-2",
        title: "Why Freemium Kills Early Solo Builders",
        startTimeSec: 160,
        endTimeSec: 495,
        summary: "The hidden support debt of free tier users and why upfront paid trials create 10x healthier feedback loops."
      },
      {
        id: "ch-142-3",
        title: "The 3-Tier Value Ladder Blueprint",
        startTimeSec: 495,
        endTimeSec: 940,
        summary: "Structuring Utility, Leverage, and Enterprise seats without diluting focus."
      },
      {
        id: "ch-142-4",
        title: "The $50k MRR High-Margin Automation Stack",
        startTimeSec: 940,
        endTimeSec: 1350,
        summary: "How Maya handles 2,400 active accounts with zero full-time support staff using PostHog and webhook triage."
      },
      {
        id: "ch-142-5",
        title: "Customer Discovery Without Confirmation Bias",
        startTimeSec: 1350,
        endTimeSec: 1720,
        summary: "Applying Rob Fitzpatrick's Mom Test framework to pricing conversations."
      },
      {
        id: "ch-142-6",
        title: "Listener Mailbag & Next Week Preview",
        startTimeSec: 1720,
        endTimeSec: 1920,
        summary: "Answering audio voicemails regarding churn mitigation in solo developer tools."
      }
    ],
    transcript: [
      {
        id: "blk-1",
        speakerId: "spk-marcus",
        startTimeSec: 0,
        endTimeSec: 160,
        text: "Welcome back to Resonance Studio. Before we plunge into today's conversation with Maya Lin, a quick reminder that today's episode is brought to you by our studio patrons and acoustic backers. If you are tuning in on the subway or your morning coffee walk, welcome. Let us jump straight to the heart of building.",
        sentences: [
          {
            id: "s-1-1",
            speakerId: "spk-marcus",
            startTimeSec: 0,
            endTimeSec: 35,
            text: "Welcome back to Resonance Studio, the space where we unpack tactile software craft and founder economics."
          },
          {
            id: "s-1-2",
            speakerId: "spk-marcus",
            startTimeSec: 35,
            endTimeSec: 95,
            text: "Before we plunge into today's conversation with Maya Lin, a quick thank you to our studio patrons and acoustic backers."
          },
          {
            id: "s-1-3",
            speakerId: "spk-marcus",
            startTimeSec: 95,
            endTimeSec: 160,
            text: "Today we are dissecting why freemium models are a trap for solo software engineers. Maya, welcome to the mic."
          }
        ]
      },
      {
        id: "blk-2",
        speakerId: "spk-maya",
        startTimeSec: 160,
        endTimeSec: 320,
        text: "Thank you Marcus. The biggest lie in modern bootstrapped software is that if you make your product free, word-of-mouth will magically offset your support costs. When you have zero employees, every free user asking for an API tweak consumes your most scarce asset: cognitive building bandwidth.",
        sentences: [
          {
            id: "s-2-1",
            speakerId: "spk-maya",
            startTimeSec: 160,
            endTimeSec: 210,
            text: "Thank you Marcus. The biggest lie in modern bootstrapped software is that if you make your product free, word-of-mouth will magically offset your support costs."
          },
          {
            id: "s-2-2",
            speakerId: "spk-maya",
            startTimeSec: 210,
            endTimeSec: 252,
            text: "When you have zero employees, every free user asking for an API tweak consumes your most scarce asset: cognitive building bandwidth."
          },
          {
            id: "s-2-3",
            speakerId: "spk-maya",
            startTimeSec: 252,
            endTimeSec: 297,
            text: "We tested this at HyperCraft. When we offered a free tier, 84% of our GitHub issues came from users paying zero dollars, while our paying customers waited 14 hours for email replies."
          },
          {
            id: "s-2-4",
            speakerId: "spk-maya",
            startTimeSec: 297,
            endTimeSec: 320,
            text: "The day we deleted the free tier and required a credit card upfront for a 14-day reverse trial, our churn dropped by half."
          }
        ]
      },
      {
        id: "blk-3",
        speakerId: "spk-marcus",
        startTimeSec: 320,
        endTimeSec: 495,
        text: "That distinction between reverse trials and indefinite free tiers is monumental. A reverse trial gives full access to premium features for fourteen days, then gracefully steps down to a read-only vault unless they activate their subscription. You respect their intelligence while setting clear boundaries.",
        sentences: [
          {
            id: "s-3-1",
            speakerId: "spk-marcus",
            startTimeSec: 320,
            endTimeSec: 390,
            text: "That distinction between reverse trials and indefinite free tiers is monumental."
          },
          {
            id: "s-3-2",
            speakerId: "spk-marcus",
            startTimeSec: 390,
            endTimeSec: 450,
            text: "A reverse trial gives full access to premium features for fourteen days, then gracefully steps down to a read-only vault unless they activate their subscription."
          },
          {
            id: "s-3-3",
            speakerId: "spk-marcus",
            startTimeSec: 450,
            endTimeSec: 495,
            text: "You respect their intelligence while setting clear commercial boundaries from day one."
          }
        ]
      },
      {
        id: "blk-4",
        speakerId: "spk-maya",
        startTimeSec: 495,
        endTimeSec: 940,
        text: "Exactly. Now let's talk about the 3-Tier Value Ladder. Tier one is what I call the Practitioner Seat at $29 a month. It provides individual high-speed workflows. Tier two is the Studio License at $99 a month, with team webhooks and audit logs. And Tier three is the Dedicated Instance tier.",
        sentences: [
          {
            id: "s-4-1",
            speakerId: "spk-maya",
            startTimeSec: 495,
            endTimeSec: 580,
            text: "Exactly. Now let's talk about the 3-Tier Value Ladder. Tier one is what I call the Practitioner Seat at $29 a month."
          },
          {
            id: "s-4-2",
            speakerId: "spk-maya",
            startTimeSec: 580,
            endTimeSec: 680,
            text: "Tier two is the Studio License at $99 a month, with team webhooks, automated exports, and centralized billing."
          },
          {
            id: "s-4-3",
            speakerId: "spk-maya",
            startTimeSec: 680,
            endTimeSec: 790,
            text: "And Tier three is the Dedicated VPC Instance at $490 a month. You would be shocked how many enterprise procurement officers will only buy if there is a tier starting at $400+."
          },
          {
            id: "s-4-4",
            speakerId: "spk-maya",
            startTimeSec: 790,
            endTimeSec: 940,
            text: "If you only charge $9, serious companies assume your software is a weekend toy that will be abandoned when you get bored."
          }
        ]
      },
      {
        id: "blk-5",
        speakerId: "spk-marcus",
        startTimeSec: 940,
        endTimeSec: 1350,
        text: "Patrick Collison once remarked on this exact phenomenon: pricing is not just cash collection, pricing is positioning and trust signaling. Let's dig into your automation stack. How do you maintain 2,400 active accounts without hiring a fleet of support representatives?",
        sentences: [
          {
            id: "s-5-1",
            speakerId: "spk-marcus",
            startTimeSec: 940,
            endTimeSec: 1030,
            text: "Patrick Collison once remarked on this exact phenomenon: pricing is not just cash collection, pricing psychology is positioning and trust signaling."
          },
          {
            id: "s-5-2",
            speakerId: "spk-marcus",
            startTimeSec: 1030,
            endTimeSec: 1180,
            text: "Let's dig into your automation stack. How do you maintain 2,400 active accounts without hiring a fleet of support representatives?"
          },
          {
            id: "s-5-3",
            speakerId: "spk-marcus",
            startTimeSec: 1180,
            endTimeSec: 1350,
            text: "You mentioned PostHog and webhook telemetry earlier. Walk us through that pipeline."
          }
        ]
      },
      {
        id: "blk-6",
        speakerId: "spk-maya",
        startTimeSec: 1350,
        endTimeSec: 1720,
        text: "We instrument every user event with PostHog. If an API request throws a 400 error twice in thirty seconds, an automated webhook triggers a subtle in-app diagnosis banner with the exact documentation link before the user even thinks to write to support. It turns a frustrating support ticket into an instant self-serve fix.",
        sentences: [
          {
            id: "s-6-1",
            speakerId: "spk-maya",
            startTimeSec: 1350,
            endTimeSec: 1470,
            text: "We instrument every user action with PostHog. If an API request throws a 400 error twice in thirty seconds, an automated webhook triggers."
          },
          {
            id: "s-6-2",
            speakerId: "spk-maya",
            startTimeSec: 1470,
            endTimeSec: 1610,
            text: "It displays a contextual diagnostic banner with the exact documentation link before the user even thinks to open a ticket."
          },
          {
            id: "s-6-3",
            speakerId: "spk-maya",
            startTimeSec: 1610,
            endTimeSec: 1720,
            text: "That single workflow deflected 62% of our inbound technical tickets in Q3 alone."
          }
        ]
      },
      {
        id: "blk-7",
        speakerId: "spk-marcus",
        startTimeSec: 1720,
        endTimeSec: 1920,
        text: "That is pure operational poetry. Thank you Maya Lin for sharing such transparent financial and architectural numbers today. Listeners, you can find Maya's full press-kit, resource links, and slide notes directly in the companion shelf on your screen. Until next week, keep building with precision.",
        sentences: [
          {
            id: "s-7-1",
            speakerId: "spk-marcus",
            startTimeSec: 1720,
            endTimeSec: 1820,
            text: "That is pure operational poetry. Thank you Maya Lin for sharing such transparent financial and architectural numbers today."
          },
          {
            id: "s-7-2",
            speakerId: "spk-marcus",
            startTimeSec: 1820,
            endTimeSec: 1920,
            text: "Listeners, you can find Maya's full press-kit and resource links in the companion shelf. Until next week, keep building with precision."
          }
        ]
      }
    ],
    resources: [
      {
        id: "res-142-1",
        title: "The Mom Test: How to talk to customers & learn if your business is a good idea",
        type: "book",
        categoryLabel: "📚 Book",
        authorOrHost: "Rob Fitzpatrick",
        description: "The definitive guide on customer discovery interviews that strip away false flattery and reveal real willingness to pay.",
        url: "https://www.momtestbook.com",
        timestampSec: 1350,
        badgeText: "💬 Discussed at 22:30"
      },
      {
        id: "res-142-2",
        title: "PostHog Open-Source Product Analytics & Session Replay",
        type: "tool",
        categoryLabel: "🛠️ Tool",
        authorOrHost: "PostHog Team",
        description: "The complete event telemetry and error tracking suite Maya uses to deflect 60%+ of solo customer support inquiries.",
        url: "https://posthog.com",
        timestampSec: 1470,
        badgeText: "💬 Discussed at 24:30"
      },
      {
        id: "res-142-3",
        title: "The End of 0% Interest Software: Why Bootstrappers are Winning",
        type: "article",
        categoryLabel: "📰 Article",
        authorOrHost: "Stratechery & Resonance Analysis",
        description: "Deep macro breakdown examining how high capital costs shifted developer preferences from venture bloat to lean, paid utilities.",
        url: "https://stratechery.com",
        timestampSec: 252,
        badgeText: "💬 Discussed at 04:12"
      },
      {
        id: "res-142-4",
        title: "Patrick Collison on Pricing as Positioning",
        type: "person",
        categoryLabel: "👤 Person",
        authorOrHost: "CEO, Stripe",
        description: "Foundational philosophy that cheap pricing repels enterprise buyers and induces mistrust in mission-critical developer tools.",
        url: "https://stripe.com",
        timestampSec: 940,
        badgeText: "💬 Discussed at 15:40"
      }
    ],
    heatmap: [
      0.15, 0.22, 0.18, 0.35, 0.42, 0.88, 0.95, 0.82, 0.65, 0.50,
      0.45, 0.52, 0.61, 0.70, 0.58, 0.64, 0.76, 0.84, 0.92, 0.68,
      0.40, 0.38, 0.45, 0.55, 0.68, 0.72, 0.60, 0.54, 0.48, 0.35
    ],
    retentionCurve: [
      { timestampSec: 0, retentionPct: 100, replayPct: 12 },
      { timestampSec: 160, retentionPct: 96, replayPct: 24, annotation: "Intro ended • Conversation begins" },
      { timestampSec: 252, retentionPct: 98, replayPct: 94, isPeak: true, annotation: "🔥 +42% Listener Rewinds (Peak Insight)" },
      { timestampSec: 495, retentionPct: 92, replayPct: 45 },
      { timestampSec: 720, retentionPct: 89, replayPct: 62 },
      { timestampSec: 940, retentionPct: 87, replayPct: 58 },
      { timestampSec: 1200, retentionPct: 84, replayPct: 40 },
      { timestampSec: 1470, retentionPct: 86, replayPct: 78, isPeak: true, annotation: "⚡ Webhook Telemetry Architecture Peak" },
      { timestampSec: 1720, retentionPct: 81, replayPct: 35 },
      { timestampSec: 1920, retentionPct: 78, replayPct: 20 }
    ],
    guestSharePack: {
      guestName: "Maya Lin",
      quotes: [
        "When you have zero employees, every free user consumes your most scarce asset: cognitive building bandwidth.",
        "The day we deleted the free tier and required a credit card upfront, our churn dropped by half.",
        "If you only charge $9, serious enterprise buyers assume your tool is a weekend toy."
      ],
      referralLink: "https://resonance.fm/e/142?ref=mayalin",
      referralListens: 4120,
      audiogramTitle: "Why Freemium Kills Solo Builders"
    }
  },
  {
    id: "ep-141",
    number: 141,
    season: 4,
    title: "Systems Architecture for 10M Real-Time WebSockets",
    takeawaySummary: "Handling high-concurrency pub/sub clusters without memory leaks, Redis connection pooling limits, and Rust microservice offloading.",
    coverUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80",
    coverGradient: "from-blue-700/30 via-slate-900/40 to-neutral-950",
    publishDate: "5 days ago • S04 E11",
    durationSec: 3480, // 58m 00s
    commuteCategory: 'deep-dive',
    sampleBestMoment: {
      startTimeSec: 1100, // 18:20
      durationSec: 45,
      hookSummary: "The subtle node event loop starvation bug that triggers cascade disconnects across 50,000 active socket channels."
    },
    skipIntroTimestampSec: 195, // 03:15
    introBanterEndSec: 195,
    speakers: [
      {
        id: "spk-marcus",
        name: "Marcus Sterling",
        role: "host",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        title: "Creator & Host"
      },
      {
        id: "spk-devon",
        name: "Devon Vance",
        role: "guest",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
        title: "Principal Architect, StreamGrid"
      }
    ],
    tags: ["🎙️ w/ Devon Vance", "Distributed Systems", "WebSockets", "Rust & Go"],
    chapters: [
      { id: "ch-141-1", title: "Latency Benchmarks & Cold Opens", startTimeSec: 0, endTimeSec: 195, isIntroBanter: true },
      { id: "ch-141-2", title: "The 10 Million Socket Milestone", startTimeSec: 195, endTimeSec: 850 },
      { id: "ch-141-3", title: "Redis Pub/Sub vs. NATS Core", startTimeSec: 850, endTimeSec: 1600 },
      { id: "ch-141-4", title: "The Cascade Disconnect Nightmare", startTimeSec: 1600, endTimeSec: 2400 },
      { id: "ch-141-5", title: "Offloading Cryptographic TLS to Rust", startTimeSec: 2400, endTimeSec: 3480 }
    ],
    transcript: [
      {
        id: "blk-141-1",
        speakerId: "spk-marcus",
        startTimeSec: 0,
        endTimeSec: 195,
        text: "Episode 141 of Resonance Studio. Today we enter the subterranean engine room of massive real-time infrastructure with Devon Vance.",
        sentences: [
          { id: "s-141-1", speakerId: "spk-marcus", startTimeSec: 0, endTimeSec: 90, text: "Episode 141 of Resonance Studio. Today we enter the subterranean engine room of real-time infrastructure." },
          { id: "s-141-2", speakerId: "spk-marcus", startTimeSec: 90, endTimeSec: 195, text: "Devon Vance architected the message relay powering 10 million concurrent active connections. Let's dive in." }
        ]
      },
      {
        id: "blk-141-2",
        speakerId: "spk-devon",
        startTimeSec: 195,
        endTimeSec: 1100,
        text: "The hard part of scaling WebSockets isn't opening the connections—Linux epoll handles that cleanly. The danger is what happens when one cluster node restarts.",
        sentences: [
          { id: "s-141-3", speakerId: "spk-devon", startTimeSec: 195, endTimeSec: 500, text: "The hard part of scaling WebSockets isn't opening the connections—Linux epoll handles that cleanly." },
          { id: "s-141-4", speakerId: "spk-devon", startTimeSec: 500, endTimeSec: 1100, text: "The danger is the thunder herd: 150,000 reconnect attempts crashing into your TLS handshake worker pool within 400 milliseconds." }
        ]
      },
      {
        id: "blk-141-3",
        speakerId: "spk-devon",
        startTimeSec: 1100,
        endTimeSec: 1600,
        text: "If you don't implement jittered exponential backoff at the client protocol layer, your edge load balancers become self-inflicted DDoS weapons.",
        sentences: [
          { id: "s-141-5", speakerId: "spk-devon", startTimeSec: 1100, endTimeSec: 1350, text: "If you don't implement jittered exponential backoff at the client protocol layer, your edge load balancers become self-inflicted DDoS weapons." },
          { id: "s-141-6", speakerId: "spk-devon", startTimeSec: 1350, endTimeSec: 1600, text: "We solved this by pushing backpressure tickets before accepting the HTTP upgrade handshake." }
        ]
      }
    ],
    resources: [
      {
        id: "res-141-1",
        title: "Designing Data-Intensive Applications",
        type: "book",
        categoryLabel: "📚 Book",
        authorOrHost: "Martin Kleppmann",
        description: "The gold standard book on consensus, stream processing, and partition tolerance in distributed databases.",
        url: "https://dataintensive.net",
        timestampSec: 850,
        badgeText: "💬 Discussed at 14:10"
      },
      {
        id: "res-141-2",
        title: "NATS.io Cloud-Native Messaging System",
        type: "tool",
        categoryLabel: "🛠️ Tool",
        authorOrHost: "Synadia",
        description: "Ultra-lean pub/sub and stream clustering technology with sub-millisecond tail latency.",
        url: "https://nats.io",
        timestampSec: 1120,
        badgeText: "💬 Discussed at 18:40"
      }
    ],
    heatmap: [
      0.1, 0.15, 0.2, 0.3, 0.45, 0.6, 0.75, 0.9, 0.98, 0.85,
      0.7, 0.65, 0.72, 0.8, 0.78, 0.65, 0.5, 0.4, 0.35, 0.25
    ],
    retentionCurve: [
      { timestampSec: 0, retentionPct: 100, replayPct: 10 },
      { timestampSec: 195, retentionPct: 95, replayPct: 20 },
      { timestampSec: 1100, retentionPct: 97, replayPct: 91, isPeak: true, annotation: "🔥 Thunder Herd Jitter Architecture (+38% Replays)" },
      { timestampSec: 2400, retentionPct: 82, replayPct: 52 },
      { timestampSec: 3480, retentionPct: 74, replayPct: 18 }
    ],
    guestSharePack: {
      guestName: "Devon Vance",
      quotes: [
        "If you don't implement jittered backoff at the client layer, your edge load balancers become self-inflicted DDoS weapons."
      ],
      referralLink: "https://resonance.fm/e/141?ref=devon",
      referralListens: 2890,
      audiogramTitle: "Scaling WebSockets to 10M Connections"
    }
  },
  {
    id: "ep-140",
    number: 140,
    season: 4,
    title: "15-Minute Tactical Sprint: The Daily Design Ritual",
    takeawaySummary: "How 15 minutes of uninterrupted morning typography and visual hierarchy exercises doubles creative output and eliminates designer burnout.",
    coverUrl: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=600&q=80",
    coverGradient: "from-emerald-700/30 via-neutral-900/30 to-neutral-950",
    publishDate: "2 weeks ago • S04 E10",
    durationSec: 840, // 14m 00s
    commuteCategory: 'break',
    sampleBestMoment: {
      startTimeSec: 310, // 05:10
      durationSec: 45,
      hookSummary: "The 'Constraint Box' exercise: how restricting yourself to 1 font weight and 0 colors unlocks 10x better layout balance."
    },
    skipIntroTimestampSec: 80, // 01:20
    introBanterEndSec: 80,
    speakers: [
      {
        id: "spk-marcus",
        name: "Marcus Sterling",
        role: "host",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        title: "Creator & Host"
      },
      {
        id: "spk-sarah",
        name: "Sarah Chen",
        role: "guest",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
        title: "Design Systems Lead, Figma"
      }
    ],
    tags: ["🎙️ w/ Sarah Chen", "Design Systems", "Tactical Sprint", "Craft Ergonomics"],
    chapters: [
      { id: "ch-140-1", title: "Warm Espresso Warmup", startTimeSec: 0, endTimeSec: 80, isIntroBanter: true },
      { id: "ch-140-2", title: "The 15-Minute Constraint Box", startTimeSec: 80, endTimeSec: 420 },
      { id: "ch-140-3", title: "Why Grids Without Hierarchy Fail", startTimeSec: 420, endTimeSec: 840 }
    ],
    transcript: [
      {
        id: "blk-140-1",
        speakerId: "spk-marcus",
        startTimeSec: 0,
        endTimeSec: 80,
        text: "Welcome to our quick 15-minute coffee sprint on Resonance Studio. Today, Sarah Chen gives us a masterclass in rapid design calibration.",
        sentences: [
          { id: "s-140-1", speakerId: "spk-marcus", startTimeSec: 0, endTimeSec: 80, text: "Welcome to our 15-minute coffee sprint. Today, Sarah Chen gives us a masterclass in daily design calibration." }
        ]
      },
      {
        id: "blk-140-2",
        speakerId: "spk-sarah",
        startTimeSec: 80,
        endTimeSec: 420,
        text: "Before opening Slack or Jira, spend fifteen minutes in a blank Figma frame with zero colors and only one font weight. If you can't communicate visual hierarchy purely with spatial rhythm, no gradient palette will save you.",
        sentences: [
          { id: "s-140-2", speakerId: "spk-sarah", startTimeSec: 80, endTimeSec: 250, text: "Before opening Slack or Jira, spend fifteen minutes in a blank frame with zero colors and only one font weight." },
          { id: "s-140-3", speakerId: "spk-sarah", startTimeSec: 250, endTimeSec: 420, text: "If you can't communicate visual hierarchy purely through spatial rhythm and spacing, no gradient palette will save you." }
        ]
      }
    ],
    resources: [
      {
        id: "res-140-1",
        title: "Grid Systems in Graphic Design",
        type: "book",
        categoryLabel: "📚 Book",
        authorOrHost: "Josef Müller-Brockmann",
        description: "The seminal master text on visual communication and objective typography systems.",
        url: "https://en.wikipedia.org/wiki/Josef_M%C3%BCller-Brockmann",
        timestampSec: 280,
        badgeText: "💬 Discussed at 04:40"
      }
    ],
    heatmap: [0.2, 0.4, 0.6, 0.85, 0.95, 0.9, 0.7, 0.5, 0.4, 0.3],
    retentionCurve: [
      { timestampSec: 0, retentionPct: 100, replayPct: 15 },
      { timestampSec: 310, retentionPct: 98, replayPct: 96, isPeak: true, annotation: "🔥 Constraint Box Design Method" },
      { timestampSec: 840, retentionPct: 91, replayPct: 30 }
    ],
    guestSharePack: {
      guestName: "Sarah Chen",
      quotes: ["If you can't communicate visual hierarchy with spatial rhythm, no gradient palette will save you."],
      referralLink: "https://resonance.fm/e/140?ref=sarah",
      referralListens: 5210,
      audiogramTitle: "The 15-Minute Design Ritual"
    }
  },
  {
    id: "ep-139",
    number: 139,
    season: 4,
    title: "AI Agents in Production: Beyond the Chatbot Gimmick",
    takeawaySummary: "State machines, deterministic guardrails, structured JSON outputs, and why multi-turn autonomy requires self-healing execution loops.",
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    coverGradient: "from-purple-800/30 via-neutral-900/30 to-neutral-950",
    publishDate: "3 weeks ago • S04 E09",
    durationSec: 2160, // 36m 00s
    commuteCategory: 'commute',
    sampleBestMoment: {
      startTimeSec: 420,
      durationSec: 45,
      hookSummary: "Why raw LLM calls fail in real apps and how deterministic state graphs guarantee zero hallucinated database queries."
    },
    skipIntroTimestampSec: 140,
    introBanterEndSec: 140,
    speakers: [
      {
        id: "spk-marcus",
        name: "Marcus Sterling",
        role: "host",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        title: "Creator & Host"
      },
      {
        id: "spk-aris",
        name: "Dr. Aris Thorne",
        role: "guest",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        title: "Staff AI Researcher, DeepLab"
      }
    ],
    tags: ["🎙️ w/ Dr. Aris Thorne", "AI Agents", "State Machines", "Reliability"],
    chapters: [
      { id: "ch-139-1", title: "Microphone Calibration & Setup", startTimeSec: 0, endTimeSec: 140, isIntroBanter: true },
      { id: "ch-139-2", title: "Why Chatbots Are Dead Ends", startTimeSec: 140, endTimeSec: 720 },
      { id: "ch-139-3", title: "Deterministic State Machines with LLMs", startTimeSec: 720, endTimeSec: 1500 },
      { id: "ch-139-4", title: "Self-Healing Tool Execution Loops", startTimeSec: 1500, endTimeSec: 2160 }
    ],
    transcript: [
      {
        id: "blk-139-1",
        speakerId: "spk-marcus",
        startTimeSec: 0,
        endTimeSec: 140,
        text: "Episode 139. Dr. Aris Thorne joins us to strip away the AI hype and examine production reliability.",
        sentences: [
          { id: "s-139-1", speakerId: "spk-marcus", startTimeSec: 0, endTimeSec: 140, text: "Episode 139. Dr. Aris Thorne joins us to strip away the AI hype and examine production reliability." }
        ]
      },
      {
        id: "blk-139-2",
        speakerId: "spk-aris",
        startTimeSec: 140,
        endTimeSec: 720,
        text: "If your agent architecture relies on raw prompt engineering without finite state transition boundaries, you don't have a product—you have a slot machine.",
        sentences: [
          { id: "s-139-2", speakerId: "spk-aris", startTimeSec: 140, endTimeSec: 420, text: "If your agent architecture relies on raw prompt engineering without state transition boundaries, you don't have a product." },
          { id: "s-139-3", speakerId: "spk-aris", startTimeSec: 420, endTimeSec: 720, text: "You have a slot machine. High-reliability agents wrap probabilistic models inside rigid, verified deterministic guards." }
        ]
      }
    ],
    resources: [
      {
        id: "res-139-1",
        title: "Building Reliable Agentic Workflows",
        type: "article",
        categoryLabel: "📰 Article",
        authorOrHost: "DeepLab Research Group",
        description: "Comprehensive whitepaper on closed-loop execution verification for autonomous coding agents.",
        url: "https://deeplab.ai",
        timestampSec: 420,
        badgeText: "💬 Discussed at 07:00"
      }
    ],
    heatmap: [0.15, 0.3, 0.5, 0.75, 0.92, 0.88, 0.7, 0.6, 0.45, 0.3],
    retentionCurve: [
      { timestampSec: 0, retentionPct: 100, replayPct: 18 },
      { timestampSec: 420, retentionPct: 97, replayPct: 92, isPeak: true, annotation: "🔥 Slot Machine vs. Deterministic Guards" },
      { timestampSec: 2160, retentionPct: 84, replayPct: 22 }
    ],
    guestSharePack: {
      guestName: "Dr. Aris Thorne",
      quotes: ["If your agent architecture relies on raw prompt engineering without finite state bounds, you have a slot machine."],
      referralLink: "https://resonance.fm/e/139?ref=aris",
      referralListens: 3740,
      audiogramTitle: "AI Agents: Beyond Chatbots"
    }
  }
];

export const MOCK_VOICEMAILS: VoicemailQuestion[] = [
  {
    id: "vm-1",
    episodeId: "ep-142",
    authorName: "Kaelen Ross",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
    timeAgo: "2 hours ago",
    durationSec: 48,
    textPrompt: "Maya, how do you handle international tax compliance and VAT when bootstrapping without an accountant?",
    status: "answered",
    topicTag: "International VAT & Stripe Tax"
  },
  {
    id: "vm-2",
    episodeId: "ep-142",
    authorName: "Liam O'Connor",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80",
    timeAgo: "5 hours ago",
    durationSec: 54,
    textPrompt: "When switching from freemium to reverse trial, how did you message the transition to your legacy 12,000 free users?",
    status: "queued",
    topicTag: "Legacy Churn Management"
  },
  {
    id: "vm-3",
    episodeId: "ep-141",
    authorName: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    timeAgo: "1 day ago",
    durationSec: 39,
    textPrompt: "Devon, what are your thoughts on Rust vs. Go for memory allocations under heavy socket reconnection spikes?",
    status: "queued",
    topicTag: "Go GC vs. Rust Zero-Cost"
  }
];
