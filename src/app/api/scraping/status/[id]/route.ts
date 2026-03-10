import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/scraping/status/[id]
 * Get the status of a specific search
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const search = await db.search.findUnique({
      where: { id: params.id },
      include: {
        leads: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!search) {
      return NextResponse.json(
        { error: 'Search not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      search,
    });
  } catch (error) {
    console.error('Error fetching search status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search status' },
      { status: 500 }
    );
  }
}
