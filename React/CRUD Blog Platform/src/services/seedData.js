// High-caliber seed data for editorial blog platform

export const INITIAL_USER = {
  id: 'usr-001',
  name: 'Elena Rostova',
  handle: '@erostova',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  bio: 'Staff Systems Architect & Essayist. Exploring distributed consensus, typographic interfaces, and digital longevity.',
  role: 'author'
};

export const MOCK_USERS = [
  INITIAL_USER,
  {
    id: 'usr-002',
    name: 'Marcus Vance',
    handle: '@mvance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    bio: 'Compiler engineer, Rust enthusiast, and typography nerd.',
    role: 'contributor'
  },
  {
    id: 'usr-003',
    name: 'Siddharth Patel',
    handle: '@spatel_dev',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    bio: 'Database internals researcher. Building latency-sensitive replication engines.',
    role: 'verified'
  },
  {
    id: 'usr-004',
    name: 'Amara Chen',
    handle: '@amarac',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
    bio: 'Product Designer & Design Systems lead. Obsessed with micro-interactions and dark mode parity.',
    role: 'contributor'
  }
];

export const INITIAL_TAGS = [
  {
    id: 'tag-architecture',
    name: 'Architecture',
    slug: 'architecture',
    color: '#0D9488', // Teal
    bgColor: 'rgba(13, 148, 136, 0.12)',
    description: 'System design patterns, distributed state engines, concurrency primitives, and resilient micro-frontends.',
    postsCount: 3,
    followersCount: 1420
  },
  {
    id: 'tag-react',
    name: 'React & Web',
    slug: 'react',
    color: '#2563EB', // Cobalt
    bgColor: 'rgba(37, 99, 235, 0.12)',
    description: 'Modern component architectures, concurrent rendering semantics, server actions, and DOM optimizations.',
    postsCount: 4,
    followersCount: 2890
  },
  {
    id: 'tag-design',
    name: 'Design Systems',
    slug: 'design-systems',
    color: '#9333EA', // Purple
    bgColor: 'rgba(147, 51, 234, 0.12)',
    description: 'Typographic hierarchy, fluid spacing scales, accessibility tokens, and editorial UI craftsmanship.',
    postsCount: 2,
    followersCount: 1850
  },
  {
    id: 'tag-databases',
    name: 'Databases',
    slug: 'databases',
    color: '#0D9488', // Teal
    bgColor: 'rgba(13, 148, 136, 0.12)',
    description: 'PostgreSQL internals, recursive CTE hierarchies, write-ahead logs, and storage tier optimization.',
    postsCount: 2,
    followersCount: 1120
  },
  {
    id: 'tag-culture',
    name: 'Tech & Culture',
    slug: 'tech-culture',
    color: '#D97706', // Amber
    bgColor: 'rgba(217, 119, 6, 0.12)',
    description: 'Essays on the intellectual legacy of software tools, craftsmanship culture, and calm computing.',
    postsCount: 3,
    followersCount: 3410
  },
  {
    id: 'tag-performance',
    name: 'Performance',
    slug: 'performance',
    color: '#E11D48', // Crimson
    bgColor: 'rgba(225, 29, 72, 0.12)',
    description: 'Web Vitals telemetry, zero-overhead runtimes, cache invalidation, and mechanical sympathy.',
    postsCount: 2,
    followersCount: 970
  }
];

