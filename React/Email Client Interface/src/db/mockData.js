export const INITIAL_ACCOUNTS = [
  {
    id: 'acc_1',
    user_id: 'usr_alex',
    email_address: 'alex@acme.dev',
    display_name: 'Alex Rivera',
    signature_html: '<p style="color:#64748B;font-size:13px;margin-top:16px;">—<br><strong>Alex Rivera</strong><br>Founding Engineer & Product Architect &bull; Acme Dev<br><span style="color:#3B82F6;">acme.dev</span></p>',
    sync_cursor: 'cursor_2026_11_13_v1',
    undo_send_seconds: 15,
  },
  {
    id: 'acc_2',
    user_id: 'usr_alex',
    email_address: 'alex.personal@gmail.com',
    display_name: 'Alex (Personal)',
    signature_html: '<p style="color:#64748B;font-size:13px;">Sent from AeroMail</p>',
    sync_cursor: 'cursor_gmail_02',
    undo_send_seconds: 10,
  }
];

export const INITIAL_LABELS = [
  {
    id: 'lbl_urgent',
    name: 'Urgent / P1',
    slug: 'urgent',
    color_hex: '#EF4444',
    icon: 'AlertCircle',
    bundle_in_inbox: false,
    sort_order: 1,
  },
  {
    id: 'lbl_legal',
    name: 'Legal & MSA',
    slug: 'legal',
    color_hex: '#8B5CF6',
    icon: 'Scale',
    bundle_in_inbox: false,
    sort_order: 2,
  },
  {
    id: 'lbl_finance',
    name: 'Finance & Invoices',
    slug: 'finance',
    color_hex: '#10B981',
    icon: 'Receipt',
    bundle_in_inbox: true,
    sort_order: 3,
  },
  {
    id: 'lbl_product',
    name: 'Product & Eng',
    slug: 'product',
    color_hex: '#3B82F6',
    icon: 'Terminal',
    bundle_in_inbox: false,
    sort_order: 4,
  },
  {
    id: 'lbl_clients',
    name: 'Clients & VIP',
    slug: 'clients',
    color_hex: '#F97316',
    icon: 'Building2',
    bundle_in_inbox: false,
    sort_order: 5,
  },
  {
    id: 'lbl_hiring',
    name: 'Hiring & People',
    slug: 'hiring',
    color_hex: '#EC4899',
    icon: 'Users',
    bundle_in_inbox: false,
    sort_order: 6,
  },
];

export const INITIAL_CONTACTS = [
  {
    email: 'elena@stripe.com',
    name: 'Elena Rostova',
    role: 'VP Partnerships & Legal',
    company: 'Stripe',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    timezone: 'Europe/London',
    city: 'London, UK',
    vip: true,
    mutual_threads_count: 14,
    notes: 'Key partner for Q4 Enterprise billing integration. Prefers morning GMT syncs.',
  },
  {
    email: 'marcus@acme.dev',
    name: 'Marcus Chen',
    role: 'Lead Infrastructure Architect',
    company: 'Acme Dev',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    timezone: 'America/Los_Angeles',
    city: 'San Francisco, CA',
    vip: false,
    mutual_threads_count: 48,
    notes: 'Handles Kubernetes, BullMQ, Redis clusters and edge POP deployment.',
  },
  {
    email: 'sarah.lin@benchmark.com',
    name: 'Sarah Lin',
    role: 'General Partner',
    company: 'Benchmark Capital',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    timezone: 'America/New_York',
    city: 'New York, NY',
    vip: true,
    mutual_threads_count: 9,
    notes: 'Series B Lead Partner. Fast responder, appreciates direct metrics.',
  },
  {
    email: 'billing@stripe.com',
    name: 'Stripe Billing System',
    role: 'Automated Billing Portal',
    company: 'Stripe Payments',
    avatar: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&auto=format&fit=crop&q=80',
    timezone: 'UTC',
    city: 'San Francisco, CA',
    vip: false,
    mutual_threads_count: 22,
    notes: 'Monthly invoices & merchant statements.',
  },
  {
    email: 'no-reply@amazon.com',
    name: 'AWS Notifications',
    role: 'Cloud Services Billing',
    company: 'Amazon Web Services',
    avatar: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80',
    timezone: 'UTC',
    city: 'Seattle, WA',
    vip: false,
    mutual_threads_count: 18,
    notes: 'Production cluster infrastructure invoices.',
  },
  {
    email: 'gergely@pragmaticengineer.com',
    name: 'Gergely Orosz',
    role: 'Author & Curator',
    company: 'The Pragmatic Engineer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    timezone: 'Europe/Amsterdam',
    city: 'Amsterdam, Netherlands',
    vip: false,
    mutual_threads_count: 5,
    notes: 'Tech newsletter on software engineering at scale.',
  },
  {
    email: 'tim@apple.com',
    name: 'Tim O\'Connor',
    role: 'WebKit Developer Relations',
    company: 'Apple Inc.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    timezone: 'America/Los_Angeles',
    city: 'Cupertino, CA',
    vip: false,
    mutual_threads_count: 3,
    notes: 'Working on Canvas sub-pixel rendering defect in Safari.',
  }
];

