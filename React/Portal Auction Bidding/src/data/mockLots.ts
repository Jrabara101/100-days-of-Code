import { LotItem, BidRecord, TimelineEntry, HammerSettlement } from '../types/auction';

// Helper to create timestamp relative to current session
const now = Date.now();

export const INITIAL_LOTS: LotItem[] = [
  {
    id: 'lot-041',
    lotNumber: 'LOT #041',
    title: '1972 Porsche 911T 2.4L Coupe',
    subtitle: 'Matching Numbers • Gemini Blue (335) • 5-Speed 915 • Porsche Certificate of Authenticity',
    slug: '1972-porsche-911t-coupe',
    category: 'Automotive',
    conditionGrade: '9.4/10 Conservator Grade',
    provenanceSummary: 'Delivered new to Porsche Sonauto Paris in May 1972. Preserved across two private French collections before comprehensive cosmetic refresh in Stuttgart in 2018. Full documented Kardex and Certificate of Authenticity matching engine #6129041 and transaxle #7124802.',
    location: 'Stuttgart, Germany (Worldwide Escrow Transit)',
    sellerId: 'seller-stuttgart-classics',
    sellerName: 'Klausen Heritage GmbH',
    sellerIsVerified: true,
    startingBidCents: 1500000, // $15,000
    reservePriceCents: 2600000, // $26,000 (confidential in production, simulated here)
    reserveStatus: 'reserve_near', // Current bid $24,500 is 94.2% of reserve (within 10%)
    currentBidCents: 2450000, // $24,500
    nextMinBidCents: 2475000, // $24,750 (+$250 increment)
    leadingBidderId: 'bidder-rival-8812',
    leadingPaddleNumber: '#8812',
    bidsCount: 28,
    watchersCount: 184,
    extensionCount: 2,
    status: 'live',
    // Scheduled to have 1m 48s remaining to perfectly showcase Popcorn Overtime!
    startsAt: new Date(now - 86400000 * 3).toISOString(),
    endsAt: new Date(now + 108 * 1000).toISOString(), // 108s = 01m 48s
    specifications: {
      'VIN': '9112102844',
      'Engine Number': '6129041 (Type 911/57 2.4L MFI)',
      'Transmission': '5-Speed 915 Manual (#7124802)',
      'Exterior Color': 'Gemini Blue Metallic (Paint Code 335)',
      'Interior': 'Black Leatherette with Pepita Houndstooth Inlays',
      'Mileage': '48,290 km (Indicated & Verified)',
      'Wheels': 'Original 15x6J Forged Fuchs (Date-stamped 03/72)',
      'Brakes': 'Ventilated Disc Brakes Front & Rear',
      'Title': 'Clean German Kraftfahrzeugbrief & EU Registration',
      'Authentication': 'Porsche Classic Technical Certificate #PC-2024-91104',
    },
    mediaGallery: [
      {
        id: 'porsche-hero',
        url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1600&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=300&q=80',
        category: 'exterior',
        caption: 'Three-quarter exterior profile in period Gemini Blue Metallic (335).',
        hasConditionPins: true,
      },
      {
        id: 'porsche-front',
        url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80',
        category: 'exterior',
        caption: 'Front fascia detailing early chrome horn grilles and European H4 headlights.',
        hasConditionPins: false,
      },
      {
        id: 'porsche-interior',
        url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1600&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=300&q=80',
        category: 'interior',
        caption: 'Five-gauge VDO instrument cluster and restored 380mm four-spoke steering wheel.',
        hasConditionPins: true,
      },
      {
        id: 'porsche-engine',
        url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1600&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=300&q=80',
        category: 'movement',
        caption: 'Matching 2.4L Mechanical Fuel Injection (MFI) flat-six and engine shroud.',
        hasConditionPins: true,
      },
      {
        id: 'porsche-docs',
        url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1600&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=300&q=80',
        category: 'provenance',
        caption: 'Porsche Certificate of Authenticity and original service logbook stamping.',
        hasConditionPins: false,
      },
    ],
    conditionPins: [
      {
        id: 'pin-1',
        xPercent: 32,
        yPercent: 68,
        label: 'Pin #1: Minor Paint Micro-Chip',
        category: 'blemish',
        description: 'Microscopic 1.5mm stone chip on the lower front valance clearcoat. Treated with matching factory 335 touch-up pencil; zero metal exposure.',
        inspectorNote: 'TUV Rheinland Inspector verified thickness: 135 microns on valance. Fully stable.',
      },
      {
        id: 'pin-2',
        xPercent: 78,
        yPercent: 44,
        label: 'Pin #2: Stamped Fuchs Date Code',
        category: 'serial',
        description: 'Original date stamp "3 72" clearly legible on inner rim barrel of the right rear 15x6J Fuchs alloy.',
        inspectorNote: 'Matches build sheet factory option M400.',
      },
      {
        id: 'pin-3',
        xPercent: 54,
        yPercent: 28,
        label: 'Pin #3: Period Correct Windshield',
        category: 'mint_detail',
        description: 'Sigla original heated rear window and tinted front glass with original Sonauto dealer running-in sticker.',
        inspectorNote: 'Extremely rare factory glass preservation with no delamination.',
      },
      {
        id: 'pin-4',
        xPercent: 62,
        yPercent: 82,
        label: 'Pin #4: Heat Exchanger Replacement',
        category: 'restoration',
        description: 'Both left and right Dansk stainless steel heat exchangers fitted in 2018; original factory exchangers preserved in crate included with sale.',
        inspectorNote: 'No exhaust leaks detected under cold smoke test.',
      },
    ],
  },

  {
    id: 'lot-072',
    lotNumber: 'LOT #072',
    title: 'Patek Philippe Ref. 3940G Perpetual Calendar',
    subtitle: '18k White Gold • First Series Opaline Dial • Micro-Rotor Cal. 240 Q • Archive Extract',
    slug: 'patek-philippe-3940g-perpetual-calendar',
    category: 'Haute Horlogerie',
    conditionGrade: '9.6/10 Exceptional Case Definition',
    provenanceSummary: 'Purchased through Chronometrie Beyer Zurich in November 1989. Single-family ownership until consigned. Serviced exclusively at Patek Philippe Salons Geneva in 2017 with receipt and archive extract confirming manufacture year and original white gold deployant clasp.',
    location: 'Geneva, Switzerland (Direct Vault Courier)',
    sellerId: 'seller-geneva-horology',
    sellerName: 'Helvetia Horology Trust',
    sellerIsVerified: true,
    startingBidCents: 3500000, // $35,000
    reservePriceCents: 4500000, // $45,000
    reserveStatus: 'reserve_met', // $48,000 >= $45,000
    currentBidCents: 4800000, // $48,000
    nextMinBidCents: 4900000, // $49,000 (+$1,000 increment)
    leadingBidderId: 'bidder-paddle-4092',
    leadingPaddleNumber: '#4092',
    bidsCount: 42,
    watchersCount: 236,
    extensionCount: 0,
    status: 'live',
    startsAt: new Date(now - 86400000 * 2).toISOString(),
    endsAt: new Date(now + 3800 * 1000).toISOString(), // ~1 hr 3m left
    specifications: {
      'Reference': '3940G-001',
      'Movement': 'Ultra-thin Caliber 240 Q with 22k Gold Off-Center Micro-Rotor',
      'Complications': 'Perpetual Calendar, Moon Phases, Leap Year & 24h Indicators',
      'Case Material': '18k White Gold (36mm diameter x 8.8mm thickness)',
      'Dial': 'First Series Silver Opaline with Sunken Subdials',
      'Case Hallmarks': 'Crisp Helvetia Head & Key 18k stamps on outer 11 o\'clock lug',
      'Clasp': 'Original 18k White Gold Calatrava Cross Deployant Buckle',
      'Box & Papers': 'Patek Archive Extract (2023) + Beyer presentation cedar box',
    },
    mediaGallery: [
      {
        id: 'patek-hero',
        url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=80',
        category: 'movement',
        caption: 'Dial macro showing sunken perpetual calendar subdials and yellow moon phase disk.',
        hasConditionPins: true,
      },
      {
        id: 'patek-case',
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80',
        category: 'exterior',
        caption: 'Stepped bezel architecture and original recessed calendar correction pushers.',
        hasConditionPins: true,
      },
    ],
    conditionPins: [
      {
        id: 'pin-patek-1',
        xPercent: 72,
        yPercent: 35,
        label: 'Pin #1: Pristine Hallmarks',
        category: 'mint_detail',
        description: 'Extremely deep, unpolished Swiss hallmark on the under-lug flank with clear Geneva Key symbol.',
        inspectorNote: 'Zero buffing evidence; factory step bevels 100% intact.',
      },
      {
        id: 'pin-patek-2',
        xPercent: 48,
        yPercent: 76,
        label: 'Pin #2: Original Dial Printing',
        category: 'serial',
        description: 'Pad-printed Serif accent font on the moon phase subdial consistent with 1989 first batch.',
        inspectorNote: 'Verified under 40x stereoscopic loupe.',
      },
    ],
  },

  {
    id: 'lot-108',
    lotNumber: 'LOT #108',
    title: '1961 Gibson Les Paul Standard "Burst"',
    subtitle: 'Original Cherry Sunburst • Double PAF Humbuckers • Verified Continuous Single-Owner Provenance',
    slug: '1961-gibson-les-paul-standard-burst',
    category: 'Fine Instruments',
    conditionGrade: '9.1/10 Collector Grade',
    provenanceSummary: 'Purchased at Manny\'s Music NYC in October 1961 by studio session guitarist Arthur Vance. Unbroken family possession until consignment. Completely unmolested electronics with untouched solder joints, original Sprague Black Beauty capacitors, and original Lifton five-latch brown case with pink velvet lining.',
    location: 'Nashville, TN (Bonded Vault Custody)',
    sellerId: 'seller-vance-estate',
    sellerName: 'Vance Family Estate Holdings',
    sellerIsVerified: true,
    startingBidCents: 1200000, // $12,000
    reservePriceCents: 1950000, // $19,500 (seller reserve!)
    reserveStatus: 'reserve_near', // Current bid $18,500 = 94.8% of $19,500
    currentBidCents: 1850000, // $18,500 (Matches prompt scenario!)
    nextMinBidCents: 1875000, // $18,750
    leadingBidderId: 'bidder-collector-7701',
    leadingPaddleNumber: '#7701',
    bidsCount: 34,
    watchersCount: 198,
    extensionCount: 0,
    status: 'live',
    startsAt: new Date(now - 86400000 * 4).toISOString(),
    endsAt: new Date(now + 1080 * 1000).toISOString(), // 18 minutes left (prime for seller reserve drop!)
    specifications: {
      'Serial Number': '1 0842 (Inked on rear headstock)',
      'Weight': '8 lbs 11 oz (3.94 kg)',
      'Pickups': 'Original PAF Humbuckers with "Patent Applied For" decals (Neck: 7.9kΩ, Bridge: 8.4kΩ)',
      'Finish': 'Original Nitrocellulose Lacquer Cherry Sunburst with natural weather checking',
      'Pots & Caps': 'Centralab 500k pots (date codes 1346124) with Sprague Black Beauties',
      'Neck Profile': "Slim '60/'61 Taper C-shape with Brazilian Rosewood Fingerboard",
      'Case': 'Original Lifton 5-Latch Brown Geib Shell with Pink Plush Lining',
    },
    mediaGallery: [
      {
        id: 'gibson-hero',
        url: 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=1600&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=300&q=80',
        category: 'exterior',
        caption: 'Full-body portrait showing flame maple carved top and subtle cherry burst fade.',
        hasConditionPins: true,
      },
    ],
    conditionPins: [
      {
        id: 'pin-gibson-1',
        xPercent: 55,
        yPercent: 42,
        label: 'Pin #1: Untouched Solder Joints',
        category: 'mint_detail',
        description: 'Cavity cover removed: all ground lugs and pot connections feature factory virgin gray solder.',
        inspectorNote: 'Zero modifications, rewire, or replaced components.',
      },
      {
        id: 'pin-gibson-2',
        xPercent: 38,
        yPercent: 88,
        label: 'Pin #2: Minor Belt Buckle Patina',
        category: 'patina',
        description: 'Gentle localized finish checking and light buckle indentation on rear mahogany block; no wood loss.',
        inspectorNote: 'Consistent with authentic studio handling in early 1960s.',
      },
    ],
  },

  {
    id: 'lot-019',
    lotNumber: 'LOT #019',
    title: '1989 Ferrari F40 Non-Cat Non-Adjustable',
    subtitle: 'Rosso Corsa • Classiche Certified Red Book • 8,400 Documented Kilometers',
    slug: '1989-ferrari-f40-non-cat',
    category: 'Automotive',
    conditionGrade: '9.8/10 Concours d\'Elegance Preservation',
    provenanceSummary: 'The purest specification of Maranello\'s 40th anniversary icon: sliding Lexan windows, non-catalytic converter twin-turbo V8, and fixed suspension without heavy hydraulic adjusters. Complete Ferrari Classiche Red Book certification and recent fuel bladder replacement by Michelotto in Padua.',
    location: 'Maranello, Italy (Global Air Freight Escrow)',
    sellerId: 'seller-maranello-vault',
    sellerName: 'Scuderia Corsa Archives',
    sellerIsVerified: true,
    startingBidCents: 220000000, // $2,200,000
    reservePriceCents: 275000000, // $2,750,000
    reserveStatus: 'reserve_met', // $2,850,000 >= $2,750,000
    currentBidCents: 285000000, // $2,850,000
    nextMinBidCents: 286000000, // $2,860,000 (+$10,000 tier increment)
    leadingBidderId: 'bidder-f40-supercar',
    leadingPaddleNumber: '#1940',
    bidsCount: 61,
    watchersCount: 640,
    extensionCount: 4,
    status: 'live',
    startsAt: new Date(now - 86400000 * 5).toISOString(),
    endsAt: new Date(now + 7200 * 1000).toISOString(), // ~2 hours left
    specifications: {
      'Chassis Number': 'ZFFGJ34B000084128',
      'Engine': 'Tipo F120A 2.9L Twin-Turbocharged 90° V8 (478 HP)',
      'Transmission': '5-Speed Gated Dog-Leg Manual',
      'Mileage': '8,410 km verified via Ferrari Classiche records',
      'Body': 'Kevlar, Carbon Fiber and Nomex composite weave',
      'Tanks': 'Fresh ATL FIA-spec FT3 fuel cells installed March 2024',
      'Certification': 'Ferrari Classiche Certificate of Authenticity #004921',
    },
    mediaGallery: [
      {
        id: 'f40-hero',
        url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1600&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=300&q=80',
        category: 'exterior',
        caption: 'Signature aerodynamic high-wing profile in original Rosso Corsa paint with visible Kevlar weave.',
        hasConditionPins: true,
      },
    ],
    conditionPins: [
      {
        id: 'pin-f40-1',
        xPercent: 44,
        yPercent: 32,
        label: 'Pin #1: Visible Factory Carbon Weave',
        category: 'mint_detail',
        description: 'Factory lightweight thin paint reveals unmistakable authentic carbon/Kevlar herringbone weave under direct light.',
        inspectorNote: 'Proof of original unrepainted factory composite bodywork.',
      },
    ],
  },

  {
    id: 'lot-088',
    lotNumber: 'LOT #088',
    title: '1957 Herman Miller Eames Lounge Chair & Ottoman',
    subtitle: '1st Generation 5-Ply Brazilian Rosewood • Down Cushions • Circular Silver Foil Medallion',
    slug: '1957-eames-lounge-chair-brazilian-rosewood',
    category: 'Rare Collectibles',
    conditionGrade: '9.3/10 Mid-Century Architectural Benchmark',
    provenanceSummary: 'Acquired in 1957 directly from the Herman Miller Zeeland Michigan showroom by an architect in Bloomfield Hills, Michigan. Features rare 5-ply Brazilian Rosewood (Dalbergia nigra) shells before the switch to 7-ply veneer.',
    location: 'Chicago, IL (Insured Freight)',
    sellerId: 'seller-midcentury-curator',
    sellerName: 'Bauhaus & Modernist Archive',
    sellerIsVerified: true,
    startingBidCents: 350000, // $3,500
    reservePriceCents: 0, // No reserve auction!
    reserveStatus: 'no_reserve', // ⚡ No Reserve!
    currentBidCents: 725000, // $7,250
    nextMinBidCents: 750000, // $7,500 (+$250 increment)
    leadingBidderId: 'bidder-design-fan',
    leadingPaddleNumber: '#5102',
    bidsCount: 22,
    watchersCount: 142,
    extensionCount: 0,
    status: 'live',
    startsAt: new Date(now - 86400000 * 2).toISOString(),
    endsAt: new Date(now + 195 * 1000).toISOString(), // ~3m 15s left
    specifications: {
      'Manufacturer': 'Herman Miller Furniture Company, Zeeland MI',
      'Designer': 'Charles & Ray Eames',
      'Shell Composition': '1st Generation 5-Ply Molded Brazilian Rosewood (Dalbergia nigra)',
      'Hardware': 'Original black-enamel cast aluminum die-cast base with screw-in glides',
      'Leather': 'Original Scottish glove leather with natural feather/down cushions',
      'Medallion': 'Rare circular silver foil Herman Miller patent medallion intact on underside',
    },
    mediaGallery: [
      {
        id: 'eames-hero',
        url: 'https://images.unsplash.com/photo-1580481077195-c3a821a5060f?auto=format&fit=crop&w=1600&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1580481077195-c3a821a5060f?auto=format&fit=crop&w=300&q=80',
        category: 'exterior',
        caption: 'Matched grain flow from chair headrest down to ottoman cushion.',
        hasConditionPins: true,
      },
    ],
    conditionPins: [
      {
        id: 'pin-eames-1',
        xPercent: 50,
        yPercent: 80,
        label: 'Pin #1: Foil Medallion Stamp',
        category: 'serial',
        description: 'Original circular patent medallion on the underside of chair reading "Designed by Charles Eames - Herman Miller Zeeland Mich".',
        inspectorNote: '100% authentic 1957 production run.',
      },
    ],
  },

  {
    id: 'lot-204',
    lotNumber: 'LOT #204',
    title: 'Rolex Cosmograph Daytona Ref. 6263 "Big Red"',
    subtitle: 'Stainless Steel • Black Dial • Valjoux 727 • Original Punched Papers & Box',
    slug: 'rolex-daytona-6263-big-red',
    category: 'Haute Horlogerie',
    conditionGrade: '9.7/10 Razor-Sharp Bevels',
    provenanceSummary: 'Purchased in 1981 at Bucherer Lucerne. Kept in a bank safety deposit box for over 30 years. All original tritium hands and plots matching creamy ivory patina.',
    location: 'London, UK (Insured Armored Courier)',
    sellerId: 'seller-london-horology',
    sellerName: 'Mayfair Horological Exchange',
    sellerIsVerified: true,
    startingBidCents: 5000000,
    reservePriceCents: 8000000,
    reserveStatus: 'reserve_met',
    currentBidCents: 8400000, // $84,000
    nextMinBidCents: 8500000, // $85,000
    leadingBidderId: 'bidder-collector-6263',
    leadingPaddleNumber: '#3301',
    bidsCount: 48,
    watchersCount: 312,
    extensionCount: 1,
    status: 'live',
    startsAt: new Date(now - 86400000 * 3).toISOString(),
    endsAt: new Date(now + 420 * 1000).toISOString(), // 7 minutes left
    specifications: {
      'Reference': '6263',
      'Case': 'Stainless Steel 37mm with screw-down pushers (Mark 3)',
      'Movement': 'Manual-wind Caliber 727 (adjusted to 5 positions)',
      'Dial': 'Matte Black dial with floating red "DAYTONA" script above hour register',
      'Bracelet': 'Original 78350 Oyster bracelet with 571 end-links',
      'Included': 'Original punched warranty certificate and green presentation box',
    },
    mediaGallery: [
      {
        id: 'rolex-hero',
        url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1600&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=300&q=80',
        category: 'exterior',
        caption: 'High-contrast matte black dial and contrasting silver subdial registers.',
        hasConditionPins: true,
      },
    ],
    conditionPins: [
      {
        id: 'pin-rolex-1',
        xPercent: 50,
        yPercent: 62,
        label: 'Pin #1: Big Red Typography',
        category: 'mint_detail',
        description: 'Vibrant scarlet serif Daytona lettering over the 6 o\'clock chronograph counter without flaking.',
        inspectorNote: 'Consistent with authentic Mark 2/3 typography.',
      },
    ],
  },
];