export const INITIAL_POSTS = [
  {
    id: 'post-1',
    authorId: 'usr-001',
    author: INITIAL_USER,
    title: 'The Typographic Sanctuary: Designing for Calm, High-Signal Digital Reading',
    slug: 'the-typographic-sanctuary',
    coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1600&q=80',
    excerpt: 'How intentional line lengths, optical sizing, and quiet user interfaces restore intellectual focus in an age of notification vertigo.',
    status: 'published',
    readingTime: 6,
    viewsCount: 4820,
    clapsCount: 482,
    publishedAt: '2026-03-28T14:30:00Z',
    updatedAt: '2026-03-29T09:15:00Z',
    canonicalUrl: 'https://chronicle-codex.org/the-typographic-sanctuary',
    tagIds: ['tag-design', 'tag-culture', 'tag-react'],
    content: `## The Crisis of Editorial Attention

We are living through an unprecedented fragmentation of human attention. Every contemporary web surface screams for instantaneous engagement: badge counts blink with manufactured urgency, layout shifts disrupt the reader's ocular flow, and algorithmic feeds treat human cognition as a yield to be maximized rather than a sanctuary to be respected.

When we set out to architect this publishing canvas, our first mandate was subtraction. What happens when an interface chooses to be quiet?

> "True elegance in software is not the accumulation of novel widgets, but the disciplined elimination of everything that stands between a human mind and an illuminating thought."

To achieve this, we anchored our layout in the venerable tradition of letterpress printing while utilizing the extreme precision of modern CSS subpixel rasterization.

---

## 1. Optimal Line Length & The 65-Character Canon

Typographers from Aldus Manutius to Jan Tschichold understood that ocular fatigue is primarily a function of line length. If a line of prose is too narrow, the eye is forced to whip back and forth with unnatural frequency, fragmenting sentence comprehension. Conversely, if a line extends beyond 85 characters, the reader's eye struggles to locate the start of the next line upon carriage return.

Our reading viewport is mathematically clamped:

\`\`\`css
.editorial-prose {
  max-width: 68ch;
  line-height: 1.78;
  letter-spacing: -0.011em;
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
}
\`\`\`

Notice the line-height multiplier of **1.78**. In classical desktop publishing, a 120% leading (1.2) is standard for print. On backlit OLED and retina displays, however, photon dispersion demands increased vertical breathing room to preserve optical comfort over 20-minute reading sessions.

---

## 2. The Color Science of Warm Literary Linen

Cold hex codes like \`#000000\` on pure \`#FFFFFF\` produce stark chromatic contrast that triggers pupillary micro-strain. In our palette, we replaced harsh contrast with organic values inspired by unbleached cotton paper:

* **Canvas Primary:** \`#FAFAF8\` (Warm Literary Linen)
* **Text Primary:** \`#18181B\` (Charcoal Ink)
* **Surface Secondary:** \`#F3F3EE\` (Subtle elevation)

For nocturnal readers, we avoid the pitch-black void in favor of **Obsidian Charcoal** (\`#0C0D0E\`), preventing the high-contrast glowing border artifacts that occur when pure white text sits upon absolute black OLED matrices.

---

## 3. Micro-Interactions that Honor Flow State

Notice what happens when you scroll through this essay. The reading progress tracker is a whisper at the top perimeter—a 2px hairline border in editorial crimson that informs without demanding tribute. 

If you highlight any passage on this page, our contextual quote tool hovers quietly into view, letting you transport the author's exact phrase into the community discourse thread below. That bridges contemplation with civil debate.

In an ecosystem polluted by synthetic distractions, the most revolutionary product decision you can make is to build a room where someone can think.`,
    revisions: [
      {
        id: 'rev-01',
        timestamp: '2026-03-28T10:00:00Z',
        title: 'The Typographic Sanctuary (Early Draft)',
        excerpt: 'Early notes on calm UI and reading experiences.',
        content: '## The Crisis of Editorial Attention\n\nWe are living through an unprecedented fragmentation of human attention...'
      },
      {
        id: 'rev-02',
        timestamp: '2026-03-28T14:30:00Z',
        title: 'The Typographic Sanctuary: Designing for Calm, High-Signal Digital Reading',
        excerpt: 'How intentional line lengths, optical sizing, and quiet user interfaces restore intellectual focus.',
        content: '## The Crisis of Editorial Attention\n\nWe are living through an unprecedented fragmentation of human attention...'
      }
    ]
  },
  {
    id: 'post-2',
    authorId: 'usr-003',
    author: MOCK_USERS[2],
    title: 'PostgreSQL Recursive CTEs: Modeling Tree Hierarchies Without Graph Databases',
    slug: 'postgresql-recursive-ctes-hierarchies',
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80',
    excerpt: 'Deep-dive into recursive Common Table Expressions, closure tables, and indexing strategies for sub-millisecond nested comment threads.',
    status: 'published',
    readingTime: 8,
    viewsCount: 3940,
    clapsCount: 312,
    publishedAt: '2026-03-26T18:00:00Z',
    updatedAt: '2026-03-27T11:20:00Z',
    canonicalUrl: 'https://chronicle-codex.org/postgresql-recursive-ctes-hierarchies',
    tagIds: ['tag-databases', 'tag-architecture', 'tag-performance'],
    content: `## The Ubiquitous Threaded Discussion Problem

Every online community from Hacker News to Reddit relies on hierarchical, nested commentary. While building a flat reply list is trivial, modeling unbounded tree depth with performant pagination, sorting, and subtree folding has broken countless relational schemas.

Often, teams prematurely abandon PostgreSQL to introduce dedicated graph databases like Neo4j or document stores that require complex distributed transactions. Yet with standard **Recursive Common Table Expressions (CTEs)** and materialized path indexes, Postgres can traverse hundreds of thousands of comment nodes in single-digit milliseconds.

---

## 1. The Recursive Query Anatomized

Let us inspect the normalized \`comments\` schema:

\`\`\`sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'visible',
  upvotes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post_parent ON comments(post_id, parent_id, created_at);
\`\`\`

To retrieve an entire discussion tree for a given post while calculating tree depth and an ordering path:

\`\`\`sql
WITH RECURSIVE comment_tree AS (
  -- Anchor member: Top-level comments
  SELECT 
    id, post_id, parent_id, user_id, content, upvotes_count, created_at,
    1 AS depth,
    ARRAY[created_at::text, id::text] AS sort_path
  FROM comments
  WHERE post_id = $1 AND parent_id IS NULL AND status != 'deleted'

  UNION ALL

  -- Recursive member: Child comments
  SELECT 
    c.id, c.post_id, c.parent_id, c.user_id, c.content, c.upvotes_count, c.created_at,
    ct.depth + 1,
    ct.sort_path || ARRAY[c.created_at::text, c.id::text]
  FROM comments c
  JOIN comment_tree ct ON c.parent_id = ct.id
  WHERE c.status != 'deleted'
)
SELECT * FROM comment_tree
ORDER BY sort_path ASC;
\`\`\`

---

## 2. Soft-Deletes Without Orphan Cascades

One critical architectural rule in threaded discussions: **never hard-delete a parent comment that has living descendant replies**.

If user Alice posts an insightful thesis and user Bob provides an equally illuminating rebuttal, Alice deleting her account must not wipe Bob's contribution. Instead, we implement a graceful status state:

\`\`\`sql
UPDATE comments 
SET status = 'deleted', content = '[Comment deleted by author]'
WHERE id = $target_id;
\`\`\`

This preserves node geometry and reply continuity while respecting user privacy.`,
    revisions: []
  },
  {
    id: 'post-3',
    authorId: 'usr-002',
    author: MOCK_USERS[1],
    title: 'Zero-Anxiety Autosave: Building Conflict-Free Snapshot Engines in React',
    slug: 'zero-anxiety-autosave-react',
    coverImage: 'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?auto=format&fit=crop&w=1600&q=80',
    excerpt: 'Architecting local-first debounced drafts, dual-storage safety nets, and visual cloud heartbeats that protect writers from catastrophic data loss.',
    status: 'published',
    readingTime: 5,
    viewsCount: 2710,
    clapsCount: 289,
    publishedAt: '2026-03-24T12:00:00Z',
    updatedAt: '2026-03-24T12:00:00Z',
    canonicalUrl: '',
    tagIds: ['tag-react', 'tag-architecture', 'tag-performance'],
    content: `## The Tragedy of the Lost Paragraph

Few developer missteps generate as much visceral fury as an editor that swallows an author's half-finished essay due to an errant browser tab closure or transient network drop.

A production-grade publishing studio must provide **Zero-Anxiety Autosaving**. The writer must know, through ambient sensory feedback, that their thoughts are safely journaled in both local memory and remote cloud persistence.

---

## The Dual-Layer Persistence Strategy

1. **Synchronous Local Mirroring:** Every keystroke immediately persists to \`localStorage\` or IndexedDB.
2. **Debounced Cloud Sync (800ms):** When typing ceases for 800 milliseconds, an idempotent update triggers to remote storage.
3. **Periodic Snapshot Journaling:** Every 5 minutes or upon major milestone edits, an immutable snapshot is pushed into the \`revisions\` array.

With this trifecta, a power outage or accidental tab reload can at most forfeit a fraction of a sentence.`,
    revisions: []
  },
  {
    id: 'post-4',
    authorId: 'usr-004',
    author: MOCK_USERS[3],
    title: 'The Linear Aesthetic: Why Utilitarian Micro-Interactions Feel Luxurious',
    slug: 'the-linear-aesthetic-utilitarian-microinteractions',
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1600&q=80',
    excerpt: 'Analyzing the subtle design language of keyboard-first navigation, fluid CSS spring animations, and tactile dark mode elevation.',
    status: 'published',
    readingTime: 7,
    viewsCount: 5120,
    clapsCount: 640,
    publishedAt: '2026-03-20T16:45:00Z',
    updatedAt: '2026-03-21T08:00:00Z',
    canonicalUrl: '',
    tagIds: ['tag-design', 'tag-culture'],
    content: `## Utilitarianism is the New Luxury

In software design, luxury used to mean skeuomorphism: faux leather stitched borders, embossed glossy glass buttons, and heavy drop shadows. Today, real luxury is defined by **latency and respect**.

When an application responds within 16 milliseconds to your input, it feels physical. When keyboard shortcuts like \`Cmd+K\` or \`/\` are ubiquitous, the user enters a state of effortless mastery.

---

## The Anatomy of a Tactile Button

A truly satisfying interaction has three phases:
1. **Anticipation (Hover):** Subtle 5% tint change without jarring size shifts.
2. **Commitment (Active):** A crisp 1px translateY or 0.98 scale transform.
3. **Acknowledgment (Release):** Optimistic UI state update accompanied by haptic or visual confirmation.`,
    revisions: []
  }
];

