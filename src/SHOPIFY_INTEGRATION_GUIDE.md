# Shopify Integration Guide

## ✅ Completed Updates

### 1. Product Page Improvements
- ✅ Added category filter buttons at the top: "All Products", "Cleaning Chemicals", "Cleaning Equipment"
- ✅ Restored sorting dropdown (Featured, Price: Low to High, Price: High to Low, Name: A-Z)
- ✅ Added separate stock filter dropdown (All Products, In Stock, Out of Stock)
- ✅ Both dropdowns now work side-by-side on the right side of the toolbar

### 2. Shopify Backend Integration
- ✅ Updated `/types/shopify.ts` with simplified Product interface matching Shopify structure
- ✅ Updated `/lib/shopify.ts` with proper GraphQL queries and normalizer functions
- ✅ Products component now fetches real data from Shopify API using `getAllProducts()`
- ✅ Added loading states for product fetching
- ✅ Created `.env.example` file for Shopify configuration

## 🔧 Setup Instructions

### Step 1: Configure Shopify Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Shopify store details in `.env`:
   ```env
   VITE_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   VITE_SHOPIFY_STOREFRONT_TOKEN=your_storefront_access_token
   VITE_SHOPIFY_API_VERSION=2025-07
   ```

### Step 2: Get Your Shopify Storefront Access Token

1. Log in to your Shopify Admin
2. Go to **Settings** > **Apps and sales channels**
3. Click **Develop apps**
4. Create a new app or select existing app
5. Go to **API credentials** tab
6. Under **Storefront API**, configure the following scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
7. Click **Save** and then **Install app**
8. Copy the **Storefront API access token**
9. Paste it in your `.env` file

### Step 3: Tag Your Products in Shopify

The app uses product tags to categorize items. Add these tags to your products in Shopify Admin:

**Category Tags:**
- `chemical` or `cleaning-chemicals` - For cleaning chemicals
- `equipment` or `cleaning-equipment` - For cleaning equipment

**Subcategory Tags (optional but recommended):**
- `fabric` - Fabric washing products
- `floor` - Floor cleaning products
- `car` - Car wash products
- `kitchen` - Kitchen cleaning products
- `bathroom` - Bathroom cleaning products

**Special Tags:**
- `new` - Will show "NEW" badge on product card
- Any discount will automatically show "SALE" badge

### Step 4: Restart Your Development Server

After setting up the `.env` file:

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

## 📋 Remaining Tasks

### Components That Need Property Name Updates

The new Product interface uses `title` instead of `name`. The following components need to be updated:

1. **`/components/ProductCard.tsx`**
   - Line 57: Change `product.name` to `product.title`
   - Line 91: Change `product.name` to `product.title`

2. **`/components/QuickViewModal.tsx`**
   - Line 47: Change `product.name` to `product.title`
   - Line 56: Change `product.name` to `product.title`

3. **`/components/AttractiveHome.tsx`**
   - Line 104: Change `product.name` to `product.title`
   - Update to fetch from Shopify instead of mockProducts

4. **`/components/ProductDetail.tsx`**
   - Line 43: Change `product.name` to `product.title`
   - Line 101: Change `product.name` to `product.title`
   - Line 150: Change `product.name` to `product.title`
   - Line 165: Change `product.name` to `product.title`
   - Update to fetch product by handle from Shopify

### Additional Property Mappings

The new Product interface has different property names:

| Old Property | New Property | Type |
|-------------|--------------|------|
| `name` | `title` | string |
| `variantId` | (removed) | - |
| `weightValue` | (calculated from weight) | - |
| `weightUnit` | (calculated from weight) | - |

### Files That Can Be Removed (Optional)

Once Shopify integration is complete and tested:
- `/lib/mockData.ts` - Mock product data (no longer needed)

## 🔍 How the Integration Works

### Product Fetching Flow

1. **Products Page** (`/components/Products.tsx`):
   ```typescript
   useEffect(() => {
     const products = await getAllProducts();
     setAllProducts(products);
   }, []);
   ```

2. **Shopify GraphQL Query** (`/lib/shopify.ts`):
   - Fetches up to 80 products
   - Gets product data: title, description, images, variants, prices, stock
   - Normalizes data to match frontend Product interface

3. **Category Mapping** (automatic):
   - Reads product tags
   - Maps to categories: fabric, floor, car-wash, kitchen, bathroom, equipment, chemicals
   - Falls back to "general" if no matching tags

### Price Calculation

```typescript
price: Number(variant.price.amount)
originalPrice: Number(variant.compareAtPrice?.amount ?? price)
onSale: originalPrice > price
discountPercent: Math.round(((originalPrice - price) / originalPrice) * 100)
```

### Stock Management

```typescript
inStock: variant.availableForSale
quantityAvailable: variant.quantityAvailable
lowStock: quantityAvailable < 5
```

## 🐛 Troubleshooting

### Products Not Loading

1. Check browser console for errors
2. Verify `.env` variables are set correctly
3. Ensure Storefront API token has correct permissions
4. Check that products are published in your Shopify store

### Wrong Categories Showing

1. Add proper tags to products in Shopify Admin
2. Restart dev server after changing products in Shopify
3. Check category mapping logic in `/lib/shopify.ts`

### CORS Errors

Shopify Storefront API should not have CORS issues, but if you see any:
1. Verify you're using the Storefront API, not the Admin API
2. Check that your token is a Storefront API token
3. Ensure API version is correct (2025-07 or later)

## 📊 Testing Checklist

- [ ] Products load from Shopify
- [ ] Category filter buttons work (All, Chemicals, Equipment)
- [ ] Sort dropdown works (Featured, Price, Name)
- [ ] Stock filter dropdown works (All, In Stock, Out of Stock)
- [ ] Product cards show correct images and prices
- [ ] Sale badges show when compareAtPrice is set
- [ ] NEW badges show for products with "new" tag
- [ ] Low stock badges show when quantity < 5
- [ ] Search functionality works
- [ ] Filter drawer works with subcategories
- [ ] Quick view modal displays products correctly

## 🚀 Next Steps

1. Update remaining components to use `product.title` instead of `product.name`
2. Test the integration with your Shopify store
3. Configure product tags in Shopify for proper categorization
4. Remove mock data once real data is working
5. Add error handling for failed API calls
6. Consider adding pagination for large product catalogs
7. Implement caching for better performance

## 📝 Notes

- The app currently fetches 80 products on load
- Products are cached in component state
- Filtering/sorting happens client-side for better performance
- You can increase the limit in `getAllProducts(limit)` if needed
- Consider implementing pagination or infinite scroll for large catalogs
