// ─── Types ────────────────────────────────────────────────────────────────────

export type Badge = "NEW" | "HOT" | "SALE" | null;

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  rating: number;
  reviewCount: number;
  category: string;
  badge: Badge;
  gradient: string;
  shortDesc: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  count: number;
  href: string;
}

export interface Brand {
  id: string;
  name: string;
  accentColor: string;
  tagline: string;
  initial: string;
}

export interface Lifestyle {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  gradient: string;
  tags: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  rating: number;
  review: string;
  verified: boolean;
  initials: string;
  avatarGradient: string;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export const products: Product[] = [
  {
    id: "p1",
    name: "ProPhone 15 Ultra",
    brand: "TechCore",
    price: 1199,
    originalPrice: 1399,
    discount: 14,
    rating: 4.8,
    reviewCount: 2341,
    category: "Smartphones",
    badge: "HOT",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    shortDesc: "6.7\" AMOLED · 200MP · 5000mAh",
  },
  {
    id: "p2",
    name: "AirBook Pro X",
    brand: "Nexus",
    price: 1599,
    originalPrice: 1899,
    discount: 16,
    rating: 4.9,
    reviewCount: 1876,
    category: "Laptops",
    badge: "NEW",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    shortDesc: "M3 Chip · 16GB RAM · 14\" Retina",
  },
  {
    id: "p3",
    name: "SoundSphere Pro",
    brand: "AudioMax",
    price: 349,
    originalPrice: 449,
    discount: 22,
    rating: 4.7,
    reviewCount: 4512,
    category: "Audio",
    badge: "SALE",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    shortDesc: "ANC · 40hr battery · Hi-Res",
  },
  {
    id: "p4",
    name: "VisionWatch S3",
    brand: "WearTech",
    price: 299,
    originalPrice: null,
    discount: null,
    rating: 4.6,
    reviewCount: 892,
    category: "Wearables",
    badge: "NEW",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    shortDesc: "AMOLED · GPS · Health tracking",
  },
  {
    id: "p5",
    name: "GamePad Elite Pro",
    brand: "XForce",
    price: 129,
    originalPrice: 179,
    discount: 28,
    rating: 4.8,
    reviewCount: 3201,
    category: "Gaming",
    badge: "HOT",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    shortDesc: "Wireless · Haptic · 40hr play",
  },
  {
    id: "p6",
    name: "TabView Pro 12",
    brand: "TechCore",
    price: 799,
    originalPrice: 999,
    discount: 20,
    rating: 4.5,
    reviewCount: 1234,
    category: "Tablets",
    badge: "SALE",
    gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    shortDesc: "12.9\" OLED · M2 · 5G ready",
  },
  {
    id: "p7",
    name: "SmartHub X5",
    brand: "HomeIQ",
    price: 149,
    originalPrice: null,
    discount: null,
    rating: 4.4,
    reviewCount: 678,
    category: "Smart Home",
    badge: "NEW",
    gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    shortDesc: "Matter · Thread · 12 devices",
  },
  {
    id: "p8",
    name: "SnapX Z9",
    brand: "OptiLens",
    price: 2299,
    originalPrice: 2699,
    discount: 15,
    rating: 4.9,
    reviewCount: 567,
    category: "Cameras",
    badge: "HOT",
    gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    shortDesc: "45MP full-frame · 8K video · AI",
  },
  {
    id: "p9",
    name: "MechKeys V Pro",
    brand: "TypeForce",
    price: 199,
    originalPrice: 249,
    discount: 20,
    rating: 4.7,
    reviewCount: 2890,
    category: "Accessories",
    badge: "SALE",
    gradient: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
    shortDesc: "TKL · Hot-swap · Per-key RGB",
  },
  {
    id: "p10",
    name: "BassBlast 360",
    brand: "AudioMax",
    price: 249,
    originalPrice: null,
    discount: null,
    rating: 4.6,
    reviewCount: 1456,
    category: "Audio",
    badge: "NEW",
    gradient: "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
    shortDesc: "360° sound · IPX7 · 24hr play",
  },
  {
    id: "p11",
    name: "PowerVault 30K",
    brand: "ChargeX",
    price: 79,
    originalPrice: 99,
    discount: 20,
    rating: 4.5,
    reviewCount: 5621,
    category: "Accessories",
    badge: "HOT",
    gradient: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
    shortDesc: "30,000mAh · 140W GaN · 4 ports",
  },
  {
    id: "p12",
    name: "EcoSmart Buds 3",
    brand: "SoundPure",
    price: 179,
    originalPrice: 229,
    discount: 22,
    rating: 4.7,
    reviewCount: 3012,
    category: "Audio",
    badge: "SALE",
    gradient: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)",
    shortDesc: "ANC · 36hr · Spatial Audio",
  },
];

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories: Category[] = [
  {
    id: "c1",
    name: "Smartphones",
    icon: "Smartphone",
    gradient: "linear-gradient(135deg, #667eea, #764ba2)",
    count: 245,
    href: "/smartphones",
  },
  {
    id: "c2",
    name: "Laptops",
    icon: "Laptop",
    gradient: "linear-gradient(135deg, #f093fb, #f5576c)",
    count: 189,
    href: "/laptops",
  },
  {
    id: "c3",
    name: "Audio",
    icon: "Headphones",
    gradient: "linear-gradient(135deg, #4facfe, #00f2fe)",
    count: 312,
    href: "/audio",
  },
  {
    id: "c4",
    name: "Wearables",
    icon: "Watch",
    gradient: "linear-gradient(135deg, #43e97b, #38f9d7)",
    count: 134,
    href: "/wearables",
  },
  {
    id: "c5",
    name: "Gaming",
    icon: "Gamepad2",
    gradient: "linear-gradient(135deg, #fa709a, #fee140)",
    count: 421,
    href: "/gaming",
  },
  {
    id: "c6",
    name: "Tablets",
    icon: "Tablet",
    gradient: "linear-gradient(135deg, #a18cd1, #fbc2eb)",
    count: 98,
    href: "/tablets",
  },
  {
    id: "c7",
    name: "Smart Home",
    icon: "Home",
    gradient: "linear-gradient(135deg, #ffecd2, #fcb69f)",
    count: 267,
    href: "/smart-home",
  },
  {
    id: "c8",
    name: "Cameras",
    icon: "Camera",
    gradient: "linear-gradient(135deg, #30cfd0, #330867)",
    count: 156,
    href: "/cameras",
  },
  {
    id: "c9",
    name: "Accessories",
    icon: "Package",
    gradient: "linear-gradient(135deg, #89f7fe, #66a6ff)",
    count: 834,
    href: "/accessories",
  },
  {
    id: "c10",
    name: "Speakers",
    icon: "Volume2",
    gradient: "linear-gradient(135deg, #fddb92, #d1fdff)",
    count: 178,
    href: "/speakers",
  },
  {
    id: "c11",
    name: "New Arrivals",
    icon: "Sparkles",
    gradient: "linear-gradient(135deg, #a1c4fd, #c2e9fb)",
    count: 64,
    href: "/new-arrivals",
  },
  {
    id: "c12",
    name: "Deals",
    icon: "Tag",
    gradient: "linear-gradient(135deg, #d299c2, #fef9d7)",
    count: 112,
    href: "/deals",
  },
];

