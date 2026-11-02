// ============================================================================
// RESTAURANT, MENU & MODIFIER DATABASE (San Francisco Epicenter)
// Integer-cents financial precision & rich culinary metadata
// ============================================================================

export const INITIAL_RESTAURANTS = [
  {
    id: "rest-001",
    name: "Osteria Mozza",
    slug: "osteria-mozza",
    cuisine_tags: ["Italian", "Artisanal Pasta", "Wood-Fired Pizza"],
    price_tier: "$$",
    is_virtual_kitchen: false,
    origin_badge: "Verified Neighborhood Dining Room — Est. 2018",
    physical_street_address: "6602 Melrose Ave, San Francisco, CA 94103",
    health_score: 99,
    health_grade: "Grade A",
    location: { lat: 37.7749, lng: -122.4194 },
    delivery_polygon: [
      [37.7900, -122.4350],
      [37.7900, -122.4000],
      [37.7600, -122.4000],
      [37.7600, -122.4350]
    ],
    base_prep_minutes: 14,
    current_load_status: "normal", // 'quiet' | 'normal' | 'busy'
    active_ticket_count: 5,
    delivery_fee_cents: 299, // $2.99
    free_delivery_min_cents: 3500, // $35.00
    service_fee_bps: 1000, // 10.00%
    rating_avg: 4.9,
    reviews_count: 1420,
    travel_quality_score: 98, // 98% arrives hot & crispy
    hero_image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    distance_miles: 0.8,
    is_open: true,
    promo_badge: "Spend $35, Save $5",
    description: "Handcrafted Roman pastas, heirloom grains, and 72-hour cold-fermented sourdough pizza from James Beard-honored chefs."
  },
  {
    id: "rest-002",
    name: "Taqueria La Palma",
    slug: "taqueria-la-palma",
    cuisine_tags: ["Mexican", "Street Tacos", "Birria", "Gluten-Free Friendly"],
    price_tier: "$",
    is_virtual_kitchen: false,
    origin_badge: "Mission District Legacy Taqueria — Est. 1993",
    physical_street_address: "2884 24th St, San Francisco, CA 94110",
    health_score: 98,
    health_grade: "Grade A",
    location: { lat: 37.7525, lng: -122.4110 },
    delivery_polygon: [
      [37.7800, -122.4250],
      [37.7800, -122.3950],
      [37.7400, -122.3950],
      [37.7400, -122.4250]
    ],
    base_prep_minutes: 10,
    current_load_status: "quiet",
    active_ticket_count: 2,
    delivery_fee_cents: 199,
    free_delivery_min_cents: 2500,
    service_fee_bps: 900, // 9%
    rating_avg: 4.8,
    reviews_count: 2190,
    travel_quality_score: 96,
    hero_image_url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80",
    distance_miles: 1.2,
    is_open: true,
    promo_badge: "⚡ Free Horchata on orders $30+",
    description: "Stone-ground heritage masa, 12-hour braised Jalisco beef birria, and charred tomatillo salsas made fresh every 2 hours."
  },
  {
    id: "rest-003",
    name: "Tokyo Midnight Noodle Lab",
    slug: "tokyo-midnight-noodle-lab",
    cuisine_tags: ["Japanese", "Ramen", "Craft Gyoza", "Halal Options"],
    price_tier: "$$",
    is_virtual_kitchen: true,
    origin_badge: "Delivery-Only Commissary Kitchen — Central Prep Hub #4",
    physical_street_address: "1350 Folsom St (Bay 4), San Francisco, CA 94103",
    health_score: 96,
    health_grade: "Grade A",
    location: { lat: 37.7730, lng: -122.4120 },
    delivery_polygon: [
      [37.7850, -122.4300],
      [37.7850, -122.4000],
      [37.7550, -122.4000],
      [37.7550, -122.4300]
    ],
    base_prep_minutes: 18,
    current_load_status: "busy",
    active_ticket_count: 14,
    delivery_fee_cents: 349,
    free_delivery_min_cents: 4000,
    service_fee_bps: 1000,
    rating_avg: 4.7,
    reviews_count: 880,
    travel_quality_score: 99, // 2-tier thermal vented broth separation
    hero_image_url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80",
    distance_miles: 0.5,
    is_open: true,
    promo_badge: "$0 Delivery Fee over $40",
    description: "Engineered 18-hour chicken paitan and spicy miso ramen packed in patented double-deck separated thermal bowls to guarantee springy noodles."
  },
  {
    id: "rest-004",
    name: "Green Goddess Botanicals",
    slug: "green-goddess-botanicals",
    cuisine_tags: ["Salads", "Healthy", "Vegan", "High-Protein", "Gluten-Free"],
    price_tier: "$$",
    is_virtual_kitchen: false,
    origin_badge: "Certified Organic Eatery & Urban Greenhouse — Est. 2021",
    physical_street_address: "518 Hayes St, San Francisco, CA 94102",
    health_score: 100,
    health_grade: "Grade A+",
    location: { lat: 37.7765, lng: -122.4245 },
    delivery_polygon: [
      [37.7900, -122.4400],
      [37.7900, -122.4050],
      [37.7600, -122.4050],
      [37.7600, -122.4400]
    ],
    base_prep_minutes: 8,
    current_load_status: "quiet",
    active_ticket_count: 1,
    delivery_fee_cents: 0, // Free delivery promo!
    free_delivery_min_cents: 0,
    service_fee_bps: 800,
    rating_avg: 4.95,
    reviews_count: 640,
    travel_quality_score: 95,
    hero_image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
    distance_miles: 0.9,
    is_open: true,
    promo_badge: "✨ All Delivery Fees Waived This Week",
    description: "Regenerative farm-to-door warm grains, marinated organic tofu, pastured roast chicken, and house cold-pressed dressing pairings."
  },
  {
    id: "rest-005",
    name: "Curry & Spice Co.",
    slug: "curry-and-spice-co",
    cuisine_tags: ["Indian", "Curry", "Halal Certified", "Vegetarian Friendly"],
    price_tier: "$$",
    is_virtual_kitchen: false,
    origin_badge: "Verified Neighborhood Dining Room — Est. 2015",
    physical_street_address: "732 Valencia St, San Francisco, CA 94110",
    health_score: 97,
    health_grade: "Grade A",
    location: { lat: 37.7605, lng: -122.4215 },
    delivery_polygon: [
      [37.7850, -122.4350],
      [37.7850, -122.4000],
      [37.7500, -122.4000],
      [37.7500, -122.4350]
    ],
    base_prep_minutes: 15,
    current_load_status: "normal",
    active_ticket_count: 6,
    delivery_fee_cents: 249,
    free_delivery_min_cents: 3000,
    service_fee_bps: 1000,
    rating_avg: 4.85,
    reviews_count: 1104,
    travel_quality_score: 99,
    hero_image_url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80",
    distance_miles: 1.4,
    is_open: true,
    promo_badge: "Free Garlic Naan on $35+",
    description: "Slow-simmered Punjabi tikka masala, tandoor-blistered rotis, and fragrant saffron basmati rice with certified 100% Halal meats."
  }
];

