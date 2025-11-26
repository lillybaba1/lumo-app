# AI Assistant Guide for Admins

## Overview

The Lumo AI Assistant is a powerful tool that helps admins create professional product listings quickly and efficiently using AI-powered content generation. The assistant analyzes product images using vision-capable AI models (Gemini 1.5 Flash or GPT-4o) to generate high-quality content.

## 🚀 Quick Start

1. **Upload Product Images** (1-5 images recommended)
2. **Click AI buttons** next to any field you want to auto-generate
3. **Review and edit** the generated content
4. **Save** your product

## 📋 Available AI Features

### 1. Product Title Generation ✨
**Location:** Small "AI" button next to Product Name field

**What it generates:**
- Concise 3-8 word product titles
- SEO-friendly and descriptive
- Includes key features or distinguishing characteristics

**Best practices:**
- Upload clear product images first
- Select category for better context
- Edit to match your brand voice

**Example outputs:**
- "Classic Cotton Crew Neck T-Shirt"
- "Wireless Bluetooth Noise Cancelling Headphones"
- "Stainless Steel Insulated Water Bottle"

---

### 2. Product Description Generation ✨
**Location:** "Generate with AI" button next to Description field

**What it generates:**
- 2-8 sentences of professional product copy
- Highlights visible features, materials, and benefits
- Conversion-focused and engaging
- Uses friendly but professional tone

**Best practices:**
- Fill in product name and category first
- Upload multiple product angles
- Review and add specific details AI might miss (dimensions, warranty, etc.)

**Example output:**
```
This classic crew neck t-shirt is crafted from 100% premium cotton for all-day
comfort. The timeless design features a ribbed neckline and straight hem, making
it perfect for casual everyday wear or layering under jackets. Available in a
range of colors, this versatile staple is pre-shrunk for a consistent fit wash
after wash.
```

---

### 3. Product Attributes Generation ✨
**Location:** "Generate with AI" button in Attributes section

**What it generates:**
- 8-10 key product specifications
- Structured as name-value pairs
- Includes: Material, Color, Size, Style, Pattern, Features

**Best practices:**
- Generate after filling in name and description
- Attributes are appended to existing ones (not replaced)
- Remove irrelevant attributes manually
- Add technical specs AI can't see (battery life, dimensions, etc.)

**Example output:**
```json
[
  {"name": "Material", "value": "100% Cotton"},
  {"name": "Color", "value": "Navy Blue"},
  {"name": "Style", "value": "Crew Neck"},
  {"name": "Fit", "value": "Regular"},
  {"name": "Sleeve Length", "value": "Short Sleeve"},
  {"name": "Pattern", "value": "Solid"},
  {"name": "Care Instructions", "value": "Machine Washable"}
]
```

---

### 4. SEO Metadata Generation (API Only) 🔍
**Endpoint:** `POST /api/admin/ai/generate-description`
**Type:** `seo`

**What it generates:**
- **Meta Title**: 50-60 characters with primary keyword
- **Meta Description**: 150-160 characters, compelling and actionable
- **Keywords**: 5-10 relevant search terms

**Example output:**
```json
{
  "metaTitle": "Classic Cotton T-Shirt - Comfortable Everyday Wear | Lumo",
  "metaDescription": "Shop our premium cotton crew neck t-shirt. Soft, durable, and perfect for any occasion. Available in multiple colors. Free shipping on orders over $50.",
  "keywords": "cotton t-shirt, crew neck, casual wear, everyday basics, comfortable shirt"
}
```

**Integration example:**
```typescript
const response = await fetch('/api/admin/ai/generate-description', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'seo',
    productName: 'Classic Cotton T-Shirt',
    category: 'Clothing',
    description: 'Premium cotton crew neck...',
    imageUrls: [image1, image2]
  })
});

const { seo } = await response.json();
// seo.metaTitle, seo.metaDescription, seo.keywords
```

---

### 5. Smart Category Suggestion (API Only) 📂
**Endpoint:** `POST /api/admin/ai/generate-description`
**Type:** `category`

**What it generates:**
- Most appropriate product category based on images
- Considers standard e-commerce categories
- Specific but not overly narrow

**Example output:**
```
"Clothing"
```

**Integration example:**
```typescript
const response = await fetch('/api/admin/ai/generate-description', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'category',
    productName: 'Wireless Headphones',
    description: 'Bluetooth noise-cancelling...',
    imageUrls: [image1]
  })
});

const { category } = await response.json();
```

---

### 6. Product Tags Generation (API Only) 🏷️
**Endpoint:** `POST /api/admin/ai/generate-description`
**Type:** `tags`

**What it generates:**
- 8-15 relevant search tags
- Mix of specific and broad terms
- Lowercase, single words or 2-word phrases
- Based on customer search behavior

**Example output:**
```json
["cotton", "t-shirt", "crew neck", "casual wear", "basics", "everyday", "comfortable", "summer", "men's fashion", "wardrobe staple"]
```

