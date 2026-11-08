import { Quiz } from '../types';

export const INITIAL_QUIZZES: Record<string, Quiz> = {
  // 1. Module 04 Mastery Assessment (The primary quiz showcased in the prompt)
  'quiz-mod-04-mastery': {
    id: 'quiz-mod-04-mastery',
    courseId: 'course-dist-sys-01',
    moduleId: 'mod-04',
    title: 'Module 04 Mastery Assessment: Consensus Algorithms & Raft Invariants',
    description: 'Verify your deep understanding of Raft leader election, randomized heartbeat timeouts, AppendEntries safety, and split-brain quorum resolution.',
    quizMode: 'module_mastery',
    passingScorePercent: 80,
    timeLimitSeconds: 720, // 12 minutes
    shuffleQuestions: false,
    questions: [
      {
        id: 'q-mod4-1',
        quizId: 'quiz-mod-04-mastery',
        questionType: 'multiple_choice',
        skillAxisTag: 'Security & Consensus',
        points: 15,
        promptMarkdown: `In Raft consensus, when **Follower Node B's** election timeout expires without receiving heartbeats from the Leader, what state does Node B transition to first, and what actions are immediately executed?`,
        optionsPayload: [
          {
            id: 'opt-a',
            text: 'Candidate: Node B increments currentTerm by 1, votes for itself, and broadcasts RequestVote RPCs to all other cluster nodes.'
          },
          {
            id: 'opt-b',
            text: 'Immediate Leader: Node B assumes the previous Leader is dead, increments currentTerm, and sends an empty heartbeat to claim leadership.'
          },
          {
            id: 'opt-c',
            text: 'Offline Partition: Node B disconnects its TCP sockets, resets its commitIndex to 0, and waits for a manual operator failover.'
          },
          {
            id: 'opt-d',
            text: 'Candidate: Node B keeps its existing term unchanged, requests the previous Leader’s WAL snapshot, and defers voting.'
          }
        ],
        correctAnswerPayload: 'opt-a',
        explanationMarkdown: `**Correct Answer is [A] Candidate State.**\n\nWhen a Follower's randomized election timeout expires, Section 5.2 of the Raft Specification dictates:\n1. Transitions to Candidate state.\n2. Increments its \`currentTerm\`.\n3. Votes for itself.\n4. Issues \`RequestVote\` RPCs in parallel to all other nodes in the cluster.\n\nOption [B] is a fatal misconception: a node can NEVER declare itself Leader without securing a quorum majority vote first!`,
        remediationLessonId: 'les-04-03',
        remediationLessonTitle: '04.3 — Consensus Algorithms & Raft Leader Election',
        remediationStartSec: 252, // 04:12
        remediationEndSec: 288    // 04:48 (exact 36s clip requested in prompt!)
      },
      {
        id: 'q-mod4-2',
        quizId: 'quiz-mod-04-mastery',
        questionType: 'drag_order',
        skillAxisTag: 'System Design',
        points: 25,
        promptMarkdown: `**Drag-and-Drop Sequence:** Arrange the exact operational sequence executed by a Raft Leader upon receiving a state-mutation write command from an external client:`,
        sequenceItems: [
          { id: 'step-3', content: 'Leader broadcasts AppendEntries RPCs containing the new entry to all cluster followers.' },
          { id: 'step-1', content: 'Client issues state machine write command to the cluster Leader.' },
          { id: 'step-5', content: 'Leader marks the entry as committed and applies it to its local deterministic state machine.' },
          { id: 'step-2', content: 'Leader appends the command as an uncommitted log entry to its own local write-ahead log.' },
          { id: 'step-4', content: 'A strict quorum majority of followers write the entry to disk and reply successfully.' },
          { id: 'step-6', content: 'Leader responds to client with success and conveys the updated commitIndex in subsequent heartbeats.' }
        ],
        correctSequenceIds: ['step-1', 'step-2', 'step-3', 'step-4', 'step-5', 'step-6'],
        explanationMarkdown: `**Correct Order of Execution:**\n1. Client issues write to Leader\n2. Leader appends to its local WAL (uncommitted)\n3. Leader broadcasts AppendEntries RPCs\n4. Strict quorum of followers persist to disk\n5. Leader marks committed and applies to local state machine\n6. Leader responds to client with success\n\nA Leader never applies an entry to its state machine before quorum acknowledgment.`,
        remediationLessonId: 'les-04-03',
        remediationLessonTitle: '04.3 — Consensus Algorithms & Raft Leader Election',
        remediationStartSec: 555, // 09:15
        remediationEndSec: 590    // 09:50
      },
      {
        id: 'q-mod4-3',
        quizId: 'quiz-mod-04-mastery',
        questionType: 'cloze_fill',
        skillAxisTag: 'Observability',
        points: 20,
        promptMarkdown: `**Fill-in-the-Blank Cloze Blocks:** Complete the foundational timing invariant defined by Ongaro & Ousterhout to guarantee Raft stability and prevent perpetual split votes:`,
        clozeTemplate: `broadcastTime ({{blank1}}) << electionTimeout ({{blank2}}) << MTBF ({{blank3}})`,
        clozeSolutions: {
          blank1: '0.5ms - 20ms',
          blank2: '150ms - 300ms',
          blank3: 'months'
        },
        explanationMarkdown: `**Timing Requirement Invariant:**\n\`broadcastTime << electionTimeout << MTBF\`\n\n- **broadcastTime** (typically 0.5ms to 20ms): Average round-trip time for a server to send RPCs to followers and receive responses.\n- **electionTimeout** (typically 150ms to 300ms): Randomized window after which a follower starts an election.\n- **MTBF** (Mean Time Between Failures, typically months): Server stability interval.`,
        remediationLessonId: 'les-04-03',
        remediationLessonTitle: '04.3 — Consensus Algorithms & Raft Leader Election',
        remediationStartSec: 198,
        remediationEndSec: 252
      },
      {
        id: 'q-mod4-4',
        quizId: 'quiz-mod-04-mastery',
        questionType: 'diagram_hotspot',
        skillAxisTag: 'Security & Consensus',
        points: 20,
        promptMarkdown: `**Interactive Diagram Hotspot:** Below is a 5-node cluster topology currently undergoing a network partition. Click directly on the **Isolated Partitioned Node** that CANNOT achieve quorum and must step down from leadership attempts:`,
        diagramUrl: 'raft-topology',
        hotspots: [
          { id: 'node-a', label: 'Node A (Leader, Partition 1)', xPercent: 25, yPercent: 30, radiusPercent: 12, isCorrect: false, feedback: 'Node A is in Partition 1 with nodes B & C (Quorum = 3/5 achieved).' },
          { id: 'node-b', label: 'Node B (Follower, Partition 1)', xPercent: 45, yPercent: 20, radiusPercent: 12, isCorrect: false, feedback: 'Node B is part of the majority partition.' },
          { id: 'node-c', label: 'Node C (Follower, Partition 1)', xPercent: 35, yPercent: 65, radiusPercent: 12, isCorrect: false, feedback: 'Node C is part of the majority partition.' },
          { id: 'node-d', label: 'Node D (Isolated Partition 2)', xPercent: 80, yPercent: 35, radiusPercent: 12, isCorrect: true, feedback: 'Correct! Node D is in minority Partition 2 with only Node E. With 2/5 nodes, it can never secure majority quorum (3).' },
          { id: 'node-e', label: 'Node E (Isolated Partition 2)', xPercent: 80, yPercent: 70, radiusPercent: 12, isCorrect: true, feedback: 'Correct! Node E is in minority Partition 2 and cannot commit writes.' }
        ],
        explanationMarkdown: `**Quorum Isolation Analysis:**\nIn a 5-node cluster, a quorum strictly requires \`floor(N/2) + 1 = 3\` nodes. Nodes D and E are isolated on the right side with only 2 nodes. Even if Node D attempts an election, it can receive at most 2 votes (D and E), which is less than 3. Thus, Raft guarantees zero split-brain writes!`,
        remediationLessonId: 'les-04-03',
        remediationLessonTitle: '04.3 — Consensus Algorithms & Raft Leader Election',
        remediationStartSec: 870,
        remediationEndSec: 930
      },
      {
        id: 'q-mod4-5',
        quizId: 'quiz-mod-04-mastery',
        questionType: 'multiple_choice',
        skillAxisTag: 'Caching & Queues',
        points: 20,
        promptMarkdown: `Suppose a Raft Leader crashes after sending AppendEntries to 2 out of 5 followers, but before marking the log entry committed. A new election occurs. What guarantees that an uncommitted entry from a previous term will NOT be overwritten if it reached a quorum?`,
        optionsPayload: [
          {
            id: 'opt-5a',
            text: 'The Leader Completeness Property: Any candidate winning the election must possess all committed entries from previous terms because its log is at least as up-to-date as a majority quorum.'
          },
          {
            id: 'opt-5b',
            text: 'Follower nodes automatically broadcast a veto signal to cancel elections whenever an entry is uncommitted.'
          },
          {
            id: 'opt-5c',
            text: 'The crashed Leader will recover within 5 seconds and resume leadership via hardware watchdog interrupts.'
          },
          {
            id: 'opt-5d',
            text: 'Entries from previous terms are immediately rolled back to ensure linearizability.'
          }
        ],
        correctAnswerPayload: 'opt-5a',
        explanationMarkdown: `**Correct Answer: Leader Completeness Property.**\n\nDuring \`RequestVote\` RPCs, voters deny their vote if the candidate’s log is less up-to-date than their own. Since committing an entry requires reaching a majority of servers, at least one server in the election quorum must contain that committed entry. Therefore, any candidate elected MUST already contain the entry!`,
        remediationLessonId: 'les-04-03',
        remediationLessonTitle: '04.3 — Consensus Algorithms & Raft Leader Election',
        remediationStartSec: 580,
        remediationEndSec: 640
      }
    ]
  },

  // 2. In-Video Micro-Check Quiz (Triggered automatically at @ 08:15)
  'quiz-invideo-04-3-check-1': {
    id: 'quiz-invideo-04-3-check-1',
    courseId: 'course-dist-sys-01',
    lessonId: 'les-04-03',
    title: 'In-Video Checkpoint @ 08:15: Raft Follower Timeout Transition',
    quizMode: 'in_video_checkpoint',
    passingScorePercent: 100,
    shuffleQuestions: false,
    questions: [
      {
        id: 'q-invideo-815',
        quizId: 'quiz-invideo-04-3-check-1',
        questionType: 'multiple_choice',
        videoCueTimestampSec: 495, // 08:15
        skillAxisTag: 'Security & Consensus',
        points: 10,
        promptMarkdown: `If Follower Node B's election timeout expires before receiving a heartbeat from the Leader, what state does Node B transition to first?`,
        optionsPayload: [
          { id: 'opt-c1', text: '[A] Candidate: Increments term, votes for self, and requests votes from peers.' },
          { id: 'opt-c2', text: '[B] Immediate Leader: Takes over cluster and broadcasts commits.' },
          { id: 'opt-c3', text: '[C] Offline Partition: Shuts down network interface and halts.' }
        ],
        correctAnswerPayload: 'opt-c1',
        explanationMarkdown: `**Correct! Node B becomes a Candidate.** It increments its term counter, casts a vote for itself, and requests votes from all other nodes. Playback can now smoothly resume!`,
        remediationLessonId: 'les-04-03',
        remediationStartSec: 411,
        remediationEndSec: 494
      }
    ]
  },

  // 3. Module 1 Diagnostic Test-Out Quiz (Bypass foundational material)
  'quiz-mod-01-diagnostic': {
    id: 'quiz-mod-01-diagnostic',
    courseId: 'course-dist-sys-01',
    moduleId: 'mod-01',
    title: '5-Minute Diagnostic Challenge: CAP Theorem & Consistency Foundations',
    description: 'Score 80%+ on this diagnostic assessment to instantly test out of Module 01 and unlock advanced modules.',
    quizMode: 'diagnostic_test_out',
    passingScorePercent: 80,
    timeLimitSeconds: 300,
    shuffleQuestions: false,
    questions: [
      {
        id: 'q-diag-1',
        quizId: 'quiz-mod-01-diagnostic',
        questionType: 'multiple_choice',
        skillAxisTag: 'System Design',
        points: 50,
        promptMarkdown: `According to the PACELC theorem, in the ABSENCE of a network partition (the "E" part of PACELC), what fundamental trade-off must a distributed database make?`,
        optionsPayload: [
          { id: 'p1', text: 'Latency (L) versus Consistency (C)' },
          { id: 'p2', text: 'Throughput (T) versus Durability (D)' },
          { id: 'p3', text: 'Partition tolerance (P) versus Availability (A)' },
          { id: 'p4', text: 'Disk I/O versus Memory Bandwidth' }
        ],
        correctAnswerPayload: 'p1',
        explanationMarkdown: `**PACELC Formulation:** If there is a Partition (P), choose between Availability (A) and Consistency (C); Else (E), choose between Latency (L) and Consistency (C).`,
        remediationLessonId: 'les-01-01',
        remediationStartSec: 720,
        remediationEndSec: 800
      },
      {
        id: 'q-diag-2',
        quizId: 'quiz-mod-01-diagnostic',
        questionType: 'multiple_choice',
        skillAxisTag: 'Database Indexing',
        points: 50,
        promptMarkdown: `Which consistency model guarantees that if Process A updates key X, and Process B reads key X after receiving an out-of-band phone call from Process A confirming the write, Process B will always observe the new value?`,
        optionsPayload: [
          { id: 'c1', text: 'Linearizability (Strict Real-Time Ordering)' },
          { id: 'c2', text: 'Eventual Consistency' },
          { id: 'c3', text: 'Read Uncommitted' },
          { id: 'c4', text: 'Causal Consistency without external synchronization' }
        ],
        correctAnswerPayload: 'c1',
        explanationMarkdown: `**Linearizability** is a real-time guarantee: operations take effect instantaneously at a discrete point in time between their invocation and response on a global clock.`,
        remediationLessonId: 'les-01-02',
        remediationStartSec: 0,
        remediationEndSec: 100
      }
    ]
  }
};