export const INITIAL_SCREENER = [
  {
    id: 'scr_1',
    sender_email: 'vikram@salesvelocity.ai',
    sender_name: 'Vikram Patel',
    sender_domain: 'salesvelocity.ai',
    status: 'pending',
    preview_subject: 'Quick question regarding Acme\'s outbound pipeline',
    preview_snippet: 'Hey Alex, noticed Acme recently scaled to 45 engineers. Are you currently leveraging automated multi-channel sequencing for...',
    received_at: '2026-11-13T08:45:00Z',
    detected_type: 'Cold Sales Pitch',
  },
  {
    id: 'scr_2',
    sender_email: 'newsletter@securityweekly.dev',
    sender_name: 'Security Weekly Brief',
    sender_domain: 'securityweekly.dev',
    status: 'pending',
    preview_subject: 'CVE-2026-4412: Zero-day in Node.js HTTP/2 Parser',
    preview_snippet: 'This week in application security: Critical CVSS 9.8 remote code execution in popular edge runtimes, plus supply chain updates...',
    received_at: '2026-11-13T07:12:00Z',
    detected_type: 'Technical Newsletter',
  },
  {
    id: 'scr_3',
    sender_email: 'billing-alert@cloudmonitor.io',
    sender_name: 'CloudMonitor System',
    sender_domain: 'cloudmonitor.io',
    status: 'pending',
    preview_subject: 'Monthly Usage Statement for Workspace #9921',
    preview_snippet: 'Your monthly consumption invoice for November 2026 is ready. Total billed: $128.50. Click here to download your tax receipt...',
    received_at: '2026-11-13T06:30:00Z',
    detected_type: 'Automated Receipt',
  },
  {
    id: 'scr_4',
    sender_email: 'charlotte@designforward.studio',
    sender_name: 'Charlotte Vance',
    sender_domain: 'designforward.studio',
    status: 'pending',
    preview_subject: 'Portfolio & Introduction: Design Systems Lead',
    preview_snippet: 'Hi Alex, saw your tweet about revamping the AeroMail command center aesthetic. I recently led design systems at Cron and Linear...',
    received_at: '2026-11-12T22:15:00Z',
    detected_type: 'Direct Candidate / Portfolio',
  }
];