export const MENU_ITEMS = [
  // --- OSTERIA MOZZA ---
  {
    id: "dish-001",
    restaurant_id: "rest-001",
    category: "Handmade Pasta",
    title: "Rigatoni alla Vodka & Crispy Prosciutto",
    description: "Calabrian chili vodka reduction, San Marzano D.O.P. tomato, double cream, 24-month Parmigiano-Reggiano, topped with crisped prosciutto.",
    base_price_cents: 2200, // $22.00
    calories: 680,
    protein_grams: 26,
    dietary_flags: ["spicy"],
    travel_quality_score: 4.9,
    packaging_note: "Heavy foil heat-lock tray • Maintains 145°F for 35m",
    is_sold_out: false,
    is_featured: true,
    image_url: "https://images.unsplash.com/photo-1621996346565-e3d5d6281729?auto=format&fit=crop&w=800&q=80",
    pairings: [
      { id: "dish-005", name: "Whipped Ricotta & Focaccia", price_cents: 900, reason: "Ordered together 84% of the time" }
    ],
    modifier_groups: [
      {
        id: "mod-pasta-shape",
        name: "Choice of Pasta Shape",
        min_select: 1,
        max_select: 1,
        is_required: true,
        options: [
          { id: "opt-shape-1", name: "Artisanal Bronze-Die Rigatoni", price_delta_cents: 0, calories_delta: 0, is_available: true },
          { id: "opt-shape-2", name: "Gluten-Free Organic Corn & Rice Penne", price_delta_cents: 250, calories_delta: -30, is_available: true },
          { id: "opt-shape-3", name: "Handmade Pappardelle Ribbon (+Fresh Egg)", price_delta_cents: 300, calories_delta: 50, is_available: true }
        ]
      },
      {
        id: "mod-protein-addon",
        name: "Add Chef's Protein",
        min_select: 0,
        max_select: 2,
        is_required: false,
        options: [
          { id: "opt-prot-1", name: "Grilled Fennel Pork Sausage (+14g protein)", price_delta_cents: 450, calories_delta: 190, is_available: true },
          { id: "opt-prot-2", name: "Sauteed Wild Gulf Prawns (+18g protein)", price_delta_cents: 650, calories_delta: 120, is_available: true },
          { id: "opt-prot-3", name: "Double Burrata Crown (Fresh Cream)", price_delta_cents: 400, calories_delta: 150, is_available: true }
        ]
      },
      {
        id: "mod-spice-level",
        name: "Calabrian Chili Heat Level",
        min_select: 1,
        max_select: 1,
        is_required: true,
        options: [
          { id: "opt-heat-1", name: "Mild (Just Warm)", price_delta_cents: 0, calories_delta: 0, is_available: true },
          { id: "opt-heat-2", name: "Traditional Mozza Kick", price_delta_cents: 0, calories_delta: 5, is_available: true },
          { id: "opt-heat-3", name: "Chef's Inferno (Extra Calabrian Chili Oil)", price_delta_cents: 75, calories_delta: 30, is_available: true }
        ]
      }
    ]
  },
  {
    id: "dish-002",
    restaurant_id: "rest-001",
    category: "Wood-Fired Pizza",
    title: "Burrata, Hot Honey & Soppressata Pizza",
    description: "72-hour sourdough crust blistered at 900°F, organic tomato sauce, whole fresh burrata ball, spicy soppressata salami, and habanero clover honey.",
    base_price_cents: 2450,
    calories: 890,
    protein_grams: 34,
    dietary_flags: ["spicy"],
    travel_quality_score: 4.7,
    packaging_note: "Fluted wave-vented carton • Prevents crust sogginess",
    is_sold_out: false,
    is_featured: true,
    image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    pairings: [
      { id: "dish-006", name: "San Pellegrino Blood Orange", price_cents: 400, reason: "Palate-cleansing pairing" }
    ],
    modifier_groups: [
      {
        id: "mod-pizza-portion-split",
        name: "Split-Portion Matrix (Half & Half)",
        min_select: 1,
        max_select: 1,
        is_required: true,
        options: [
          { id: "opt-split-1", name: "Full Pie — Classic Burrata & Hot Honey Soppressata", price_delta_cents: 0, calories_delta: 0, is_available: true },
          { id: "opt-split-2", name: "Half & Half — Left: Soppressata / Right: Wild Mushroom & Fontina", price_delta_cents: 250, calories_delta: -40, is_available: true },
          { id: "opt-split-3", name: "Half & Half — Left: Soppressata / Right: Margherita D.O.P.", price_delta_cents: 0, calories_delta: -60, is_available: true }
        ]
      },
      {
        id: "mod-crust-style",
        name: "Crust Style",
        min_select: 1,
        max_select: 1,
        is_required: true,
        options: [
          { id: "opt-crust-1", name: "Neapolitan High-Hydration (Airy Crust)", price_delta_cents: 0, calories_delta: 0, is_available: true },
          { id: "opt-crust-2", name: "Well-Done / Extra Char", price_delta_cents: 0, calories_delta: 0, is_available: true },
          { id: "opt-crust-3", name: "Cauliflower Herb Crust (Gluten-Free)", price_delta_cents: 400, calories_delta: -180, is_available: true }
        ]
      },
      {
        id: "mod-pizza-drizzle",
        name: "Finishing Drizzles",
        min_select: 0,
        max_select: 3,
        is_required: false,
        options: [
          { id: "opt-drizzle-1", name: "Extra Mike's Hot Honey Side Cup", price_delta_cents: 150, calories_delta: 60, is_available: true },
          { id: "opt-drizzle-2", name: "White Truffle Infused Olive Oil", price_delta_cents: 250, calories_delta: 80, is_available: true },
          { id: "opt-drizzle-3", name: "Fresh Basil & Roasted Garlic Emulsion", price_delta_cents: 175, calories_delta: 50, is_available: true }
        ]
      }
    ]
  },
  {
    id: "dish-003",
    restaurant_id: "rest-001",
    category: "Handmade Pasta",
    title: "Black Truffle Tagliolini & Cultured Butter",
    description: "30-yolk egg pasta strands tossed in Normandy cultured butter, chicken jus, and shaved Norcia black winter truffle.",
    base_price_cents: 2800,
    calories: 740,
    protein_grams: 22,
    dietary_flags: ["vegetarian"],
    travel_quality_score: 4.8,
    packaging_note: "Hermetic seal with separate truffle shaver packet",
    is_sold_out: false,
    is_featured: false,
    image_url: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=800&q=80",
    modifier_groups: []
  },

  // --- TAQUERIA LA PALMA ---
  {
    id: "dish-010",
    restaurant_id: "rest-002",
    category: "Street Tacos",
    title: "Trio of Crispy Quesabirria Tacos with Consomé",
    description: "Slow-braised Jalisco Angus chuck rolled in corn tortillas, griddled in beef tallow with Oaxaca cheese, served with 8oz rich dipping consomé.",
    base_price_cents: 1650,
    calories: 720,
    protein_grams: 42,
    dietary_flags: ["gf", "high-protein"],
    travel_quality_score: 4.8,
    packaging_note: "Perforated foil sleeve keeps shells crisp, broth capped leakproof",
    is_sold_out: false,
    is_featured: true,
    image_url: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80",
    modifier_groups: [
      {
        id: "mod-birria-tortilla",
        name: "Tortilla Choice",
        min_select: 1,
        max_select: 1,
        is_required: true,
        options: [
          { id: "opt-tort-1", name: "Yellow Corn (Crisped on Plancha)", price_delta_cents: 0, calories_delta: 0, is_available: true },
          { id: "opt-tort-2", name: "Blue Corn Heirloom (+Mineral Crisp)", price_delta_cents: 100, calories_delta: 10, is_available: true }
        ]
      },
      {
        id: "mod-birria-salsa",
        name: "Included Salsa Selection",
        min_select: 1,
        max_select: 2,
        is_required: true,
        options: [
          { id: "opt-salsa-1", name: "Salsa Verde (Fire-Roasted Tomatillo)", price_delta_cents: 0, calories_delta: 15, is_available: true },
          { id: "opt-salsa-2", name: "Salsa Roja Habanera (Very Spicy)", price_delta_cents: 0, calories_delta: 20, is_available: true },
          { id: "opt-salsa-3", name: "Creamy Avocado Crema", price_delta_cents: 75, calories_delta: 50, is_available: true }
        ]
      }
    ]
  },
  {
    id: "dish-011",
    restaurant_id: "rest-002",
    category: "Street Tacos",
    title: "Mission Super Burrito with Carne Asada",
    description: "Charcoal-grilled flap steak, Rancho Gordo pinto beans, Mexican red rice, jack cheese, guacamole, and sour cream wrapped in griddled flour tortilla.",
    base_price_cents: 1550,
    calories: 940,
    protein_grams: 48,
    dietary_flags: ["high-protein"],
    travel_quality_score: 4.9,
    packaging_note: "Double parchment + foil wrap • Stays piping hot 40m",
    is_sold_out: false,
    is_featured: false,
    image_url: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80",
    modifier_groups: []
  },

  // --- TOKYO MIDNIGHT NOODLE LAB ---
  {
    id: "dish-020",
    restaurant_id: "rest-003",
    category: "Ramen",
    title: "18-Hour Smoked Chashu Toripaitan Ramen",
    description: "Rich, emulsified chicken paitan broth, thin wheat noodles, 2 thick torch-seared pork belly chashu, ajitsuke tamago egg, menma bamboo, and black garlic oil.",
    base_price_cents: 1950,
    calories: 820,
    protein_grams: 38,
    dietary_flags: ["halal-friendly"],
    travel_quality_score: 4.95,
    packaging_note: "Patented 2-Tier Thermal Bowl • Broth bottom, dry noodles top",
    is_sold_out: false,
    is_featured: true,
    image_url: "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=800&q=80",
    modifier_groups: [
      {
        id: "mod-noodle-firmness",
        name: "Noodle Texture (Katame)",
        min_select: 1,
        max_select: 1,
        is_required: true,
        options: [
          { id: "opt-firm-1", name: "Firm (Recommended for Delivery)", price_delta_cents: 0, calories_delta: 0, is_available: true },
          { id: "opt-firm-2", name: "Standard Al Dente", price_delta_cents: 0, calories_delta: 0, is_available: true },
          { id: "opt-firm-3", name: "Gluten-Free Yam Noodles", price_delta_cents: 200, calories_delta: -120, is_available: true }
        ]
      },
      {
        id: "mod-ramen-addons",
        name: "Extra Ramen Toppings",
        min_select: 0,
        max_select: 3,
        is_required: false,
        options: [
          { id: "opt-ram-1", name: "Extra Ajitama Soft Egg", price_delta_cents: 250, calories_delta: 80, is_available: true },
          { id: "opt-ram-2", name: "Extra Seared Chashu (+15g protein)", price_delta_cents: 450, calories_delta: 160, is_available: true },
          { id: "opt-ram-3", name: "Crispy Garlic Chili Crisp Bomb", price_delta_cents: 150, calories_delta: 65, is_available: true }
        ]
      }
    ]
  },

  // --- GREEN GODDESS BOTANICALS ---
  {
    id: "dish-030",
    restaurant_id: "rest-004",
    category: "Protein Bowls",
    title: "Warm Wild Salmon & Ancient Grains Bowl",
    description: "Pacific wild coho salmon, warm black quinoa, massaged organic tuscan kale, roasted sweet potato, creamy Meyer lemon tahini dressing, toasted pumpkin seeds.",
    base_price_cents: 1850,
    calories: 590,
    protein_grams: 39,
    dietary_flags: ["gf", "high-protein", "halal"],
    travel_quality_score: 4.9,
    packaging_note: "100% Compostable sugarcane bowl • Keeps dressing crisp",
    is_sold_out: false,
    is_featured: true,
    image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    modifier_groups: [
      {
        id: "mod-grain-base",
        name: "Base Grain / Green",
        min_select: 1,
        max_select: 1,
        is_required: true,
        options: [
          { id: "opt-base-1", name: "Quinoa & Tuscan Kale Split (Standard)", price_delta_cents: 0, calories_delta: 0, is_available: true },
          { id: "opt-base-2", name: "All Organic Tuscan Kale (Low Carb)", price_delta_cents: 0, calories_delta: -80, is_available: true },
          { id: "opt-base-3", name: "Brown Rice & Wild Grain Blend", price_delta_cents: 50, calories_delta: 40, is_available: true }
        ]
      },
      {
        id: "mod-extra-boost",
        name: "Superfood Boosters",
        min_select: 0,
        max_select: 2,
        is_required: false,
        options: [
          { id: "opt-boost-1", name: "Avocado Mash with Hemp Seed", price_delta_cents: 300, calories_delta: 120, is_available: true },
          { id: "opt-boost-2", name: "Marinated Sprouted Tofu (+8g Protein)", price_delta_cents: 250, calories_delta: 90, is_available: true }
        ]
      }
    ]
  },
  {
    id: "dish-031",
    restaurant_id: "rest-004",
    category: "Protein Bowls",
    title: "Organic Crispy Tofu & Green Goddess Buddha Bowl",
    description: "24-hour ginger-tamari marinated organic tofu, rainbow quinoa, roasted kabocha squash, pickled red onion, avocado, and house cashew green goddess dressing.",
    base_price_cents: 1700,
    calories: 520,
    protein_grams: 36,
    dietary_flags: ["vegan", "gf", "high-protein", "halal"],
    travel_quality_score: 4.95,
    packaging_note: "100% Compostable sugarcane bowl • Cold dressing container separated",
    is_sold_out: false,
    is_featured: true,
    image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    pairings: [
      { id: "dish-032", name: "Cold-Pressed Citrus Turmeric Elixir", price_cents: 550, reason: "Anti-inflammatory pairing" }
    ],
    modifier_groups: [
      {
        id: "mod-tofu-grain",
        name: "Grain & Greens Base Matrix",
        min_select: 1,
        max_select: 1,
        is_required: true,
        options: [
          { id: "opt-tbase-1", name: "Half Quinoa & Half Massaged Tuscan Kale", price_delta_cents: 0, calories_delta: 0, is_available: true },
          { id: "opt-tbase-2", name: "Double Organic Kale (Zero Grain / Keto)", price_delta_cents: 0, calories_delta: -120, is_available: true },
          { id: "opt-tbase-3", name: "Forbidden Black Rice & Edamame Blend", price_delta_cents: 150, calories_delta: 60, is_available: true }
        ]
      },
      {
        id: "mod-tofu-dressing",
        name: "House Dressing Selection",
        min_select: 1,
        max_select: 1,
        is_required: true,
        options: [
          { id: "opt-dress-1", name: "Creamy Cashew Green Goddess (Vegan)", price_delta_cents: 0, calories_delta: 0, is_available: true },
          { id: "opt-dress-2", name: "Meyer Lemon Tahini & Garlic (Vegan)", price_delta_cents: 0, calories_delta: -10, is_available: true },
          { id: "opt-dress-3", name: "Ginger Sesame Miso Vinaigrette", price_delta_cents: 50, calories_delta: 20, is_available: true }
        ]
      }
    ]
  },

  // --- CURRY & SPICE CO. ---
  {
    id: "dish-040",
    restaurant_id: "rest-005",
    category: "Curries",
    title: "Smoked Butter Chicken & Aged Basmati",
    description: "Tandoor-charred Halal chicken breast simmered in velvety tomato gravy with Kashmiri chili, fenugreek leaves, and clarified butter.",
    base_price_cents: 1900,
    calories: 780,
    protein_grams: 38,
    dietary_flags: ["halal", "high-protein", "gf"],
    travel_quality_score: 4.9,
    packaging_note: "Insulated deep seal container • Arrives bubbling hot",
    is_sold_out: false,
    is_featured: true,
    image_url: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80",
    modifier_groups: [
      {
        id: "mod-spice-curry",
        name: "Curry Spice Level",
        min_select: 1,
        max_select: 1,
        is_required: true,
        options: [
          { id: "opt-curry-1", name: "Medium (Authentic Delhi balance)", price_delta_cents: 0, calories_delta: 0, is_available: true },
          { id: "opt-curry-2", name: "Mild (Kid friendly)", price_delta_cents: 0, calories_delta: 0, is_available: true },
          { id: "opt-curry-3", name: "Desi Hot (Fresh green chilies)", price_delta_cents: 50, calories_delta: 10, is_available: true }
        ]
      },
      {
        id: "mod-bread-pairing",
        name: "Tandoori Bread Selection",
        min_select: 0,
        max_select: 2,
        is_required: false,
        options: [
          { id: "opt-bread-1", name: "Garlic & Cilantro Butter Naan", price_delta_cents: 395, calories_delta: 240, is_available: true },
          { id: "opt-bread-2", name: "Cheese & Green Chili Stuffed Naan", price_delta_cents: 550, calories_delta: 310, is_available: true },
          { id: "opt-bread-3", name: "Gluten-Free Roti (Besan Flour)", price_delta_cents: 425, calories_delta: 160, is_available: true }
        ]
      }
    ]
  }
];