// Initial Bids for Lot #041 (Porsche 911T)
export const INITIAL_BIDS_LOT_041: BidRecord[] = [
  {
    id: 'bid-041-01',
    lotId: 'lot-041',
    bidderId: 'bidder-collector-102',
    paddleNumber: '#1049',
    amountCents: 2000000, // $20,000
    isProxyAutoBid: false,
    triggeredSoftCloseExtension: false,
    previousEndsAt: new Date(now + 3600000).toISOString(),
    newEndsAt: new Date(now + 3600000).toISOString(),
    createdAt: new Date(now - 14400000).toISOString(),
    bidderTitle: 'Collector (Zurich)',
  },
  {
    id: 'bid-041-02',
    lotId: 'lot-041',
    bidderId: 'bidder-dealer-paris',
    paddleNumber: '#3092',
    amountCents: 2150000, // $21,500
    isProxyAutoBid: false,
    triggeredSoftCloseExtension: false,
    previousEndsAt: new Date(now + 3600000).toISOString(),
    newEndsAt: new Date(now + 3600000).toISOString(),
    createdAt: new Date(now - 7200000).toISOString(),
    bidderTitle: 'Classic Dealer (Paris)',
  },
  {
    id: 'bid-041-03',
    lotId: 'lot-041',
    bidderId: 'bidder-porsche-enthusiast',
    paddleNumber: '#7741',
    amountCents: 2300000, // $23,000
    isProxyAutoBid: false,
    triggeredSoftCloseExtension: false,
    previousEndsAt: new Date(now + 3600000).toISOString(),
    newEndsAt: new Date(now + 3600000).toISOString(),
    createdAt: new Date(now - 3600000).toISOString(),
    bidderTitle: 'Enthusiast (London)',
  },
  {
    id: 'bid-041-04',
    lotId: 'lot-041',
    bidderId: 'bidder-rival-8812',
    paddleNumber: '#8812',
    amountCents: 2400000, // $24,000
    isProxyAutoBid: false,
    triggeredSoftCloseExtension: false,
    previousEndsAt: new Date(now + 600000).toISOString(),
    newEndsAt: new Date(now + 600000).toISOString(),
    createdAt: new Date(now - 900000).toISOString(),
    bidderTitle: 'Collector (Munich)',
  },
  {
    id: 'bid-041-05',
    lotId: 'lot-041',
    bidderId: 'bidder-rival-8812',
    paddleNumber: '#8812',
    amountCents: 2450000, // $24,500
    isProxyAutoBid: true,
    triggeredSoftCloseExtension: true,
    previousEndsAt: new Date(now - 20000).toISOString(),
    newEndsAt: new Date(now + 108000).toISOString(),
    createdAt: new Date(now - 14000).toISOString(),
    bidderTitle: 'Auto-Proxy Step #8812',
  },
];