export const INITIAL_THREADS = [
  {
    id: 'th_1',
    account_id: 'acc_1',
    subject: 'Stripe & Acme: Q4 Enterprise Master Services Agreement (Redlines Attached)',
    snippet: 'Attached is the redlined Q4 Master Services Agreement with our general counsel comments regarding data sovereignty...',
    split_category: 'focused',
    message_count: 3,
    has_attachments: true,
    is_unread: true,
    is_starred: true,
    is_archived: false,
    is_trash: false,
    snoozed_until: null,
    needs_reply_reminder_at: null,
    last_message_at: '2026-11-13T08:52:00Z',
    labels: ['legal', 'clients'],
    participants: [
      { name: 'Elena Rostova', email: 'elena@stripe.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', is_vip: true },
      { name: 'Alex Rivera', email: 'alex@acme.dev', avatar: '' }
    ],
    primary_sender: {
      name: 'Elena Rostova',
      email: 'elena@stripe.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      is_vip: true,
    },
    sample_attachment: {
      name: 'Stripe_Enterprise_MSA_v3.pdf',
      size: '1.4 MB',
      type: 'pdf',
    }
  },
  {
    id: 'th_2',
    account_id: 'acc_1',
    subject: '🔥 P1 Incident: Edge Redis Cluster Latency Spike in us-east-1',
    snippet: 'We observed P99 latency jump from 1.8ms to 320ms starting at 08:15 UTC. BullMQ workers are experiencing queue backlog...',
    split_category: 'focused',
    message_count: 2,
    has_attachments: false,
    is_unread: true,
    is_starred: false,
    is_archived: false,
    is_trash: false,
    snoozed_until: null,
    needs_reply_reminder_at: null,
    last_message_at: '2026-11-13T08:30:00Z',
    labels: ['urgent', 'product'],
    participants: [
      { name: 'Marcus Chen', email: 'marcus@acme.dev', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { name: 'Alex Rivera', email: 'alex@acme.dev' }
    ],
    primary_sender: {
      name: 'Marcus Chen',
      email: 'marcus@acme.dev',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      is_vip: false,
    }
  },
  {
    id: 'th_3',
    account_id: 'acc_1',
    subject: 'Benchmark Series B Follow-up & Board Deck Discussion',
    snippet: 'Alex, loved the sub-50ms demo yesterday. The team was blown away by the local-first Dexie sync engine. Can we sync on valuation...',
    split_category: 'vip',
    message_count: 2,
    has_attachments: true,
    is_unread: false,
    is_starred: true,
    is_archived: false,
    is_trash: false,
    snoozed_until: null,
    needs_reply_reminder_at: null,
    last_message_at: '2026-11-12T19:40:00Z',
    labels: ['clients'],
    participants: [
      { name: 'Sarah Lin', email: 'sarah.lin@benchmark.com', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', is_vip: true }
    ],
    primary_sender: {
      name: 'Sarah Lin',
      email: 'sarah.lin@benchmark.com',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      is_vip: true,
    },
    sample_attachment: {
      name: 'Benchmark_TermSheet_Summary.xlsx',
      size: '420 KB',
      type: 'spreadsheet',
    }
  },
  // BUNDLED IN INBOX: Finance & Invoices
  {
    id: 'th_4',
    account_id: 'acc_1',
    subject: 'Your Stripe Monthly Billing Invoice #INV-2026-8891 ($4,200.00)',
    snippet: 'Your card ending in 4242 was successfully charged $4,200.00 for Acme Inc Enterprise Platform...',
    split_category: 'paper_trail',
    message_count: 1,
    has_attachments: true,
    is_unread: false,
    is_starred: false,
    is_archived: false,
    is_trash: false,
    snoozed_until: null,
    needs_reply_reminder_at: null,
    last_message_at: '2026-11-13T06:15:00Z',
    labels: ['finance'],
    participants: [
      { name: 'Stripe Billing System', email: 'billing@stripe.com' }
    ],
    primary_sender: {
      name: 'Stripe Billing System',
      email: 'billing@stripe.com',
      avatar: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&auto=format&fit=crop&q=80',
    },
    sample_attachment: {
      name: 'Invoice_INV-2026-8891.pdf',
      size: '210 KB',
      type: 'pdf',
    }
  },
  {
    id: 'th_5',
    account_id: 'acc_1',
    subject: 'AWS Billing Alert: October Invoice Ready ($1,842.15)',
    snippet: 'Greetings from Amazon Web Services. An invoice has been generated for your account 902-114-882...',
    split_category: 'paper_trail',
    message_count: 1,
    has_attachments: true,
    is_unread: false,
    is_starred: false,
    is_archived: false,
    is_trash: false,
    snoozed_until: null,
    needs_reply_reminder_at: null,
    last_message_at: '2026-11-13T05:20:00Z',
    labels: ['finance'],
    participants: [
      { name: 'AWS Notifications', email: 'no-reply@amazon.com' }
    ],
    primary_sender: {
      name: 'AWS Notifications',
      email: 'no-reply@amazon.com',
      avatar: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80',
    },
    sample_attachment: {
      name: 'AWS_Oct_TaxReceipt.pdf',
      size: '340 KB',
      type: 'pdf',
    }
  },
  {
    id: 'th_6',
    account_id: 'acc_1',
    subject: 'Vercel Enterprise Platform Tier — Invoice #VCL-99120 ($850.00)',
    snippet: 'Thank you for building on Vercel. Your payment for the billing period Oct 1 - Oct 31 has cleared...',
    split_category: 'paper_trail',
    message_count: 1,
    has_attachments: true,
    is_unread: false,
    is_starred: false,
    is_archived: false,
    is_trash: false,
    snoozed_until: null,
    needs_reply_reminder_at: null,
    last_message_at: '2026-11-12T23:05:00Z',
    labels: ['finance'],
    participants: [
      { name: 'Vercel Billing', email: 'billing@vercel.com' }
    ],
    primary_sender: {
      name: 'Vercel Billing',
      email: 'billing@vercel.com',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    },
    sample_attachment: {
      name: 'Vercel_Invoice_VCL99120.pdf',
      size: '180 KB',
      type: 'pdf',
    }
  },
  // NEWSLETTERS (The Feed)
  {
    id: 'th_7',
    account_id: 'acc_1',
    subject: 'The Pragmatic Engineer: How Big Tech runs incident post-mortems',
    snippet: 'Inside the blameless RCA culture at Meta, Stripe, and Google. Plus why five-whys fails without telemetry parity...',
    split_category: 'feed',
    message_count: 1,
    has_attachments: false,
    is_unread: true,
    is_starred: false,
    is_archived: false,
    is_trash: false,
    snoozed_until: null,
    needs_reply_reminder_at: null,
    last_message_at: '2026-11-13T04:10:00Z',
    labels: [],
    participants: [
      { name: 'Gergely Orosz', email: 'gergely@pragmaticengineer.com' }
    ],
    primary_sender: {
      name: 'Gergely Orosz',
      email: 'gergely@pragmaticengineer.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    }
  },
  {
    id: 'th_8',
    account_id: 'acc_1',
    subject: 'Dense Discovery #312: Analog Ergonomics, Quiet Software & Focus Tools',
    snippet: 'This week: A curated selection of quiet digital instruments, mechanical keyboards, sustainable typography, and links...',
    split_category: 'feed',
    message_count: 1,
    has_attachments: false,
    is_unread: false,
    is_starred: false,
    is_archived: false,
    is_trash: false,
    snoozed_until: null,
    needs_reply_reminder_at: null,
    last_message_at: '2026-11-12T15:20:00Z',
    labels: [],
    participants: [
      { name: 'Kai Brach', email: 'kai@densediscovery.com' }
    ],
    primary_sender: {
      name: 'Kai Brach',
      email: 'kai@densediscovery.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    }
  },
  // WAITING ON REPLY (Boomerang / Follow-up radar)
  {
    id: 'th_9',
    account_id: 'acc_1',
    subject: 'Safari 18 WebKit Canvas sub-pixel rendering regression test case',
    snippet: 'Hey Tim, following up on our bug report #28919. Were your engineers able to reproduce the jitter on Retina displays?',
    split_category: 'waiting_reply',
    message_count: 2,
    has_attachments: true,
    is_unread: false,
    is_starred: false,
    is_archived: false,
    is_trash: false,
    snoozed_until: null,
    needs_reply_reminder_at: '2026-11-12T10:00:00Z', // Past due!
    last_message_at: '2026-11-09T14:30:00Z',
    labels: ['product'],
    participants: [
      { name: 'Tim O\'Connor', email: 'tim@apple.com' },
      { name: 'Alex Rivera', email: 'alex@acme.dev' }
    ],
    primary_sender: {
      name: 'Tim O\'Connor',
      email: 'tim@apple.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    },
    sample_attachment: {
      name: 'repro_canvas_jitter.html',
      size: '12 KB',
      type: 'code',
    }
  },
  // SNOOZED THREAD
  {
    id: 'th_10',
    account_id: 'acc_1',
    subject: 'Quarterly Infrastructure Budget Review & Capacity Planning',
    snippet: 'Let\'s finalize server projections before next Monday\'s executive review...',
    split_category: 'focused',
    message_count: 1,
    has_attachments: false,
    is_unread: false,
    is_starred: false,
    is_archived: false,
    is_trash: false,
    snoozed_until: '2026-11-17T09:00:00Z',
    needs_reply_reminder_at: null,
    last_message_at: '2026-11-11T16:00:00Z',
    labels: ['product', 'finance'],
    participants: [
      { name: 'Marcus Chen', email: 'marcus@acme.dev' }
    ],
    primary_sender: {
      name: 'Marcus Chen',
      email: 'marcus@acme.dev',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    }
  }
];

export const INITIAL_MESSAGES = [
  // th_1 messages
  {
    id: 'msg_1_1',
    thread_id: 'th_1',
    message_id_header: '<msa-init-2026@stripe.com>',
    from_participant: {
      name: 'Elena Rostova',
      email: 'elena@stripe.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      is_vip: true,
    },
    to_participants: [
      { name: 'Alex Rivera', email: 'alex@acme.dev' }
    ],
    cc_participants: [
      { name: 'legal@stripe.com', email: 'legal@stripe.com' }
    ],
    body_html: `
      <p>Hi Alex,</p>
      <p>Great chatting with you and the team earlier this week. We are eager to formalize our partnership for the Q4 Enterprise Billing Engine.</p>
      <p>Our legal counsel has compiled the standard Master Services Agreement for your review. Please examine sections 4.2 (Data Handling) and 9.1 (Limitation of Liability).</p>
      <p>Best regards,<br><strong>Elena Rostova</strong><br>VP Partnerships & Legal &bull; Stripe</p>
    `,
    body_text: 'Hi Alex, Great chatting with you and the team earlier this week. We are eager to formalize our partnership for the Q4 Enterprise Billing Engine. Please examine sections 4.2 and 9.1.',
    attachments: [
      {
        id: 'att_1',
        name: 'Stripe_Enterprise_MSA_Draft_v1.pdf',
        size: '1.2 MB',
        type: 'pdf',
        pages: 18,
      }
    ],
    list_unsubscribe_url: null,
    trackers_blocked_count: 2,
    send_status: 'received',
    scheduled_for: null,
    created_at: '2026-11-11T14:15:00Z',
    team_notes: [
      {
        id: 'note_1',
        author: 'Alex Rivera',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        content: '@marcus Have you verified the data residency clause in 4.2 against our AWS Frankfurt cluster?',
        created_at: '2026-11-11T16:20:00Z',
      },
      {
        id: 'note_2',
        author: 'Marcus Chen',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        content: '@alex Yes, verified. Our eu-central-1 deployment fully satisfies GDPR and local sovereignty mandates.',
        created_at: '2026-11-11T17:05:00Z',
      }
    ]
  },
  {
    id: 'msg_1_2',
    thread_id: 'th_1',
    message_id_header: '<msa-reply-alex@acme.dev>',
    from_participant: {
      name: 'Alex Rivera',
      email: 'alex@acme.dev',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      is_vip: false,
    },
    to_participants: [
      { name: 'Elena Rostova', email: 'elena@stripe.com' }
    ],
    cc_participants: [
      { name: 'legal@stripe.com', email: 'legal@stripe.com' }
    ],
    body_html: `
      <p>Hi Elena,</p>
      <p>Thank you for the prompt draft. We reviewed Section 4.2 with our infrastructure team and confirmed our eu-central-1 Frankfurt cluster conforms to all stated requirements.</p>
      <p>However, we have slightly amended Section 9.1 to reflect standard 12-month fees paid liability rather than aggregate uncapped liability. Would Tuesday work to finalize and sign?</p>
      <p>Warm regards,<br>Alex</p>
    `,
    body_text: 'Hi Elena, Thank you for the prompt draft. We confirmed our eu-central-1 Frankfurt cluster conforms to all requirements. We slightly amended Section 9.1. Would Tuesday work to finalize and sign? Warm regards, Alex',
    attachments: [],
    list_unsubscribe_url: null,
    trackers_blocked_count: 0,
    send_status: 'sent',
    scheduled_for: null,
    created_at: '2026-11-12T11:30:00Z',
    team_notes: []
  },
  {
    id: 'msg_1_3',
    thread_id: 'th_1',
    message_id_header: '<msa-redlines-v3@stripe.com>',
    from_participant: {
      name: 'Elena Rostova',
      email: 'elena@stripe.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      is_vip: true,
    },
    to_participants: [
      { name: 'Alex Rivera', email: 'alex@acme.dev' }
    ],
    cc_participants: [
      { name: 'legal@stripe.com', email: 'legal@stripe.com' }
    ],
    body_html: `
      <p>Hi Alex,</p>
      <p>Attached is the redlined Q4 Master Services Agreement with our general counsel comments regarding data sovereignty. We accepted your proposal on Section 9.1 liability cap at 12-month aggregate contract value.</p>
      <p>If the highlighted redlines in Section 12 look good to you, we can generate the DocuSign envelope immediately.</p>
      <div style="margin: 16px 0; padding: 12px; background: rgba(37,99,235,0.08); border-left: 3px solid #2563EB; border-radius: 4px; font-size: 13.5px;">
        <strong>Key Action Item:</strong> Review Clause 12.3 (Audit Rights) and confirm if your annual SOC 2 Type II attestation is ready for dispatch.
      </div>
      <p>Best regards,<br><strong>Elena Rostova</strong><br>Stripe Legal & Partnerships</p>
    `,
    body_text: 'Hi Alex, Attached is the redlined Q4 Master Services Agreement with our general counsel comments. We accepted your proposal on Section 9.1. If Section 12 looks good, we can generate DocuSign.',
    attachments: [
      {
        id: 'att_2',
        name: 'Stripe_Enterprise_MSA_v3.pdf',
        size: '1.4 MB',
        type: 'pdf',
        pages: 22,
        preview_url: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'att_3',
        name: 'Data_Processing_Addendum_Exhibit_B.docx',
        size: '380 KB',
        type: 'doc',
        pages: 6,
      }
    ],
    list_unsubscribe_url: null,
    trackers_blocked_count: 3,
    send_status: 'received',
    scheduled_for: null,
    created_at: '2026-11-13T08:52:00Z',
    team_notes: [
      {
        id: 'note_3',
        author: 'Alex Rivera',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        content: '@marcus Please grab our 2026 SOC 2 Type II report so we can attach it when replying to Elena.',
        created_at: '2026-11-13T09:05:00Z',
      }
    ]
  },
  // th_2 messages (Incident P1)
  {
    id: 'msg_2_1',
    thread_id: 'th_2',
    message_id_header: '<incident-p1-alert@acme.dev>',
    from_participant: {
      name: 'Marcus Chen',
      email: 'marcus@acme.dev',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    to_participants: [
      { name: 'eng-leads@acme.dev', email: 'eng-leads@acme.dev' },
      { name: 'Alex Rivera', email: 'alex@acme.dev' }
    ],
    cc_participants: [],
    body_html: `
      <p style="color:#EF4444;font-weight:600;">🚨 INCIDENT ALERT [SEV-1] — Edge Redis Latency Degradation</p>
      <p>Team, Datadog triggered alert <code>RedisConnectionPoolExhausted</code> at 08:15 UTC. We are seeing request queuing on all BullMQ background jobs.</p>
      <pre style="background:#161922;color:#38BDF8;padding:12px;border-radius:8px;font-family:monospace;font-size:12px;">
[ERROR] 2026-11-13T08:16:02.112Z [BullMQ:Worker] 
TimeoutError: Resource acquisition timed out after 5000ms
  at RedisCluster.acquireConnection (/app/node_modules/ioredis/cluster.js:412)
  at DispatchPipeline.drain (/app/src/queues/mailSync.js:88)
      </pre>
      <p>I am failing over to the read-replica cluster now. Will update thread every 15 minutes.</p>
    `,
    body_text: '🚨 INCIDENT ALERT [SEV-1] — Edge Redis Latency Degradation. Datadog triggered alert RedisConnectionPoolExhausted. Failing over to read-replica now.',
    attachments: [],
    list_unsubscribe_url: null,
    trackers_blocked_count: 0,
    send_status: 'received',
    created_at: '2026-11-13T08:18:00Z',
    team_notes: []
  },
  {
    id: 'msg_2_2',
    thread_id: 'th_2',
    message_id_header: '<incident-p1-update-1@acme.dev>',
    from_participant: {
      name: 'Marcus Chen',
      email: 'marcus@acme.dev',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    to_participants: [
      { name: 'eng-leads@acme.dev', email: 'eng-leads@acme.dev' },
      { name: 'Alex Rivera', email: 'alex@acme.dev' }
    ],
    cc_participants: [],
    body_html: `
      <p>Update 1 (08:30 UTC): Failover completed successfully. Connection pool exhaustion resolved; P99 latency has normalized back to 2.1ms across all edge zones.</p>
      <p>We are initiating an investigation into the rogue cron job that spawned 10,000 unthrottled worker connections.</p>
    `,
    body_text: 'Update 1 (08:30 UTC): Failover completed successfully. P99 latency back to 2.1ms. Investigating rogue cron job.',
    attachments: [],
    list_unsubscribe_url: null,
    trackers_blocked_count: 0,
    send_status: 'received',
    created_at: '2026-11-13T08:30:00Z',
    team_notes: []
  },
  // th_7 Newsletter
  {
    id: 'msg_7_1',
    thread_id: 'th_7',
    message_id_header: '<pragmatic-engineer-184@substack.com>',
    from_participant: {
      name: 'Gergely Orosz',
      email: 'gergely@pragmaticengineer.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    to_participants: [
      { name: 'Alex Rivera', email: 'alex@acme.dev' }
    ],
    cc_participants: [],
    body_html: `
      <div style="font-family: Georgia, serif; line-height: 1.7; font-size: 16px;">
        <h2 style="font-family: -apple-system, sans-serif; font-size: 24px; font-weight: 700; margin-bottom: 12px;">Issue #184: How Big Tech runs incident post-mortems</h2>
        <p>A few months ago, a major cloud outage knocked several million developers offline. The public post-mortem took 72 hours to publish. Why does high-severity incident reporting take so long, and how do top engineering organizations turn outages into learning mechanisms?</p>
        <p>In this issue, we examine:</p>
        <ul>
          <li><strong>The myth of root causes:</strong> Complex distributed systems fail due to cascading state interactions, not single operator typos.</li>
          <li><strong>Blameless retrospective structures:</strong> How Stripe and Google remove individual culpability to extract genuine telemetry insights.</li>
          <li><strong>Action item decay:</strong> Why 40% of post-mortem remediation tasks are forgotten within 60 days, and how automated linter rules prevent recurrence.</li>
        </ul>
        <p>Read on for detailed case studies and interview quotes with Staff SREs.</p>
      </div>
    `,
    body_text: 'Issue #184: How Big Tech runs incident post-mortems. Inside blameless RCA culture, root cause myths, and preventing remediation decay.',
    attachments: [],
    list_unsubscribe_url: 'https://newsletter.pragmaticengineer.com/unsubscribe?token=sample_token',
    trackers_blocked_count: 4,
    send_status: 'received',
    created_at: '2026-11-13T04:10:00Z',
    team_notes: []
  }
];

export const INITIAL_SNIPPETS = [
  {
    id: 'snp_intro',
    shortcut: '/intro',
    title: 'Intro & Capabilities Overview',
    content: 'Hi {{first_name}},\n\nGreat to connect! AeroMail is an intentional, keyboard-first communication command center built for sub-50ms triage speed with local-first IndexedDB persistence and smart sender screening.\n\nWould love to walk you through a brief live demo whenever convenient.\n\nBest,\nAlex',
  },
  {
    id: 'snp_pricing',
    shortcut: '/pricing',
    title: 'Enterprise Tier & SLA Pricing',
    content: 'Hi {{first_name}},\n\nOur Enterprise tier starts at $32/seat/month and includes:\n- Unlimited sub-16ms local indexing\n- First-Time Sender Screener with custom routing\n- Team side-chat & private collaboration notes\n- Dedicated JMAP/IMAP sync nodes with 99.99% SLA\n\nLet me know if you would like me to prepare an MSA draft for review.',
  },
  {
    id: 'snp_calendly',
    shortcut: '/calendly',
    title: 'Calendar Booking Link',
    content: 'Feel free to pick any slot that fits your schedule directly on my calendar here: https://cal.com/alex-rivera/30min\n\nLooking forward to speaking!',
  },
  {
    id: 'snp_nda',
    shortcut: '/nda',
    title: 'Mutual NDA Boilerplate',
    content: 'Hi {{first_name}},\n\nBefore we dive into technical architectural details, could you please sign our standard Mutual NDA at the link below?\n\nhttps://acme.dev/legal/mnda-sign\n\nThanks!',
  },
  {
    id: 'snp_followup',
    shortcut: '/followup',
    title: 'Gentle 3-Day Follow-Up',
    content: 'Hi {{first_name}},\n\nJust bumping this to the top of your inbox in case it got buried under incoming mail. Please let me know if you have any questions or if you\'d like to proceed!\n\nBest,\nAlex',
  }
];

export const INITIAL_RULES = [
  {
    id: 'rul_1',
    name: 'Auto-Bundle SaaS Receipts & Invoices',
    conditions: [
      { field: 'sender_domain', operator: 'in', value: 'stripe.com, amazon.com, vercel.com, github.com' },
      { field: 'subject', operator: 'contains', value: 'Invoice, Receipt, Billing' }
    ],
    actions: {
      apply_labels: ['finance'],
      bundle_in_inbox: true,
      skip_inbox: false,
      mark_read: false,
      route_split: 'paper_trail'
    },
    matches_count: 84
  },
  {
    id: 'rul_2',
    name: 'Auto-Route Newsletters to The Feed',
    conditions: [
      { field: 'list_unsubscribe', operator: 'exists', value: 'true' }
    ],
    actions: {
      apply_labels: [],
      bundle_in_inbox: false,
      skip_inbox: false,
      mark_read: false,
      route_split: 'feed'
    },
    matches_count: 32
  },
  {
    id: 'rul_3',
    name: 'VIP Client Tagging for Benchmark & Stripe',
    conditions: [
      { field: 'sender_domain', operator: 'in', value: 'benchmark.com, stripe.com' }
    ],
    actions: {
      apply_labels: ['clients'],
      bundle_in_inbox: false,
      skip_inbox: false,
      mark_read: false,
      route_split: 'focused'
    },
    matches_count: 19
  }
];

