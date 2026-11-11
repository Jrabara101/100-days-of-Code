export const EVENT_PRESETS = {
  wedding: {
    id: 'wedding',
    themeClass: '',
    name: '💍 Candlelit Garden Wedding',
    shortName: 'Wedding',
    icon: 'HeartHandshake',
    badge: 'Formal Celebration',
    accentColor: '#2E5A44',
    goldColor: '#C5A059',
    hero: {
      kicker: 'TOGETHER WITH THEIR FAMILIES',
      title: 'Clara Vance & Julian Mercer',
      ampersand: '&',
      subtitle: 'Celebrate our union with an intimate weekend among hundred-year heritage oaks, candlelit stone courtyards, and joyful music.',
      date: 'Saturday, November 14, 2026',
      dateShort: 'Nov 14, 2026',
      time: '4:30 PM PST',
      venue: 'The Sonoma Conservatory & Olive Grove',
      city: 'Sonoma, California',
      coordinates: '38.2919° N, 122.4580° W',
      sunset: '5:12 PM PST (Golden Hour 4:25 PM)',
      weather: '🌤️ Expected 64°F • Crisp coastal breeze at dusk',
      attireSummary: 'Black-Tie Garden Optional',
      unboxType: 'wax-seal',
      sealMonogram: 'C & J',
      sealColor: '#B8860B',
      heroTagline: 'Sonoma Valley Estate Gathering',
      rsvpDeadline: 'Kindly reply by October 15, 2026'
    },
    days: [
      { id: 'fri', label: 'Fri, Nov 13', title: 'Welcome Aperitivo' },
      { id: 'sat', label: 'Sat, Nov 14', title: 'The Main Event' },
      { id: 'sun', label: 'Sun, Nov 15', title: 'Farewell Brunch' },
    ],
    schedule: {
      fri: [
        {
          time: '05:00 PM',
          subLabel: 'DOORS AT 4:45 PM',
          title: 'Welcome Aperitivo & Regional Wine Tasting',
          location: 'The Vintage Courtyard & Fountain',
          description: 'A relaxed reunion over Sonoma Valley pinots, sparkling blanc de blancs, artisanal charcuterie, and warm focaccia straight from the wood-fired hearth.',
          badges: ['🥂 Local Vintage Wines', '✨ Casual Attire', '🎸 Acoustic Spanish Guitar'],
          energy: 'Warm & Intimate'
        },
        {
          time: '07:30 PM',
          subLabel: 'INTIMATE GATHERING',
          title: 'Rehearsal Fireside Toasts (Private Party)',
          location: 'The Stone Barn Hearth',
          description: 'Intimate welcoming remarks and casual storytelling around the outdoor firepits.',
          badges: ['🔥 Open Firepits', '🍷 Port & Dessert Bites'],
          energy: 'Relaxed'
        }
      ],
      sat: [
        {
          time: '04:00 PM',
          subLabel: 'GATES OPEN',
          title: 'Arrival Champagne in the Glasshouse',
          location: 'Glasshouse Veranda & Rose Arbor',
          description: 'Welcome glasses of chilled Rosé and seasonal peach shrub while you explore the conservatory grounds and find your seats.',
          badges: ['🥂 Champagne Served', '🎼 String Quartet', '📸 Keepsake Guest Portraits'],
          energy: 'Anticipation'
        },
        {
          time: '04:30 PM',
          subLabel: 'MAIN MOMENT',
          title: 'Vows Under the Heritage Oak',
          location: 'The Lower Botanical Lawn',
          description: 'Surrounded by ancient oaks as golden hour begins. We invite you to be fully present with us in this moment with an unplugged ceremony.',
          badges: ['💍 Unplugged Ceremony', '🌅 Golden Hour Light', '👟 Grass-Friendly Shoes'],
          energy: 'Sacred & Emotional'
        },
        {
          time: '05:15 PM',
          subLabel: 'TWILIGHT REVELRY',
          title: 'Sunset Cocktails & Garden Hors d’Oeuvres',
          location: 'The Terrace & Rose Garden',
          description: 'Passed Pacific oysters on the half shell, fig & goat cheese crostini, signature herbal gin cocktails, and twilight jazz.',
          badges: ['🦪 Raw Oyster Bar', '🎷 Bossa Nova Quartet', '🌅 Sunset at 5:12 PM'],
          energy: 'Joyful & Vibrancy'
        },
        {
          time: '06:45 PM',
          subLabel: 'SEATED FEAST',
          title: 'Family-Style Candlelit Courtyard Dinner',
          location: 'The Pergola Pavilion & Wisteria Trellis',
          description: 'A long-table feast celebrating the autumn harvest of Northern California, accompanied by vintage cellar pairings and heartfelt toasts.',
          badges: ['🕯️ Candlelit Long Tables', '🍷 Cellar Pinot Noir', '🌱 Farm-to-Table Seasonal'],
          energy: 'Heartfelt Feasting'
        },
        {
          time: '08:45 PM',
          subLabel: 'DANCE FLOOR',
          title: 'Toasts, First Dance & Champagne Coupe Tower',
          location: 'The Conservatory Ballroom',
          description: 'Champagne tower pour, parent dances, and opening up the 9-piece live band dancefloor.',
          badges: ['🍾 Champagne Tower', '🎺 9-Piece Soul Band', '🍰 Fig & Almond Cake'],
          energy: 'High Energy'
        },
        {
          time: '10:00 PM',
          subLabel: 'LATE NIGHT',
          title: 'Cellar Speakeasy & Midnight Espresso Martinis',
          location: 'The Historic Barrel Cellar',
          description: 'DJ vinyl takeover, shaking fresh espresso martinis, and late-night hot smash burgers and churros.',
          badges: ['🍸 Espresso Martinis', '🎧 Vinyl DJ Set', '🍔 Late-Night Sliders'],
          energy: 'Electric'
        }
      ],
      sun: [
        {
          time: '10:30 AM',
          subLabel: 'DROP-IN CASUAL',
          title: 'Farewell Sourdough Pastries & Espresso Bar',
          location: 'Sonoma Plaza Patisserie Garden',
          description: 'Grab a hot cortado, fresh croissants, and give Clara and Julian one final warm hug before your flights or drives home.',
          badges: ['☕ Specialty Espresso Bar', '🥐 Tartine Pastries', '🤍 No Formal Program'],
          energy: 'Gentle Recovery'
        }
      ]
    },
    moodboard: {
      title: 'Black-Tie Garden Optional',
      note: 'We invite you to dress for a joyful, candlelit garden celebration. Ceremony and cocktails will take place on manicured lawn turf before moving into the open pergola pavilion.',
      palette: [
        { name: 'Olive Silk', hex: '#3B4E38', desc: 'Earthy, deep olive greens that echo the heritage grove foliage' },
        { name: 'Champagne Linen', hex: '#E6DEC9', desc: 'Warm, luminous neutral tones and natural textural weaves' },
        { name: 'Espresso Tailoring', hex: '#2D231E', desc: 'Rich, dark coffee and charcoal dinner jackets or tailored suits' },
        { name: 'Terracotta Velvet', hex: '#A3543B', desc: 'Warm sunset rust, clay, or copper accents for gowns or pocket squares' },
        { name: 'Dusk Rose', hex: '#B58A8A', desc: 'Soft muted rose blush inspired by twilight over Sonoma Valley' }
      ],
      tips: [
        'Ceremony & cocktails are on grass: block heels, stylish wedges, or leather dress loafers are strongly advised.',
        'Sonoma valley cools by ~15°F as dusk falls: bring a cashmere wrap, shawl, or tailored dinner jacket for the evening.',
        'White, ivory, and cream are graciously reserved for the bride.'
      ]
    },
    concierge: {
      valet: 'Complimentary Valet at North Conservatory Gate (Shuttle available between hotels)',
      rideshareCode: 'CLARAJULIAN26',
      rideshareDiscount: '$20 Lyft / Uber Voucher Applied',
      address: '4200 Sonoma Mountain Rd, Sonoma, CA 95476',
      coords: { lat: 38.2919, lng: -122.4580 },
      hotels: [
        {
          name: 'The MacArthur Place Hotel & Spa',
          distance: '4 min drive / 15 min stroll',
          rate: '$320/night',
          code: 'VANCE2026',
          status: '8 rooms left',
          link: 'https://macarthurplace.com'
        },
        {
          name: 'The Lodge at Sonoma Resort',
          distance: '7 min • Dedicated shuttle stop',
          rate: '$265/night',
          code: 'MERCERWED',
          status: 'Courtesy block open',
          link: 'https://thelodgeatsonoma.com'
        },
        {
          name: 'El Dorado Hotel & Kitchen',
          distance: 'Central Sonoma Plaza • 9 min drive',
          rate: '$290/night',
          code: 'WEDDINGCJ',
          status: 'Filling up',
          link: 'https://eldoradosonoma.com'
        }
      ]
    },
    subEvents: [
      { id: 'welcome', title: 'Friday Welcome Aperitivo', time: 'Fri 5:00 PM', desc: 'Sonoma vintage wine & charcuterie welcome', private: true },
      { id: 'main', title: 'Saturday Ceremony & Candlelit Dinner', time: 'Sat 4:00 PM', desc: 'Main vows, dinner and late-night afterparty', private: false },
      { id: 'brunch', title: 'Sunday Farewell Garden Pastries', time: 'Sun 10:30 AM', desc: 'Espresso, fresh sourdough and farewell hugs', private: false }
    ],
    microPrompt: {
      label: '🎵 What song will guarantee you sprint to the dancefloor?',
      placeholder: 'e.g., September — Earth, Wind & Fire or You Make My Dreams',
      toastLabel: '💬 Leave a toast note or favorite memory for Clara & Julian',
      toastPlaceholder: 'Wishing you a lifetime of golden sunsets and shared laughter...'
    }
  },

  birthday: {
    id: 'birthday',
    themeClass: 'theme-birthday-velvet',
    name: '🥂 30th Rooftop Birthday Soirée',
    shortName: 'Birthday',
    icon: 'Sparkles',
    badge: 'Milestone Soirée',
    accentColor: '#F43F5E',
    goldColor: '#FBBF24',
    hero: {
      kicker: 'CELEBRATING 3 DECADES OF CHAOS & BRILLIANCE',
      title: "Sasha's Velvet & Vinyl 30th",
      ampersand: '&',
      subtitle: 'Sunset skyline, dirty martinis with blue cheese olives, rare vinyl cuts, and celebrating life with my favorite humans high above Manhattan.',
      date: 'Friday, October 23, 2026',
      dateShort: 'Oct 23, 2026',
      time: '7:00 PM EST',
      venue: 'The Skylark Penthouse & Wraparound Terrace',
      city: 'Midtown Manhattan, New York',
      coordinates: '40.7533° N, 73.9868° W',
      sunset: '6:08 PM EST (Skyline blue hour at 6:40 PM)',
      weather: '✨ Expected 58°F • Heated rooftop terrace with panoramic Empire State view',
      attireSummary: 'Creative Chic / Velvet & Metallics',
      unboxType: 'polaroid-vip',
      sealMonogram: 'S 30',
      sealColor: '#F43F5E',
      heroTagline: '30 Stories Above the City Lights',
      rsvpDeadline: 'Kindly RSVP by October 8, 2026'
    },
    days: [
      { id: 'fri', label: 'Fri, Oct 23', title: 'Penthouse Soirée' },
      { id: 'sat', label: 'Sat, Oct 24', title: 'Loft Bagel Brunch' }
    ],
    schedule: {
      fri: [
        {
          time: '07:00 PM',
          subLabel: 'DOORS & ROOFTOP',
          title: 'Skyline Aperitivo & Golden Hour Caviar Bumps',
          location: 'West Wraparound Deck',
          description: 'Catch the twilight glow over the Hudson River with dirty gin martinis, chilled pet-nat, and truffle arancini.',
          badges: ['🍸 Dirty Martinis', '🦪 Caviar & Oysters', '🌆 Panoramic Sunset'],
          energy: 'Chic Arrival'
        },
        {
          time: '08:30 PM',
          subLabel: 'DINNER BITES',
          title: 'Toast to 30 & Family-Style Tapas Feast',
          location: 'The Penthouse Salon',
          description: 'A decadent roaming feast: wagyu smash sliders, jamón ibérico, blistered padrones, and wild mushroom risotto bites.',
          badges: ['🥩 Roaming Gourmet Tapas', '🍾 Natural Orange Wines', '🥂 Birthday Speech'],
          energy: 'Bustling & Festive'
        },
        {
          time: '09:45 PM',
          subLabel: 'CELEBRATION',
          title: 'Birthday Cake Spectacle & Champagne Saber',
          location: 'Main Bar Hearth',
          description: 'Funfetti layered tiered cake, sparklers, champagne saber popping, and custom neon photo ops.',
          badges: ['🎂 Tiered Cake', '✨ Sparkler Tower', '📸 35mm Disposable Cameras'],
          energy: 'Crescendo Peak'
        },
        {
          time: '10:15 PM',
          subLabel: 'MAIN DANCEFLOOR',
          title: 'Live Vinyl DJ Set & Rooftop Dancefloor',
          location: 'The Skyline Room',
          description: 'Nu-disco, French touch, 2000s R&B, and the crowd-voted playlist blasting into the night.',
          badges: ['🎧 Resident Vinyl DJ', '🪩 Disco Ball Reflections', '🕺 Open Floor'],
          energy: 'Unapologetic Party'
        },
        {
          time: '01:30 AM',
          subLabel: 'NYC TRADITION',
          title: 'Midnight Joe’s Pizza Delivery & After-After',
          location: 'Terrace Velvet Lounges',
          description: 'Fresh piping hot pepperoni and grandma pies straight from Greenwich Village to wrap up the night.',
          badges: ['🍕 Joe’s NYC Pizza', '☕ Nightcap Amaro', '🌙 Late Night Confessions'],
          energy: 'Warm Afterglow'
        }
      ],
      sat: [
        {
          time: '11:30 AM',
          subLabel: 'RECOVERY CLUB',
          title: 'Russ & Daughters Bagel & Bloody Mary Recovery',
          location: 'Sasha’s Chelsea Loft',
          description: 'Everything bagels, scallion cream cheese, Scottish smoked salmon, and oversized sunglasses.',
          badges: ['🥯 Russ & Daughters', '🍅 Spicy Bloody Marys', '🕶️ Sunglasses Obligatory'],
          energy: 'Mellow Hangout'
        }
      ]
    },
    moodboard: {
      title: 'Creative Chic / Velvet & Metallics',
      note: 'Dress like you are heading to a 1970s Studio 54 revival hosted in 2026. Think textured velvets, liquid silks, tailored monochrome, bold jewelry, or metallic highlights.',
      palette: [
        { name: 'Plum Velvet', hex: '#3B1F3E', desc: 'Deep moody plum and dark amethyst luxury textures' },
        { name: 'Rose Fizz', hex: '#F43F5E', desc: 'Playful neon rose and vibrant magenta statements' },
        { name: 'Liquid Gold', hex: '#FBBF24', desc: 'Shimmering lamé, sequins, or warm metallic highlights' },
        { name: 'Midnight Obsidian', hex: '#1A1721', desc: 'Sharp black tailoring, satin lapels, and leather accents' },
        { name: 'Champagne Luster', hex: '#EDE5D8', desc: 'Ivory silks, frosted metallics, and pearl finishes' }
      ],
      tips: [
        'Entire venue is polished hardwood and heated terrace concrete: completely stiletto-friendly!',
        'The rooftop terrace is equipped with radiant heaters, but October NYC night air is crisp—a sharp coat or leather jacket is recommended.',
        'Complimentary coat check is stationed directly at the 30th floor elevator doors.'
      ]
    },
    concierge: {
      valet: 'Dedicated Private Elevator at 200 W 39th St (Attendant at Ground Lobby)',
      rideshareCode: 'SASHA30TH',
      rideshareDiscount: '$25 Uber/Lyft Credit for Ride Home',
      address: '200 W 39th St, 30th Floor, New York, NY 10018',
      coords: { lat: 40.7533, lng: -73.9868 },
      hotels: [
        {
          name: 'The Refinery Hotel',
          distance: '2 min walk across the block',
          rate: '$275/night',
          code: 'SASHA30',
          status: 'Host recommendation',
          link: 'https://refineryhotelnewyork.com'
        },
        {
          name: 'The Bryant Park Hotel',
          distance: '5 min walk • Park views',
          rate: '$310/night',
          code: 'OCTCELEBRATE',
          status: 'Open',
          link: 'https://bryantparkhotel.com'
        },
        {
          name: 'Ace Hotel New York',
          distance: '10 min walk / 3 min cab',
          rate: '$240/night',
          code: 'VINYL30',
          status: 'Filling fast',
          link: 'https://acehotel.com/new-york'
        }
      ]
    },
    subEvents: [
      { id: 'pre-toast', title: '6:00 PM VIP Speakeasy Toast', time: 'Fri 6:00 PM', desc: 'Pre-party champagne toast for intimate squad', private: true },
      { id: 'main', title: '7:00 PM Penthouse Soirée & Rooftop Dancing', time: 'Fri 7:00 PM', desc: 'The full 30th birthday extravaganza', private: false },
      { id: 'recovery', title: 'Saturday Morning Bagel & Bloody Mary Recovery', time: 'Sat 11:30 AM', desc: 'Russ & Daughters bagel spread at Sasha’s loft', private: false }
    ],
    microPrompt: {
      label: '🎵 What 1 song is non-negotiable for the dancefloor tonight?',
      placeholder: 'e.g., Levitating — Dua Lipa or Gimme! Gimme! Gimme! (A Man After Midnight)',
      toastLabel: '💬 Drop your favorite hilarious or unhinged memory with Sasha',
      toastPlaceholder: 'Remember that time in Barcelona at 4 AM...'
    }
  },

  conference: {
    id: 'conference',
    themeClass: 'theme-summit-swiss',
    name: '🎙️ Boutique Design & AI Summit',
    shortName: 'Summit',
    icon: 'Cpu',
    badge: 'Curated Symposium',
    accentColor: '#2563EB',
    goldColor: '#0EA5E9',
    hero: {
      kicker: 'SYNTHETICA 2026 • ANNUAL BOUTIQUE ASSEMBLY',
      title: 'Designing Autonomous Intelligence',
      ampersand: '&',
      subtitle: 'A curated 180-person symposium on agentic interfaces, tactile generative models, physical computing, and the next chapter of human-AI collaboration.',
      date: 'Thursday, October 15, 2026',
      dateShort: 'Oct 15, 2026',
      time: '8:30 AM PST',
      venue: 'The SF Mint & Vault Chambers',
      city: 'San Francisco, California',
      coordinates: '37.7824° N, 122.4069° W',
      sunset: '6:25 PM PST (Summit concludes with Vault networking at 7:00 PM)',
      weather: '🌫️ Expected 61°F • Typical SF mild fog morning shifting to crisp afternoon sunshine',
      attireSummary: 'Architectural Smart Casual / Minimalist Tailoring',
      unboxType: 'kinetic-lanyard',
      sealMonogram: 'SYN ’26',
      sealColor: '#2563EB',
      heroTagline: 'Curated Gathering of 180 Product & AI Leaders',
      rsvpDeadline: 'Registration confirms lock on Sept 30, 2026'
    },
    days: [
      { id: 'wed', label: 'Wed, Oct 14', title: 'VIP Speaker Dinner' },
      { id: 'thu', label: 'Thu, Oct 15', title: 'Main Summit Day' },
      { id: 'fri', label: 'Fri, Oct 16', title: 'Tactile Hack Lab' }
    ],
    schedule: {
      wed: [
        {
          time: '07:00 PM',
          subLabel: 'INVITATION ONLY',
          title: 'Speakers & Fellows Private Dinner',
          location: 'Cotogna Private Dining Room, Jackson Square',
          description: 'A 5-course wood-fired dinner bringing together keynote speakers, venture fellows, and symposium hosts for unrecorded Chatham House dialogue.',
          badges: ['🍷 Italian Wine Pairings', '🔒 Chatham House Rule', '🎙️ Speaker Cohort'],
          energy: 'High-Level Strategic'
        }
      ],
      thu: [
        {
          time: '08:30 AM',
          subLabel: 'REGISTRATION',
          title: 'Badge Pickup, Single-Origin Pour-Overs & Morning Bites',
          location: 'The Historic Grand Rotunda',
          description: 'Collect your kinetic NFC badge, enjoy bespoke Four Barrel pour-overs, artisan morning pastries, and morning networking.',
          badges: ['☕ Four Barrel Espresso Bar', '🎫 NFC Kinetic Badge', '🥐 Tartine Brioche'],
          energy: 'Caffeinated Connection'
        },
        {
          time: '09:30 AM',
          subLabel: 'KEYNOTE ARENA',
          title: 'Beyond the Chatbox: Tactile Agentic Interfaces',
          location: 'Vault Stage Alpha',
          description: 'Exploring how AI systems graduate from text streaming to spatial canvases, direct manipulation, and autonomous workflows that feel physically grounded.',
          badges: ['💡 Keynote Address', '⚡ Live Interface Demo', '📊 2027 UX Frameworks'],
          energy: 'Mind-Expanding'
        },
        {
          time: '11:00 AM',
          subLabel: 'PARALLEL TRACKS',
          title: 'Breakout Sessions: Steering vs. Generative Canvas',
          location: 'Chambers 101 & 102',
          description: 'Track 1: Latency budgets & local edge inference for agents. Track 2: Designing multimodal canvas affordances with zero cognitive friction.',
          badges: ['🛠️ Deep Technical Dive', '💻 Interactive Labs', '👥 40-Cap Pods'],
          energy: 'Focused Workshop'
        },
        {
          time: '12:30 PM',
          subLabel: 'CURATED LUNCH',
          title: 'Chef-Driven Luncheon & Topic Pods',
          location: 'The Courtyard Pavilion',
          description: 'Seasonal Northern California bento boxes paired with guided topic tables (Generative UI, Open Weights, Robotics, Safety & Alignment).',
          badges: ['🍱 Seasonal Chef Bento', '🌱 100% Organic & Local', '🤝 Curated Table Pods'],
          energy: 'Engaged Discussion'
        },
        {
          time: '02:00 PM',
          subLabel: 'DEEP DIVE',
          title: 'Autonomous Multimodal Systems at Scale',
          location: 'Vault Stage Alpha',
          description: 'Executive panel featuring research leads discussing multi-agent coordination, real-time safety nets, and agent observability.',
          badges: ['🎙️ Research Panel', '🔍 Failure Modes & Fixes', '❓ Live Audience Q&A'],
          energy: 'Technical Insight'
        },
        {
          time: '04:15 PM',
          subLabel: 'SHOWCASE',
          title: 'Live Prototype Showcase & Lightning Demos',
          location: 'The Grand Coin Vault',
          description: '12 curated teams show live, unscripted hardware and software demos. No slides allowed—working code and prototypes only.',
          badges: ['⚡ 12 Live Demos', '🚫 Zero Slides Rule', '🛠️ Hands-On Stations'],
          energy: 'High Spark'
        },
        {
          time: '05:30 PM',
          subLabel: 'NETWORKING',
          title: 'Sunset Vault Reception & Natural Wine Tasting',
          location: 'The Historic Mint Vaults',
          description: 'Bespoke cocktails, low-intervention natural wines, ambient modular synthesizer soundscape, and evening networking.',
          badges: ['🍸 Craft Botanicals', '🍷 Low-Intervention Wines', '🎹 Modular Synth Set'],
          energy: 'Atmospheric Soirée'
        }
      ],
      fri: [
        {
          time: '09:30 AM',
          subLabel: 'SPECIAL SESSION',
          title: 'Hands-On Agent Architecture Hack Lab (40 Seats)',
          location: 'The Design Vault Annex',
          description: 'Pair programming and hands-on implementation sprint deploying custom subagent toolchains with our core research team.',
          badges: ['💻 BYO Laptop', '⚡ Mentor Sprints', '🏆 Showcase at 1 PM'],
          energy: 'Hands-on Building'
        }
      ]
    },
    moodboard: {
      title: 'Architectural Smart Casual / Minimalist Tailoring',
      note: 'Clean silhouettes, modern materials, Japanese raw denim, structured blazers, or designer sneakers. Feel comfortable, sharp, and authentic.',
      palette: [
        { name: 'Klein Blue', hex: '#2563EB', desc: 'Signature electric international Klein blue signifying intelligence' },
        { name: 'Concrete Grey', hex: '#94A3B8', desc: 'Architectural slate and cool matte stone finishes' },
        { name: 'Charcoal Noir', hex: '#0F172A', desc: 'Deep matte black and structured wool outerwear' },
        { name: 'Gallery Paper', hex: '#F8FAFC', desc: 'Crisp optic white and Japanese heavyweight cottons' },
        { name: 'Live Emerald', hex: '#10B981', desc: 'Accent green denoting active compute and live stage signals' }
      ],
      tips: [
        'Historic granite and restored hardwood floors: sneakers, minimalist boots, or modern loafers are ideal.',
        'High-speed charging stations and bag drop available inside the main registration pavilion.',
        'San Francisco microclimates fluctuate quickly—bring a light technical layer or tailored coat for evening outdoor moments.'
      ]
    },
    concierge: {
      valet: 'Dedicated Event Drop-Off Zone at 88 5th St (San Francisco)',
      rideshareCode: 'SYNTHETICA26',
      rideshareDiscount: '$20 Waymo / Uber Credit Included',
      address: '88 5th St, San Francisco, CA 94103',
      coords: { lat: 37.7824, lng: -122.4069 },
      hotels: [
        {
          name: 'The Proper Hotel SF (Designed by Kelly Wearstler)',
          distance: '6 min walk • Rooftop lounge',
          rate: '$310/night',
          code: 'SYNTHETICA',
          status: 'Official Speaker Hotel',
          link: 'https://properhotel.com/san-francisco'
        },
        {
          name: 'The Clancy, Autograph Collection',
          distance: '10 min walk to Mint',
          rate: '$260/night',
          code: 'DESIGN26',
          status: 'Open block',
          link: 'https://theclancyhotel.com'
        },
        {
          name: '1 Hotel San Francisco (Embarcadero)',
          distance: '6 min transit / Waymo ride',
          rate: '$340/night',
          code: 'GREENAI',
          status: 'Eco-Luxury Option',
          link: 'https://1hotels.com/san-francisco'
        }
      ]
    },
    subEvents: [
      { id: 'speaker-dinner', title: 'Wednesday Evening Speaker & VIP Dinner', time: 'Wed 7:00 PM', desc: 'Intimate multi-course dinner at Cotogna', private: true },
      { id: 'main', title: 'Thursday Full Summit Pass & Keynotes', time: 'Thu 8:30 AM', desc: 'Access to all stages, breakouts, lunches and networking', private: false },
      { id: 'hack-lab', title: 'Friday Morning Hands-On Agent Workshop', time: 'Fri 9:30 AM', desc: 'Limited 40-seat coding & design sprint with mentors', private: true }
    ],
    microPrompt: {
      label: '💡 What question would you most want addressed by the Keynote Panel?',
      placeholder: 'e.g., How do we design agency without user cognitive overload?',
      toastLabel: '💬 Your primary networking goal or project you are building',
      toastPlaceholder: 'Looking to connect with designers exploring generative UI...'
    }
  }
};

