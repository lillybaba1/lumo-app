import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateContentInputSchema = z.object({
  type: z.enum(['title', 'description', 'attributes']).default('description'),
  productName: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
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

    const { type, productName, category, description, imageUrls } = validation.data;

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
    }

    // Generate content using AI with multimodal input
    const { text } = await ai.generate({
      prompt: [
        { text: promptText },
        ...imageUrls.map(url => ({ media: { url } }))
      ]
    });

    console.log('[AI Content] Generated successfully:', type);

    // For attributes, try to parse as JSON
    if (type === 'attributes') {
      try {
        const attributes = JSON.parse(text);
        return NextResponse.json({
          attributes,
          success: true,
        });
      } catch (parseError) {
        console.error('[AI Content] Failed to parse attributes JSON:', text);
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
