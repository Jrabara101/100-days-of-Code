/**
 * Hollis Goods: Institutional Seed Data
 * Matches exact Stitch designs, telemetry stats, and review taxonomy.
 */

export const INITIAL_PRODUCTS = [
  {
    id: "prod_kettle_mbk",
    title: "Pour-Over Kettle · Matte Black",
    category: "kitchenware",
    price: 165.0,
    sku: "FLW-STAGG-MBK",
    inStock: true,
    shipEstimate: "Ships Within 24h",
    image: "/assets/kettle-countertop.png",
    rating: 4.73,
    bayesianScore: 4.73,
    totalReviews: 1248,
    verifiedReviews: 1106,
    recommendPercent: 94,
    ratingDistribution: {
      5: 1023, // 82%
      4: 150,  // 12%
      3: 50,   // 4%
      2: 13,   // 1%
      1: 12    // 1%
    },
    dimensionalScores: [
      { id: "pour_control", label: "Pour control", score: 4.9, max: 5.0, percent: 98, highlight: "Precision gooseneck spout" },
      { id: "heat_retention", label: "Heat retention", score: 4.6, max: 5.0, percent: 92, highlight: "PID temp hold 60 min" },
      { id: "build_quality", label: "Build quality", score: 4.8, max: 5.0, percent: 96, highlight: "304 stainless steel" },
      { id: "flow_dynamic", label: "Flow Dynamic", status: "Calibrated Optimal", score: 5.0, percent: 100 }
    ],
    sentimentHighlights: [
      { text: "All reviews", count: 1248 },
      { text: "Pour control", count: 312 },
      { text: "Gooseneck", count: 148 },
      { text: "Fast shipping", count: 64 },
      { text: "Lid fit", count: 21 },
      { text: "Temperature hold", count: 18 }
    ],
    variants: [
      { id: "var_kettle_1l", name: "Matte Black · 1 L", inStock: true },
      { id: "var_kettle_wht", name: "Matte White · 1 L", inStock: true },
      { id: "var_kettle_stn", name: "Warm Stone · 0.9 L", inStock: false }
    ],
    isBrigadeLocked: false
  },
  {
    id: "prod_wool_coat",
    title: "Wool Coat · Charcoal",
    category: "apparel",
    price: 285.0,
    sku: "SKU-89211",
    inStock: true,
    shipEstimate: "Ships Within 48h",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
    rating: 3.82,
    bayesianScore: 3.91,
    totalReviews: 240,
    verifiedReviews: 215,
    recommendPercent: 78,
    ratingDistribution: { 5: 130, 4: 55, 3: 25, 2: 18, 1: 12 },
    dimensionalScores: [
      { id: "sizing", label: "Sizing", status: "Runs Slightly Small", score: 3.4, max: 5.0, percent: 68 },
      { id: "wool_weight", label: "Fabric Weight", score: 4.9, max: 5.0, percent: 98, highlight: "520 GSM Melton wool" },
      { id: "durability", label: "Seam Durability", score: 3.1, max: 5.0, percent: 62, highlight: "Batch #LOT-441B under QA" }
    ],
    sentimentHighlights: [
      { text: "All reviews", count: 240 },
      { text: "Wool weight", count: 82 },
      { text: "Seam torn", count: 4, isAlert: true },
      { text: "Charcoal color", count: 45 },
      { text: "Runs small", count: 38 }
    ],
    variants: [
      { id: "var_coat_m", name: "Charcoal / M", inStock: true },
      { id: "var_coat_l", name: "Charcoal / L", inStock: true },
      { id: "var_coat_xl", name: "Charcoal / XL", inStock: false }
    ],
    defectAlert: {
      active: true,
      title: "Defect Radar: 4 similar reports · Charcoal L · 72h",
      batch: "#LOT-441B",
      keyword: "seam torn",
      detectedCount: 4,
      trend: [2, 4, 10, 18]
    },
    isBrigadeLocked: false
  },
  {
    id: "prod_ceramic_mug",
    title: "Ceramic Pourer Mug",
    category: "kitchenware",
    price: 38.0,
    sku: "SKU-99214",
    inStock: true,
    shipEstimate: "Ships Within 24h",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    rating: 2.15,
    bayesianScore: 3.1,
    totalReviews: 84,
    verifiedReviews: 24,
    recommendPercent: 32,
    ratingDistribution: { 5: 12, 4: 8, 3: 10, 2: 16, 1: 38 },
    dimensionalScores: [
      { id: "ergonomics", label: "Handle Ergonomics", score: 4.2, max: 5.0, percent: 84 },
      { id: "durability", label: "Thermal Shock", score: 4.5, max: 5.0, percent: 90 }
    ],
    sentimentHighlights: [
      { text: "All reviews", count: 84 },
      { text: "Bot attack", count: 38, isAlert: true },
      { text: "Glaze finish", count: 18 }
    ],
    variants: [
      { id: "var_mug_natural", name: "Raw Stoneware / 12oz", inStock: true }
    ],
    isBrigadeLocked: true, // Triggered by brigade circuit breaker!
    brigadeIncident: {
      detectedAt: "2026-10-22T14:20:00Z",
      spikeCount: 38,
      subnetCluster: "198.51.100.0/24",
      deviceHash: "dev_9f4a1",
      phashDuplicate: "#a8f2",
      lockdownActive: true
    }
  }
];

