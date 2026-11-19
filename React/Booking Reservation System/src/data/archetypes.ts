import { Archetype, VisitStyleConfig } from '../types';

export const VISIT_STYLES: VisitStyleConfig[] = [
  {
    id: 'express',
    label: '45-Min Express Visit',
    durationMinutes: 45,
    badge: '⚡ Express Turn',
    description: 'Unlocks tight gap windows between prime seatings. High-efficiency hospitality.',
    idealFor: 'Quick aperitivo, post-work bites, or focused studio session'
  },
  {
    id: 'classic',
    label: '90-Min Classic Experience',
    durationMinutes: 90,
    badge: '🍷 Standard Pacing',
    description: 'Balanced unhurried rhythm with full course progression or standard match.',
    idealFor: 'Dinner dates, group reformer classes, or 90m court matches'
  },
  {
    id: 'celebration',
    label: '2.5-Hour Unhurried Celebration',
    durationMinutes: 150,
    badge: '✨ Leisure Immersion',
    description: 'Extended table ownership with sommelier pairings and digestif buffer.',
    idealFor: 'Tasting menus, milestone birthdays, or multi-set creative production'
  }
];

export const ARCHETYPES: Archetype[] = [
  {
    id: 'fine-dining',
    name: "The Luminary Osteria & Chef's Hearth",
    tagline: 'Modern wood-fired hearth dining, biodynamic cellar & courtyard olive grove',
    heroSerif: 'A dining sanctuary guided by open fire, natural light, and quiet hospitality.',
    categoryBadge: '🍽️ Fine Dining & Chef’s Table',
    defaultPartySize: 2,
    currency: '$',
    priceNote: 'Complimentary booking hold • $25/pp deposit credited to final bill',
    curatedAddOns: [
      {
        id: 'sommelier-reserve',
        title: 'Cellar Master 5-Flight Pairing',
        price: 85,
        badge: '🍷 Curated Cellar',
        description: 'Rare low-intervention vintages paired dish-by-dish by Head Sommelier Marco',
        category: 'sommelier'
      },
      {
        id: 'truffle-shave',
        title: 'Black Périgord Truffle Progression',
        price: 45,
        badge: '🍄 Tableside Service',
        description: 'Fresh seasonal black truffles shaved tableside over handmade agnolotti',
        category: 'course'
      },
      {
        id: 'courtyard-blanket',
        title: 'Courtyard Firepit Digestif Reserve',
        price: 30,
        badge: '🔥 Post-Dinner Lounge',
        description: 'Reserved fireside seating after dinner with house amaro and warm cashmere throws',
        category: 'course'
      }
    ],
    hospitalityPrompts: {
      occasions: [
        { id: 'bday-subtle', label: '🎂 Subtle Birthday', icon: '🎂', prompt: 'Discreet candle on dessert, no singing' },
        { id: 'client-dinner', label: '💼 Client Dinner', icon: '💼', prompt: 'Discreet bill presentation, quiet acoustic table' },
        { id: 'anniversary', label: '🥂 Anniversary Toast', icon: '🥂', prompt: 'Welcome glassware of reserve Franciacorta' },
        { id: 'date-night', label: '✨ Casual Date Night', icon: '✨', prompt: 'Romantic side-by-side or intimate banquette' }
      ],
      comforts: [
        { id: 'severe-allergy', label: '🥜 Severe Allergy Protocol', icon: '🥜', prompt: 'Dedicated sterile station prep with chef sign-off' },
        { id: 'vegan-concierge', label: '🌱 Vegan / Plant-Forward', icon: '🌱', prompt: 'Full bespoke 5-course plant-forward pairing' },
        { id: 'step-free', label: '♿ Step-Free Access', icon: '♿', prompt: 'Ground level access without stairs or curbs' },
        { id: 'high-chair', label: '👶 Stroller / High-Chair Space', icon: '👶', prompt: 'Spacious perimeter booth with baby gear clearance' }
      ]
    },
    sampleVipGuest: {
      name: 'Dr. Evelyn Vance & Guest',
      streak: 7,
      notes: '7th visit this season. Loves corner banquette Booth 04, sparkling water with Meyer lemon on arrival.',
      preferences: ['Booth 04', 'Zero sulfites', 'Prefers quiet corner']
    },
    zones: [
      {
        id: 'window-banquettes',
        name: 'Sunlit Window Banquettes',
        archetypeId: 'fine-dining',
        description: 'Warm natural light overlooking the cobblestone courtyard. Plush moss-green mohair banquettes.',
        vibePills: ['☀️ Natural Daylight', '🕯️ Intimate & Low-Noise', '🌿 Garden View'],
        indoor: true,
        ambientLighting: 'direct-sun',
        spots: [
          {
            id: 'b-01',
            code: 'BOOTH 01',
            name: 'North Window Corner Banquette',
            zoneId: 'window-banquettes',
            zoneName: 'Sunlit Window Banquettes',
            capacityMin: 2,
            capacityMax: 4,
            optimalCapacity: 2,
            vibes: ['sunlit', 'intimate', 'acoustic-quiet'],
            noiseLevel: 'Whisper Soft (<55dB)',
            noiseDb: 52,
            comfortRating: 'Plush Mohair Banquette',
            sightlineSummary: 'Direct views of courtyard olive trees; 10ft from neighboring tables',
            photoUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 25,
            svg: { shape: 'rect', x: 60, y: 70, width: 85, height: 60 }
          },
          {
            id: 'b-02',
            code: 'BOOTH 02',
            name: 'Sunlit Window Banquette',
            zoneId: 'window-banquettes',
            zoneName: 'Sunlit Window Banquettes',
            capacityMin: 2,
            capacityMax: 4,
            optimalCapacity: 4,
            vibes: ['sunlit', 'intimate'],
            noiseLevel: 'Warm Conversation (55-65dB)',
            noiseDb: 56,
            comfortRating: 'Bespoke Oak & Linen Seating',
            sightlineSummary: 'Panoramic south-facing arched glass window with golden afternoon angle',
            photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 25,
            svg: { shape: 'rect', x: 175, y: 70, width: 85, height: 60 }
          },
          {
            id: 'b-03',
            code: 'BOOTH 03',
            name: 'Olive Arbour Window Table',
            zoneId: 'window-banquettes',
            zoneName: 'Sunlit Window Banquettes',
            capacityMin: 4,
            capacityMax: 6,
            optimalCapacity: 4,
            vibes: ['sunlit', 'garden-pergola'],
            noiseLevel: 'Warm Conversation (55-65dB)',
            noiseDb: 58,
            comfortRating: 'Deep Curved Booth with Velvet Cushions',
            sightlineSummary: 'Corner sanctuary with diffused light filtered by climbing jasmine vines',
            photoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 30,
            svg: { shape: 'rect', x: 290, y: 70, width: 95, height: 60 }
          },
          {
            id: 'b-04',
            code: 'BOOTH 04',
            name: 'VIP Corner Solarium Banquette',
            zoneId: 'window-banquettes',
            zoneName: 'Sunlit Window Banquettes',
            capacityMin: 2,
            capacityMax: 4,
            optimalCapacity: 2,
            vibes: ['sunlit', 'intimate', 'acoustic-quiet'],
            noiseLevel: 'Whisper Soft (<55dB)',
            noiseDb: 50,
            comfortRating: 'Quietest & most requested alcove in house',
            sightlineSummary: 'Zero back-traffic, discreet corner angle with custom brass reading lamp',
            photoUrl: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 25,
            svg: { shape: 'rect', x: 415, y: 70, width: 90, height: 60 }
          }
        ]
      },
      {
        id: 'chefs-counter',
        name: "The Chef's Hearth & Counter",
        archetypeId: 'fine-dining',
        description: 'Front-row view of Chef Matteo finishing plates over the open white-oak hearth grill.',
        vibePills: ['🥂 High-Energy Social', '🔥 Hearthside Aroma', '👨‍🍳 Interactive Kitchen'],
        indoor: true,
        ambientLighting: 'amber-glow',
        spots: [
          {
            id: 'c-01',
            code: 'COUNTER 01-02',
            name: "Hearthside Chef's Pair (Left)",
            zoneId: 'chefs-counter',
            zoneName: "The Chef's Hearth & Counter",
            capacityMin: 1,
            capacityMax: 2,
            optimalCapacity: 2,
            vibes: ['chef-view', 'high-energy'],
            noiseLevel: 'Lively Buzz (65-75dB)',
            noiseDb: 68,
            comfortRating: 'Ergonomic Leather High-Back Stools with Footrest',
            sightlineSummary: 'Direct 4-foot view of wood-fire embers and plating station',
            photoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 35,
            svg: { shape: 'rect', x: 60, y: 175, width: 75, height: 50 }
          },
          {
            id: 'c-02',
            code: 'COUNTER 03-04',
            name: "Center Plating Pass Pair",
            zoneId: 'chefs-counter',
            zoneName: "The Chef's Hearth & Counter",
            capacityMin: 1,
            capacityMax: 2,
            optimalCapacity: 2,
            vibes: ['chef-view', 'high-energy'],
            noiseLevel: 'Lively Buzz (65-75dB)',
            noiseDb: 70,
            comfortRating: 'Leather High-Back Stools with brass purse hooks',
            sightlineSummary: 'Direct interaction with Chef Matteo during the 7-course tasting menu',
            photoUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 35,
            svg: { shape: 'rect', x: 155, y: 175, width: 80, height: 50 }
          },
          {
            id: 'c-03',
            code: 'COUNTER 05-06',
            name: "Pastry & Sommelier Station Pair",
            zoneId: 'chefs-counter',
            zoneName: "The Chef's Hearth & Counter",
            capacityMin: 1,
            capacityMax: 2,
            optimalCapacity: 2,
            vibes: ['chef-view', 'intimate'],
            noiseLevel: 'Warm Conversation (55-65dB)',
            noiseDb: 64,
            comfortRating: 'Cushioned Saddle Leather Swivel Stools',
            sightlineSummary: 'Adjacent to our temperature-controlled biodynamic wine cellar',
            photoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 35,
            svg: { shape: 'rect', x: 255, y: 175, width: 80, height: 50 }
          }
        ]
      },
      {
        id: 'olive-courtyard',
        name: 'Heated Olive Courtyard & Pergola',
        archetypeId: 'fine-dining',
        description: 'Tuscan gravel courtyard framed by century-old olive trees, radiant underfloor heating & pergola.',
        vibePills: ['🐾 Dog-Friendly Patio', '🌿 Garden Pergola', '🌦️ Weather-Safe Guarantee'],
        indoor: false,
        ambientLighting: 'diffused-courtyard',
        spots: [
          {
            id: 'p-01',
            code: 'PATIO 01',
            name: 'Olive Tree Canopy Table',
            zoneId: 'olive-courtyard',
            zoneName: 'Heated Olive Courtyard & Pergola',
            capacityMin: 2,
            capacityMax: 4,
            optimalCapacity: 2,
            vibes: ['dog-friendly', 'garden-pergola', 'intimate'],
            noiseLevel: 'Whisper Soft (<55dB)',
            noiseDb: 54,
            comfortRating: 'Woven Teak Chairs with Heated Cushions',
            sightlineSummary: 'Centrally sheltered by heated glass canopy; water fountain soundscape',
            photoUrl: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 25,
            isWeatherContingency: true,
            indoorBackupSpotId: 'b-02',
            svg: { shape: 'circle', x: 420, y: 195, radius: 28 }
          },
          {
            id: 'p-02',
            code: 'PATIO 02',
            name: 'Pergola Jasmine Table',
            zoneId: 'olive-courtyard',
            zoneName: 'Heated Olive Courtyard & Pergola',
            capacityMin: 4,
            capacityMax: 6,
            optimalCapacity: 4,
            vibes: ['dog-friendly', 'garden-pergola'],
            noiseLevel: 'Warm Conversation (55-65dB)',
            noiseDb: 57,
            comfortRating: 'Natural Travertine Table with Reclining Armchairs',
            sightlineSummary: 'Open sky overhead with retractable weather louvers',
            photoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 25,
            isWeatherContingency: true,
            indoorBackupSpotId: 'b-03',
            svg: { shape: 'circle', x: 500, y: 195, radius: 28 }
          },
          {
            id: 'p-03',
            code: 'PATIO 03',
            name: 'Courtyard Fireplace Table',
            zoneId: 'olive-courtyard',
            zoneName: 'Heated Olive Courtyard & Pergola',
            capacityMin: 2,
            capacityMax: 4,
            optimalCapacity: 4,
            vibes: ['intimate', 'garden-pergola'],
            noiseLevel: 'Whisper Soft (<55dB)',
            noiseDb: 53,
            comfortRating: 'Upholstered Low Dining Armchairs beside Firepit',
            sightlineSummary: 'Facing the open stone outdoor fireplace; ideal for romantic evenings',
            photoUrl: 'https://images.unsplash.com/photo-1508766917616-d22f3f1eea14?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 30,
            isWeatherContingency: true,
            indoorBackupSpotId: 'b-04',
            svg: { shape: 'circle', x: 460, y: 275, radius: 28 }
          }
        ]
      },
      {
        id: 'acoustic-alcove',
        name: 'Quiet Acoustic Wine Alcove',
        archetypeId: 'fine-dining',
        description: 'Tucked beneath limestone barrel vaults lined with vintage Barolo bottles. Acoustically treated for confidential discussion.',
        vibePills: ['🕯️ Intimate & Low-Noise', '💼 Client Dinner Pick', '🤫 Zero Spillover'],
        indoor: true,
        ambientLighting: 'amber-glow',
        spots: [
          {
            id: 'a-01',
            code: 'ALCOVE 01',
            name: 'Sommelier Vault Table',
            zoneId: 'acoustic-alcove',
            zoneName: 'Quiet Acoustic Wine Alcove',
            capacityMin: 2,
            capacityMax: 4,
            optimalCapacity: 2,
            vibes: ['acoustic-quiet', 'intimate'],
            noiseLevel: 'Whisper Soft (<55dB)',
            noiseDb: 46,
            comfortRating: 'Tufted Emerald Leather Booth',
            sightlineSummary: 'Complete acoustic isolation, limestone archway, private cellar view',
            photoUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 35,
            svg: { shape: 'rect', x: 60, y: 265, width: 85, height: 60 }
          },
          {
            id: 'a-02',
            code: 'ALCOVE 02',
            name: 'Reserve Cellar Oval Table',
            zoneId: 'acoustic-alcove',
            zoneName: 'Quiet Acoustic Wine Alcove',
            capacityMin: 4,
            capacityMax: 8,
            optimalCapacity: 6,
            vibes: ['acoustic-quiet', 'intimate', 'power-outlet'],
            noiseLevel: 'Whisper Soft (<55dB)',
            noiseDb: 48,
            comfortRating: 'Oval Walnut Table & Custom Executive Chairs',
            sightlineSummary: 'Discreet service door, integrated concealed AV & power ports for private meetings',
            photoUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 50,
            svg: { shape: 'rect', x: 175, y: 265, width: 120, height: 60 }
          }
        ]
      }
    ]
  },
  {
    id: 'wellness-studio',
    name: 'Sanctuary Reformer & Thermal Bathhouse',
    tagline: 'Precision Pilates reformers, eucalyptus steam, and private infrared suites',
    heroSerif: 'Reserve your exact reformer machine, temperature zone, and recovery suite.',
    categoryBadge: '🧖‍♀️ Boutique Wellness & Reformer',
    defaultPartySize: 1,
    currency: '$',
    priceNote: 'Direct spot selection • 12-hour free cancellation window',
    curatedAddOns: [
      {
        id: 'infrared-recovery',
        title: '30-Min Post-Class Infrared Sauna Session',
        price: 35,
        badge: '🧖 Recovery Suite',
        description: 'Full-spectrum infrared cabin with eucalyptus cold plunge and electrolyte tonic',
        category: 'wellness'
      },
      {
        id: 'grip-socks-towel',
        title: 'Lululemon Grip Sock & Chilled Towel Service',
        price: 18,
        badge: '✨ Studio Prep',
        description: 'Pre-set on your carriage with cold pressed lavender towel post-burn',
        category: 'wellness'
      }
    ],
    hospitalityPrompts: {
      occasions: [
        { id: 'first-time', label: '🌱 First Time on Reformer', icon: '🌱', prompt: 'Instructor 5-min machine orientation before class' },
        { id: 'injury-mod', label: '🩹 Injury Modification', icon: '🩹', prompt: 'Lower spine/wrist friendly spring settings notified to coach' },
        { id: 'high-intensity', label: '🔥 Peak Intensity', icon: '🔥', prompt: 'Heavy resistance springs pre-loaded on your station' },
        { id: 'silent-recovery', label: '🤫 Silent Recovery Mode', icon: '🤫', prompt: 'No hands-on adjustments, self-paced breathing' }
      ],
      comforts: [
        { id: 'temp-cool', label: '❄️ Prefer Cooler Airflow', icon: '❄️', prompt: 'Direct fan alignment near north glass' },
        { id: 'sound-soft', label: '🎧 Sensitive to Audio', icon: '🎧', prompt: 'Position away from overhead subwoofers' },
        { id: 'shower-priority', label: '🚿 Post-Class Rainshower Hold', icon: '🚿', prompt: 'Locker #14 & rainshower pre-allocated' }
      ]
    },
    sampleVipGuest: {
      name: 'Maya Chen',
      streak: 19,
      notes: '19-class streak. Prefers Reformer R03 (front left) for clear mirror alignment, cold water with electrolytes.',
      preferences: ['Reformer R03', 'Instructor Sophia', 'Infrared Sauna Add-On']
    },
    zones: [
      {
        id: 'front-reformers',
        name: 'Front-Row Reformers (Direct Mirror View)',
        archetypeId: 'wellness-studio',
        description: 'Clear unobstructed sightline to lead instructor & floor-to-ceiling alignment mirrors.',
        vibePills: ['👀 Direct Instructor Sightline', '🪞 Full Alignment Mirror', '🎵 Optimal Acoustics'],
        indoor: true,
        ambientLighting: 'studio-lumens',
        spots: [
          {
            id: 'r-01',
            code: 'REFORMER 01',
            name: 'Front Left Reformer (Corner)',
            zoneId: 'front-reformers',
            zoneName: 'Front-Row Reformers (Direct Mirror View)',
            capacityMin: 1,
            capacityMax: 1,
            optimalCapacity: 1,
            vibes: ['reformer', 'acoustic-quiet'],
            noiseLevel: 'Warm Conversation (55-65dB)',
            noiseDb: 60,
            comfortRating: 'Balanced Body Allegro 2 with Footbar Upgrade',
            sightlineSummary: 'Left front flank; ideal if you prefer personal space with full mirror visibility',
            photoUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 38,
            svg: { shape: 'rect', x: 80, y: 70, width: 45, height: 95 }
          },
          {
            id: 'r-02',
            code: 'REFORMER 02',
            name: 'Front Center-Left Reformer',
            zoneId: 'front-reformers',
            zoneName: 'Front-Row Reformers (Direct Mirror View)',
            capacityMin: 1,
            capacityMax: 1,
            optimalCapacity: 1,
            vibes: ['reformer', 'high-energy'],
            noiseLevel: 'Warm Conversation (55-65dB)',
            noiseDb: 62,
            comfortRating: 'Allegro 2 with custom memory foam headrest',
            sightlineSummary: 'Direct eye contact with instructor during tempo cueing',
            photoUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 38,
            svg: { shape: 'rect', x: 155, y: 70, width: 45, height: 95 }
          },
          {
            id: 'r-03',
            code: 'REFORMER 03',
            name: 'Front Center-Right Reformer (VIP Pick)',
            zoneId: 'front-reformers',
            zoneName: 'Front-Row Reformers (Direct Mirror View)',
            capacityMin: 1,
            capacityMax: 1,
            optimalCapacity: 1,
            vibes: ['reformer', 'high-energy'],
            noiseLevel: 'Warm Conversation (55-65dB)',
            noiseDb: 62,
            comfortRating: 'Premium Allegro 2 • Most requested spot in studio',
            sightlineSummary: 'Golden center position directly aligned with coach demonstration table',
            photoUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 38,
            svg: { shape: 'rect', x: 230, y: 70, width: 45, height: 95 }
          },
          {
            id: 'r-04',
            code: 'REFORMER 04',
            name: 'Front Right Reformer (Window Side)',
            zoneId: 'front-reformers',
            zoneName: 'Front-Row Reformers (Direct Mirror View)',
            capacityMin: 1,
            capacityMax: 1,
            optimalCapacity: 1,
            vibes: ['reformer', 'sunlit'],
            noiseLevel: 'Warm Conversation (55-65dB)',
            noiseDb: 59,
            comfortRating: 'Allegro 2 with natural breeze from transom window',
            sightlineSummary: 'Soft natural daylight from east transom window; pleasant cool airflow',
            photoUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 38,
            svg: { shape: 'rect', x: 305, y: 70, width: 45, height: 95 }
          }
        ]
      },
      {
        id: 'back-reformers',
        name: 'Second-Row Reformers (Intimate Space)',
        archetypeId: 'wellness-studio',
        description: 'Slightly set back for guests who prefer more privacy without being on display.',
        vibePills: ['🤫 Lower Pressure Vibe', '✨ Space to Focus', '❄️ Proximity to Fan'],
        indoor: true,
        ambientLighting: 'diffused-courtyard',
        spots: [
          {
            id: 'r-05',
            code: 'REFORMER 05',
            name: 'Row 2 Left Reformer',
            zoneId: 'back-reformers',
            zoneName: 'Second-Row Reformers (Intimate Space)',
            capacityMin: 1,
            capacityMax: 1,
            optimalCapacity: 1,
            vibes: ['reformer', 'intimate'],
            noiseLevel: 'Whisper Soft (<55dB)',
            noiseDb: 55,
            comfortRating: 'Allegro 2 with extra lumbar cushion option',
            sightlineSummary: 'Private angle, unobtrusive view of coach without front-row exposure',
            photoUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 35,
            svg: { shape: 'rect', x: 80, y: 195, width: 45, height: 95 }
          },
          {
            id: 'r-06',
            code: 'REFORMER 06',
            name: 'Row 2 Center Reformer',
            zoneId: 'back-reformers',
            zoneName: 'Second-Row Reformers (Intimate Space)',
            capacityMin: 1,
            capacityMax: 1,
            optimalCapacity: 1,
            vibes: ['reformer', 'acoustic-quiet'],
            noiseLevel: 'Warm Conversation (55-65dB)',
            noiseDb: 57,
            comfortRating: 'Allegro 2 with soft leather straps',
            sightlineSummary: 'Perfect middle ground between mirror feedback and relaxed pacing',
            photoUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 35,
            svg: { shape: 'rect', x: 190, y: 195, width: 45, height: 95 }
          },
          {
            id: 'r-07',
            code: 'REFORMER 07',
            name: 'Row 2 Right Reformer',
            zoneId: 'back-reformers',
            zoneName: 'Second-Row Reformers (Intimate Space)',
            capacityMin: 1,
            capacityMax: 1,
            optimalCapacity: 1,
            vibes: ['reformer', 'intimate'],
            noiseLevel: 'Whisper Soft (<55dB)',
            noiseDb: 55,
            comfortRating: 'Allegro 2 with gentle air breeze',
            sightlineSummary: 'Quiet right flank near the filtered bamboo water fountain',
            photoUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 35,
            svg: { shape: 'rect', x: 305, y: 195, width: 45, height: 95 }
          }
        ]
      },
      {
        id: 'infrared-pods',
        name: 'Private Infrared & Thermal Pods',
        archetypeId: 'wellness-studio',
        description: 'Individual red-cedar thermal suites with chromotherapy, bluetooth audio, and private rainfall shower.',
        vibePills: ['🔥 158°F Full-Spectrum IR', '🎧 Private Audio Stream', '🚿 En-Suite Shower'],
        indoor: true,
        ambientLighting: 'amber-glow',
        spots: [
          {
            id: 'pod-a',
            code: 'POD ALPHA',
            name: 'Cedar Infrared Thermal Suite A',
            zoneId: 'infrared-pods',
            zoneName: 'Private Infrared & Thermal Pods',
            capacityMin: 1,
            capacityMax: 2,
            optimalCapacity: 1,
            vibes: ['infrared', 'intimate', 'acoustic-quiet', 'power-outlet'],
            noiseLevel: 'Whisper Soft (<55dB)',
            noiseDb: 40,
            comfortRating: 'Ergonomic Western Red Cedar Recliner',
            sightlineSummary: 'Complete private suite with frosted acoustic glass door and ambient dimming',
            photoUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 45,
            svg: { shape: 'rect', x: 410, y: 70, width: 110, height: 105 }
          },
          {
            id: 'pod-b',
            code: 'POD BETA',
            name: 'Contrast Plunge & Infrared Suite B',
            zoneId: 'infrared-pods',
            zoneName: 'Private Infrared & Thermal Pods',
            capacityMin: 1,
            capacityMax: 2,
            optimalCapacity: 2,
            vibes: ['infrared', 'intimate', 'acoustic-quiet'],
            noiseLevel: 'Whisper Soft (<55dB)',
            noiseDb: 42,
            comfortRating: 'Twin Cedar Loungers + 48°F Cold Plunge Tub',
            sightlineSummary: 'Designed for couples or friends: infrared sweat followed by private icy dip',
            photoUrl: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 60,
            svg: { shape: 'rect', x: 410, y: 200, width: 110, height: 105 }
          }
        ]
      }
    ]
  },
  {
    id: 'creative-padel',
    name: 'Atelier 9 & Baseline Club',
    tagline: 'Championship panoramic padel courts, infinity cyclorama & audio suites',
    heroSerif: 'Reserve competition glass courts or film cycloramas with instant team cost-split.',
    categoryBadge: '🏛️ Creative Studio & Padel Court',
    defaultPartySize: 4,
    currency: '$',
    priceNote: 'Split billing available • 15-min group hold locks court for teammates',
    curatedAddOns: [
      {
        id: 'padel-rackets-balls',
        title: 'Babolat Pro Carbon Rackets (Set of 4) + Fresh Cans',
        price: 24,
        badge: '🎾 Pro Equipment',
        description: 'Pre-strung tournament rackets & pressure-tested balls waiting on your court bench',
        category: 'gear'
      },
      {
        id: 'lighting-aputure',
        title: 'Aputure 600d Pro Lighting Grid Pre-Rig',
        price: 65,
        badge: '💡 Studio Gear',
        description: '3-point daylight overhead softbox rig calibrated and patched to DMX iPad',
        category: 'gear'
      },
      {
        id: 'refreshment-cooler',
        title: 'Electrolyte & Cold Brew Bar Tub',
        price: 32,
        badge: '🧊 Court Refresh',
        description: 'Chilled iced towels, coconut waters, craft sodas & double-shot cold brews',
        category: 'gear'
      }
    ],
    hospitalityPrompts: {
      occasions: [
        { id: 'tournament-match', label: '🎾 Competitive Match Play', icon: '🎾', prompt: 'Turn on LED scoreboard and high-definition replay camera' },
        { id: 'commercial-shoot', label: '🎬 Commercial Video Production', icon: '🎬', prompt: 'Studio loading bay access and 3-phase 60A power hookup' },
        { id: 'casual-clinic', label: '🤝 Social Friendly Match', icon: '🤝', prompt: 'Music playlist streaming to court Bluetooth horns' },
        { id: 'podcast-guest', label: '🎙️ VIP Podcast Interview', icon: '🎙️', prompt: 'Shure SM7B mics sterilized with headphone monitors' }
      ],
      comforts: [
        { id: 'ball-machine', label: '🤖 Ball Machine Pre-Loaded', icon: '🤖', prompt: 'Spinfire Pro machine positioned on baseline' },
        { id: 'ac-max', label: '❄️ Sub-Zero Court A/C', icon: '❄️', prompt: 'Pre-chill court enclosure to 68°F before session' },
        { id: 'split-tab-host', label: '💳 4-Way Tab Split Enabled', icon: '💳', prompt: 'Micro-hold link automatically sent to other 3 players' }
      ]
    },
    sampleVipGuest: {
      name: 'Marcus Sterling (Baseline Squad)',
      streak: 12,
      notes: '12-week recurring booking. Prefers Court 1 (Panoramic Glass), Babolat carbon demo rackets.',
      preferences: ['Court 1', 'Sub-Zero A/C', 'Fresh Wilson Pro balls']
    },
    zones: [
      {
        id: 'padel-courts',
        name: 'Panoramic Glass Padel Courts',
        archetypeId: 'creative-padel',
        description: 'Mondo Supercourt XN turf with 12mm tempered safety glass walls and shadowless 400-lux LED masts.',
        vibePills: ['🎾 Mondo Pro Turf', '🏟️ 12mm Panoramic Glass', '⚡ Split-Cost Teammate Invites'],
        indoor: true,
        ambientLighting: 'studio-lumens',
        spots: [
          {
            id: 'court-01',
            code: 'COURT 01',
            name: 'Stadium Glass Padel Court (Center Court)',
            zoneId: 'padel-courts',
            zoneName: 'Panoramic Glass Padel Courts',
            capacityMin: 2,
            capacityMax: 4,
            optimalCapacity: 4,
            vibes: ['court-glass', 'high-energy'],
            noiseLevel: 'Lively Buzz (65-75dB)',
            noiseDb: 72,
            comfortRating: 'Mondo Supercourt XN Turf & Glass Sightlines',
            sightlineSummary: 'Center showcase court with automated 4K replay recording and digital scoreboard',
            photoUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 60,
            svg: { shape: 'rect', x: 60, y: 70, width: 140, height: 110 }
          },
          {
            id: 'court-02',
            code: 'COURT 02',
            name: 'North Glass Padel Court',
            zoneId: 'padel-courts',
            zoneName: 'Panoramic Glass Padel Courts',
            capacityMin: 2,
            capacityMax: 4,
            optimalCapacity: 4,
            vibes: ['court-glass', 'sunlit'],
            noiseLevel: 'Lively Buzz (65-75dB)',
            noiseDb: 70,
            comfortRating: 'Pro Turf with adjacent shaded players lounge',
            sightlineSummary: 'Soft north diffuse skylight; private court entrance directly from locker suites',
            photoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 60,
            svg: { shape: 'rect', x: 60, y: 200, width: 140, height: 110 }
          }
        ]
      },
      {
        id: 'creative-studios',
        name: 'Infinite Cyclorama & Audio Suites',
        archetypeId: 'creative-padel',
        description: 'Two-wall seamless white cyclorama studio plus broadcast-grade acoustic podcast suite.',
        vibePills: ['🎬 2-Wall White Cyc', '🎙️ Treated Broadcast Sound', '💡 Overhead Motorized Grid'],
        indoor: true,
        ambientLighting: 'studio-lumens',
        spots: [
          {
            id: 'cyc-a',
            code: 'CYC STUDIO A',
            name: 'Infinite 2-Wall White Cyclorama (30x25ft)',
            zoneId: 'creative-studios',
            zoneName: 'Infinite Cyclorama & Audio Suites',
            capacityMin: 2,
            capacityMax: 12,
            optimalCapacity: 6,
            vibes: ['acoustics-treated', 'power-outlet', 'high-energy'],
            noiseLevel: 'Whisper Soft (<55dB)',
            noiseDb: 44,
            comfortRating: 'Seamless cove with rolling client lounge & hair/makeup station',
            sightlineSummary: 'Full blackout curtains or daylight north clerestory windows; 60A distro box',
            photoUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 95,
            svg: { shape: 'rect', x: 230, y: 70, width: 150, height: 110 }
          },
          {
            id: 'podcast-01',
            code: 'PODCAST 01',
            name: 'Acoustic Broadcast Suite (4 Mics)',
            zoneId: 'creative-studios',
            zoneName: 'Infinite Cyclorama & Audio Suites',
            capacityMin: 1,
            capacityMax: 5,
            optimalCapacity: 4,
            vibes: ['acoustics-treated', 'intimate', 'power-outlet'],
            noiseLevel: 'Whisper Soft (<55dB)',
            noiseDb: 35,
            comfortRating: 'Acoustic slatted walnut panels with Herman Miller swivel chairs',
            sightlineSummary: 'Zero street flutter, dedicated Rodecaster Pro II audio desk & 4K PTZ cameras',
            photoUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 50,
            svg: { shape: 'rect', x: 230, y: 200, width: 150, height: 110 }
          }
        ]
      },
      {
        id: 'espresso-lounge',
        name: 'Clubhouse Mezzanine & Espresso Bar',
        archetypeId: 'creative-padel',
        description: 'Elevated mezzanine overlooking Court 1 and Cyc A. Specialty espresso, laptop bar & lockers.',
        vibePills: ['☕ La Marzocco Espresso', '🔌 Gigabit WiFi & Power', '👀 Overlooks Court 1'],
        indoor: true,
        ambientLighting: 'direct-sun',
        spots: [
          {
            id: 'l-01',
            code: 'MEZZANINE 01',
            name: 'Court Overlook Banquette',
            zoneId: 'espresso-lounge',
            zoneName: 'Clubhouse Mezzanine & Espresso Bar',
            capacityMin: 2,
            capacityMax: 6,
            optimalCapacity: 4,
            vibes: ['power-outlet', 'high-energy', 'sunlit'],
            noiseLevel: 'Warm Conversation (55-65dB)',
            noiseDb: 64,
            comfortRating: 'Saddle Leather Banquette with walnut laptop tables',
            sightlineSummary: 'Birdseye view of Court 1 matches and studio bustle; private high-speed WiFi node',
            photoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 20,
            svg: { shape: 'rect', x: 410, y: 70, width: 110, height: 110 }
          },
          {
            id: 'l-02',
            code: 'MEZZANINE 02',
            name: 'Soundproof Call Alcove',
            zoneId: 'espresso-lounge',
            zoneName: 'Clubhouse Mezzanine & Espresso Bar',
            capacityMin: 1,
            capacityMax: 2,
            optimalCapacity: 1,
            vibes: ['acoustics-treated', 'intimate', 'power-outlet'],
            noiseLevel: 'Whisper Soft (<55dB)',
            noiseDb: 42,
            comfortRating: 'Framery acoustic phone booth with desk & ergonomic stool',
            sightlineSummary: 'Take urgent client calls or pitch meetings before or after your match',
            photoUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
            priceDeposit: 15,
            svg: { shape: 'rect', x: 410, y: 200, width: 110, height: 110 }
          }
        ]
      }
    ]
  }
];
