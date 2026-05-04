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

  // Validate title length (should be 100-140 chars for Etsy optimization)
  const title = typeof candidate.productTitle === 'string' ? candidate.productTitle.trim() : '';
  if (!title || title.length < 40) {
    throw new Error('Title is too short. Must be 40+ characters for good SEO.');
  }

  // Validate description length (should be 250+ chars for good quality)
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

  // Validate tag quality (should be 2-4 words, not single words)
  const invalidTags = tags
    .slice(0, 13)
    .filter((tag) => {
      const wordCount = tag.split(' ').length;
      return wordCount === 1 || wordCount > 5;
    });

  if (invalidTags.length > 3) {
    console.warn(`Warning: Found ${invalidTags.length} tags that may be too short or too long: ${invalidTags.join(', ')}`);
  }

  return {
    productTitle: title.slice(0, 140),
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
    
    const systemPrompt = `You are an Etsy SEO expert with 10+ years of experience optimizing product listings for maximum visibility and sales. Your task is to generate professional, high-converting Etsy listings.

CRITICAL RULES:
1. TITLE (140 char max): Use ALL characters available. Include primary keyword, material, style, and benefit. Example: "Handmade Ceramic Coffee Mug - Unique Morning Gift for Her, Customizable Quote Office Mug"
2. DESCRIPTION (250+ words): Write like a professional copywriter. Start with PRIMARY benefit. Include: material, dimensions, care instructions, style/aesthetic, who it's for, gift suitability, and unique selling points. NO generic filler.
3. TAGS (13 long-tail keywords): MUST be 2-4 word phrases that real Etsy buyers search. Examples: "ceramic coffee mug", "handmade gift for her", "office desk decor". NO single words. NO overly broad terms. NO variations of same keyword.

TAGS STRATEGY:
- Mix of high-search-volume (common) and niche long-tail phrases
- Include buyer intent keywords: "gift for", "personalized", "handmade", etc.
- Include material + product keywords: "ceramic mug", "leather jacket", etc.
- Include use-case keywords: "office decor", "kitchen gift", "wedding favor", etc.
- Include style keywords: "vintage style", "modern minimalist", "boho chic", etc.

Return ONLY valid JSON. No markdown, no explanation.`;

    const userPrompt = `Generate a professional Etsy listing for: "${productName}"

Requirements:
- Title: Exactly 140 characters (count every character including spaces). Make it keyword-rich and compelling.
- Description: 250-400 words. Niche-specific, emphasize unique value. Include what the buyer gets, who it's for, and why it's special.
- Tags: 13 long-tail keyword phrases (2-4 words each). Real phrases people search on Etsy, not generic terms.

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