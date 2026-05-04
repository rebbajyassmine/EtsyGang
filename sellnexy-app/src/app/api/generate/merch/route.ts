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

  // Validate title length (should be 50-200 chars for Merch)
  const title = typeof candidate.productTitle === 'string' ? candidate.productTitle.trim() : '';
  if (!title || title.length < 40) {
    throw new Error('Title is too short. Must be 40+ characters for good SEO.');
  }

  // Validate description length (should be 200+ chars for Merch)
  const description = typeof candidate.productDescription === 'string' ? candidate.productDescription.trim() : '';
  if (!description || description.length < 150) {
    throw new Error('Description is too short. Must be 150+ characters.');
  }

  // Parse and validate tags
  let tags: string[] = [];
  if (Array.isArray(candidate.tags)) {
    tags = (candidate.tags as unknown[])
      .map((t) => (typeof t === 'string' ? t.trim() : ''))
      .filter((t) => t.length > 0);
  } else if (typeof candidate.tags === 'string') {
    tags = (candidate.tags as string)
      .split(',')
      .map((tag) => tag.trim())
      .filter((t) => t.length > 0);
  }

  if (tags.length < 10) {
    throw new Error(`Need at least 10 quality tags. Got ${tags.length}.`);
  }

  return {
    productTitle: title.slice(0, 200),
    productDescription: description,
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
    
    const systemPrompt = `You are a Merch by Amazon SEO expert specializing in print-on-demand t-shirt, hoodie, and apparel design optimization. Your task is to generate high-converting Merch by Amazon product listings.

CRITICAL RULES:
1. TITLE (up to 200 chars): Include multiple keywords naturally. Format: "Primary Keyword - Secondary Keyword [Design Style]". Examples: "Dog Lover Funny Tshirt - Gifts for Dog Mom, Cute Dog Apparel"
2. DESCRIPTION (150-300 words): Focus on design quality, versatility, and target audience. Emphasize: who wears this, occasions/events, material quality, comfortable fit, perfect gift. Avoid generic filler.
3. TAGS (13 keywords): MUST include niche keywords, audience keywords, occasion keywords, and lifestyle keywords. 1-3 words each. Examples: "dog lover gifts", "funny tshirt", "dog mom apparel", "pet lover gifts", "animal lover clothing".

TAGS STRATEGY for Merch:
- Target audience: "dog lovers", "cat owners", "plant parents", "coffee lovers"
- Design style: "funny tshirt", "cute apparel", "witty design", "humorous clothing"
- Occasions: "birthday gift", "holiday gift", "christmas apparel", "father's day"
- Niche categories: "pet lover", "animal lover", "hobby shirts"
- Lifestyle: "casual wear", "comfortable clothing", "everyday wear"

Return ONLY valid JSON. No markdown, no explanation.`;

    const userPrompt = `Generate a professional Merch by Amazon listing for a design about: "${productName}"

Requirements:
- Title: 50-150 characters. Include primary keyword, design style, and benefit. Make it keyword-rich and compelling.
- Description: 200-300 words. Focus on design quality and who should wear it. Include fit/comfort, perfect for gifts/occasions.
- Tags: 13 relevant keywords. Mix of audience targets, design style, occasions, and lifestyle keywords (1-3 words each).

Return JSON with keys: productTitle, productDescription, tags (array of 13 strings).`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
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
