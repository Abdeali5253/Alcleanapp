import { Product } from "../types/shopify";

/**
 * Mock product data that matches Shopify structure
 * This will be replaced with actual Shopify API calls in production
 */
export const mockProducts: Product[] = [
  // Fabric Washing Products
  {
    id: "gid://shopify/Product/1",
    handle: "premium-fabric-detergent",
    name: "Premium Fabric Detergent - Advanced Formula",
    description: "Premium quality fabric detergent with advanced stain removal technology. Perfect for all fabric types including cotton, synthetic, and delicate materials. Leaves clothes fresh and clean.",
    price: 2499,
    originalPrice: 2999,
    category: "cleaning-chemicals",
    subcategory: "fabric-washing",
    image: "https://images.unsplash.com/photo-1758273705792-a2887e079e83?w=400",
    images: [
      "https://images.unsplash.com/photo-1758273705792-a2887e079e83?w=400",
      "https://images.unsplash.com/photo-1758273705792-a2887e079e83?w=800",
    ],
    inStock: true,
    weight: "5kg",
    weightValue: 5,
    weightUnit: "kg",
    isNew: true,
    onSale: true,
    brand: "AlClean Pro",
    tags: ["detergent", "fabric", "premium", "new"],
    variantId: "gid://shopify/ProductVariant/1",
    quantityAvailable: 50,
    sku: "ALC-FD-001",
  },
  {
    id: "gid://shopify/Product/2",
    handle: "deep-fabric-cleaner",
    name: "Deep Fabric Cleaner - Professional Grade",
    description: "Deep cleaning formula that penetrates fibers for a thorough clean. Removes tough stains and odors. Ideal for heavy-duty cleaning tasks.",
    price: 2299,
    category: "cleaning-chemicals",
    subcategory: "fabric-washing",
    image: "https://images.unsplash.com/photo-1758273705792-a2887e079e83?w=400",
    images: ["https://images.unsplash.com/photo-1758273705792-a2887e079e83?w=400"],
    inStock: true,
    weight: "3kg",
    weightValue: 3,
    weightUnit: "kg",
    brand: "AlClean",
    tags: ["cleaner", "fabric", "professional"],
    variantId: "gid://shopify/ProductVariant/2",
    quantityAvailable: 30,
    sku: "ALC-FC-001",
  },
  {
    id: "gid://shopify/Product/3",
    handle: "eco-friendly-detergent",
    name: "Eco-Friendly Detergent - Biodegradable",
    description: "Environmentally friendly detergent made from biodegradable ingredients. Safe for sensitive skin and the planet.",
    price: 1899,
    category: "cleaning-chemicals",
    subcategory: "fabric-washing",
    image: "https://images.unsplash.com/photo-1758273705792-a2887e079e83?w=400",
    images: ["https://images.unsplash.com/photo-1758273705792-a2887e079e83?w=400"],
    inStock: true,
    weight: "2kg",
    weightValue: 2,
    weightUnit: "kg",
    isNew: true,
    brand: "AlClean Eco",
    tags: ["eco-friendly", "biodegradable", "detergent"],
    variantId: "gid://shopify/ProductVariant/3",
    quantityAvailable: 45,
    sku: "ALC-ED-001",
  },

  // Cleaning Equipment
  {
    id: "gid://shopify/Product/10",
    handle: "smart-cleaning-robot",
    name: "Smart Cleaning Robot - AI Powered",
    description: "AI-powered cleaning robot with smart navigation, app control, and automatic charging. Perfect for busy households. Features HEPA filtration and multiple cleaning modes.",
    price: 59999,
    originalPrice: 69999,
    category: "cleaning-equipment",
    subcategory: "cleaning-robot",
    image: "https://images.unsplash.com/photo-1603618090561-412154b4bd1b?w=400",
    images: ["https://images.unsplash.com/photo-1603618090561-412154b4bd1b?w=400"],
    inStock: true,
    weight: "5kg",
    weightValue: 5,
    weightUnit: "kg",
    onSale: true,
    isNew: true,
    lowStock: true,
    brand: "AlClean Tech",
    tags: ["robot", "smart", "equipment", "ai"],
    variantId: "gid://shopify/ProductVariant/10",
    quantityAvailable: 3,
    sku: "ALC-CR-001",
  },
  {
    id: "gid://shopify/Product/11",
    handle: "professional-mop-bucket",
    name: "Professional Mop Bucket with Wringer",
    description: "Heavy-duty mop bucket with built-in wringer and wheels. 25-liter capacity. Perfect for commercial and residential use. Durable construction.",
    price: 14999,
    category: "cleaning-equipment",
    subcategory: "mop-buckets",
    image: "https://images.unsplash.com/photo-1749214317455-efbdd57df844?w=400",
    images: ["https://images.unsplash.com/photo-1749214317455-efbdd57df844?w=400"],
    inStock: true,
    weight: "3kg",
    weightValue: 3,
    weightUnit: "kg",
    brand: "AlClean Pro",
    tags: ["mop", "bucket", "equipment", "professional"],
    variantId: "gid://shopify/ProductVariant/11",
    quantityAvailable: 20,
    sku: "ALC-MB-001",
  },
  {
    id: "gid://shopify/Product/12",
    handle: "microfiber-mop-set",
    name: "Microfiber Mop Set - Complete Kit",
    description: "Complete microfiber mop set with telescopic handle and 3 washable pads. Perfect for all floor types. Easy to use and maintain.",
    price: 3499,
    originalPrice: 4299,
    category: "cleaning-equipment",
    subcategory: "mop-buckets",
    image: "https://images.unsplash.com/photo-1749214317455-efbdd57df844?w=400",
    images: ["https://images.unsplash.com/photo-1749214317455-efbdd57df844?w=400"],
    inStock: true,
    weight: "1.5kg",
    weightValue: 1.5,
    weightUnit: "kg",
    onSale: true,
    brand: "AlClean",
    tags: ["mop", "microfiber", "cleaning"],
    variantId: "gid://shopify/ProductVariant/12",
    quantityAvailable: 35,
    sku: "ALC-MM-001",
  },

  // Floor Cleaners
  {
    id: "gid://shopify/Product/20",
    handle: "tile-floor-cleaner",
    name: "Tile & Floor Cleaner - Multi-Surface",
    description: "Professional-grade floor cleaner suitable for tiles, marble, and hardwood. Leaves floors sparkling clean without residue.",
    price: 1299,
    category: "cleaning-chemicals",
    subcategory: "floor-cleaner",
    image: "https://images.unsplash.com/photo-1758273705792-a2887e079e83?w=400",
    images: ["https://images.unsplash.com/photo-1758273705792-a2887e079e83?w=400"],
    inStock: true,
    weight: "2kg",
    weightValue: 2,
    weightUnit: "kg",
    brand: "AlClean",
    tags: ["floor", "tile", "cleaner", "multi-surface"],
    variantId: "gid://shopify/ProductVariant/20",
    quantityAvailable: 60,
    sku: "ALC-TF-001",
  },
  {
    id: "gid://shopify/Product/21",
    handle: "wood-floor-polish",
    name: "Wood Floor Polish - Protective Shine",
    description: "Premium wood floor polish that cleans, protects, and shines. Safe for all wood types. Long-lasting protection.",
    price: 1899,
    originalPrice: 2299,
    category: "cleaning-chemicals",
    subcategory: "floor-cleaner",
    image: "https://images.unsplash.com/photo-1758273705792-a2887e079e83?w=400",
    images: ["https://images.unsplash.com/photo-1758273705792-a2887e079e83?w=400"],
    inStock: true,
    weight: "1kg",
    weightValue: 1,
    weightUnit: "kg",
    onSale: true,
    brand: "AlClean Premium",
    tags: ["wood", "floor", "polish", "protective"],
    variantId: "gid://shopify/ProductVariant/21",
    quantityAvailable: 25,
    sku: "ALC-WP-001",
  },

  // Glass Cleaners
  {
    id: "gid://shopify/Product/30",
    handle: "streak-free-glass-cleaner",
    name: "Streak-Free Glass Cleaner - Crystal Clear",
    description: "Professional glass cleaner that leaves no streaks. Perfect for windows, mirrors, and glass surfaces. Quick-drying formula.",
    price: 899,
    category: "cleaning-chemicals",
    subcategory: "glass-cleaner",
    image: "https://images.unsplash.com/photo-1758273705792-a2887e079e83?w=400",
    images: ["https://images.unsplash.com/photo-1758273705792-a2887e079e83?w=400"],
    inStock: true,
    weight: "500g",
    weightValue: 0.5,
    weightUnit: "kg",
    isNew: true,
    brand: "AlClean",
    tags: ["glass", "cleaner", "streak-free", "windows"],
    variantId: "gid://shopify/ProductVariant/30",
    quantityAvailable: 80,
    sku: "ALC-GC-001",
  },

  // Out of Stock Example
  {
    id: "gid://shopify/Product/40",
    handle: "industrial-vacuum-cleaner",
    name: "Industrial Vacuum Cleaner - Heavy Duty",
    description: "Professional-grade industrial vacuum cleaner. Currently out of stock, will be available soon.",
    price: 45999,
    category: "cleaning-equipment",
    subcategory: "vacuum-cleaners",
    image: "https://images.unsplash.com/photo-1603618090561-412154b4bd1b?w=400",
    images: ["https://images.unsplash.com/photo-1603618090561-412154b4bd1b?w=400"],
    inStock: false,
    weight: "8kg",
    weightValue: 8,
    weightUnit: "kg",
    brand: "AlClean Industrial",
    tags: ["vacuum", "industrial", "heavy-duty"],
    variantId: "gid://shopify/ProductVariant/40",
    quantityAvailable: 0,
    sku: "ALC-VC-001",
  },
];

/**
 * Get products with optional filters
 */
export function getProducts(filters?: {
  category?: string;
  subcategory?: string;
  inStock?: boolean;
  search?: string;
}): Product[] {
  let products = [...mockProducts];

  if (filters?.category) {
    products = products.filter(p => p.category === filters.category);
  }

  if (filters?.subcategory) {
    products = products.filter(p => p.subcategory === filters.subcategory);
  }

  if (filters?.inStock !== undefined) {
    products = products.filter(p => p.inStock === filters.inStock);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  return products;
}

/**
 * Get a single product by ID or handle
 */
export function getProduct(idOrHandle: string): Product | undefined {
  return mockProducts.find(p => p.id === idOrHandle || p.handle === idOrHandle);
}

/**
 * Get featured/new products
 */
export function getFeaturedProducts(limit: number = 4): Product[] {
  return mockProducts
    .filter(p => p.isNew || p.onSale)
    .slice(0, limit);
}

/**
 * Get products by category
 */
export function getProductsByCategory(category: string): Product[] {
  return mockProducts.filter(p => p.category === category);
}