// ─── Brands ───────────────────────────────────────────────────────────────────

export const brands: Brand[] = [
  { id: "b1", name: "TechCore", accentColor: "#00D4FF", tagline: "Power Redefined", initial: "T" },
  { id: "b2", name: "AudioMax", accentColor: "#6366F1", tagline: "Pure Sound", initial: "A" },
  { id: "b3", name: "XForce", accentColor: "#F59E0B", tagline: "Game On", initial: "X" },
  { id: "b4", name: "Nexus", accentColor: "#10B981", tagline: "Think Different", initial: "N" },
  { id: "b5", name: "HomeIQ", accentColor: "#EC4899", tagline: "Smart Living", initial: "H" },
  { id: "b6", name: "OptiLens", accentColor: "#8B5CF6", tagline: "See Everything", initial: "O" },
  { id: "b7", name: "WearTech", accentColor: "#06B6D4", tagline: "Wear the Future", initial: "W" },
  { id: "b8", name: "ChargeX", accentColor: "#F97316", tagline: "Always On", initial: "C" },
];

// ─── Lifestyles ───────────────────────────────────────────────────────────────

export const lifestyles: Lifestyle[] = [
  {
    id: "l1",
    title: "Work From Anywhere",
    subtitle: "Laptops, tablets & accessories for the modern remote professional.",
    ctaLabel: "Shop WFH Setup",
    gradient: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
    tags: ["Laptops", "Monitors", "Keyboards", "Webcams"],
  },
  {
    id: "l2",
    title: "Ultimate Gaming Rig",
    subtitle: "High-performance gear to dominate every session.",
    ctaLabel: "Build My Setup",
    gradient: "linear-gradient(135deg, #1a0533, #3d0b6b, #6d28d9)",
    tags: ["Gaming", "Controllers", "Headsets", "Streaming"],
  },
  {
    id: "l3",
    title: "Travel Tech Essentials",
    subtitle: "Compact, durable gadgets built for the road warrior.",
    ctaLabel: "Pack Smart",
    gradient: "linear-gradient(135deg, #0c2340, #1a4a6b, #007bcc)",
    tags: ["Power Banks", "Earbuds", "Adapters", "Cameras"],
  },
  {
    id: "l4",
    title: "Smart Home Life",
    subtitle: "Turn your home into a connected, intelligent living space.",
    ctaLabel: "Automate Home",
    gradient: "linear-gradient(135deg, #0d3b1a, #1a6b2e, #15803d)",
    tags: ["Hubs", "Speakers", "Security", "Lighting"],
  },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Alex Rivera",
    role: "Software Engineer",
    rating: 5,
    review:
      "GadgetZ is hands down the best tech store I've shopped at. The ProPhone 15 Ultra arrived in perfect condition and the price was unbeatable. Their customer service is top-notch!",
    verified: true,
    initials: "AR",
    avatarGradient: "linear-gradient(135deg, #667eea, #764ba2)",
  },
  {
    id: "t2",
    name: "Sarah Chen",
    role: "Content Creator",
    rating: 5,
    review:
      "I upgraded my entire home office setup from GadgetZ. The laptop bundle deal saved me $400 and shipping was insanely fast. I'll never shop anywhere else for tech.",
    verified: true,
    initials: "SC",
    avatarGradient: "linear-gradient(135deg, #f093fb, #f5576c)",
  },
  {
    id: "t3",
    name: "Marcus Thompson",
    role: "Pro Gamer",
    rating: 5,
    review:
      "Got the GamePad Elite Pro and the MechKeys V Pro together. The quality is incredible for the price. GadgetZ really understands what gamers need.",
    verified: true,
    initials: "MT",
    avatarGradient: "linear-gradient(135deg, #43e97b, #38f9d7)",
  },
  {
    id: "t4",
    name: "Priya Sharma",
    role: "Digital Nomad",
    rating: 4,
    review:
      "Ordered three travel accessories and they all arrived within 2 days. The PowerVault 30K is a lifesaver during long travel days. Great curation of products!",
    verified: true,
    initials: "PS",
    avatarGradient: "linear-gradient(135deg, #4facfe, #00f2fe)",
  },
  {
    id: "t5",
    name: "Jordan Kim",
    role: "Photographer",
    rating: 5,
    review:
      "The SnapX Z9 camera I bought here is absolutely mind-blowing. GadgetZ gave me the best price I found anywhere online. Super happy with the purchase!",
    verified: true,
    initials: "JK",
    avatarGradient: "linear-gradient(135deg, #30cfd0, #330867)",
  },
  {
    id: "t6",
    name: "Emma Walsh",
    role: "UX Designer",
    rating: 5,
    review:
      "Finally a tech store with an interface as premium as the products it sells. The shopping experience is smooth, the recommendations are spot-on, and returns are effortless.",
    verified: true,
    initials: "EW",
    avatarGradient: "linear-gradient(135deg, #fa709a, #fee140)",
  },
];
