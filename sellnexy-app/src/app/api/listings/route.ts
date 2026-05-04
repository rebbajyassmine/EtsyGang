import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    // All listings are stored in client-side localStorage
    // This endpoint is kept for compatibility but returns empty
    return NextResponse.json({ listings: [] }, { status: 200 });
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
    const body = (await request.json()) as { documentId: string };
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // All deletions are handled client-side via localStorage
    // This endpoint is kept for compatibility
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
