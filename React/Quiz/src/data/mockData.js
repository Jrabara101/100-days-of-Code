// Pre-populated templates, survey definitions, and sample response analytics

export const initialSurveys = [
  {
    id: 'survey-pmf-1',
    title: 'SaaS Product-Market Fit & NPS Survey',
    slug: 'product-market-fit',
    type: 'survey',
    description: 'Measure user delight, identify churn hazards, and dynamically branch respondents based on their Net Promoter Score.',
    cover_image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&auto=format&fit=crop&q=80',
    status: 'published',
    theme_config: {
      primaryColor: '#4F46E5',
      darkTheme: true,
      fontFamily: 'Plus Jakarta Sans',
      showLogo: true,
      logoText: 'PulseFlow PMF'
    },
    settings: {
      shuffle_questions: false,
      time_limit_seconds: null,
      partial_capture: true,
      passing_score: null,
      show_instant_feedback: false,
      auto_advance_delay_ms: 320,
      allow_backtracking: true
    },
    questions: [
      {
        id: 'q-pmf-1',
        order_index: 1,
        type: 'short_text',
        title: "Welcome! To begin, what is your first name?",
        subtitle: "We'll personalize this quick 90-second feedback session for you.",
        is_required: true,
        media_url: null,
        properties: {
          placeholder: 'e.g. Alex or Sarah',
          variable_name: 'name'
        }
      },
      {
        id: 'q-pmf-2',
        order_index: 2,
        type: 'opinion_scale',
        title: "Hey {{name}}, how likely are you to recommend PulseFlow to a colleague?",
        subtitle: "Rate from 0 (Not at all likely) to 10 (Extremely likely). Use number keys 0-9.",
        is_required: true,
        media_url: null,
        properties: {
          min_value: 0,
          max_value: 10,
          min_label: 'Not at all likely',
          max_label: 'Extremely likely',
          variable_name: 'nps_score'
        }
      },
      {
        id: 'q-pmf-3',
        order_index: 3,
        type: 'multiple_choice',
        title: "Which primary benefit has delivered the highest ROI for your team?",
        subtitle: "Select the option that best reflects your primary use case.",
        is_required: true,
        media_url: null,
        properties: {
          choices: [
            { id: 'c1', label: 'Keyboard-first conversational completion rate' },
            { id: 'c2', label: 'Visual no-code conditional logic branching' },
            { id: 'c3', label: 'Ghost partial response capture & funnel triage' },
            { id: 'c4', label: 'Multi-dimensional archetype scoring & quizzes' }
          ]
        }
      },
      {
        id: 'q-pmf-4',
        order_index: 4,
        type: 'long_text',
        title: "What is the single biggest roadblock or missing feature we should fix, {{name}}?",
        subtitle: "Your raw, unfiltered feedback helps us prioritize our next sprint cycle.",
        is_required: false,
        media_url: null,
        properties: {
          placeholder: 'Tell us what felt clunky, confusing, or needed more polish...'
        }
      },
      {
        id: 'q-pmf-5',
        order_index: 5,
        type: 'multiple_choice',
        title: "What do you love most about the experience so far, {{name}}?",
        subtitle: "You gave us a stellar rating! Help us double down on what works.",
        is_required: false,
        media_url: null,
        properties: {
          choices: [
            { id: 'p1', label: 'Blazing fast sub-second question transitions' },
            { id: 'p2', label: 'Clean, distraction-free aesthetic and typography' },
            { id: 'p3', label: 'Easy embedding across our website & docs' },
            { id: 'p4', label: 'Deep abandonment and drop-off analytics' }
          ]
        }
      },
      {
        id: 'q-pmf-6',
        order_index: 6,
        type: 'file_upload',
        title: "Have a workflow diagram or screenshot you'd like to share?",
        subtitle: "Optional attachment (Mock upload supports PNG, JPG, PDF up to 10MB).",
        is_required: false,
        media_url: null,
        properties: {
          max_size_mb: 10,
          allowed_types: ['image/*', 'application/pdf']
        }
      },
      {
        id: 'q-pmf-7',
        order_index: 7,
        type: 'email',
        title: "Where can our engineering team send your VIP early-access invite?",
        subtitle: "We will only email you regarding product roadmap updates.",
        is_required: true,
        media_url: null,
        properties: {
          placeholder: 'your.name@company.com',
          variable_name: 'email'
        }
      }
    ],
    logic_rules: [
      {
        id: 'rule-pmf-1',
        source_question_id: 'q-pmf-2',
        condition: 'less_than',
        value: '9',
        action: 'jump_to',
        target_question_id: 'q-pmf-4'
      },
      {
        id: 'rule-pmf-2',
        source_question_id: 'q-pmf-2',
        condition: 'greater_than',
        value: '8',
        action: 'jump_to',
        target_question_id: 'q-pmf-5'
      },
      {
        id: 'rule-pmf-3',
        source_question_id: 'q-pmf-4',
        condition: 'always',
        value: '',
        action: 'jump_to',
        target_question_id: 'q-pmf-6'
      },
      {
        id: 'rule-pmf-4',
        source_question_id: 'q-pmf-5',
        condition: 'always',
        value: '',
        action: 'jump_to',
        target_question_id: 'q-pmf-6'
      }
    ],
    quiz_outcomes: [
      {
        id: 'out-pmf-1',
        title: 'Thank you for your valuable feedback!',
        description: 'Your insights have been streamed directly to our core product team. We review submissions every single Monday morning.',
        badge: 'Feedback Received',
        image_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
        min_score: 0,
        max_score: 100,
        cta_label: 'Explore Our Public Roadmap',
        cta_url: 'https://pulseflow.app/roadmap'
      }
    ]
  },
  {
    id: 'survey-leadership-2',
    title: 'Tech Leadership Archetype Assessment',
    slug: 'leadership-archetype',
    type: 'personality_assessment',
    description: 'Discover your engineering leadership archetype across 4 pillars: Visionary Architect, Empathetic Coach, Pragmatic Operator, and Execution Maestro.',
    cover_image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
    status: 'published',
    theme_config: {
      primaryColor: '#8B5CF6',
      darkTheme: true,
      fontFamily: 'Plus Jakarta Sans',
      showLogo: true,
      logoText: 'ArchetypeIQ'
    },
    settings: {
      shuffle_questions: false,
      time_limit_seconds: null,
      partial_capture: true,
      passing_score: null,
      show_instant_feedback: false,
      auto_advance_delay_ms: 300,
      allow_backtracking: true
    },
    questions: [
      {
        id: 'q-lead-1',
        order_index: 1,
        type: 'short_text',
        title: "To tailor your leadership profile, what is your name?",
        subtitle: "We will generate a personalized Archetype report.",
        is_required: true,
        media_url: null,
        properties: {
          placeholder: 'e.g. Jordan Reed',
          variable_name: 'name'
        }
      },
      {
        id: 'q-lead-2',
        order_index: 2,
        type: 'multiple_choice',
        title: "When your team encounters an unexpected production outage, what is your primary instinct, {{name}}?",
        subtitle: "Select the behavior that represents your authentic response under pressure.",
        is_required: true,
        media_url: null,
        properties: {
          choices: [
            { id: 'la1', label: 'Dissect the distributed architecture to solve the root failure', category_points: { architect: 3 } },
            { id: 'la2', label: 'Support and shield the on-call engineer from stress and blame', category_points: { coach: 3 } },
            { id: 'la3', label: 'Enforce recovery SOPs, post-mortems, and runbook updates', category_points: { operator: 3 } },
            { id: 'la4', label: 'Coordinate immediate rollback or hotfix to restore SLA instantly', category_points: { maestro: 3 } }
          ]
        }
      },
      {
        id: 'q-lead-3',
        order_index: 3,
        type: 'picture_choice',
        title: "Which workspace atmosphere reflects your peak creative state?",
        subtitle: "Visual cues indicate your core cognitive workflow style.",
        is_required: true,
        media_url: null,
        properties: {
          choices: [
            {
              id: 'pic1',
              label: 'Deep System Architecture & Blueprints',
              image_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=500&auto=format&fit=crop&q=80',
              category_points: { architect: 3 }
            },
            {
              id: 'pic2',
              label: '1-on-1 Mentorship & Team Growth Sessions',
              image_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&auto=format&fit=crop&q=80',
              category_points: { coach: 3 }
            },
            {
              id: 'pic3',
              label: 'High-Reliability Observability & Dashboards',
              image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80',
              category_points: { operator: 3 }
            },
            {
              id: 'pic4',
              label: 'Fast-Paced Ship War Room & Release Sprints',
              image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&auto=format&fit=crop&q=80',
              category_points: { maestro: 3 }
            }
          ]
        }
      },
      {
        id: 'q-lead-4',
        order_index: 4,
        type: 'rating',
        title: "How heavily do you prioritize psychological safety over raw sprint velocity?",
        subtitle: "1 = Pure velocity focus; 5 = Absolute psychological safety focus.",
        is_required: true,
        media_url: null,
        properties: {
          min_value: 1,
          max_value: 5,
          category_points: { coach: 2, architect: 1 }
        }
      },
      {
        id: 'q-lead-5',
        order_index: 5,
        type: 'multiple_choice',
        title: "How do you define engineering excellence, {{name}}?",
        subtitle: "Your guiding North Star when setting technical standards.",
        is_required: true,
        media_url: null,
        properties: {
          choices: [
            { id: 'le1', label: 'Elegantly decoupled systems that scale smoothly to 10M users', category_points: { architect: 3 } },
            { id: 'le2', label: 'An autonomous team where engineers flourish into staff leaders', category_points: { coach: 3 } },
            { id: 'le3', label: 'Predictable 99.99% uptime, clear SLOs, and zero chaotic surprises', category_points: { operator: 3 } },
            { id: 'le4', label: 'Rapid continuous delivery shipping value to users multiple times daily', category_points: { maestro: 3 } }
          ]
        }
      },
      {
        id: 'q-lead-6',
        order_index: 6,
        type: 'email',
        title: "Where should we deliver your Archetype Dossier, {{name}}?",
        subtitle: "Unlock your leadership score matrix and recommended team pairings.",
        is_required: true,
        media_url: null,
        properties: {
          placeholder: 'leader@company.com',
          variable_name: 'email'
        }
      }
    ],
    logic_rules: [],
    quiz_outcomes: [
      {
        id: 'out-architect',
        category_match: 'architect',
        title: 'The Visionary Architect',
        badge: 'Systems Thinker & Blueprint Pioneer',
        description: 'You see the big technical horizon. You anticipate bottlenecks years before they manifest and craft elegant, decoupled architectures that empower high-performance systems.',
        image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
        cta_label: 'Download Systems Architecture Handbook',
        cta_url: '#'
      },
      {
        id: 'out-coach',
        category_match: 'coach',
        title: 'The Empathetic Coach',
        badge: 'People Multiplier & Talent Catalyst',
        description: 'Your greatest pride is seeing individual engineers grow into visionary leaders. You foster unparalleled psychological safety, mentorship, and high-trust team collaboration.',
        image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
        cta_label: 'Get 1-on-1 Mentorship Templates',
        cta_url: '#'
      },
      {
        id: 'out-operator',
        category_match: 'operator',
        title: 'The Pragmatic Operator',
        badge: 'Reliability Guardian & Process Wizard',
        description: 'Chaos has no place on your watch. You turn volatile deployments into clockwork automation, build robust observability, and safeguard mission-critical uptime.',
        image_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
        cta_label: 'Explore Production Readiness Checklist',
        cta_url: '#'
      },
      {
        id: 'out-maestro',
        category_match: 'maestro',
        title: 'The Execution Maestro',
        badge: 'Velocity Driver & Relentless Shipper',
        description: 'You eliminate friction, demolish blockers, and turn high-stakes roadmaps into shipped code. Your teams consistently deliver on schedule with relentless momentum.',
        image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        cta_label: 'Access Sprint Acceleration Playbook',
        cta_url: '#'
      }
    ]
  },
  {
    id: 'survey-quiz-3',
    title: 'Frontend Architecture Masterclass Quiz',
    slug: 'frontend-masterclass',
    type: 'scored_quiz',
    description: 'Test your mastery of React 19, Server Components, State Machines, and Web Vitals. Passing score: 75% for certified credential.',
    cover_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    status: 'published',
    theme_config: {
      primaryColor: '#10B981',
      darkTheme: true,
      fontFamily: 'Plus Jakarta Sans',
      showLogo: true,
      logoText: 'MasteryCert'
    },
    settings: {
      shuffle_questions: false,
      time_limit_seconds: 180, // 3 minute timer
      partial_capture: true,
      passing_score: 75,
      show_instant_feedback: true,
      auto_advance_delay_ms: 500,
      allow_backtracking: false
    },
    questions: [
      {
        id: 'q-quiz-1',
        order_index: 1,
        type: 'short_text',
        title: "Candidate Name for official credentials:",
        subtitle: "Enter your full name exactly as it should appear on your Certificate of Excellence.",
        is_required: true,
        media_url: null,
        properties: {
          placeholder: 'e.g. Morgan Vance',
          variable_name: 'name'
        }
      },
      {
        id: 'q-quiz-2',
        order_index: 2,
        type: 'multiple_choice',
        title: "In React 19, which hook is newly introduced to read Promises and context directly in render?",
        subtitle: "Select the correct official API name.",
        is_required: true,
        media_url: null,
        properties: {
          correct_answer: 'use()',
          points: 25,
          explanation: "React 19 introduces the use() hook to unwrap promises and read context conditionally inside components without needing useEffect or custom wrappers.",
          choices: [
            { id: 'qc1', label: 'useAsync()' },
            { id: 'qc2', label: 'use()' },
            { id: 'qc3', label: 'useDeferredPromise()' },
            { id: 'qc4', label: 'useSuspense()' }
          ]
        }
      },
      {
        id: 'q-quiz-3',
        order_index: 3,
        type: 'multiple_choice',
        title: "What is the primary architectural advantage of Fine-Grained Reactivity (Signals)?",
        subtitle: "Compare component-level reconciliation with direct signal graph subscription.",
        is_required: true,
        media_url: null,
        properties: {
          correct_answer: 'Updates specific DOM text nodes without re-evaluating parent component functions',
          points: 25,
          explanation: "Signals establish direct bindings between reactive nodes and specific DOM properties. When a signal changes, only the subscriber callback runs—bypassing component re-execution.",
          choices: [
            { id: 'qc5', label: 'Updates specific DOM text nodes without re-evaluating parent component functions' },
            { id: 'qc6', label: 'Automatically caches all network requests in service workers' },
            { id: 'qc7', label: 'Forces all state to be synchronized globally in localStorage' },
            { id: 'qc8', label: 'Replaces the need for CSS transitions and animations' }
          ]
        }
      },
      {
        id: 'q-quiz-4',
        order_index: 4,
        type: 'multiple_choice',
        title: "Which Core Web Vital metric officially superseded First Input Delay (FID) in 2024?",
        subtitle: "Select the metric assessing holistic interaction responsiveness.",
        is_required: true,
        media_url: null,
        properties: {
          correct_answer: 'Interaction to Next Paint (INP)',
          points: 25,
          explanation: "INP evaluates overall interaction latency throughout the entire user lifecycle on a page, observing all clicks, taps, and keyboard events, unlike FID which only measured the initial event.",
          choices: [
            { id: 'qc9', label: 'Cumulative Layout Shift (CLS)' },
            { id: 'qc10', label: 'Time to First Byte (TTFB)' },
            { id: 'qc11', label: 'Interaction to Next Paint (INP)' },
            { id: 'qc12', label: 'Total Blocking Time (TBT)' }
          ]
        }
      },
      {
        id: 'q-quiz-5',
        order_index: 5,
        type: 'multiple_choice',
        title: "Why is 'Ghost Capture' (Partial Response Harvest) essential in modern survey design?",
        subtitle: "Think about user drop-off behavior and funnel analytics.",
        is_required: true,
        media_url: null,
        properties: {
          correct_answer: 'Preserves partial inputs per step to diagnose drop-off hotspots and retain lead data',
          points: 25,
          explanation: "Ghost Capture ensures answers are saved optimistically as questions are completed. Even if an end-user abandons at Question 4, their answers are preserved and authors can pinpoint friction points.",
          choices: [
            { id: 'qc13', label: 'Preserves partial inputs per step to diagnose drop-off hotspots and retain lead data' },
            { id: 'qc14', label: 'Encrypts answers so not even the survey author can view them' },
            { id: 'qc15', label: 'Forces respondents to restart from question 1 if they pause' },
            { id: 'qc16', label: 'Eliminates the need for any database or local storage' }
          ]
        }
      }
    ],
    logic_rules: [],
    quiz_outcomes: [
      {
        id: 'out-passed',
        title: 'Certified Frontend Architect',
        badge: 'Passed with Distinction',
        min_score: 75,
        max_score: 100,
        description: 'Exemplary performance! You demonstrated master-level understanding of React 19 ergonomics, signal reactivity, Core Web Vitals, and resilient conversational data pipelines.',
        image_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80',
        cta_label: 'Download Official Certificate',
        cta_url: '#certificate'
      },
      {
        id: 'out-failed',
        title: 'Associate Architecture Candidate',
        badge: 'Review & Retake Recommended',
        min_score: 0,
        max_score: 74,
        description: 'You scored below the 75% threshold. Review the explanations provided for each question to strengthen your core principles and re-attempt the assessment.',
        image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
        cta_label: 'Retake Assessment',
        cta_url: '#retake'
      }
    ]
  }
];

