import { PrizeTier, Question } from '../engine/types';

export const PRIZE_LADDER: PrizeTier[] = [
  { tier: 1,  bounty: 100,    safe: false },
  { tier: 2,  bounty: 300,    safe: false },
  { tier: 3,  bounty: 500,    safe: false },
  { tier: 4,  bounty: 1000,   safe: true  }, // Safe checkpoint 1
  { tier: 5,  bounty: 2500,   safe: false },
  { tier: 6,  bounty: 5000,   safe: false },
  { tier: 7,  bounty: 10000,  safe: true  }, // Safe checkpoint 2
  { tier: 8,  bounty: 25000,  safe: false },
  { tier: 9,  bounty: 50000,  safe: false },
  { tier: 10, bounty: 100000, safe: true  }  // Grand Finale Jackpot
];

export const QUESTION_BANK: Question[] = [
  {
    tier: 1,
    category: "COMPUTER SCIENCE",
    question: "What does the 'P' in CPU stand for?",
    options: ["Processing", "Performance", "Peripheral", "Program"],
    correct: 0,
    explanation: "CPU stands for Central Processing Unit, the primary component executing instructions in a computer.",
    pollPercentages: [88, 4, 3, 5]
  },
  {
    tier: 2,
    category: "ALGORITHMS & DATA STRUCTURES",
    question: "What is the average time complexity of key lookup in a Hash Table with a uniform hash function?",
    options: ["O(log n)", "O(n)", "O(1)", "O(n log n)"],
    correct: 2,
    explanation: "Under simple uniform hashing, the average lookup, insertion, and deletion complexity is constant O(1).",
    pollPercentages: [9, 6, 81, 4]
  },
  {
    tier: 3,
    category: "WEB ARCHITECTURE & NETWORKING",
    question: "Which transport layer protocol does WebRTC DataChannel utilize by default for reliable or unreliable packet delivery?",
    options: ["WebSocket", "SCTP", "QUIC", "Raw TCP"],
    correct: 1,
    explanation: "WebRTC DataChannel operates atop the Stream Control Transmission Protocol (SCTP) encapsulated within DTLS.",
    pollPercentages: [24, 56, 15, 5]
  },
  {
    tier: 4,
    category: "ASTRONOMY & RELATIVITY",
    question: "What is the theoretical boundary surrounding a black hole beyond which neither matter nor radiation can escape?",
    options: ["Schwarzschild Cavity", "Accretion Disk", "Event Horizon", "Roche Limit"],
    correct: 2,
    explanation: "The Event Horizon defines the gravitational boundary beyond which the escape velocity strictly exceeds the speed of light.",
    pollPercentages: [8, 12, 74, 6]
  },
  {
    tier: 5,
    category: "PHYSICS & CONTINUUM MECHANICS",
    question: "Which system of non-linear partial differential equations describes the motion of viscous fluid substances?",
    options: ["Navier-Stokes Equations", "Maxwell's Equations", "Hamilton-Jacobi Formula", "Schrödinger Equation"],
    correct: 0,
    explanation: "The Navier-Stokes equations govern fluid dynamics by applying Newton's second law to fluid motion alongside shear stresses.",
    pollPercentages: [71, 14, 8, 7]
  },
  {
    tier: 6,
    category: "OPERATING SYSTEMS CONCURRENCY",
    question: "In preemptive CPU scheduling, what pathological state occurs when a high-priority process is blocked waiting for a resource held by a low-priority process that is preempted by a medium-priority process?",
    options: ["Thrashing", "Convoy Effect", "Priority Inversion", "Cascading Abort"],
    correct: 2,
    explanation: "Priority Inversion famously affected the Mars Pathfinder rover until priority inheritance mechanisms corrected mutex scheduling.",
    pollPercentages: [11, 18, 65, 6]
  },
  {
    tier: 7,
    category: "GRAPH THEORY & HEURISTICS",
    question: "Which distance metric is optimal and admissible for A* grid pathfinding when movement is strictly restricted to orthogonal (4-way) grid steps?",
    options: ["Euclidean Distance", "Manhattan Distance", "Chebyshev Distance", "Minkowski Metric"],
    correct: 1,
    explanation: "Manhattan (L1 / Taxicab) distance calculates |x1 - x2| + |y1 - y2|, serving as an exact admissible heuristic for 4-directional grids.",
    pollPercentages: [16, 73, 8, 3]
  },
  {
    tier: 8,
    category: "RETRO COMPUTING & HARDWARE",
    question: "Which iconic 1982 home microcomputer launched with 16KB of RAM and distinct rainbow stripes on its rubber chiclet-key chassis?",
    options: ["Commodore 64", "Sinclair ZX Spectrum", "BBC Micro Model B", "Atari 800XL"],
    correct: 1,
    explanation: "Sir Clive Sinclair's ZX Spectrum 16K/48K debuted in 1982 featuring its trademark rubber keyboard and rainbow motif.",
    pollPercentages: [21, 68, 7, 4]
  },
  {
    tier: 9,
    category: "CRYPTOGRAPHY & NUMBER THEORY",
    question: "Which computational hardness assumption underpins the trapdoor one-way permutation in standard RSA encryption?",
    options: ["Discrete Logarithm", "Integer Factorization", "Shortest Vector Problem", "Elliptic Curve Isogeny"],
    correct: 1,
    explanation: "RSA security rests on the computational intractability of factoring large semi-prime integers n = p * q.",
    pollPercentages: [14, 76, 5, 5]
  },
  {
    tier: 10,
    category: "GRAND FINALE: DISTRIBUTED SYSTEMS",
    question: "Which theorem proves that an asynchronous distributed data store can simultaneously provide at most two guarantees among Consistency, Availability, and Partition Tolerance?",
    options: ["Brewer's CAP Theorem", "Amdahl's Scalability Law", "Church-Turing Thesis", "Nyquist-Shannon Theorem"],
    correct: 0,
    explanation: "Eric Brewer's CAP theorem (formalized by Gilbert and Lynch) establishes that distributed network partitions mandate a trade-off between consistency and availability.",
    pollPercentages: [84, 8, 5, 3]
  }
];
