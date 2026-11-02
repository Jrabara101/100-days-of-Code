// ============================================================================
// LIVE GEOSPATIAL TELEMETRY, COURIER PROFILE & 6-STAGE PIPELINE
// Realistic GPS waypoints, batched drop-off stops & 10-minute bundle add-ons
// ============================================================================

export const COURIER_PROFILE = {
  id: "courier-772",
  name: "Marcus V.",
  rating: 4.98,
  delivery_count: 2480,
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  vehicle_badge: "Honda PCX Scooter • Plate 8X92",
  vehicle_type: "scooter",
  has_insulated_thermal_bag: true,
  thermal_bag_temp_f: 148,
  phone_masked: "+1 (415) 555-0198"
};

export const TELEMETRY_STAGES = [
  {
    step: 1,
    key: "accepted",
    label: "Order Accepted by POS",
    timestamp: "6:18 PM",
    description: "Ticket printed at kitchen pass • Ingredients verified in stock"
  },
  {
    step: 2,
    key: "cooking",
    label: "Fired on Line",
    timestamp: "6:21 PM",
    description: "Chef Marco dropped fresh rigatoni & fired 900°F pizza hearth"
  },
  {
    step: 3,
    key: "sealed",
    label: "Quality Checked & Sealed",
    timestamp: "6:29 PM",
    description: "Tamper-evident seal applied • Placed in temperature-holding thermal well"
  },
  {
    step: 4,
    key: "en_route",
    label: "Marcus Picked Up & En Route",
    timestamp: "6:31 PM",
    description: "Stowed in insulated heated thermal bag • Heading down Mission corridor"
  },
  {
    step: 5,
    key: "arriving",
    label: "Arriving at Curb (< 1 min)",
    timestamp: "6:41 PM",
    description: "Within 150m geofence • Marcus is pulling up outside your building"
  },
  {
    step: 6,
    key: "delivered",
    label: "Delivered to Porch Door",
    timestamp: "6:42 PM",
    description: "Placed on porch per instructions • Gate closed securely"
  }
];

// San Francisco Coordinates: Restaurant (Osteria Mozza) to Customer (742 Evergreen Ter)
export const ROUTE_COORDINATES = [
  { lat: 37.7749, lng: -122.4194, heading: 92, speed_mph: 0 },    // Osteria Mozza Kitchen
  { lat: 37.7746, lng: -122.4172, heading: 105, speed_mph: 18 },  // Turn on 8th
  { lat: 37.7738, lng: -122.4148, heading: 110, speed_mph: 22 },  // Down Mission St
  { lat: 37.7725, lng: -122.4120, heading: 120, speed_mph: 24 },  // Intermediate waypoint vicinity
  { lat: 37.7712, lng: -122.4095, heading: 125, speed_mph: 8 },   // Quick batched drop-off stop
  { lat: 37.7695, lng: -122.4105, heading: 215, speed_mph: 19 },  // Turning southwest
  { lat: 37.7680, lng: -122.4125, heading: 220, speed_mph: 21 },  // Toward 16th St
  { lat: 37.7665, lng: -122.4150, heading: 225, speed_mph: 20 },  // Approaching drop-off block
  { lat: 37.7652, lng: -122.4168, heading: 230, speed_mph: 12 },  // 150m geofence trigger!
  { lat: 37.7645, lng: -122.4178, heading: 235, speed_mph: 0 }    // Customer building doorstep
];

export const INTERMEDIATE_BATCH_STOP = {
  lat: 37.7712,
  lng: -122.4095,
  label: "Quick Neighbor Drop-off (4 blocks away)",
  note: "Completing 1 quick drop-off 4 blocks away • Your food is in a heated thermal bag • ETA 6:42 PM unchanged",
  duration_seconds: 45
};

export const CUSTOMER_DROPOFF_LOCATION = {
  address: "742 Evergreen Ter, Apt 4B",
  neighborhood: "Mission District, San Francisco",
  lat: 37.7645,
  lng: -122.4178,
  gate_code: "1492#",
  instructions: "Leave at front porch door on blue wooden bench. Do not ring bell (baby sleeping).",
  porch_reference_photo: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
  courier_verification_photo: "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80"
};

// 10-Minute Zero-Fee Bundle Add-On Items (Along courier's path)
export const NEARBY_BUNDLE_ITEMS = [
  {
    id: "bundle-01",
    shop_name: "Bodega Express (2 blocks away)",
    title: "San Pellegrino Blood Orange (2x Cold Cans)",
    price_cents: 450,
    calories: 140,
    image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80",
    badge: "$0 Delivery Fee • Along Courier Path"
  },
  {
    id: "bundle-02",
    shop_name: "Bi-Rite Creamery Counter",
    title: "Salted Caramel Ice Cream Pint",
    price_cents: 850,
    calories: 420,
    image_url: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80",
    badge: "Kept in Dry-Ice Pouch"
  },
  {
    id: "bundle-03",
    shop_name: "Tartine Bakery Pop-up",
    title: "Warm Valrhona Dark Chocolate Chip Cookie",
    price_cents: 495,
    calories: 310,
    image_url: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=80",
    badge: "Fresh Baked 12m Ago"
  },
  {
    id: "bundle-04",
    shop_name: "Corner Market",
    title: "Topo Chico Mineral Water (Chilled Glass)",
    price_cents: 350,
    calories: 0,
    image_url: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80",
    badge: "Zero Calorie"
  }
];

export const COURIER_QUICK_CHIPS = [
  "Gate code is 1492#",
  "Leave on the blue wooden bench",
  "Please do not ring the bell",
  "Text me when you pull up outside"
];