export const INITIAL_REVIEWS = [
  {
    id: "REV-094182",
    productId: "prod_kettle_mbk",
    productTitle: "Pour-Over Kettle · Matte Black",
    productSku: "FLW-STAGG-MBK",
    variantTitle: "Matte Black · 1 L",
    orderId: "HG-8492",
    reviewerName: "Dana K.",
    reviewerLocation: "Austin, TX",
    reviewerAttributes: {
      accountAge: "2 yrs",
      orderCount: 4,
      experienceLevel: "Daily Chemex Brewer",
      favoriteRoast: "Light Roast Ethiopian"
    },
    rating: 5,
    title: "Pours like a dream",
    bodyOriginal: "I love this kettle! It arrived at 1428 Elm Street, Austin super fast. If anyone has questions text me at 512-555-0194 — honestly it cured my insomnia! The thermal balance and spout design are undeniably superior for Chemex morning routines.",
    bodySanitized: "I love this kettle! It arrived at [Address redacted] super fast. If anyone has questions text me at [•••-•••-0194] — honestly [Health claim removed]! The thermal balance and spout design are undeniably superior for Chemex morning routines.",
    isRedacted: false, // In queue awaiting moderator commitment or already sanitized
    provenanceType: "verified_purchase", // 'verified_purchase' | 'incentivized_gifted' | 'repeat_buyer' | 'unverified'
    tokenNumber: "TX-8820-F",
    purchasedDate: "2026-10-14",
    createdAt: "2026-10-22T09:14:00Z",
    moderationStatus: "pending", // 'pending' | 'needs_redaction' | 'approved' | 'rejected'
    priorityQueue: "needs-redaction",
    slaRemainingMinutes: 12,
    riskScore: 8,
    riskLevel: "LOW",
    riskFlags: ["contains_phone_pii", "contains_address_pii", "unauthorized_health_claim"],
    media: [
      {
        id: "media_dk_1",
        type: "image",
        originalPath: "/assets/photo-blur-screen.png",
        sanitizedUrl: "/assets/kettle-countertop.png",
        filename: "IMG_7492_raw.jpeg",
        dimensions: "3024 × 4032",
        fileSize: "2.4 MB",
        exifStripped: true,
        perceptualHash: "phash_a8f2",
        hasBBoxExposure: true,
        bbox: { y: "78%", x: "22%", w: "56%", h: "14%", label: "Address on label" },
        isBlurred: false,
        blurRadius: 14
      }
    ],
    helpfulVotes: 42,
    unhelpfulVotes: 1,
    auditLog: [
      { action: "SUBMITTED", timestamp: "2026-10-22T09:14:00Z", actor: "CUSTOMER" },
      { action: "LINTER_FLAGGED", flags: ["PII_PHONE", "PII_ADDRESS", "HEALTH_CLAIM"], riskScore: 8, timestamp: "2026-10-22T09:14:02Z", actor: "TRUST_ENGINE" }
    ],
    followUpUpdate: null
  },
  {
    id: "REV-094181",
    productId: "prod_kettle_mbk",
    productTitle: "Pour-Over Kettle · Matte Black",
    productSku: "FLW-STAGG-MBK",
    variantTitle: "Matte Black · 1 L",
    orderId: "HG-7819",
    reviewerName: "Elena R.",
    reviewerLocation: "Seattle, WA",
    reviewerAttributes: {
      accountAge: "1 yr",
      orderCount: 2,
      grindSetup: "Ode Gen 2"
    },
    rating: 5,
    title: "Unmatched ergonomics and temperature hold",
    bodyOriginal: "Heats rapidly to exact 202°F target for light-roast Ethiopian origins. The counterbalanced handle feels weightless during extended circular pours. Arrived cleanly packed with no plastic surplus in the carton.",
    bodySanitized: "Heats rapidly to exact 202°F target for light-roast Ethiopian origins. The counterbalanced handle feels weightless during extended circular pours. Arrived cleanly packed with no plastic surplus in the carton.",
    isRedacted: false,
    provenanceType: "verified_purchase",
    tokenNumber: "WA-1904-A",
    purchasedDate: "2026-09-28",
    createdAt: "2026-10-03T11:20:00Z",
    moderationStatus: "approved",
    priorityQueue: "published",
    slaRemainingMinutes: 0,
    riskScore: 2,
    riskLevel: "LOW",
    riskFlags: [],
    media: [],
    helpfulVotes: 18,
    unhelpfulVotes: 0,
    auditLog: [
      { action: "AUTO_APPROVED", timestamp: "2026-10-03T11:20:01Z", actor: "AUTO_RULE_VERIFIED_PURCHASE" }
    ],
    followUpUpdate: {
      timestamp: "2026-10-29T10:00:00Z",
      label: "⏱ 6-Month Ownership Update",
      text: "Update after 6 months of daily pour-overs: zero mineral buildup inside the 304 stainless chamber, PID thermostat still hits 202°F within 3 minutes. Truly built to last."
    }
  },
  {
    id: "REV-094178",
    productId: "prod_wool_coat",
    productTitle: "Wool Coat · Charcoal / L",
    productSku: "SKU-89211",
    variantTitle: "Charcoal / L",
    orderId: "HG-7731",
    reviewerName: "Marcus T.",
    reviewerLocation: "Chicago, IL",
    reviewerAttributes: {
      height: "6'1\"",
      usualSize: "Large",
      fitPreference: "Tailored"
    },
    rating: 2,
    title: "Beautiful coat, seam tore in a week",
    bodyOriginal: "I was really excited about this coat and loved the wool weight and fit out of the box. Unfortunately, after just five days of gentle office wear, the inner underarm seam completely tore open. Really disappointing for a $285 investment piece.",
    bodySanitized: "I was really excited about this coat and loved the wool weight and fit out of the box. Unfortunately, after just five days of gentle office wear, the inner underarm seam completely tore open. Really disappointing for a $285 investment piece.",
    isRedacted: false,
    provenanceType: "verified_purchase",
    tokenNumber: "IL-4412-B",
    purchasedDate: "2026-10-12",
    createdAt: "2026-10-22T08:55:00Z",
    moderationStatus: "pending",
    priorityQueue: "low-star-escalations",
    slaRemainingMinutes: 31,
    riskScore: 18,
    riskLevel: "LOW",
    riskFlags: ["qa_defect_spike_seam_torn"],
    media: [],
    helpfulVotes: 8,
    unhelpfulVotes: 0,
    brandResponse: {
      responderName: "Ana Ruiz",
      responderTitle: "Head of Product Quality",
      body: "We're sorry, Marcus — that seam should never give. We've sent a replacement and flagged this batch for inspection.",
      createdAt: "2026-10-22T09:30:00Z",
      isPublic: true,
      makeGood: {
        type: "replacement_sent",
        label: "Replacement sent · Charcoal L",
        trackingNumber: "#TRK-882193-FEDEX",
        reorderCost: "$0.00"
      }
    },
    auditLog: [
      { action: "ESCALATED_TO_QA", note: "Linked to Defect Radar LOT-441B", actor: "LEAD_OPERATOR", timestamp: "2026-10-22T09:00:00Z" }
    ],
    followUpUpdate: null
  },
  {
    id: "REV-98240",
    productId: "prod_ceramic_mug",
    productTitle: "Ceramic Pourer Mug",
    productSku: "SKU-99214",
    variantTitle: "Raw Stoneware / 12oz",
    orderId: null,
    reviewerName: "user_83f2",
    reviewerLocation: "Unknown Subnet",
    reviewerAttributes: {
      accountAge: "0 days",
      orderCount: 0
    },
    rating: 1,
    title: "Terrible quality do not buy",
    bodyOriginal: "Cracked completely within 1 hour. Total scam product and customer service refused refund. Avoid at all costs!",
    bodySanitized: "Cracked completely within 1 hour. Total scam product and customer service refused refund. Avoid at all costs!",
    isRedacted: false,
    provenanceType: "unverified",
    purchasedDate: null,
    createdAt: "2026-10-22T14:18:00Z",
    moderationStatus: "pending",
    priorityQueue: "fraud-hold",
    slaRemainingMinutes: 5,
    riskScore: 85,
    riskLevel: "CRITICAL",
    riskFlags: ["bot_cluster_anomaly", "duplicate_phash_match", "new_account_zero_orders"],
    telemetry: {
      subnet: "198.51.100.0/24",
      deviceHash: "dev_9f4a1",
      phashMatch: "#a8f2",
      clusterSize: 38
    },
    media: [],
    helpfulVotes: 0,
    unhelpfulVotes: 14,
    auditLog: [
      { action: "CIRCUIT_BREAKER_HELD", note: "Held under Verified-Purchase Lockdown", actor: "CIRCUIT_BREAKER", timestamp: "2026-10-22T14:20:00Z" }
    ]
  },
  {
    id: "REV-094175",
    productId: "prod_kettle_mbk",
    productTitle: "Pour-Over Kettle · Matte Black",
    productSku: "FLW-STAGG-MBK",
    variantTitle: "Matte Black · 1 L",
    orderId: "GIFT-0091",
    reviewerName: "Priya S.",
    reviewerLocation: "San Francisco, CA",
    reviewerAttributes: {
      accountAge: "8 mos",
      orderCount: 1,
      influencerProgram: "Hollis Creator Guild"
    },
    rating: 4,
    title: "Sleek look, slightly stiff lid when hot",
    bodyOriginal: "Received this as a complimentary gift from Hollis Goods in exchange for honest feedback. The matte finish is stunning and the balance is pristine. Only minor critique: the lid gets slightly tight to pull off when steam builds up.",
    bodySanitized: "Received this as a complimentary gift from Hollis Goods in exchange for honest feedback. The matte finish is stunning and the balance is pristine. Only minor critique: the lid gets slightly tight to pull off when steam builds up.",
    isRedacted: false,
    provenanceType: "incentivized_gifted",
    tokenNumber: "FTC-GIFT-449",
    purchasedDate: "2026-10-18",
    createdAt: "2026-10-22T08:48:00Z",
    moderationStatus: "approved",
    priorityQueue: "published",
    slaRemainingMinutes: 39,
    riskScore: 10,
    riskLevel: "LOW",
    riskFlags: ["ftc_gifted_disclosed"],
    media: [],
    helpfulVotes: 12,
    unhelpfulVotes: 1
  },
  {
    id: "REV-094170",
    productId: "prod_kettle_mbk",
    productTitle: "Pour-Over Kettle · Matte Black",
    productSku: "FLW-STAGG-MBK",
    variantTitle: "Matte Black · 1 L",
    orderId: "HG-8104",
    reviewerName: "Owen L.",
    reviewerLocation: "Denver, CO",
    reviewerAttributes: {
      accountAge: "3 yrs",
      orderCount: 6
    },
    rating: 3,
    title: "Good but you can find similar for less",
    bodyOriginal: "Works as advertised, but check out https://amazon.com/cheaper-kettle-alternative for half the price with similar features.",
    bodySanitized: "Works as advertised, but check out [Link redacted] for half the price with similar features.",
    isRedacted: false,
    provenanceType: "verified_purchase",
    tokenNumber: "CO-7719-Z",
    purchasedDate: "2026-10-09",
    createdAt: "2026-10-22T08:41:00Z",
    moderationStatus: "pending",
    priorityQueue: "needs-redaction",
    slaRemainingMinutes: 44,
    riskScore: 30,
    riskLevel: "MEDIUM",
    riskFlags: ["competitor_link"],
    media: [],
    helpfulVotes: 3,
    unhelpfulVotes: 5
  },
  {
    id: "REV-094166",
    productId: "prod_kettle_mbk",
    productTitle: "Pour-Over Kettle · Matte Black",
    productSku: "FLW-STAGG-MBK",
    variantTitle: "Matte Black · 1 L",
    orderId: "HG-8321",
    reviewerName: "Mei W.",
    reviewerLocation: "Brooklyn, NY",
    reviewerAttributes: {
      accountAge: "1 yr",
      orderCount: 3
    },
    rating: 5,
    title: "Every morning feels like a luxury coffee lab",
    bodyOriginal: "Unboxing experience was top notch. Zero plastic wrap, just recycled corrugated cardboard. Flow restriction allows textbook spiral blooms on V60.",
    bodySanitized: "Unboxing experience was top notch. Zero plastic wrap, just recycled corrugated cardboard. Flow restriction allows textbook spiral blooms on V60.",
    isRedacted: false,
    provenanceType: "verified_purchase",
    tokenNumber: "NY-5521-K",
    purchasedDate: "2026-10-10",
    createdAt: "2026-10-22T08:35:00Z",
    moderationStatus: "approved",
    priorityQueue: "published",
    slaRemainingMinutes: 52,
    riskScore: 2,
    riskLevel: "LOW",
    riskFlags: [],
    media: [
      {
        id: "media_mw_1",
        type: "image",
        sanitizedUrl: "/assets/kettle-countertop.png",
        filename: "v60_morning_bloom.webp",
        dimensions: "1920 × 1440",
        fileSize: "380 KB",
        exifStripped: true,
        perceptualHash: "phash_71e4",
        isBlurred: false
      }
    ],
    helpfulVotes: 29,
    unhelpfulVotes: 0
  },
  {
    id: "REV-094160",
    productId: "prod_wool_coat",
    productTitle: "Wool Coat · Charcoal",
    productSku: "SKU-89211",
    variantTitle: "Charcoal / M",
    orderId: "HG-6401",
    reviewerName: "Sam P.",
    reviewerLocation: "Boston, MA",
    reviewerAttributes: {
      accountAge: "4 yrs",
      orderCount: 4,
      loyaltyTier: "Hollis Club Platinum"
    },
    rating: 4,
    title: "Thick, warm, but size up if layering chunky knits",
    bodyOriginal: "The 520 GSM wool cuts straight through Atlantic ocean gusts. Fits slim through chest so if you wear bulky fishermen sweaters underneath, order 1 size up.",
    bodySanitized: "The 520 GSM wool cuts straight through Atlantic ocean gusts. Fits slim through chest so if you wear bulky fishermen sweaters underneath, order 1 size up.",
    isRedacted: false,
    provenanceType: "repeat_buyer",
    tokenNumber: "MA-9011-L",
    purchasedDate: "2026-09-15",
    createdAt: "2026-10-22T08:29:00Z",
    moderationStatus: "approved",
    priorityQueue: "published",
    slaRemainingMinutes: 60,
    riskScore: 3,
    riskLevel: "LOW",
    riskFlags: [],
    media: [],
    helpfulVotes: 24,
    unhelpfulVotes: 0
  }
];

export const INITIAL_ANOMALY_SIGNALS = [
  {
    id: "sig_velocity",
    title: "Submission Velocity Anomaly",
    severity: "CRITICAL",
    metric: "+850% in 45m",
    detail: "38 unverified reviews submitted targeting SKU-99214 within 45 minutes",
    status: "CONFIRMED"
  },
  {
    id: "sig_subnet",
    title: "IP Subnet Clustering",
    severity: "CRITICAL",
    metric: "92% from 198.51.100.0/24",
    detail: "35 submissions routed through single proxy ASN provider",
    status: "CONFIRMED"
  },
  {
    id: "sig_phash",
    title: "Duplicate Image pHash (#a8f2)",
    severity: "HIGH",
    metric: "3 accounts sharing identical photo",
    detail: "Stolen stock image detected across multiple freshly created user profiles",
    status: "FLAGGED"
  },
  {
    id: "sig_device",
    title: "Device Canvas Fingerprint Overlap",
    severity: "HIGH",
    metric: "dev_9f4a1 repeated 18 times",
    detail: "Same hardware GPU canvas hash submitting with distinct burner emails",
    status: "FLAGGED"
  }
];

