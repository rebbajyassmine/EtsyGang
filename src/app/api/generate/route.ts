import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

import { appwriteFetch, getAppwriteConfig } from '@/lib/appwrite';

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

  const candidate = payload as {
    productTitle?: unknown;
    productDescription?: unknown;
    tags?: unknown;
  };

  const tags = Array.isArray(candidate.tags)
    ? candidate.tags.filter((tag): tag is string => typeof tag === 'string')
    : typeof candidate.tags === 'string'
      ? candidate.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [];

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
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID;

    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'Missing GROQ_API_KEY environment variable.' },
        { status: 500 },
      );
    }

    if (!databaseId || !collectionId) {
      return NextResponse.json(
        { error: 'Missing Appwrite database configuration.' },
        { status: 500 },
      );
    }

    const groq = new Groq({ apiKey: groqApiKey });
    const prompt = `Act as an Etsy SEO expert. Given the product name ${productName}, generate a highly optimized Product Title, a list of 13 Tags, and a compelling Product Description. Return the response in a clean JSON format.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'Return only valid JSON with the keys productTitle, tags, and productDescription. tags must be an array of exactly 13 short Etsy SEO tags.',
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

    // Use Appwrite REST API to save the document (no SDK needed)
    const config = await getAppwriteConfig();
    const document = await appwriteFetch(
      `/databases/${config.databaseId}/collections/${config.collectionId}/documents`,
      {
        method: 'POST',
        body: JSON.stringify({
          data: {
            productName,
            productTitle: listing.productTitle,
            productDescription: listing.productDescription,
            tags: listing.tags.join(', '),
          },
        }),
      }
    );

    return NextResponse.json({
      success: true,
      listing,
      document,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
