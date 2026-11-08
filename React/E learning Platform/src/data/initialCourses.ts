import { Course, TimedQuestionItem } from '../types';

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-dist-sys-01',
    slug: 'distributed-systems-architecture',
    title: 'Distributed Systems Architecture & High-Availability Consensus',
    subtitle: 'Master consensus algorithms, consistent hashing, replication logs, and fault-tolerant state machine replication.',
    difficulty: 'advanced',
    category: 'Systems & Infrastructure',
    skillAxes: ['System Design', 'Database Indexing', 'Caching & Queues', 'Observability', 'Security & Consensus'],
    totalDurationMinutes: 185,
    publishedAt: '2026-03-15T00:00:00Z',
    author: {
      name: 'Dr. Elena Rostova',
      role: 'Principal Distributed Systems Architect, Ex-Google Brain',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    modules: [
      {
        id: 'mod-01',
        courseId: 'course-dist-sys-01',
        sortOrder: 1,
        title: 'Module 01: CAP Theorem, Consistency Models & Network Partitions',
        description: 'Deconstruct linearizability, PACELC theorem tradeoffs, and network split semantics in geographically distributed data centers.',
        prerequisiteModuleIds: [],
        allowTestOut: true,
        testOutQuizId: 'quiz-mod-01-diagnostic',
        estimatedMinutes: 35,
        lessons: [
          {
            id: 'les-01-01',
            moduleId: 'mod-01',
            courseId: 'course-dist-sys-01',
            sortOrder: 1,
            title: '01.1 — The Physics of Latency & PACELC Tradeoffs',
            lessonType: 'video_lecture',
            durationSeconds: 1020,
            chapters: [
              { id: 'c1', title: 'Speed of Light & Speed of Copper', timestampSec: 0 },
              { id: 'c2', title: 'Why CAP Theorem is Incomplete', timestampSec: 320 },
              { id: 'c3', title: 'PACELC in Modern Databases', timestampSec: 720 }
            ],
            transcriptSegments: [
              { startMs: 0, endMs: 8000, text: 'Welcome to Distributed Systems Architecture. Today we start with the fundamental laws of physics governing networks.', speaker: 'Dr. Rostova' },
              { startMs: 8100, endMs: 18000, text: 'No matter how fast your SSD is, packet round trips across continents will never beat the speed of light.', speaker: 'Dr. Rostova' }
            ],
            resources: []
          },
          {
            id: 'les-01-02',
            moduleId: 'mod-01',
            courseId: 'course-dist-sys-01',
            sortOrder: 2,
            title: '01.2 — Eventual vs Linearizable Consistency in Production',
            lessonType: 'video_lecture',
            durationSeconds: 1140,
            chapters: [
              { id: 'c1', title: 'Sequential vs Strict Serializability', timestampSec: 0 },
              { id: 'c2', title: 'Read-Your-Writes Guarantees', timestampSec: 480 }
            ],
            transcriptSegments: [
              { startMs: 0, endMs: 12000, text: 'Understanding linearizability requires viewing distributed state as a single global real-time clock sequence.', speaker: 'Dr. Rostova' }
            ],
            resources: []
          }
        ]
      },
      {
        id: 'mod-02',
        courseId: 'course-dist-sys-01',
        sortOrder: 2,
        title: 'Module 02: Consistent Hashing, Virtual Nodes & Sharding',
        description: 'Eliminate hotspot rebalancing storms using ring topologies, virtual node distributions, and deterministic replication strategies.',
        prerequisiteModuleIds: ['mod-01'],
        allowTestOut: true,
        testOutQuizId: 'quiz-mod-02-diagnostic',
        estimatedMinutes: 45,
        lessons: [
          {
            id: 'les-02-01',
            moduleId: 'mod-02',
            courseId: 'course-dist-sys-01',
            sortOrder: 1,
            title: '02.1 — Hash Ring Geometry & Boundary Rebalancing',
            lessonType: 'video_lecture',
            durationSeconds: 1320,
            chapters: [
              { id: 'c1', title: 'Naive Modulo Sharding Pitfalls', timestampSec: 0 },
              { id: 'c2', title: 'Consistent Hashing Rings', timestampSec: 420 },
              { id: 'c3', title: 'Virtual Nodes for Uniform Spread', timestampSec: 890 }
            ],
            transcriptSegments: [
              { startMs: 0, endMs: 15000, text: 'When a database node fails in a naive modulo system, 90% of all keys get displaced instantly.', speaker: 'Dr. Rostova' }
            ],
            resources: []
          }
        ]
      },
      {
        id: 'mod-03',
        courseId: 'course-dist-sys-01',
        sortOrder: 3,
        title: 'Module 03: Replication Logs, WAL & State Machine Replication',
        description: 'Write-ahead logs, monotonic sequence identifiers, and deterministic state transitions across failure-prone nodes.',
        prerequisiteModuleIds: ['mod-02'],
        allowTestOut: true,
        testOutQuizId: 'quiz-mod-03-diagnostic',
        estimatedMinutes: 40,
        lessons: [
          {
            id: 'les-03-01',
            moduleId: 'mod-03',
            courseId: 'course-dist-sys-01',
            sortOrder: 1,
            title: '03.1 — Anatomy of an Append-Only Write-Ahead Log',
            lessonType: 'video_lecture',
            durationSeconds: 1200,
            chapters: [
              { id: 'c1', title: 'Disk Sequential I/O Advantage', timestampSec: 0 },
              { id: 'c2', title: 'LSM Trees vs B-Trees in Log Replication', timestampSec: 540 }
            ],
            transcriptSegments: [
              { startMs: 0, endMs: 14000, text: 'All distributed consensus is fundamentally an agreed order on an append-only log.', speaker: 'Dr. Rostova' }
            ],
            resources: []
          }
        ]
      },
      {
        id: 'mod-04',
        courseId: 'course-dist-sys-01',
        sortOrder: 4,
        title: 'Module 04: Raft Consensus, Leader Election & Log Replication',
        description: 'Deep dive into Raft leader election, randomized election timeouts, AppendEntries RPC safety, and split-brain resolution.',
        prerequisiteModuleIds: ['mod-03'],
        allowTestOut: false,
        estimatedMinutes: 55,
        lessons: [
          {
            id: 'les-04-01',
            moduleId: 'mod-04',
            courseId: 'course-dist-sys-01',
            sortOrder: 1,
            title: '04.1 — Leader Election, Randomized Timeouts & Split Votes',
            lessonType: 'video_lecture',
            durationSeconds: 980,
            chapters: [
              { id: 'c1', title: 'Three Raft States', timestampSec: 0 },
              { id: 'c2', title: 'Randomized Heartbeat Deadlines', timestampSec: 360 }
            ],
            transcriptSegments: [
              { startMs: 0, endMs: 10000, text: 'In Raft, at any given time, each server is in one of three states: Leader, Follower, or Candidate.', speaker: 'Dr. Rostova' }
            ],
            resources: []
          },
          {
            id: 'les-04-02',
            moduleId: 'mod-04',
            courseId: 'course-dist-sys-01',
            sortOrder: 2,
            title: '04.2 — AppendEntries RPC & Log Matching Invariant',
            lessonType: 'video_lecture',
            durationSeconds: 1120,
            chapters: [
              { id: 'c1', title: 'Log Matching Guarantee', timestampSec: 0 },
              { id: 'c2', title: 'Log Inconsistencies & Overwriting', timestampSec: 500 }
            ],
            transcriptSegments: [
              { startMs: 0, endMs: 12000, text: 'The Leader handles log inconsistencies by forcing Follower logs to duplicate its own.', speaker: 'Dr. Rostova' }
            ],
            resources: []
          },
          {
            id: 'les-04-03',
            moduleId: 'mod-04',
            courseId: 'course-dist-sys-01',
            sortOrder: 3,
            title: '04.3 — Consensus Algorithms & Raft Leader Election (Master Stage)',
            lessonType: 'video_lecture',
            durationSeconds: 1450, // 24m 10s
            chapters: [
              { id: 'c1', title: 'Raft Cluster Architecture & Term Monotonicity', timestampSec: 0 },
              { id: 'c2', title: 'Heartbeat Protocol & Election Timeout Windows', timestampSec: 210 },
              { id: 'c3', title: 'Leader Failure & Candidate Term Increment', timestampSec: 495 }, // @ 08:15 checkpoint
              { id: 'c4', title: 'Quorum Votes & Split-Brain Prevention', timestampSec: 870 }, // @ 14:30 lab/checkpoint
              { id: 'c5', title: 'Log Compaction & Snapshot State Transfers', timestampSec: 1220 }
            ],
            transcriptSegments: [
              { startMs: 0, endMs: 14500, text: 'Welcome back. In this lecture, we dissect Raft leader election step-by-step under adverse network conditions.', speaker: 'Dr. Rostova' },
              { startMs: 15000, endMs: 38000, text: 'Notice on the topology diagram: our cluster consists of 5 nodes: A, B, C, D, and E. Node A is currently the active Leader.', speaker: 'Dr. Rostova' },
              { startMs: 39000, endMs: 65000, text: 'Every 50 milliseconds, Node A broadcasts an empty AppendEntries RPC as a periodic heartbeat to prevent elections.', speaker: 'Dr. Rostova' },
              { startMs: 66000, endMs: 125000, text: 'Each follower maintains an election timer initialized to a randomized duration between 150ms and 300ms.', speaker: 'Dr. Rostova' },
              { startMs: 126000, endMs: 198000, text: 'Randomization is vital. Without it, all nodes would timeout simultaneously, causing perpetual split votes.', speaker: 'Dr. Rostova' },
              { startMs: 199000, endMs: 252000, text: 'Now consider timestamp 03:18: Note that heartbeat interval must be at least an order of magnitude smaller than election timeout.', speaker: 'Dr. Rostova' },
              { startMs: 253000, endMs: 320000, text: 'Specifically, 15ms to 50ms heartbeat versus 150ms to 300ms election timeout guarantees stability against jitter.', speaker: 'Dr. Rostova' },
              { startMs: 321000, endMs: 410000, text: 'Now let us simulate Leader A crashing. When Node A goes silent, the followers stop receiving heartbeats.', speaker: 'Dr. Rostova' },
              { startMs: 411000, endMs: 494000, text: 'Follower Node B is the first whose election timeout expires at 08:15. Pay close attention to this state change.', speaker: 'Dr. Rostova' },
              { startMs: 495000, endMs: 580000, text: 'Node B transitions immediately from Follower to Candidate. It increments its current term, votes for itself, and broadcasts RequestVote RPCs.', speaker: 'Dr. Rostova' },
              { startMs: 581000, endMs: 690000, text: 'If a node receives RequestVote and hasn’t voted in this term, it checks whether Candidate B’s log is at least as up-to-date as its own.', speaker: 'Dr. Rostova' },
              { startMs: 691000, endMs: 869000, text: 'Once Candidate B receives votes from a majority quorum (3 of 5 nodes), it transitions to Leader and sends heartbeats.', speaker: 'Dr. Rostova' },
              { startMs: 870000, endMs: 1040000, text: 'Now examine network partitions at 14:30. Suppose nodes D and E are isolated in partition 2 while A, B, and C remain in partition 1.', speaker: 'Dr. Rostova' },
              { startMs: 1041000, endMs: 1219000, text: 'Partition 1 contains a quorum of 3 nodes, so it continues committing writes. Partition 2 cannot form quorum, preserving safety.', speaker: 'Dr. Rostova' },
              { startMs: 1220000, endMs: 1450000, text: 'Finally, log compaction via snapshotting prevents logs from growing infinitely on disk. Let’s verify this in the lab.', speaker: 'Dr. Rostova' }
            ],
            resources: [
              {
                name: 'raft-consensus-simulator.ts',
                size: '24 KB',
                language: 'typescript',
                description: 'Interactive in-memory Raft state machine node simulator with network drop injection.',
                codeSnippet: `// Raft Node Implementation\nexport class RaftNode {\n  term: number = 0;\n  state: 'Follower' | 'Candidate' | 'Leader' = 'Follower';\n  votedFor: string | null = null;\n  log: LogEntry[] = [];\n  commitIndex: number = 0;\n}`
              },
              {
                name: 'cluster-config.yaml',
                size: '4.2 KB',
                language: 'yaml',
                description: 'Cluster topology configuration for 5-node raft deployment with latency metrics.'
              },
              {
                name: 'raft-election-formal-proof.pdf',
                size: '1.4 MB',
                language: 'pdf',
                description: 'TLA+ specification and formal safety invariants for leader election completeness.'
              }
            ]
          }
        ]
      },
      {
        id: 'mod-05',
        courseId: 'course-dist-sys-01',
        sortOrder: 5,
        title: 'Module 05: Distributed Transactions, 2PC & Saga Orchestration',
        description: 'Two-phase commit blocking vulnerability, coordinator election, and compensating transaction sagas in microservices.',
        prerequisiteModuleIds: ['mod-04'],
        allowTestOut: true,
        testOutQuizId: 'quiz-mod-05-diagnostic',
        estimatedMinutes: 50,
        lessons: [
          {
            id: 'les-05-01',
            moduleId: 'mod-05',
            courseId: 'course-dist-sys-01',
            sortOrder: 1,
            title: '05.1 — Two-Phase Commit Coordinator Failure Mechanics',
            lessonType: 'video_lecture',
            durationSeconds: 1260,
            chapters: [
              { id: 'c1', title: 'Prepare & Commit Phases', timestampSec: 0 },
              { id: 'c2', title: 'Why 2PC is a Blocking Protocol', timestampSec: 610 }
            ],
            transcriptSegments: [
              { startMs: 0, endMs: 10000, text: 'In 2PC, if the coordinator crashes during the commit phase, participants remain locked in limbo.', speaker: 'Dr. Rostova' }
            ],
            resources: []
          }
        ]
      }
    ]
  },
  {
    id: 'course-ts-sys-02',
    slug: 'fullstack-typescript-systems',
    title: 'High-Throughput Full-Stack TypeScript & Systems Architecture',
    subtitle: 'Zero-copy buffers, libuv event loop tuning, memory leak diagnostics, and V8 optimization pipelines.',
    difficulty: 'intermediate',
    category: 'Engineering & Performance',
    skillAxes: ['Node.js Internals', 'V8 Optimization', 'Concurrency', 'Memory Profiling', 'Database Optimization'],
    totalDurationMinutes: 210,
    publishedAt: '2026-02-10T00:00:00Z',
    author: {
      name: 'Marcus Chen',
      role: 'Staff Infrastructure Engineer, Systems Optimization Lead',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80'
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    modules: [
      {
        id: 'ts-mod-01',
        courseId: 'course-ts-sys-02',
        sortOrder: 1,
        title: 'Module 01: V8 Compilation Pipeline & Hidden Classes',
        description: 'Ignition bytecode, TurboFan JIT compiler optimization flags, and monomorphic inline caches.',
        prerequisiteModuleIds: [],
        allowTestOut: true,
        estimatedMinutes: 60,
        lessons: []
      }
    ]
  },
  {
    id: 'course-ai-sys-03',
    slug: 'modern-generative-ai-rag',
    title: 'Generative AI Systems & Production Vector RAG Pipelines',
    subtitle: 'Vector embeddings, semantic caching, hybrid BM25 + dense retrieval, and agentic reasoning loops.',
    difficulty: 'advanced',
    category: 'Artificial Intelligence',
    skillAxes: ['Vector Retrieval', 'Embedding Quantization', 'RAG Evaluation', 'Context Routing', 'LLM Alignment'],
    totalDurationMinutes: 240,
    publishedAt: '2026-04-01T00:00:00Z',
    author: {
      name: 'Dr. Aisha Morales',
      role: 'Head of Applied AI Research',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80'
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    modules: [
      {
        id: 'ai-mod-01',
        courseId: 'course-ai-sys-03',
        sortOrder: 1,
        title: 'Module 01: Dense Embeddings & Approximate Nearest Neighbors',
        description: 'HNSW graph indexing, ScaNN quantization, and cosine vs inner product spatial metrics.',
        prerequisiteModuleIds: [],
        allowTestOut: true,
        estimatedMinutes: 60,
        lessons: []
      }
    ]
  }
];

export const INITIAL_TIMED_QA: TimedQuestionItem[] = [
  {
    id: 'qa-1',
    lessonId: 'les-04-03',
    timestampSec: 198,
    author: 'Devon Vance',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    question: 'Why does the Raft paper recommend 150ms–300ms for election timeout instead of 10ms for faster failover?',
    upvotes: 42,
    hasInstructorAnswer: true,
    instructorAnswer: {
      author: 'Dr. Elena Rostova',
      text: 'Because typical LAN latency and OS thread scheduling jitter can reach 10ms–15ms. If timeout was 10ms, normal delays would trigger false-alarm elections, destroying throughput.',
      timestamp: '2 days ago'
    },
    createdAt: '3 days ago'
  },
  {
    id: 'qa-2',
    lessonId: 'les-04-03',
    timestampSec: 495,
    author: 'Sarah Lin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    question: 'What happens if a Candidate increments its term to 4, but finds an old Leader sending term 3 heartbeats?',
    upvotes: 27,
    hasInstructorAnswer: true,
    instructorAnswer: {
      author: 'Dr. Elena Rostova',
      text: 'The Candidate rejects the term 3 AppendEntries RPC because term 3 < term 4. When the old Leader receives the rejection with term 4, it immediately steps down to Follower state!',
      timestamp: '1 day ago'
    },
    createdAt: '2 days ago'
  },
  {
    id: 'qa-3',
    lessonId: 'les-04-03',
    timestampSec: 870,
    author: 'Alexandre Roy',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    question: 'Can a 5-node cluster tolerate 3 node failures simultaneously?',
    upvotes: 18,
    hasInstructorAnswer: false,
    createdAt: '1 day ago'
  }
];