// Initial Timeline Entries (Interleaved Q&A, Specialist notes)
export const INITIAL_TIMELINE_LOT_041: TimelineEntry[] = [
  {
    id: 'tl-01',
    lotId: 'lot-041',
    authorId: 'sys',
    authorName: 'Auctio Vault Protocol',
    authorRole: 'system',
    entryType: 'system_milestone',
    body: 'Auction officially opened for Lot #041 (1972 Porsche 911T 2.4L Coupe). Verified paddle hold requirement enforced ($1,000 pre-auth hold). Popcorn soft-close anti-sniping clock active (2m reset window).',
    isPinned: true,
    upvotesCount: 12,
    createdAt: new Date(now - 86400000 * 3).toISOString(),
  },
  {
    id: 'tl-02',
    lotId: 'lot-041',
    authorId: 'user-specialist-tuv',
    authorPaddleNumber: '#SPECIALIST-04',
    authorName: 'Jürgen Weiss (TÜV Rheinland Classic Inspector)',
    authorRole: 'specialist',
    entryType: 'inspection_addendum',
    body: 'On-site physical inspection performed in Stuttgart on Nov 1st. Paint meter readings taken across all panels: front fenders 128-142μm, hood 135μm, roof 125μm, doors 130-140μm. Consistent with factory-thickness repaint during 2018 refresh. Zero signs of structural collision, corrosion on torsion bar mounts or battery boxes. Compression test results: 145, 142, 146, 144, 142, 145 psi across all six cylinders.',
    isPinned: true,
    upvotesCount: 44,
    createdAt: new Date(now - 86400000 * 2).toISOString(),
  },
  {
    id: 'tl-03',
    lotId: 'lot-041',
    authorId: 'bidder-paddle-1049',
    authorPaddleNumber: '#1049',
    authorName: 'Marc D. (Paddle #1049)',
    authorRole: 'bidder',
    entryType: 'comment',
    body: 'Can the seller confirm whether the original Bosch mechanical fuel injection pump (015 pump) has been rebuilt, and if cold-start hesitation is present when starting from ambient temperature?',
    isPinned: false,
    upvotesCount: 8,
    createdAt: new Date(now - 7200000).toISOString(),
  },
  {
    id: 'tl-04',
    lotId: 'lot-041',
    authorId: 'seller-stuttgart-classics',
    authorName: 'Klausen Heritage GmbH (Seller)',
    authorRole: 'seller',
    entryType: 'seller_answer',
    replyToId: 'tl-03',
    body: 'Yes Marc! The Bosch 015 MFI pump was fully bench-calibrated by Koller Classic in Nuremberg in 2021 with receipt on file. It starts cleanly on the first crank without throttle feathering. We just uploaded a cold-start video in the gallery overview showing immediate oil pressure rise to 4.5 bar.',
    isPinned: true,
    upvotesCount: 29,
    createdAt: new Date(now - 5400000).toISOString(),
  },
  {
    id: 'tl-05',
    lotId: 'lot-041',
    authorId: 'bidder-rival-8812',
    authorPaddleNumber: '#8812',
    authorName: 'Paddle #8812',
    authorRole: 'bidder',
    entryType: 'comment',
    body: 'Placed competitive bid of $24,500. Gorgeous Gemini Blue paintwork in the daylight photos.',
    isPinned: false,
    upvotesCount: 5,
    createdAt: new Date(now - 14000).toISOString(),
  },
];

