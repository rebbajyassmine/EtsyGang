import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

type GeneratedListing = {
  productTitle: string;
  tags: string[];
  productDescription: string;
};

function extractJsonPayload(content: string) {
  const trimmed = content.trim();

  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  return trimmed;
}

function normalizeListing(payload: unknown): GeneratedListing {
  if (!payload || typeof payload !== 'object') {
    throw new Error('AI response was not a JSON object.');
  }

  const candidate = payload as Record<string, unknown> & {
    productTitle?: unknown;
    productDescription?: unknown;
    tags?: unknown;
  };

  let tags: string[] = [];
  if (Array.isArray(candidate.tags)) {
    tags = candidate.tags as string[];
  } else if (typeof candidate.tags === 'string') {
    tags = (candidate.tags as string).split(',').map((tag) => tag.trim()).filter(Boolean);
  }

  if (
    typeof candidate.productTitle !== 'string' ||
    typeof candidate.productDescription !== 'string' ||
    tags.length === 0
  ) {
    throw new Error('AI response is missing required listing fields.');
  }

  return {
    productTitle: candidate.productTitle.trim(),
    productDescription: candidate.productDescription.trim(),
    tags: tags.slice(0, 13),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { productName?: string };
    const productName = body.productName?.trim();

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required.' },
        { status: 400 },
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'Missing GROQ_API_KEY environment variable.' },
        { status: 500 },
      );
    }

    const groq = new Groq({ apiKey: groqApiKey });
    const prompt = `Act as an Etsy SEO expert. Given the product name "${productName}", generate a highly optimized Product Title, a list of 13 Tags, and a compelling Product Description. Return the response in a clean JSON format with keys: productTitle, tags (array of 13 strings), and productDescription.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'Return only valid JSON with the keys productTitle, tags, and productDescription. tags must be an array of exactly 13 short Etsy SEO tags. Do not include any markdown code blocks.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'The AI returned an empty response.' },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(extractJsonPayload(content)) as unknown;
    const listing = normalizeListing(parsed);

    return NextResponse.json({
      success: true,
      listing,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}