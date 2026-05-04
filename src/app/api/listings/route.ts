import { appwriteFetch, getAppwriteConfig } from '@/lib/appwrite';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    const config = await getAppwriteConfig();

    const response = await appwriteFetch(
      `/databases/${config.databaseId}/collections/${config.collectionId}/documents`
    );

    const listings = (response.documents || []).map((doc: {
      $id: string;
      $createdAt: string;
      productTitle?: unknown;
      productDescription?: unknown;
      tags?: unknown;
    }) => {
      return {
        $id: doc.$id,
        productTitle: typeof doc.productTitle === 'string' ? doc.productTitle : '',
        productDescription:
          typeof doc.productDescription === 'string' ? doc.productDescription : '',
        tags: typeof doc.tags === 'string'
          ? doc.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
          : Array.isArray(doc.tags)
            ? doc.tags.filter((tag): tag is string => typeof tag === 'string')
            : [],
        $createdAt: doc.$createdAt,
      };
    });

    return NextResponse.json({ listings }, { status: 200 });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json() as { documentId: string };
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const config = await getAppwriteConfig();

    await appwriteFetch(
      `/databases/${config.databaseId}/collections/${config.collectionId}/documents/${documentId}`,
      { method: 'DELETE' }
    );

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}