export const INITIAL_COMMENTS = [
  {
    id: 'comm-101',
    postId: 'post-1',
    parentId: null,
    userId: 'usr-002',
    user: MOCK_USERS[1],
    content: `The distinction between optical comfort in print versus emissive RGB displays is so underappreciated. I spent three weeks tweaking my company's engineering handbook typography and found that bumping line-height from 1.5 to 1.75 reduced reported reading fatigue by over 40% in our internal survey.`,
    isPinned: true,
    status: 'visible',
    upvotesCount: 38,
    createdAt: '2026-03-28T16:15:00Z',
    updatedAt: '2026-03-28T16:15:00Z'
  },
  {
    id: 'comm-102',
    postId: 'post-1',
    parentId: 'comm-101',
    userId: 'usr-001', // OP
    user: INITIAL_USER,
    content: `> bumping line-height from 1.5 to 1.75 reduced reported reading fatigue by over 40%

Exactly! When photons are emitted directly into the retina (as opposed to ambient light bouncing off physical paper fibers), the white space between lines acts as an optical damper. Thrilled you ran an empirical survey on this!`,
    isPinned: false,
    status: 'visible',
    upvotesCount: 19,
    createdAt: '2026-03-28T17:02:00Z',
    updatedAt: '2026-03-28T17:02:00Z'
  },
  {
    id: 'comm-103',
    postId: 'post-1',
    parentId: 'comm-102',
    userId: 'usr-004',
    user: MOCK_USERS[3],
    content: `Did you also test character tracking (letter-spacing) alongside the 1.75 leading? At 19px body copy, we noticed that applying \`-0.012em\` letter-spacing prevents larger serif glyphs from feeling loose.`,
    isPinned: false,
    status: 'visible',
    upvotesCount: 8,
    createdAt: '2026-03-28T18:20:00Z',
    updatedAt: '2026-03-28T18:20:00Z'
  },
  {
    id: 'comm-104',
    postId: 'post-1',
    parentId: null,
    userId: 'usr-003',
    user: MOCK_USERS[2],
    content: `I particularly appreciate the choice of **Obsidian Charcoal** (#0C0D0E) instead of pitch black. Pure #000000 causes noticeable text smear when scrolling on OLED screens at low brightness levels. Great attention to hardware realities.`,
    isPinned: false,
    status: 'visible',
    upvotesCount: 24,
    createdAt: '2026-03-28T19:40:00Z',
    updatedAt: '2026-03-28T19:40:00Z'
  },
  {
    id: 'comm-201',
    postId: 'post-2',
    parentId: null,
    userId: 'usr-002',
    user: MOCK_USERS[1],
    content: `Have you benchmarked this recursive CTE against Postgres's \`ltree\` extension for deep trees (>10 levels)? \`ltree\` with GiST indexes has traditionally yielded slightly faster path prefixes in our multi-tenant workloads.`,
    isPinned: false,
    status: 'visible',
    upvotesCount: 14,
    createdAt: '2026-03-26T20:10:00Z',
    updatedAt: '2026-03-26T20:10:00Z'
  },
  {
    id: 'comm-202',
    postId: 'post-2',
    parentId: 'comm-201',
    userId: 'usr-003', // OP of post-2
    user: MOCK_USERS[2],
    content: `> Have you benchmarked this recursive CTE against Postgres's ltree extension?

Great question Marcus. \`ltree\` is indeed phenomenal for write-infrequent read-heavy taxonomies! The primary tradeoff is during subtree re-parenting (moving a comment thread to another parent), where \`ltree\` requires rewriting the path string for all descendants. For discussion threads where comments are never re-parented, \`ltree\` is a fantastic alternative. I'll write a comparative follow-up piece!`,
    isPinned: false,
    status: 'visible',
    upvotesCount: 16,
    createdAt: '2026-03-26T21:05:00Z',
    updatedAt: '2026-03-26T21:05:00Z'
  }
];
