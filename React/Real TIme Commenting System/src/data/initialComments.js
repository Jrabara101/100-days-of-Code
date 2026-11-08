export const initialComments = [
  {
    id: "c-101",
    parentId: null,
    paragraphId: "para-2",
    quotedText: "The real bottleneck in online discourse isn't bandwidth; it's nuance compression.",
    author: {
      name: "Marcus Sterling",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      role: "Distributed Systems Lead",
      isAuthor: false,
      isExpert: true
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 145).toISOString(), // ~2.4h ago
    stance: "building",
    body: "This framing of 'nuance compression' hits the core issue. In our internal engineering RFCs, we replaced generic +1/-1 with two specific axes: **Confidence in premise** and **Operational risk**. The emotional temperature dropped overnight because people stopped defending their ego and started assessing the parameter bounds.",
    reactions: {
      changedMyMind: 18,
      spotOn: 42,
      greatSource: 9,
      goodQuestion: 5
    },
    userReactions: ["spotOn"],
    depth: 0,
    isUnreadSinceLastVisit: false,
    children: [
      {
        id: "c-101-1",
        parentId: "c-101",
        paragraphId: "para-2",
        quotedText: null,
        author: {
          name: "Dr. Elena Vance",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          role: "Author",
          isAuthor: true,
          isExpert: true
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
        stance: "building",
        body: "Exactly, Marcus. What's fascinating is that the 'Confidence vs Risk' duality mirrors the ancient epistemological distinction between episteme (justified truth) and techne (practical application). How did your team handle disagreements where confidence was high but risk was catastrophic?",
        reactions: {
          changedMyMind: 14,
          spotOn: 38,
          greatSource: 12,
          goodQuestion: 22
        },
        userReactions: [],
        depth: 1,
        isUnreadSinceLastVisit: false,
        children: [
          {
            id: "c-101-1-1",
            parentId: "c-101-1",
            paragraphId: "para-2",
            quotedText: null,
            author: {
              name: "Marcus Sterling",
              avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
              role: "Distributed Systems Lead",
              isAuthor: false,
              isExpert: true
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
            stance: "resource",
            body: "We introduced a mandatory 'pre-mortem anchor': any objection flagged as catastrophic risk triggers a 48-hour cool-down where the author must document a fallback canary deployment. I open-sourced the schema here: `github.com/distributed-rfc/pre-mortem-matrix`.",
            reactions: {
              changedMyMind: 29,
              spotOn: 54,
              greatSource: 61,
              goodQuestion: 8
            },
            userReactions: ["greatSource"],
            depth: 2,
            isUnreadSinceLastVisit: false,
            children: [
              {
                id: "c-101-1-1-1",
                parentId: "c-101-1-1",
                paragraphId: "para-2",
                quotedText: null,
                author: {
                  name: "Siddharth Rao",
                  avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
                  role: "SRE Architect",
                  isAuthor: false,
                  isExpert: false
                },
                createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
                stance: "counterpoint",
                body: "Deep reply at level 3! A 48-hour mandatory cool-down can paralyze incident remediation if not bounded by severity tier. In P0/P1 incidents, this consensus-seeking mechanism inverted into a decision paralysis loop.",
                reactions: {
                  changedMyMind: 12,
                  spotOn: 23,
                  greatSource: 4,
                  goodQuestion: 15
                },
                userReactions: [],
                depth: 3,
                isUnreadSinceLastVisit: true,
                children: [
                  {
                    id: "c-101-1-1-1-1",
                    parentId: "c-101-1-1-1",
                    paragraphId: "para-2",
                    quotedText: null,
                    author: {
                      name: "Maya Lin",
                      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
                      role: "Incident Commander",
                      isAuthor: false,
                      isExpert: true
                    },
                    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
                    stance: "fix",
                    body: "Level 4 depth branch: That's why high-maturity organizations bifurcate: operational incident runbooks bypass RFC consensus entirely, while design RFCs retain the mandatory cool-down. Clear boundaries prevent both chaos and stagnation.",
                    reactions: {
                      changedMyMind: 16,
                      spotOn: 31,
                      greatSource: 18,
                      goodQuestion: 7
                    },
                    userReactions: [],
                    depth: 4,
                    isUnreadSinceLastVisit: true,
                    children: []
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "c-102",
    parentId: null,
    paragraphId: "para-4",
    quotedText: "by reply level six on mobile, a comment is squished into a pathetic three-word column along the right bezel.",
    author: {
      name: "Talia Brooks",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      role: "Staff Product Designer",
      isAuthor: false,
      isExpert: true
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    stance: "building",
    body: "The visual death spiral is real! We did an eye-tracking and comprehension audit across Reddit, Hacker News, and Substack threads last quarter. Once line length drops below `35ch`, comprehension speed declines by 42% because reader saccades are violently broken every three words. Strict 2-level nesting with slide-over drawers is the mathematically optimal compromise.",
    reactions: {
      changedMyMind: 33,
      spotOn: 68,
      greatSource: 41,
      goodQuestion: 11
    },
    userReactions: ["changedMyMind", "spotOn"],
    depth: 0,
    isUnreadSinceLastVisit: false,
    children: [
      {
        id: "c-102-1",
        parentId: "c-102",
        paragraphId: "para-4",
        quotedText: null,
        author: {
          name: "Devon Chen",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          role: "Frontend Engineer",
          isAuthor: false,
          isExpert: false
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        stance: "question",
        body: "How do you manage parent context when the user navigates into the focus slide-over? Does the drawer render the full root ancestral path, or just the immediate parent comment?",
        reactions: {
          changedMyMind: 3,
          spotOn: 15,
          greatSource: 2,
          goodQuestion: 29
        },
        userReactions: [],
        depth: 1,
        isUnreadSinceLastVisit: false,
        children: [
          {
            id: "c-102-1-1",
            parentId: "c-102-1",
            paragraphId: "para-4",
            quotedText: null,
            author: {
              name: "Dr. Elena Vance",
              avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
              role: "Author",
              isAuthor: true,
              isExpert: true
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
            stance: "building",
            body: "Great question Devon! We use an expandable contextual breadcrumb trail at the top of the Focus Drawer: it shows the root parent in a muted teaser box with a 1-click toggle to expand the full lineage, ensuring you never lose your cognitive bearings.",
            reactions: {
              changedMyMind: 19,
              spotOn: 44,
              greatSource: 8,
              goodQuestion: 14
            },
            userReactions: ["spotOn"],
            depth: 2,
            isUnreadSinceLastVisit: false,
            children: []
          }
        ]
      }
    ]
  },
  {
    id: "c-103",
    parentId: null,
    paragraphId: "para-5",
    quotedText: "Real-time updates must be viewport-aware: buffer insertions gently behind floating activity pills",
    author: {
      name: "Kofi Mensah",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      role: "Real-Time Infrastructure Engineer",
      isAuthor: false,
      isExpert: true
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    stance: "counterpoint",
    body: "Playing devil's advocate here: While viewport buffering protects the reader from sudden jumps, it introduces a subtle synchronization hazard in live auctions or fast Q&As. If user A types a reply to comment X that is currently buffered for user B, user B might re-ask or misinterpret the thread state. How do you signal pending delta weight without visual clutter?",
    reactions: {
      changedMyMind: 45,
      spotOn: 29,
      greatSource: 24,
      goodQuestion: 51
    },
    userReactions: [],
    depth: 0,
    isUnreadSinceLastVisit: true,
    children: [
      {
        id: "c-103-1",
        parentId: "c-103",
        paragraphId: "para-5",
        quotedText: null,
        author: {
          name: "Dr. Elena Vance",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          role: "Author",
          isAuthor: true,
          isExpert: true
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        stance: "building",
        body: "A profound nuance, Kofi! We solve this via a dual-threshold delta buffer: If the reader is idle or scrolling slowly, the floating glass pill surfaces with avatar bubbles. But in the composer, if you attempt to reply to a thread with un-flowed deltas, we show an inline indicator: `2 new replies flowed in while you were typing — [Inspect Diff]`. It bridges both worlds.",
        reactions: {
          changedMyMind: 38,
          spotOn: 62,
          greatSource: 35,
          goodQuestion: 12
        },
        userReactions: ["spotOn", "changedMyMind"],
        depth: 1,
        isUnreadSinceLastVisit: true,
        children: []
      }
    ]
  },
  {
    id: "c-104",
    parentId: null,
    paragraphId: "para-3",
    quotedText: "Comments must live as living margin annotations, anchored directly beside the thoughts they critique.",
    author: {
      name: "Hannah Schmidt",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      role: "Cognitive Ergonomics Researcher",
      isAuthor: false,
      isExpert: false
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    stance: "building",
    body: "Medieval Talmudic codices and monastic scriptoriums already solved this a millennium ago with concentric margin commentary. The central sacred text occupied the middle, surrounded by generations of rabbinic glosses in the margins. It transformed reading into a multi-generational dialogue rather than an isolated monologue.",
    reactions: {
      changedMyMind: 52,
      spotOn: 48,
      greatSource: 73,
      goodQuestion: 16
    },
    userReactions: ["greatSource"],
    depth: 0,
    isUnreadSinceLastVisit: true,
    children: []
  },
  {
    id: "c-105",
    parentId: null,
    paragraphId: "para-6",
    quotedText: "When commenters are invited to tag their contribution with intent... the dynamic shifts from tribal skirmishing to an intellectual salon.",
    author: {
      name: "Liam O'Connor",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
      role: "Community Governance Director",
      isAuthor: false,
      isExpert: true
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    stance: "question",
    body: "What prevents bad actors from weaponizing the [🌱 Building on this] tag to post disingenuous bad-faith attacks, or using intent tags sarcastically?",
    reactions: {
      changedMyMind: 8,
      spotOn: 22,
      greatSource: 6,
      goodQuestion: 37
    },
    userReactions: [],
    depth: 0,
    isUnreadSinceLastVisit: true,
    children: []
  }
];

// Pool of automated incoming real-time comments for simulation
export const incomingStreamQueue = [
  {
    id: "stream-01",
    targetParentId: "c-103",
    paragraphId: "para-5",
    author: {
      name: "Aria Thorne",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      role: "Distributed Protocol Dev",
      isAuthor: false,
      isExpert: true
    },
    stance: "resource",
    body: "We tested a CRDT-backed shadow delta buffer with OT (Operational Transformation) fallbacks. The key insight is keeping the text cursor anchor locked to character offsets even when adjacent nodes mutate. Check RFC-9244 on zero-jump layouts.",
    reactions: { changedMyMind: 5, spotOn: 12, greatSource: 18, goodQuestion: 2 },
    depth: 1
  },
  {
    id: "stream-02",
    targetParentId: "c-101-1-1",
    paragraphId: "para-2",
    author: {
      name: "Carlos Mendez",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
      role: "VP of Engineering",
      isAuthor: false,
      isExpert: true
    },
    stance: "building",
    body: "The 48-hour pre-mortem rule saved our payments service from a silent database collation corruption bug last month. When junior engineers have a formal channel to flag 'catastrophic risk' without social penalty, psychological safety skyrockets.",
    reactions: { changedMyMind: 9, spotOn: 24, greatSource: 14, goodQuestion: 4 },
    depth: 3
  },
  {
    id: "stream-03",
    targetParentId: null,
    paragraphId: "para-1",
    author: {
      name: "Dr. Elena Vance",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      role: "Author",
      isAuthor: true,
      isExpert: true
    },
    stance: "building",
    body: "I'm popping into the salon for live Office Hours! Looking forward to addressing the questions around viewport buffer synchronization and semantic intent tagging.",
    reactions: { changedMyMind: 15, spotOn: 55, greatSource: 20, goodQuestion: 10 },
    depth: 0
  },
  {
    id: "stream-04",
    targetParentId: "c-105",
    paragraphId: "para-6",
    author: {
      name: "Zoe Kravitz",
      avatar: "https://images.unsplash.com/photo-1534751516642-a171ed260c6d?w=150&auto=format&fit=crop&q=80",
      role: "NLP Moderation Lead",
      isAuthor: false,
      isExpert: true
    },
    stance: "fix",
    body: "To answer Liam's question: we use lightweight client-side sentiment-alignment heuristics. If a post tagged [🌱 Building on this] contains high lexical antagonism or ad-hominem clusters, it triggers a gentle confirmation dialog before publishing.",
    reactions: { changedMyMind: 21, spotOn: 39, greatSource: 28, goodQuestion: 6 },
    depth: 1
  }
];

export const stanceDefinitions = {
  building: {
    label: "Building on this",
    icon: "🌱",
    bgClass: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    badgeClass: "text-emerald-700 bg-emerald-100/60 dark:text-emerald-300 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700"
  },
  counterpoint: {
    label: "Counter-Example",
    icon: "🔄",
    bgClass: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
    badgeClass: "text-rose-700 bg-rose-100/60 dark:text-rose-300 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700"
  },
  question: {
    label: "Question for Author",
    icon: "❓",
    bgClass: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    badgeClass: "text-amber-700 bg-amber-100/60 dark:text-amber-300 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700"
  },
  resource: {
    label: "Sharing a Resource",
    icon: "📎",
    bgClass: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
    badgeClass: "text-blue-700 bg-blue-100/60 dark:text-blue-300 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700"
  },
  fix: {
    label: "Fix / Clarification",
    icon: "🛠️",
    bgClass: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60",
    badgeClass: "text-purple-700 bg-purple-100/60 dark:text-purple-300 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700"
  }
};

