/**
 * BRAND COLLECTION — EXPANDED PRODUCT CATALOG & SPECIFICATIONS
 * Realistic demonstration dataset tailored for the Pakistani fashion & luxury streetwear market.
 * All prices in PKR (₨).
 */

const PRODUCTS_DATA = [
  // ================= MEN'S & UNISEX =================
  {
    id: 'bc-001',
    name: 'Cyber-Matrix Modular Trench Jacket',
    slug: 'cyber-matrix-modular-jacket',
    sku: 'BC-JKT-001',
    category: 'men',
    subCategory: 'outerwear',
    collection: 'NEO-CYBER 2026',
    price: 24500,
    salePrice: 19500,
    image: 'assets/images/jacket.jpg',
    images: ['assets/images/jacket.jpg', 'assets/images/men.jpg'],
    badge: 'Flagship Drop',
    badgeType: 'sale',
    stock: 5,
    rating: 4.9,
    reviewCount: 38,
    isFeatured: true,
    isBestseller: true,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Obsidian Charcoal', hex: '#121417' },
      { name: 'Cyber Lime Trim', hex: '#C7F36B' }
    ],
    material: '3-Layer Weatherproof Tech-Ripstop (10,000mm hydrostatic head), YKK Aquaguard Zips',
    fit: 'Modular Structured Cyber-Fit. Engineered for layering over hoodies.',
    care: 'Machine wash 30°C delicate. Do not bleach. Air dry in shade. Do not iron waterproof seams.',
    origin: 'Hand-tailored atelier in Lahore, Pakistan',
    description: 'An avant-garde outerwear triumph engineered for Pakistan’s changing weather and urban nightlife. Features magnetic tactical pocket modularity, high-visibility electric lime contrast taping, and waterproof dual-zip storm flaps.',
    specifications: {
      weight: '820 grams',
      pockets: '6 tactical compartments + hidden interior passport pocket',
      cuffs: 'Velcro micro-adjust with thumb loop ergonomics'
    }
  },
  {
    id: 'bc-004',
    name: 'Tailored Techwear Cargo Trouser & Blazer Set',
    slug: 'tailored-techwear-cargo-blazer-mens',
    sku: 'BC-MEN-004',
    category: 'men',
    subCategory: 'suits',
    collection: 'HIGH-VOLTAGE ACCENTS',
    price: 28000,
    salePrice: null,
    image: 'assets/images/men.jpg',
    images: ['assets/images/men.jpg', 'assets/images/hero.jpg'],
    badge: 'New Arrival',
    badgeType: 'new',
    stock: 9,
    rating: 4.9,
    reviewCount: 19,
    isFeatured: true,
    isBestseller: false,
    sizes: ['30', '32', '34', '36', '38'],
    colors: [
      { name: 'Charcoal Wool-Tech', hex: '#1C1E24' },
      { name: 'Midnight Onyx', hex: '#0B0C0E' }
    ],
    material: 'Tropical Stretch Wool infused with technical anti-wrinkle micro-fibers',
    fit: 'Modern Athletic Tapered Fit with Ergonomic Articulated Knees',
    care: 'Professional dry clean only. Steam refresh recommended.',
    origin: 'Master bespoke unit, Karachi, Pakistan',
    description: 'A revolutionary reinterpretation of formal menswear for the modern Pakistani gentleman. Features minimalist zipper chest accents, clean matte black finish, and integrated moisture-wicking linings perfect for Karachi & Lahore evenings.',
    specifications: {
      waist: 'Concealed elastic side adjusters with belt loops',
      vent: 'Modern center-back magnetic kick vent'
    }
  },
  {
    id: 'bc-002',
    name: 'Heavyweight Cyber Luxe Boxy Hoodie',
    slug: 'heavyweight-cyber-luxe-hoodie',
    sku: 'BC-HD-002',
    category: 'men',
    subCategory: 'hoodies',
    collection: 'OBSIDIAN MINIMALISM',
    price: 11500,
    salePrice: null,
    image: 'assets/images/hoodie.jpg',
    images: ['assets/images/hoodie.jpg', 'assets/images/hero.jpg'],
    badge: 'Core Luxury',
    badgeType: 'new',
    stock: 14,
    rating: 4.8,
    reviewCount: 52,
    isFeatured: true,
    isBestseller: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Warm Ivory', hex: '#F5F0E8' },
      { name: 'Obsidian Charcoal', hex: '#101114' }
    ],
    material: '500 GSM Heavy Organic French Terry Cotton, brushed interior fleece',
    fit: 'Relaxed Drop-Shoulder Oversized Silhouette',
    care: 'Gentle cycle cold inside-out. Dry flat. Warm iron on reverse side.',
    origin: 'Knit & finished in Faisalabad & Lahore, Pakistan',
    description: 'Constructed from custom-milled 500 GSM luxury fleece in warm ivory with tonal obsidian arm panels. Features high-density Electric Lime Brand Collection chest typography and a double-layered structured hood that stays upright.',
    specifications: {
      weight: '980 grams',
      hood: 'Double-layered seamless hood with metal aglet drawstrings',
      waistband: 'Heavy 2x2 ribbing with reinforced shape retention'
    }
  },
  {
    id: 'bc-005',
    name: 'Boxy 280GSM Heavyweight Micro-Brand Tee',
    slug: 'boxy-heavyweight-micro-brand-tee',
    sku: 'BC-TEE-005',
    category: 'men',
    subCategory: 't-shirts',
    collection: 'CORE ESSENTIALS',
    price: 4900,
    salePrice: 3900,
    image: 'assets/images/tee.jpg',
    images: ['assets/images/tee.jpg', 'assets/images/hero.jpg'],
    badge: 'Essential',
    badgeType: 'sale',
    stock: 22,
    rating: 4.7,
    reviewCount: 88,
    isFeatured: true,
    isBestseller: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Warm Ivory', hex: '#F5F0E8' },
      { name: 'Obsidian Black', hex: '#111215' },
      { name: 'Cyber Lime', hex: '#C7F36B' }
    ],
    material: '100% Combed Compact Pakistani Cotton (280 GSM Single Jersey)',
    fit: 'True Boxy Streetwear Silhouette with Dropped Shoulders & Thick Collar',
    care: 'Machine wash cold 30°C. Do not tumble dry. Iron on low heat.',
    origin: 'Knitted, dyed and cut in Faisalabad, Pakistan',
    description: 'The definitive daily luxury t-shirt. Milled from ultra-dense 280 GSM Pakistani combed cotton that retains its boxy drape wash after wash. Finished with silicon-screened Brand Collection minimal branding.',
    specifications: {
      collar: '3.2cm thick 1x1 ribbed collar that will never sag',
      hem: 'Twin-needle reinforced hems'
    }
  },
  {
    id: 'bc-007',
    name: 'Cyber Kimono Streetwear Haori Wrap',
    slug: 'cyber-kimono-streetwear-haori-wrap',
    sku: 'BC-UNX-007',
    category: 'men',
    subCategory: 'outerwear',
    collection: 'NEO-CYBER 2026',
    price: 16500,
    salePrice: null,
    image: 'assets/images/jacket.jpg',
    images: ['assets/images/jacket.jpg'],
    badge: 'Limited Run',
    badgeType: 'new',
    stock: 6,
    rating: 4.8,
    reviewCount: 14,
    isFeatured: false,
    isBestseller: false,
    sizes: ['S/M', 'L/XL'],
    colors: [
      { name: 'Obsidian Black', hex: '#111215' }
    ],
    material: 'Linen-Cotton Cyber Blend with Water-Repellent Treatment',
    fit: 'Oversized Flowing Drape with Magnetic Waist Buckle',
    care: 'Hand wash cold or gentle machine wash.',
    origin: 'Crafted in Lahore, Pakistan',
    description: 'An East-meets-West fusion silhouette. Traditional kimono sleeve proportions fused with futuristic urban utilitarian buckles and electric lime interior seam binding.',
    specifications: {
      closure: 'Fidlock style quick-clip magnetic utility buckle',
      sleeves: 'Drop 3/4 length box cut'
    }
  },
  {
    id: 'bc-009',
    name: 'Tactical Articulated Utility Cargo Pants',
    slug: 'tactical-articulated-cargo-pants',
    sku: 'BC-MEN-009',
    category: 'men',
    subCategory: 'bottoms',
    collection: 'NEO-CYBER 2026',
    price: 10500,
    salePrice: 8900,
    image: 'assets/images/men.jpg',
    images: ['assets/images/men.jpg'],
    badge: 'Popular',
    badgeType: 'sale',
    stock: 8,
    rating: 4.8,
    reviewCount: 29,
    isFeatured: false,
    isBestseller: true,
    sizes: ['30', '32', '34', '36'],
    colors: [
      { name: 'Obsidian Black', hex: '#101114' },
      { name: 'Concrete Grey', hex: '#2A2D35' }
    ],
    material: 'High-Density Stretch Cotton Twill with Reinforced Knee Darting',
    fit: 'Ergonomic Tapered Cargo Fit with Adjustable Ankle Snaps',
    care: 'Machine wash cold 30°C.',
    origin: 'Karachi, Pakistan',
    description: 'Engineered for all-day mobility with 8 strategic pockets, waterproof zipper closures, and reinforced gussets for unrestricted movement.',
    specifications: {
      waist: 'Integrated webbed nylon belt with quick-release buckle',
      pockets: '8 functional multi-depth utility pockets'
    }
  },
  {
    id: 'bc-010',
    name: 'Futuristic Cyber Kurtis Streetwear Tunic',
    slug: 'futuristic-cyber-kurtis-tunic',
    sku: 'BC-MEN-010',
    category: 'men',
    subCategory: 'pret',
    collection: 'HIGH-VOLTAGE ACCENTS',
    price: 8500,
    salePrice: 7500,
    image: 'assets/images/hero.jpg',
    images: ['assets/images/hero.jpg'],
    badge: 'Pret Drop',
    badgeType: 'sale',
    stock: 12,
    rating: 4.9,
    reviewCount: 15,
    isFeatured: false,
    isBestseller: false,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Monochrome Charcoal', hex: '#14161A' }
    ],
    material: 'Breathable Raw Cotton & Linen Blend with Neon Contrast Stitching',
    fit: 'Modern Longline Straight Silhouette with Side Slits',
    care: 'Gentle hand wash cold. Steam iron.',
    origin: 'Lahore Atelier, Pakistan',
    description: 'Subcontinental silhouette evolved for the cyber era. Crisp mandarin collar, concealed front placket, and electric lime bartack reinforcements.',
    specifications: {
      collar: 'Structured band collar with snap closure',
      length: 'Thigh-length tailored drape'
    }
  },

  // ================= WOMEN'S COLLECTION =================
  {
    id: 'bc-003',
    name: 'Architectural Asymmetric Fusion Pret Dress',
    slug: 'architectural-asymmetric-pret-dress',
    sku: 'BC-WMN-003',
    category: 'women',
    subCategory: 'dresses',
    collection: 'NEO-CYBER 2026',
    price: 18500,
    salePrice: 15500,
    image: 'assets/images/women.jpg',
    images: ['assets/images/women.jpg', 'assets/images/hero.jpg'],
    badge: 'Runway Exclusive',
    badgeType: 'sale',
    stock: 4,
    rating: 5.0,
    reviewCount: 24,
    isFeatured: true,
    isBestseller: false,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [
      { name: 'Two-Tone Ivory/Charcoal', hex: '#EAE5DB' },
      { name: 'Pure Obsidian', hex: '#101114' }
    ],
    material: 'Premium Raw Silk & Poly-Viscose Structured Crepe blend',
    fit: 'Sculptural Tailored Bodice with Flowing Asymmetric Knife-Pleat Hem',
    care: 'Dry clean only. Store on padded coat hanger.',
    origin: 'Patterned and sewn in Karachi Studio, Pakistan',
    description: 'Bridging avant-garde architectural tailoring with modern Pakistani luxury pret. High mock-neck collar with dynamic diagonal contrast blocking in warm ivory and deep charcoal, outlined with razor-sharp electric lime piping.',
    specifications: {
      length: 'Midi to ankle diagonal drop',
      closure: 'Concealed Japanese invisible back zipper',
      lining: 'Breathable Habotai silk feel lining'
    }
  },
  {
    id: 'bc-008',
    name: 'High-Waist Cyber Pleated Tech Skirt',
    slug: 'high-waist-cyber-pleated-tech-skirt',
    sku: 'BC-WMN-008',
    category: 'women',
    subCategory: 'bottoms',
    collection: 'OBSIDIAN MINIMALISM',
    price: 9500,
    salePrice: 7900,
    image: 'assets/images/women.jpg',
    images: ['assets/images/women.jpg'],
    badge: 'Sale',
    badgeType: 'sale',
    stock: 11,
    rating: 4.7,
    reviewCount: 21,
    isFeatured: false,
    isBestseller: false,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [
      { name: 'Two-Tone Warm Ivory', hex: '#F5F0E8' },
      { name: 'Charcoal Black', hex: '#121417' }
    ],
    material: 'Poly-Spandex High-Memory Permanent Pleat Tech Fabric',
    fit: 'High-Rise Waist with Asymmetric Stepped Knife Pleats',
    care: 'Hand wash cold. Do not iron pleats directly. Steam vertically.',
    origin: 'Karachi Atelier, Pakistan',
    description: 'Asymmetrical architectural pleats engineered with high-memory crease retention that never loses its geometry after washing. Styled with an integrated neon carabiner loop.',
    specifications: {
      waist: 'Elastic back waistband with metal side zipper',
      pockets: 'Deep concealed side pocket'
    }
  },
  {
    id: 'bc-011',
    name: 'Two-Tone Monochromatic Draped Kaftan Pret',
    slug: 'monochromatic-draped-kaftan-pret',
    sku: 'BC-WMN-011',
    category: 'women',
    subCategory: 'dresses',
    collection: 'HIGH-VOLTAGE ACCENTS',
    price: 19500,
    salePrice: 17500,
    image: 'assets/images/women.jpg',
    images: ['assets/images/women.jpg'],
    badge: 'Atelier Edition',
    badgeType: 'new',
    stock: 5,
    rating: 4.9,
    reviewCount: 18,
    isFeatured: true,
    isBestseller: true,
    sizes: ['Free Size (Fluid Drape)'],
    colors: [
      { name: 'Warm Ivory & Obsidian', hex: '#EAE5DB' }
    ],
    material: 'Pure Chiffon Crepe & Raw Modal Silk Blend',
    fit: 'Flowing Sculptural Kaftan with Cinching Utility Belt',
    care: 'Dry clean recommended.',
    origin: 'Karachi Studio, Pakistan',
    description: 'An elegant fluid evening kaftan designed for high-end Pakistani dinners and galas. Floor-sweeping drape with structured neon piping along the sleeves.',
    specifications: {
      belt: 'Detachable magnetic clasp leatherette cord belt',
      neckline: 'Boat neckline with raw edge binding'
    }
  },
  {
    id: 'bc-012',
    name: 'Minimalist Asymmetric Structured Blazer Vest',
    slug: 'minimalist-asymmetric-blazer-vest',
    sku: 'BC-WMN-012',
    category: 'women',
    subCategory: 'outerwear',
    collection: 'NEO-CYBER 2026',
    price: 15500,
    salePrice: 13900,
    image: 'assets/images/hero.jpg',
    images: ['assets/images/hero.jpg'],
    badge: 'Runway Look',
    badgeType: 'new',
    stock: 6,
    rating: 5.0,
    reviewCount: 11,
    isFeatured: false,
    isBestseller: false,
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: 'Charcoal Black', hex: '#111215' }
    ],
    material: 'Italian Suiting Wool-Viscose with Satin Acetate Interior',
    fit: 'Tailored Sleeveless Silhouette with Extended Hem',
    care: 'Dry clean only.',
    origin: 'Lahore Atelier, Pakistan',
    description: 'An authoritative layering piece for modern women. Sharp lapels, asymmetric single-button closure, and neon interior bound seams.',
    specifications: {
      closure: 'Matte black horn button with concealed inner anchor',
      pockets: 'Dual flap hip pockets'
    }
  },
  {
    id: 'bc-013',
    name: 'Cropped 280GSM Boxy Cyber Streetwear Tee',
    slug: 'cropped-boxy-cyber-tee-womens',
    sku: 'BC-WMN-013',
    category: 'women',
    subCategory: 't-shirts',
    collection: 'CORE ESSENTIALS',
    price: 4200,
    salePrice: 3500,
    image: 'assets/images/tee.jpg',
    images: ['assets/images/tee.jpg'],
    badge: 'Essential',
    badgeType: 'sale',
    stock: 16,
    rating: 4.8,
    reviewCount: 34,
    isFeatured: false,
    isBestseller: true,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [
      { name: 'Warm Ivory', hex: '#F5F0E8' },
      { name: 'Obsidian Black', hex: '#101114' }
    ],
    material: '100% Combed Pakistani Cotton (280 GSM Heavy Jersey)',
    fit: 'Modern Boxy Crop hitting right at the waistline',
    care: 'Cold wash inside-out.',
    origin: 'Faisalabad, Pakistan',
    description: 'The heavyweight cropped essential. Crafted with high-density cotton that retains its crisp architectural drape over high-waisted tech pants or pleated skirts.',
    specifications: {
      collar: 'Thick seamless 1x1 rib knit band',
      hem: 'Double needle raw edge aesthetic stitch'
    }
  },

  // ================= KIDS' COLLECTION =================
  {
    id: 'bc-006',
    name: 'Junior Cyber Utility Storm Combat Suit',
    slug: 'junior-cyber-utility-combat-suit',
    sku: 'BC-KID-006',
    category: 'kids',
    subCategory: 'outerwear',
    collection: 'FUTURE GENERATION',
    price: 12500,
    salePrice: 9900,
    image: 'assets/images/kids.jpg',
    images: ['assets/images/kids.jpg'],
    badge: 'Kids Drop',
    badgeType: 'sale',
    stock: 7,
    rating: 4.9,
    reviewCount: 16,
    isFeatured: true,
    isBestseller: false,
    sizes: ['4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'],
    colors: [
      { name: 'Slate Charcoal & Lime', hex: '#262930' }
    ],
    material: 'Durable Micro-Canvas Twill with Soft Hypoallergenic Cotton Lining',
    fit: 'Active Play Fit with Elasticated Jogger Cuffs and Articulated Elbows',
    care: 'Machine wash 40°C durable cycle. Tumble dry low.',
    origin: 'Crafted in Lahore, Pakistan',
    description: 'Empowering the next generation with high-performance fashion. Modular zip compartments, fluorescent safety visibility pullers, and ultra-durable reinforced knees that withstand playground exploration in style.',
    specifications: {
      pockets: '4 oversized cargo pockets with quick-release velcro',
      safety: 'Electric lime reflective contrast piping for dusk visibility'
    }
  },
  {
    id: 'bc-014',
    name: 'Junior Mini Cyber Luxe Heavyweight Hoodie',
    slug: 'junior-mini-cyber-luxe-hoodie',
    sku: 'BC-KID-014',
    category: 'kids',
    subCategory: 'hoodies',
    collection: 'FUTURE GENERATION',
    price: 7900,
    salePrice: 6500,
    image: 'assets/images/hoodie.jpg',
    images: ['assets/images/hoodie.jpg'],
    badge: 'Kids Cozy',
    badgeType: 'sale',
    stock: 12,
    rating: 4.9,
    reviewCount: 22,
    isFeatured: true,
    isBestseller: true,
    sizes: ['4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'],
    colors: [
      { name: 'Warm Ivory & Charcoal', hex: '#F5F0E8' }
    ],
    material: '100% Ultra-Soft Brushed Cotton Fleece (400 GSM)',
    fit: 'Drop-Shoulder Streetwear Kid Fit',
    care: 'Machine wash gentle. Non-toxic organic dyes.',
    origin: 'Lahore, Pakistan',
    description: 'The iconic Brand Collection silhouette scaled down for kids. Warm, soft against sensitive skin, and fitted with heavy-gauge lime zipper pullers.',
    specifications: {
      hood: 'No-drawstring safety certified hood',
      cuffs: 'Soft cotton elastane stretch ribs'
    }
  },
  {
    id: 'bc-015',
    name: 'Junior Reflex Techwear Cargo Joggers',
    slug: 'junior-reflex-techwear-cargo-joggers',
    sku: 'BC-KID-015',
    category: 'kids',
    subCategory: 'bottoms',
    collection: 'FUTURE GENERATION',
    price: 5800,
    salePrice: 4900,
    image: 'assets/images/kids.jpg',
    images: ['assets/images/kids.jpg'],
    badge: 'Playproof',
    badgeType: 'sale',
    stock: 9,
    rating: 4.8,
    reviewCount: 14,
    isFeatured: false,
    isBestseller: false,
    sizes: ['4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'],
    colors: [
      { name: 'Charcoal Black', hex: '#14161B' }
    ],
    material: 'Ripstop Cotton Twill with Double Stitching',
    fit: 'Elastic Waistband with Adjustable Drawcord',
    care: 'Machine wash 40°C.',
    origin: 'Faisalabad, Pakistan',
    description: 'Tough, resilient street joggers for active boys and girls. Equipped with neon reflective stripes and deep cargo pockets for daily essentials.',
    specifications: {
      knees: 'Reinforced double-layered knee patches',
      waist: 'Comfort elastic band that never pinches'
    }
  },
  {
    id: 'bc-016',
    name: 'Junior Boxy Minimalist Graphic Tee',
    slug: 'junior-boxy-minimalist-graphic-tee',
    sku: 'BC-KID-016',
    category: 'kids',
    subCategory: 't-shirts',
    collection: 'FUTURE GENERATION',
    price: 3500,
    salePrice: 2800,
    image: 'assets/images/tee.jpg',
    images: ['assets/images/tee.jpg'],
    badge: 'Daily Favorite',
    badgeType: 'sale',
    stock: 20,
    rating: 4.7,
    reviewCount: 28,
    isFeatured: false,
    isBestseller: true,
    sizes: ['4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'],
    colors: [
      { name: 'Warm Ivory', hex: '#F5F0E8' },
      { name: 'Cyber Lime', hex: '#C7F36B' }
    ],
    material: '100% Organic Pakistani Cotton (240 GSM Soft Jersey)',
    fit: 'Relaxed Streetwear Boxy Fit',
    care: 'Machine wash cold.',
    origin: 'Faisalabad, Pakistan',
    description: 'Heavyweight organic cotton tee for children with hypoallergenic non-toxic ink printing. Soft, breathable, and colorfast.',
    specifications: {
      neck: 'Reinforced rib crew neck',
      tag: 'Tagless heat-transferred neck label for zero scratching'
    }
  }
];