// Initial mock settlements
export const INITIAL_SETTLEMENT: HammerSettlement = {
  id: 'stl-2026-881',
  settlementNumber: 'STL-2026-881',
  lotId: 'lot-041',
  lotTitle: '1972 Porsche 911T 2.4L Coupe',
  winnerId: 'bidder-current-user',
  winnerPaddleNumber: '#4092',
  sellerId: 'seller-stuttgart-classics',
  sellerName: 'Klausen Heritage GmbH',
  hammerPriceCents: 2850000, // $28,500
  buyerPremiumCents: 142500, // $1,425 (5%)
  shippingInsuredCents: 145000, // $1,450
  depositAppliedCents: 100000, // $1,000 pre-auth hold applied
  totalBuyerDueCents: 3037500, // $30,375 ($28.5k + $1.425k + $1.45k - $1k)
  sellerCommissionCents: 142500, // 5%
  sellerNetPayoutCents: 2707500, // $27,075
  escrowStage: 'funds_in_escrow',
  trackingNumber: 'CARRIER-DHL-EXP-992140',
  carrier: 'DHL Global Forwarding Enclosed Auto Logistics',
  payoutTraceId: 'STRIPE_ESCROW_TR_88192041',
  createdAt: new Date(now - 3600000).toISOString(),
};
