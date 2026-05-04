import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Listings API is no longer needed - client uses localStorage instead
export async function GET() {
  return NextResponse.json(
    { message: 'Use browser localStorage for saved listings' },
    { status: 200 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: 'Use browser localStorage for saved listings' },
    { status: 200 }
  );
}
