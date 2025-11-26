import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateDescriptionInputSchema = z.object({
  productName: z.string().optional(),
  category: z.string().optional(),
  imageUrls: z.array(z.string()).min(1).max(5), // At least 1, max 5 images
});

export async function POST(req: Request) {
  try {
    // Check admin authentication
    await requireAdmin({ redirect: false });

    const body = await req.json();

    // Validate input
    const validation = GenerateDescriptionInputSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { productName, category, imageUrls } = validation.data;

    console.log('[AI Description] Generating description:', {
      productName,
      category,
      imageCount: imageUrls.length,
    });

    // Build the prompt
    let promptText = `You are an expert e-commerce product description writer. Analyze the product image(s) provided and generate a compelling, detailed product description.

GUIDELINES:
- Be descriptive and highlight key features visible in the images
- Use professional yet friendly tone
- Focus on benefits and use cases
- Keep it concise (2-4 sentences for simple products, up to 6-8 sentences for complex ones)
- Make it engaging and conversion-focused
- Describe materials, colors, and notable design elements you can see`;

    if (productName) {
      promptText += `\n\nProduct Name: ${productName}`;
    }
    if (category) {
      promptText += `\nCategory: ${category}`;
    }

    promptText += `\n\nBased on the image(s), generate a product description. Return ONLY the description text, no additional commentary.`;

    // Generate description using AI with multimodal input
    // Format the prompt with image URLs
    const { text } = await ai.generate({
      prompt: [
        { text: promptText },
        ...imageUrls.map(url => ({ media: { url } }))
      ]
    });

    console.log('[AI Description] Generated successfully');

    return NextResponse.json({
      description: text,
      success: true,
    });

  } catch (error: any) {
    console.error('[AI Description] Error:', {
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
        error: 'Failed to generate description',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
