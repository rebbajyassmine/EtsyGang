import { getDatabases } from '@/lib/appwrite';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const APPWRITE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID;

export async function GET() {
  try {
    if (!APPWRITE_DATABASE_ID || !APPWRITE_COLLECTION_ID) {
      return NextResponse.json(
        { error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const databases = getDatabases();
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      []
    );

    const listings = response.documents.map((doc) => {
      const record = doc as {
        $id: string;
        $createdAt: string;
        productTitle?: unknown;
        productDescription?: unknown;
        tags?: unknown;
      };

      return {
        $id: record.$id,
        productTitle: typeof record.productTitle === 'string' ? record.productTitle : '',
        productDescription:
          typeof record.productDescription === 'string' ? record.productDescription : '',
        tags: typeof record.tags === 'string'
          ? record.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
          : Array.isArray(record.tags)
            ? record.tags.filter((tag): tag is string => typeof tag === 'string')
            : [],
        $createdAt: record.$createdAt,
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

    if (!APPWRITE_DATABASE_ID || !APPWRITE_COLLECTION_ID) {
      return NextResponse.json(
        { error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const databases = getDatabases();
    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      documentId
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
