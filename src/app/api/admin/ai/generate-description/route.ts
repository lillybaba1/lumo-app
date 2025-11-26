import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateContentInputSchema = z.object({
  type: z.enum(['title', 'description', 'attributes', 'seo', 'category', 'tags']).default('description'),
  productName: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  imageUrls: z.array(z.string()).min(1).max(5),
});

export async function POST(req: Request) {
  try {
    // Check admin authentication
    await requireAdmin({ redirect: false });

    const body = await req.json();

    // Validate input
    const validation = GenerateContentInputSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { type, productName, category, description, price, imageUrls } = validation.data;

    console.log('[AI Content] Generating:', {
      type,
      productName,
      category,
      imageCount: imageUrls.length,
    });

    let promptText = '';

    switch (type) {
      case 'title':
        promptText = `You are an expert e-commerce product naming specialist. Analyze the product image(s) and generate a compelling product title.

GUIDELINES FOR PRODUCT TITLES:
- Keep it concise (3-8 words ideal)
- Include key features or distinguishing characteristics
- Use specific, descriptive language
- Make it search-friendly and clear
- Capitalize appropriately (Title Case)
- No promotional language like "Best" or "Amazing"

${category ? `Category: ${category}` : ''}
${description ? `Context: ${description.substring(0, 200)}` : ''}

Based on the image(s), generate a clear, compelling product title. Return ONLY the title, nothing else.`;
        break;

      case 'description':
        promptText = `You are an expert e-commerce product description writer. Analyze the product image(s) provided and generate a compelling, detailed product description.

GUIDELINES:
- Be descriptive and highlight key features visible in the images
- Use professional yet friendly tone
- Focus on benefits and use cases
- Keep it concise (2-4 sentences for simple products, up to 6-8 sentences for complex ones)
- Make it engaging and conversion-focused
- Describe materials, colors, and notable design elements you can see

${productName ? `Product Name: ${productName}` : ''}
${category ? `Category: ${category}` : ''}

Based on the image(s), generate a product description. Return ONLY the description text, no additional commentary.`;
        break;

      case 'attributes':
        promptText = `You are an expert e-commerce product analyst. Analyze the product image(s) and identify key product attributes/specifications.

GUIDELINES FOR ATTRIBUTES:
- List measurable or observable attributes only
- Common attributes: Material, Color, Size, Style, Pattern, Features, etc.
- Be specific and accurate based on what you can see
- Return as a JSON array of objects with "name" and "value" fields
- Maximum 8-10 most relevant attributes

${productName ? `Product Name: ${productName}` : ''}
${category ? `Category: ${category}` : ''}
${description ? `Description: ${description.substring(0, 200)}` : ''}

Analyze the image(s) and generate product attributes. Return ONLY valid JSON in this format:
[{"name": "Material", "value": "Cotton"}, {"name": "Color", "value": "Blue"}]`;
        break;

      case 'seo':
        promptText = `You are an SEO expert for e-commerce. Analyze the product image(s) and generate SEO metadata.

GUIDELINES FOR SEO METADATA:
- Meta Title: 50-60 characters, include primary keyword
- Meta Description: 150-160 characters, compelling and actionable
- Keywords: 5-10 relevant search terms, comma-separated
- Focus on search intent and conversion
- Use natural language, avoid keyword stuffing

${productName ? `Product Name: ${productName}` : ''}
${category ? `Category: ${category}` : ''}
${description ? `Description: ${description.substring(0, 200)}` : ''}

Generate SEO metadata in JSON format:
{
  "metaTitle": "Product Name - Key Feature | Store Name",
  "metaDescription": "Compelling 150-160 char description with benefits",
  "keywords": "keyword1, keyword2, keyword3, keyword4, keyword5"
}

Return ONLY valid JSON, nothing else.`;
        break;

      case 'category':
        promptText = `You are an e-commerce categorization expert. Analyze the product image(s) and suggest the most appropriate product category.

GUIDELINES FOR CATEGORY SELECTION:
- Choose from standard e-commerce categories
- Be specific but not overly narrow
- Consider the product's primary use case
- Think about how customers would search for this

${productName ? `Product Name: ${productName}` : ''}
${description ? `Description: ${description.substring(0, 200)}` : ''}

Common categories include: Electronics, Clothing, Home & Garden, Sports, Books, Toys, Beauty, Food, Automotive, etc.

Based on the image(s), suggest the most appropriate category. Return ONLY the category name, nothing else.`;
        break;

      case 'tags':
        promptText = `You are an e-commerce tagging specialist. Analyze the product image(s) and generate relevant search tags/keywords.

GUIDELINES FOR PRODUCT TAGS:
- 8-15 relevant tags
- Include: style, use case, occasion, audience, features
- Mix specific and broad terms
- Think about customer search behavior
- Use lowercase, single words or 2-word phrases

${productName ? `Product Name: ${productName}` : ''}
${category ? `Category: ${category}` : ''}
${description ? `Description: ${description.substring(0, 200)}` : ''}

Generate product tags as a JSON array of strings:
["tag1", "tag2", "tag3", "tag4", "tag5"]

Return ONLY valid JSON array, nothing else.`;
        break;
    }

    // Generate content using AI with multimodal input
    const { text } = await ai.generate({
      prompt: [
        { text: promptText },
        ...imageUrls.map(url => ({ media: { url } }))
      ]
    });

    console.log('[AI Content] Generated successfully:', type);

    // For JSON response types, try to parse
    if (type === 'attributes' || type === 'seo' || type === 'tags') {
      try {
        const parsed = JSON.parse(text);

        if (type === 'attributes') {
          return NextResponse.json({
            attributes: parsed,
            success: true,
          });
        } else if (type === 'seo') {
          return NextResponse.json({
            seo: parsed,
            success: true,
          });
        } else if (type === 'tags') {
          return NextResponse.json({
            tags: parsed,
            success: true,
          });
        }
      } catch (parseError) {
        console.error(`[AI Content] Failed to parse ${type} JSON:`, text);
        // Return raw text if JSON parsing fails
        return NextResponse.json({
          rawText: text,
          success: true,
        });
      }
    }

    return NextResponse.json({
      [type]: text,
      success: true,
    });

  } catch (error: any) {
    console.error('[AI Content] Error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });

    // Check if it's an auth error
    if (error?.name === 'UnauthorizedError') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate content',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