**Integration example:**
```typescript
const response = await fetch('/api/admin/ai/generate-description', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'tags',
    productName: 'Classic Cotton T-Shirt',
    category: 'Clothing',
    description: 'Premium cotton crew neck...',
    imageUrls: [image1, image2]
  })
});

const { tags } = await response.json();
```

---

## 💡 Pro Tips

### Getting Better Results

1. **Image Quality Matters**
   - Upload clear, well-lit product images
   - Include multiple angles (front, back, side, detail shots)
   - Show product in use when possible
   - Use 2-5 images for best results

2. **Provide Context**
   - Fill in product name before generating description
   - Select category before generating title
   - The more context you provide, the better the results

3. **Review and Customize**
   - AI is a starting point, not a finished product
   - Add specific technical details
   - Adjust tone for your brand voice
   - Include information AI can't see (dimensions, weight, warranty)

4. **Iterative Approach**
   - Generate title → Select category → Generate description → Generate attributes
   - This order gives each generation more context

### Time-Saving Workflows

**Workflow 1: Complete Product from Images**
```
1. Upload 3-4 product images
2. Click AI on Product Name → Get title
3. Select/confirm category
4. Click Generate with AI on Description → Get copy
5. Click Generate with AI on Attributes → Get specs
6. Review all fields, add price and stock
7. Save product
```
Time saved: 60-80% compared to manual entry

**Workflow 2: Enhance Existing Products**
```
1. Edit existing product
2. Upload better images if needed
3. Click Generate with AI on Description → Upgrade copy
4. Click Generate with AI on Attributes → Add missing specs
5. Save enhancements
```
Time saved: 50% compared to manual rewriting

### Common Issues and Solutions

**Issue:** AI button is disabled
**Solution:** Upload at least one product image first

**Issue:** Generated content is not accurate
**Solution:**
- Use higher quality images
- Add more context (name, category, description)
- Generate again with different images

**Issue:** Attributes are replacing my existing ones
**Solution:** Attributes are actually appended, not replaced. Remove unwanted ones manually.

**Issue:** Generated text is too long/short
**Solution:** Edit manually after generation. You can regenerate multiple times to get different variations.

---

## 🔐 Security

- All AI features require admin authentication
- Non-admin users receive 401 errors if they attempt to access
- Image URLs are validated (max 5 images)
- All inputs are sanitized with Zod schemas

---

## 🎯 Best Use Cases

### When to Use AI Generation

✅ **Use AI when:**
- Adding new products in bulk
- Product has clear visual features
- You need SEO-optimized copy quickly
- Starting from scratch with minimal info
- Standardizing product descriptions

❌ **Don't rely solely on AI when:**
- Product has complex technical specifications
- Legal/compliance information is needed
- Specific dimensions or measurements are critical
- Warranty or return policy details needed
- Brand-specific terminology is important

---

## 📊 Performance Tips

### Image Optimization

- **Recommended:** 2-5 images per product
- **Format:** JPEG, PNG (WebP also supported)
- **Size:** Under 4MB per image
- **Resolution:** At least 800x800px

### API Usage

- Maximum 5 images per generation request
- Responses typically take 3-10 seconds
- All content types can be generated in parallel
- Rate limits apply (see admin dashboard)

---

## 🚀 Advanced Integration

### Programmatic Access

All AI features are available via the unified endpoint:

```typescript
POST /api/admin/ai/generate-description

Body: {
  type: 'title' | 'description' | 'attributes' | 'seo' | 'category' | 'tags',
  productName?: string,
  category?: string,
  description?: string,
  price?: number,
  imageUrls: string[] // 1-5 URLs
}

Response: {
  success: true,
  [type]: string | object | array // depending on type
}
```

### Batch Processing

You can create custom scripts to process multiple products:

```typescript
async function enhanceProducts(products: Product[]) {
  for (const product of products) {
    if (product.imageUrls.length > 0) {
      // Generate description
      const desc = await generateContent('description', product);

      // Generate attributes
      const attrs = await generateContent('attributes', product);

      // Generate SEO
      const seo = await generateContent('seo', product);

      // Update product
      await updateProduct(product.id, { ...desc, ...attrs, ...seo });
    }
  }
}
```

---

## 🤝 Support

For issues or questions about the AI Assistant:
- Check this guide first
- Review error messages in the console
- Contact technical support with specific error details
- Include: product ID, generation type, and error message

---

## 📈 Success Metrics

After implementing AI-assisted product management, admins typically report:
- **60-80% reduction** in time spent on product data entry
- **Improved SEO** from consistent, optimized descriptions
- **Higher conversion rates** from professional product copy
- **Better attribute coverage** across product catalog
- **Faster time-to-market** for new products

---

## 🔄 Version History

### Current Version: 2.0
- Added SEO metadata generation
- Added smart category suggestions
- Added product tags generation
- Enhanced title generation with context awareness
- Improved attribute generation with better formatting

### Version 1.0
- Initial release with title, description, and attribute generation

---

*Last updated: November 26, 2025*