export const CRAVING_CATEGORIES = [
  { id: "all", label: "All Curations", icon: "✨" },
  { id: "pizza", label: "Wood-Fired Pizza", icon: "🔥", tag: "Wood-Fired Pizza" },
  { id: "pasta", label: "Artisanal Pasta", icon: "🍝", tag: "Artisanal Pasta" },
  { id: "tacos", label: "Street Tacos", icon: "🌮", tag: "Street Tacos" },
  { id: "ramen", label: "Ramen & Pho", icon: "🍜", tag: "Ramen" },
  { id: "healthy", label: "Crisp Salads & Bowls", icon: "🥗", tag: "Salads" },
  { id: "curry", label: "Indian Curry", icon: "🍛", tag: "Curry" }
];

export const DIETARY_GUARDRAILS = [
  { id: "free_delivery", label: "$0 Delivery Fee", icon: "✨" },
  { id: "under_30", label: "Under 25 Mins", icon: "⚡" },
  { id: "gf", label: "Gluten-Free Safe", icon: "🌾" },
  { id: "vegan", label: "Vegan", icon: "🌱" },
  { id: "high_protein", label: "High Protein (>35g)", icon: "🥩" },
  { id: "halal", label: "Halal Certified", icon: "🌿" },
  { id: "brick_mortar", label: "Brick & Mortar Only", icon: "🏛️" },
  { id: "top_rated", label: "4.8+ Rated", icon: "★" }
];
