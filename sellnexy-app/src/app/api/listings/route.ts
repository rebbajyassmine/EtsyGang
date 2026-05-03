import { databases } from '@/lib/appwrite';
import { NextRequest, NextResponse } from 'next/server';

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

    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      []
    );

    const listings = response.documents.map((doc: {
      $id: string;
      productTitle: string;
      productDescription: string;
      tags: string | string[];
      $createdAt: string;
    }) => ({
      $id: doc.$id,
      productTitle: doc.productTitle,
      productDescription: doc.productDescription,
      tags: typeof doc.tags === 'string' 
        ? doc.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : Array.isArray(doc.tags) ? doc.tags : [],
      $createdAt: doc.$createdAt,
    }));

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