// Delivery fee configuration for Pakistani market
const SHIPPING_CONFIG = {
  freeShippingThreshold: 5000, // PKR
  standardShippingFee: 250,    // Flat nationwide standard
  expressShippingFee: 450,     // Karachi / Lahore / Islamabad 24h express
  codHandlingFee: 150,         // Cash on delivery verification & handling
  cities: [
    { name: 'Karachi', province: 'Sindh', standardDays: '2-3 Days', expressAvailable: true },
    { name: 'Lahore', province: 'Punjab', standardDays: '1-2 Days', expressAvailable: true },
    { name: 'Islamabad', province: 'ICT', standardDays: '2-3 Days', expressAvailable: true },
    { name: 'Rawalpindi', province: 'Punjab', standardDays: '2-3 Days', expressAvailable: true },
    { name: 'Faisalabad', province: 'Punjab', standardDays: '2-4 Days', expressAvailable: false },
    { name: 'Multan', province: 'Punjab', standardDays: '2-4 Days', expressAvailable: false },
    { name: 'Peshawar', province: 'KPK', standardDays: '3-4 Days', expressAvailable: false },
    { name: 'Quetta', province: 'Balochistan', standardDays: '4-5 Days', expressAvailable: false },
    { name: 'Sialkot', province: 'Punjab', standardDays: '2-3 Days', expressAvailable: false },
    { name: 'Gujranwala', province: 'Punjab', standardDays: '2-3 Days', expressAvailable: false },
    { name: 'Hyderabad', province: 'Sindh', standardDays: '2-4 Days', expressAvailable: false }
  ]
};

// Pakistani Coupon Codes
const ACTIVE_COUPONS = {
  'NEO10': { discountPercent: 10, minSpend: 5000, description: '10% Off Orders over ₨5,000' },
  'FIRSTDROP': { discountAmount: 1000, minSpend: 8000, description: '₨1,000 Off Your First Order' },
  'FREESHIP': { freeShipping: true, minSpend: 3000, description: 'Free Express Shipping Nationwide' }
};