// Pre-seeded responses showcasing Completed responses and Ghost (Partial Abandoned) submissions
export const initialResponses = [
  {
    id: 'res-101',
    survey_id: 'survey-pmf-1',
    session_token: 'sess-82a93bf1',
    is_completed: true,
    last_question_id: 'q-pmf-7',
    total_score: 10,
    calculated_outcome_title: 'Thank you for your valuable feedback!',
    device: 'desktop',
    started_at: '2026-10-17T08:15:20Z',
    completed_at: '2026-10-17T08:17:42Z',
    duration_seconds: 142,
    answers: {
      'q-pmf-1': 'Sarah Jenkins',
      'q-pmf-2': 10,
      'q-pmf-3': 'Ghost partial response capture & funnel triage',
      'q-pmf-5': 'Blazing fast sub-second question transitions',
      'q-pmf-7': 'sarah.j@acme-saas.io'
    }
  },
  {
    id: 'res-102',
    survey_id: 'survey-pmf-1',
    session_token: 'sess-194fa82d',
    is_completed: true,
    last_question_id: 'q-pmf-7',
    total_score: 7,
    calculated_outcome_title: 'Thank you for your valuable feedback!',
    device: 'mobile',
    started_at: '2026-10-17T08:42:10Z',
    completed_at: '2026-10-17T08:44:50Z',
    duration_seconds: 160,
    answers: {
      'q-pmf-1': 'Marcus Brody',
      'q-pmf-2': 7,
      'q-pmf-3': 'Keyboard-first conversational completion rate',
      'q-pmf-4': 'More webhook notification integrations for Discord would be huge.',
      'q-pmf-7': 'm.brody@venturetech.co'
    }
  },
  {
    id: 'res-103',
    survey_id: 'survey-pmf-1',
    session_token: 'sess-73c8801f',
    is_completed: false, // GHOST PARTIAL CAPTURE!
    last_question_id: 'q-pmf-4',
    total_score: 6,
    calculated_outcome_title: null,
    device: 'mobile',
    started_at: '2026-10-17T09:12:00Z',
    completed_at: null,
    duration_seconds: 68,
    answers: {
      'q-pmf-1': 'David Chen',
      'q-pmf-2': 6,
      'q-pmf-3': 'Visual no-code conditional logic branching'
      // Abandoned at Q4!
    }
  },
  {
    id: 'res-104',
    survey_id: 'survey-pmf-1',
    session_token: 'sess-99b2110c',
    is_completed: false, // GHOST PARTIAL CAPTURE!
    last_question_id: 'q-pmf-2',
    total_score: 9,
    calculated_outcome_title: null,
    device: 'desktop',
    started_at: '2026-10-17T10:05:14Z',
    completed_at: null,
    duration_seconds: 35,
    answers: {
      'q-pmf-1': 'Elena Rostova',
      'q-pmf-2': 9
      // Abandoned after Q2!
    }
  },
  {
    id: 'res-105',
    survey_id: 'survey-pmf-1',
    session_token: 'sess-44e8321a',
    is_completed: true,
    last_question_id: 'q-pmf-7',
    total_score: 9,
    calculated_outcome_title: 'Thank you for your valuable feedback!',
    device: 'desktop',
    started_at: '2026-10-17T10:30:10Z',
    completed_at: '2026-10-17T10:32:25Z',
    duration_seconds: 135,
    answers: {
      'q-pmf-1': 'Priya Patel',
      'q-pmf-2': 9,
      'q-pmf-3': 'Keyboard-first conversational completion rate',
      'q-pmf-5': 'Clean, distraction-free aesthetic and typography',
      'q-pmf-7': 'priya@fintech-matrix.com'
    }
  },
  {
    id: 'res-201',
    survey_id: 'survey-quiz-3',
    session_token: 'sess-quiz-771',
    is_completed: true,
    last_question_id: 'q-quiz-5',
    total_score: 100,
    calculated_outcome_title: 'Certified Frontend Architect',
    device: 'desktop',
    started_at: '2026-10-17T07:20:00Z',
    completed_at: '2026-10-17T07:22:15Z',
    duration_seconds: 135,
    answers: {
      'q-quiz-1': 'Alexander Wright',
      'q-quiz-2': 'use()',
      'q-quiz-3': 'Updates specific DOM text nodes without re-evaluating parent component functions',
      'q-quiz-4': 'Interaction to Next Paint (INP)',
      'q-quiz-5': 'Preserves partial inputs per step to diagnose drop-off hotspots and retain lead data'
    }
  },
  {
    id: 'res-202',
    survey_id: 'survey-quiz-3',
    session_token: 'sess-quiz-892',
    is_completed: true,
    last_question_id: 'q-quiz-5',
    total_score: 75,
    calculated_outcome_title: 'Certified Frontend Architect',
    device: 'mobile',
    started_at: '2026-10-17T09:10:00Z',
    completed_at: '2026-10-17T09:12:40Z',
    duration_seconds: 160,
    answers: {
      'q-quiz-1': 'Chloe Bennett',
      'q-quiz-2': 'use()',
      'q-quiz-3': 'Updates specific DOM text nodes without re-evaluating parent component functions',
      'q-quiz-4': 'Cumulative Layout Shift (CLS)', // incorrect
      'q-quiz-5': 'Preserves partial inputs per step to diagnose drop-off hotspots and retain lead data'
    }
  },
  {
    id: 'res-203',
    survey_id: 'survey-quiz-3',
    session_token: 'sess-quiz-310',
    is_completed: false, // ghost drop-off
    last_question_id: 'q-quiz-3',
    total_score: 25,
    calculated_outcome_title: null,
    device: 'mobile',
    started_at: '2026-10-17T10:14:00Z',
    completed_at: null,
    duration_seconds: 55,
    answers: {
      'q-quiz-1': 'Liam O\'Connor',
      'q-quiz-2': 'use()'
    }
  }
];
