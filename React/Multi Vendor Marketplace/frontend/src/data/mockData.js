// Curated Multi-Vendor Marketplace Seed Data
// Aligned with Laravel Database Schema & Strict Integer-Cents Arithmetic

export const INITIAL_VENDORS = [
  {
    id: 'ven-koto-01',
    user_id: 'usr-koto-01',
    shop_name: 'Atelier Koto',
    slug: 'atelier-koto',
    logo_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=160&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1400&auto=format&fit=crop&q=80',
    story_bio: 'Generational ceramic studio based in Kyoto, Japan. We blend 400-year-old stoneware wood-firing traditions with contemporary minimalist tabletop ergonomics. Every piece is thrown by hand from local Shigaraki clay.',
    origin_country: 'JP',
    origin_city: 'Kyoto, Japan',
    commission_rate_bps: 1000, // 10.00%
    free_shipping_threshold_cents: 7500, // $75.00
    flat_shipping_rate_cents: 800, // $8.00
    avg_ship_hours: 24,
    on_time_ship_pct: 99.2,
    response_time_text: '< 2 hrs',
    rating_avg: 4.96,
    reviews_count: 418,
    stripe_connect_account_id: 'acct_1NkotoKYOTO992',
    is_vacation_mode: false,
    vacation_return_date: 'Nov 12, 2026',
    status: 'active',
    tier: 'Maker Partner',
    badges: ['⚡ Ships in 24h', '★ 4.96 Top Studio', '✨ Shigaraki Clay'],
    escrow_balance_cents: 184000, // $1,840.00
    available_balance_cents: 362000, // $3,620.00
  },
  {
    id: 'ven-botanica-02',
    user_id: 'usr-botanica-02',
    shop_name: 'Lisbon Botanica',
    slug: 'lisbon-botanica',
    logo_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=160&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1400&auto=format&fit=crop&q=80',
    story_bio: 'Wild-harvested cold-pressed botanical oils, raw beeswax candles, and artisanal room fragrances crafted in small batches along the sun-drenched Sintra hills outside Lisbon.',
    origin_country: 'PT',
    origin_city: 'Lisbon, Portugal',
    commission_rate_bps: 1000, // 10.00%
    free_shipping_threshold_cents: 5000, // $50.00
    flat_shipping_rate_cents: 600, // $6.00
    avg_ship_hours: 24,
    on_time_ship_pct: 98.4,
    response_time_text: '< 1 hr',
    rating_avg: 4.92,
    reviews_count: 312,
    stripe_connect_account_id: 'acct_1NlisbonBOTANICA11',
    is_vacation_mode: false,
    vacation_return_date: null,
    status: 'active',
    tier: 'Maker Partner',
    badges: ['⚡ Ships in 24h', '🌿 Wild Harvested', '★ 4.92 Top Rated'],
    escrow_balance_cents: 98000, // $980.00
    available_balance_cents: 241050, // $2,410.50
  },
  {
    id: 'ven-nordic-03',
    user_id: 'usr-nordic-03',
    shop_name: 'Nordic Loom Studio',
    slug: 'nordic-loom',
    logo_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=160&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1528458876885-544243324950?w=1400&auto=format&fit=crop&q=80',
    story_bio: 'Hand-loomed organic Merino wool throws, stone-washed European flax table linens, and raw canvas totes tailored in Bergen, Norway. Made to endure generations of cold winters.',
    origin_country: 'NO',
    origin_city: 'Bergen, Norway',
    commission_rate_bps: 800, // 8.00% (Pro Tier Vendor)
    free_shipping_threshold_cents: 12000, // $120.00
    flat_shipping_rate_cents: 1200, // $12.00
    avg_ship_hours: 36,
    on_time_ship_pct: 97.8,
    response_time_text: '< 3 hrs',
    rating_avg: 4.89,
    reviews_count: 195,
    stripe_connect_account_id: 'acct_1NnordicLOOM441',
    is_vacation_mode: false,
    vacation_return_date: null,
    status: 'active',
    tier: 'Pro Studio Tier',
    badges: ['🐑 100% Organic Merino', '★ 4.89 Verified', '🌱 OEKO-TEX'],
    escrow_balance_cents: 245000, // $2,450.00
    available_balance_cents: 489000, // $4,890.00
  },
  {
    id: 'ven-forma-04',
    user_id: 'usr-forma-04',
    shop_name: 'Forma Studio Milano',
    slug: 'forma-milano',
    logo_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=160&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&auto=format&fit=crop&q=80',
    story_bio: 'Architectural cast bronze, turned solid brass stationery, and sculptural desk objets designed and hand-finished in the historic Brera design district of Milan.',
    origin_country: 'IT',
    origin_city: 'Milan, Italy',
    commission_rate_bps: 1000, // 10.00%
    free_shipping_threshold_cents: 9000, // $90.00
    flat_shipping_rate_cents: 1000, // $10.00
    avg_ship_hours: 24,
    on_time_ship_pct: 99.4,
    response_time_text: '< 1 hr',
    rating_avg: 4.98,
    reviews_count: 540,
    stripe_connect_account_id: 'acct_1NformaMILANO883',
    is_vacation_mode: false,
    vacation_return_date: null,
    status: 'active',
    tier: 'Maker Partner',
    badges: ['⚡ Ships in 24h', '★ 4.98 Top Rated', '🏛️ Cast Solid Bronze'],
    escrow_balance_cents: 142000, // $1,420.00
    available_balance_cents: 512000, // $5,120.00
  }
];

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-koto-01',
    vendor_id: 'ven-koto-01',
    category: 'Home & Ceramics',
    title: 'Hasami Stoneware Pour-Over Dripper & Server',
    slug: 'hasami-stoneware-pour-over-dripper-server',
    description: 'Carved from high-density Amakusa ceramic stone and clay from Kyushu. Features a 60-degree internal rib geometry engineered for smooth extraction and optimal thermal mass.',
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'published',
    rating_avg: 4.95,
    reviews_count: 128,
    provenance_badge: '⚡ Ships in 24h',
    variants: [
      {
        id: 'var-koto-01a',
        sku: 'KTO-DRIP-SLT-500',
        title: '500ml / Natural Slate Glaze',
        attributes: { size: '500ml', color: 'Natural Slate' },
        price_cents: 6800,
        compare_at_price_cents: 7800,
        stock_quantity: 12,
        velocity_days_left: 4,
        weight_grams: 620
      },
      {
        id: 'var-koto-01b',
        sku: 'KTO-DRIP-OAK-500',
        title: '500ml / Smoked Ash Wood & White',
        attributes: { size: '500ml', color: 'Smoked Ash' },
        price_cents: 7400,
        compare_at_price_cents: null,
        stock_quantity: 6,
        velocity_days_left: 2,
        weight_grams: 640
      },
      {
        id: 'var-koto-01c',
        sku: 'KTO-DRIP-SLT-800',
        title: '800ml Large / Natural Slate Glaze',
        attributes: { size: '800ml', color: 'Natural Slate' },
        price_cents: 8600,
        compare_at_price_cents: 9400,
        stock_quantity: 18,
        velocity_days_left: 7,
        weight_grams: 850
      }
    ],
    dimensional_reviews: {
      sizing: 'True to Size',
      craftsmanship: 5.0,
      packaging_care: 4.9,
      runs_measure: { small: 2, true_to_size: 96, large: 2 }
    },
    sample_reviews: [
      {
        author: 'Evelyn V.',
        verified: true,
        rating: 5,
        date: '2 days ago',
        comment: 'The tactile texture of the unglazed outer rim feels wonderful in the hand. Pours with zero drip. Packed with double honeycomb padding.',
        photo: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'prod-koto-02',
    vendor_id: 'ven-koto-01',
    category: 'Home & Ceramics',
    title: 'Wabi-Sabi Stoneware Matcha Chawan Bowl',
    slug: 'wabi-sabi-stoneware-matcha-chawan-bowl',
    description: 'Wheel-thrown in Kyoto using iron-rich terracotta clay. Coated with an organic wood-ash glaze that crackles uniquely during 72-hour kiln reduction.',
    images: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'published',
    rating_avg: 4.98,
    reviews_count: 84,
    provenance_badge: '✨ Shigaraki Kiln',
    variants: [
      {
        id: 'var-koto-02a',
        sku: 'KTO-CHW-ASH-12',
        title: '12cm / Wood-Ash Crackle',
        attributes: { size: '12cm', color: 'Wood-Ash' },
        price_cents: 5400,
        compare_at_price_cents: 6000,
        stock_quantity: 8,
        velocity_days_left: 3,
        weight_grams: 390
      },
      {
        id: 'var-koto-02b',
        sku: 'KTO-CHW-IRN-12',
        title: '12cm / Iron Matte Black',
        attributes: { size: '12cm', color: 'Matte Black' },
        price_cents: 5800,
        compare_at_price_cents: null,
        stock_quantity: 4,
        velocity_days_left: 1,
        weight_grams: 410
      }
    ],
    dimensional_reviews: {
      sizing: 'True to Size',
      craftsmanship: 5.0,
      packaging_care: 5.0,
      runs_measure: { small: 0, true_to_size: 98, large: 2 }
    }
  },
  {
    id: 'prod-koto-03',
    vendor_id: 'ven-koto-01',
    category: 'Home & Ceramics',
    title: 'Hand-Carved Hinoki Wood Coaster Set (Pair)',
    slug: 'hand-carved-hinoki-wood-coaster-set',
    description: 'Complementary tabletop accent carved from aromatic Japanese Cypress (Hinoki). Natural water-resistant cedar grain with natural beeswax polish. Ideal cart add-on.',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'published',
    rating_avg: 4.92,
    reviews_count: 67,
    provenance_badge: '🌱 Natural Cypress',
    is_add_on: true,
    variants: [
      {
        id: 'var-koto-03a',
        sku: 'KTO-CST-HNK-2PK',
        title: 'Standard (Set of 2)',
        attributes: { size: 'Set of 2', color: 'Natural Hinoki' },
        price_cents: 1400, // $14.00 - Perfect add-on for free shipping!
        compare_at_price_cents: null,
        stock_quantity: 45,
        velocity_days_left: 15,
        weight_grams: 110
      }
    ],
    dimensional_reviews: {
      sizing: 'True to Size',
      craftsmanship: 4.9,
      packaging_care: 4.8,
      runs_measure: { small: 0, true_to_size: 100, large: 0 }
    }
  },
  {
    id: 'prod-botanica-01',
    vendor_id: 'ven-botanica-02',
    category: 'Pantry & Apothecary',
    title: 'Sintra Pine Needle & Wild Bergamot Beeswax Candle',
    slug: 'sintra-pine-wild-bergamot-beeswax-candle',
    description: 'Poured into heavy amber laboratory glass with an unbleached organic cotton wick. Infused with wild-harvested Sintra pine resins, sweet orange rind, and French bergamot essential oils.',
    images: [
      'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'published',
    rating_avg: 4.94,
    reviews_count: 215,
    provenance_badge: '🌿 Pure Beeswax',
    variants: [
      {
        id: 'var-bot-01a',
        sku: 'BOT-CNDL-PNE-280',
        title: '280g / Amber Glass (65h Burn)',
        attributes: { size: '280g', scent: 'Sintra Pine & Bergamot' },
        price_cents: 3800,
        compare_at_price_cents: 4200,
        stock_quantity: 14,
        velocity_days_left: 5,
        weight_grams: 520
      },
      {
        id: 'var-bot-01b',
        sku: 'BOT-CNDL-PNE-500',
        title: '500g Large / Three-Wick Ceramic Pot',
        attributes: { size: '500g', scent: 'Sintra Pine & Bergamot' },
        price_cents: 6200,
        compare_at_price_cents: null,
        stock_quantity: 7,
        velocity_days_left: 3,
        weight_grams: 880
      }
    ],
    dimensional_reviews: {
      sizing: 'True to Size',
      craftsmanship: 4.9,
      packaging_care: 5.0,
      runs_measure: { small: 0, true_to_size: 97, large: 3 }
    }
  },
  {
    id: 'prod-botanica-02',
    vendor_id: 'ven-botanica-02',
    category: 'Pantry & Apothecary',
    title: 'Cold-Pressed Wild Fig Leaf & Neroli Botanical Mist',
    slug: 'cold-pressed-wild-fig-leaf-neroli-botanical-mist',
    description: 'Refreshing linen and personal atmosphere mist distilled from organic Portuguese fig leaves and bitter orange blossom. Cart add-on favorite.',
    images: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'published',
    rating_avg: 4.88,
    reviews_count: 94,
    provenance_badge: '⚡ Ships in 24h',
    is_add_on: true,
    variants: [
      {
        id: 'var-bot-02a',
        sku: 'BOT-MST-FIG-100',
        title: '100ml / Frosted Glass Atomizer',
        attributes: { size: '100ml', scent: 'Wild Fig & Neroli' },
        price_cents: 1800, // $18.00 add-on
        compare_at_price_cents: null,
        stock_quantity: 26,
        velocity_days_left: 9,
        weight_grams: 220
      }
    ],
    dimensional_reviews: {
      sizing: 'True to Size',
      craftsmanship: 4.9,
      packaging_care: 4.9,
      runs_measure: { small: 0, true_to_size: 100, large: 0 }
    }
  },
  {
    id: 'prod-nordic-01',
    vendor_id: 'ven-nordic-03',
    category: 'Apparel & Textiles',
    title: 'Heirloom Organic Merino Wool Waffle Blanket',
    slug: 'heirloom-organic-merino-wool-waffle-blanket',
    description: 'Spun from certified ethical Scandinavian merino wool. The structured thermal waffle weave retains warmth while maintaining breathable air circulation throughout the night.',
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1528458876885-544243324950?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'published',
    rating_avg: 4.91,
    reviews_count: 142,
    provenance_badge: '🐑 Bergen Loomed',
    variants: [
      {
        id: 'var-nor-01a',
        sku: 'NOR-WFL-OAT-THW',
        title: 'Throw (140x190cm) / Oat Milk',
        attributes: { size: 'Throw 140x190cm', color: 'Oat Milk' },
        price_cents: 13500, // $135.00
        compare_at_price_cents: 15000,
        stock_quantity: 8,
        velocity_days_left: 3,
        weight_grams: 1200
      },
      {
        id: 'var-nor-01b',
        sku: 'NOR-WFL-CHRC-THW',
        title: 'Throw (140x190cm) / Charcoal Heather',
        attributes: { size: 'Throw 140x190cm', color: 'Charcoal Heather' },
        price_cents: 13500,
        compare_at_price_cents: null,
        stock_quantity: 5,
        velocity_days_left: 2,
        weight_grams: 1200
      },
      {
        id: 'var-nor-01c',
        sku: 'NOR-WFL-OAT-KNG',
        title: 'King (220x240cm) / Oat Milk',
        attributes: { size: 'King 220x240cm', color: 'Oat Milk' },
        price_cents: 19500,
        compare_at_price_cents: null,
        stock_quantity: 3,
        velocity_days_left: 1,
        weight_grams: 1850
      }
    ],
    dimensional_reviews: {
      sizing: 'True to Size',
      craftsmanship: 5.0,
      packaging_care: 4.9,
      runs_measure: { small: 0, true_to_size: 94, large: 6 }
    }
  },
  {
    id: 'prod-nordic-02',
    vendor_id: 'ven-nordic-03',
    category: 'Apparel & Textiles',
    title: 'Stone-Washed French Flax Linen Table Napkins (Set of 4)',
    slug: 'stone-washed-french-flax-linen-table-napkins',
    description: 'Pre-washed with volcanic pumice stone for supreme softness without chemical treatments. Natural unhemmed mitered corner craftsmanship.',
    images: [
      'https://images.unsplash.com/photo-1528458876885-544243324950?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'published',
    rating_avg: 4.87,
    reviews_count: 53,
    provenance_badge: '🌱 Pure Flax',
    is_add_on: true,
    variants: [
      {
        id: 'var-nor-02a',
        sku: 'NOR-NPK-SGE-4PK',
        title: 'Set of 4 / Sage Green',
        attributes: { size: '4-Pack (45x45cm)', color: 'Sage Green' },
        price_cents: 2800, // $28.00 add-on
        compare_at_price_cents: 3400,
        stock_quantity: 19,
        velocity_days_left: 6,
        weight_grams: 280
      }
    ],
    dimensional_reviews: {
      sizing: 'True to Size',
      craftsmanship: 4.8,
      packaging_care: 4.9,
      runs_measure: { small: 0, true_to_size: 100, large: 0 }
    }
  },
  {
    id: 'prod-forma-01',
    vendor_id: 'ven-forma-04',
    category: 'Art & Stationery',
    title: 'Architectural Cast Solid Bronze Bookend Obelisk',
    slug: 'architectural-cast-solid-bronze-bookend-obelisk',
    description: 'Lost-wax cast in solid architectural bronze and hand-rubbed with liver of sulfur patina. Weighs 1.4kg to easily anchor large hardcover monographs on your shelf.',
    images: [
      'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'published',
    rating_avg: 4.99,
    reviews_count: 88,
    provenance_badge: '🏛️ Brera Cast Bronze',
    variants: [
      {
        id: 'var-frm-01a',
        sku: 'FRM-OBL-BRZ-SGL',
        title: 'Single Obelisk / Raw Brushed Bronze',
        attributes: { style: 'Single Obelisk', finish: 'Raw Brushed Bronze' },
        price_cents: 9500, // $95.00
        compare_at_price_cents: null,
        stock_quantity: 7,
        velocity_days_left: 3,
        weight_grams: 1400
      },
      {
        id: 'var-frm-01b',
        sku: 'FRM-OBL-OXD-SGL',
        title: 'Single Obelisk / Oxidized Midnight Black',
        attributes: { style: 'Single Obelisk', finish: 'Oxidized Black' },
        price_cents: 10500,
        compare_at_price_cents: 11500,
        stock_quantity: 4,
        velocity_days_left: 1,
        weight_grams: 1400
      }
    ],
    dimensional_reviews: {
      sizing: 'True to Size',
      craftsmanship: 5.0,
      packaging_care: 5.0,
      runs_measure: { small: 0, true_to_size: 100, large: 0 }
    }
  }
];

export const CURATED_CROSS_SHOP_BUNDLE = {
  id: 'bundle-autumn-ritual',
  title: 'The Sunday Slow Morning Ritual Lookbook',
  curator: 'Editorial Selection by Atelier & Co.',
  tagline: 'Combine 3 independent studios into a unified tabletop moment. Adds all 3 items to your unified bag with a 15% co-op bundle incentive.',
  banner_image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&auto=format&fit=crop&q=80',
  discount_pct: 15,
  items: [
    {
      product_id: 'prod-koto-01',
      variant_id: 'var-koto-01a',
      vendor_id: 'ven-koto-01',
      vendor_name: 'Atelier Koto',
      title: 'Hasami Stoneware Pour-Over Dripper',
      price_cents: 6800,
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80'
    },
    {
      product_id: 'prod-botanica-01',
      variant_id: 'var-bot-01a',
      vendor_id: 'ven-botanica-02',
      vendor_name: 'Lisbon Botanica',
      title: 'Sintra Pine Needle Beeswax Candle',
      price_cents: 3800,
      image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=300&auto=format&fit=crop&q=80'
    },
    {
      product_id: 'prod-nordic-02',
      variant_id: 'var-nor-02a',
      vendor_id: 'ven-nordic-03',
      vendor_name: 'Nordic Loom Studio',
      title: 'Stone-Washed Linen Napkins (4-Pack)',
      price_cents: 2800,
      image: 'https://images.unsplash.com/photo-1528458876885-544243324950?w=300&auto=format&fit=crop&q=80'
    }
  ]
};

export const INITIAL_ORDERS = [
  {
    id: 'ord-mkt-8492',
    order_number: 'MKT-2026-8492',
    buyer: {
      name: 'Sofia Alcantara',
      email: 'sofia.alcantara@designstudio.io',
      address: '742 Evergreen Terrace, Portland, OR 97201'
    },
    currency: 'USD',
    created_at: '2026-10-27T14:22:00Z',
    payment_status: 'paid',
    payment_intent_id: 'pi_3MKT8492UnifiedStripe',
    items_subtotal_cents: 14200,
    shipping_total_cents: 600, // Atelier Koto unlocked FREE shipping! Lisbon flat $6.00
    tax_total_cents: 1184,
    discount_total_cents: 0,
    grand_total_cents: 15984, // $159.84
    sub_orders: [
      {
        id: 'sub-8492-v1',
        sub_order_number: 'MKT-2026-8492-V1',
        parent_order_id: 'ord-mkt-8492',
        vendor_id: 'ven-koto-01',
        shop_name: 'Atelier Koto',
        shop_origin: 'Kyoto, Japan',
        fulfillment_status: 'shipped', // In Transit
        referral_source: 'marketplace', // 10%
        carrier_name: 'DHL Express Japan',
        tracking_number: 'DHL-JP-9482710492',
        shipped_at: '2026-10-27T18:40:00Z',
        delivered_at: null,
        escrow_release_at: '2026-10-31T18:40:00Z', // Releases 3 days post delivery or scan
        gross_items_cents: 10400, // $104.00 ($68 + $36)
        shipping_charged_cents: 0, // Free threshold unlocked!
        platform_commission_bps: 1000,
        platform_commission_cents: 1040, // $10.40
        gateway_fee_allocation_cents: 331, // $3.31
        vendor_net_payout_cents: 9029, // $90.29 guaranteed
        escrow_status: 'held_in_escrow',
        sla_hours_remaining: null,
        items: [
          {
            title: 'Hasami Stoneware Pour-Over Dripper',
            variant: '500ml / Natural Slate Glaze',
            quantity: 1,
            unit_price_cents: 6800,
            image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=160&auto=format&fit=crop&q=80'
          },
          {
            title: 'Wabi-Sabi Stoneware Matcha Chawan Bowl',
            variant: '12cm / Wood-Ash Crackle',
            quantity: 1,
            unit_price_cents: 3600,
            image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=160&auto=format&fit=crop&q=80'
          }
        ]
      },
      {
        id: 'sub-8492-v2',
        sub_order_number: 'MKT-2026-8492-V2',
        parent_order_id: 'ord-mkt-8492',
        vendor_id: 'ven-botanica-02',
        shop_name: 'Lisbon Botanica',
        shop_origin: 'Lisbon, Portugal',
        fulfillment_status: 'confirmed', // Preparing at Studio
        referral_source: 'vendor_direct', // 0% Bring-Your-Own-Customer!
        carrier_name: 'CTT Correios Portugal',
        tracking_number: null,
        shipped_at: null,
        delivered_at: null,
        escrow_release_at: null,
        gross_items_cents: 3800, // $38.00
        shipping_charged_cents: 600, // $6.00
        platform_commission_bps: 0, // 0% Referral Link!
        platform_commission_cents: 0,
        gateway_fee_allocation_cents: 140, // $1.40
        vendor_net_payout_cents: 4260, // $38 + $6 - $1.40 = $42.60
        escrow_status: 'pending_fulfillment',
        sla_hours_remaining: 14, // 14 hours to fulfill
        items: [
          {
            title: 'Sintra Pine Needle Beeswax Candle',
            variant: '280g / Amber Glass',
            quantity: 1,
            unit_price_cents: 3800,
            image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=160&auto=format&fit=crop&q=80'
          }
        ]
      }
    ]
  }
];

export const INITIAL_LEDGER_ENTRIES = [
  {
    id: 'ledg-001',
    vendor_id: 'ven-koto-01',
    sub_order_id: 'sub-8492-v1',
    type: 'sale_escrow_credit',
    amount_cents: 9029, // +$90.29
    balance_bucket: 'escrow_pending',
    stripe_transfer_id: null,
    description: 'Sale funds locked in escrow for Sub-Order #MKT-2026-8492-V1 (Releases upon carrier delivery scan)',
    created_at: '2026-10-27T14:25:00Z'
  },
  {
    id: 'ledg-002',
    vendor_id: 'ven-koto-01',
    sub_order_id: 'sub-7301-v1',
    type: 'escrow_released',
    amount_cents: 11420, // +$114.20
    balance_bucket: 'available',
    stripe_transfer_id: 'tr_1N9482StripeConnectRelease',
    description: 'Escrow auto-released: Sub-Order #MKT-2026-7301-V1 verified delivered by DHL Express',
    created_at: '2026-10-26T09:12:00Z'
  },
  {
    id: 'ledg-003',
    vendor_id: 'ven-koto-01',
    sub_order_id: 'sub-6912-v1',
    type: 'payout_withdrawal',
    amount_cents: -250000, // -$2,500.00
    balance_bucket: 'available',
    stripe_transfer_id: 'po_19284BankSweepKyoto',
    description: 'Automated bank payout sweep to Chase Commercial Bank (•••• 4910)',
    created_at: '2026-10-25T03:00:00Z'
  }
];

export const INITIAL_COMMISSION_TIERS = [
  { id: 'tier-std', name: 'Standard Maker', rate_bps: 1000, rate_pct: '10.0%', description: 'Default marketplace rate with full escrow & discovery support' },
  { id: 'tier-pro', name: 'High-Volume Pro Studio', rate_bps: 800, rate_pct: '8.0%', description: 'Unlocked at > $10,000 monthly sales with > 98% SLA' },
  { id: 'tier-elec', name: 'Specialty Craft Electronics', rate_bps: 500, rate_pct: '5.0%', description: 'High price-point maker hardware and studio appliances' },
  { id: 'tier-dir', name: 'Bring-Your-Own-Customer Link', rate_bps: 0, rate_pct: '0.0%', description: '0% commission whenever shopper checks out via ?ref=vendor_slug' }
];

export const INITIAL_COOP_CAMPAIGNS = [
  {
    id: 'camp-autumn-2026',
    title: '🍂 Autumn Tableware & Warm Lighting Week',
    slug: 'autumn-design-week',
    discount_pct: 20,
    marketplace_subsidy_pct: 10, // 10% co-funded by marketplace via reduced commission
    vendor_contribution_pct: 10, // 10% margin sacrifice by vendor
    participating_vendors_count: 18,
    status: 'active',
    end_date: 'Nov 04, 2026'
  }
];
