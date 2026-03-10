import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DuplicateDetector } from '@/lib/duplicate-detector';

/**
 * POST /api/leads/duplicates/scan
 * Scan all leads for duplicates
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'scan') {
      const duplicates = await DuplicateDetector.scanAllLeads();
      return NextResponse.json({
        success: true,
        duplicates,
        count: duplicates.length,
      });
    } else if (action === 'merge') {
      const body = await request.json();
      const { primaryId, duplicateIds } = body;

      if (!primaryId || !duplicateIds || !Array.isArray(duplicateIds)) {
        return NextResponse.json(
          { error: 'primaryId and duplicateIds array required' },
          { status: 400 }
        );
      }

      await DuplicateDetector.mergeDuplicates(primaryId, duplicateIds);

      return NextResponse.json({
        success: true,
        message: `Merged ${duplicateIds.length} duplicates into ${primaryId}`,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use: scan or merge' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error handling duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to handle duplicates' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads/duplicates
 * Get all duplicate leads
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (leadId) {
      // Find duplicates for a specific lead
      const lead = await db.lead.findUnique({
        where: { id: leadId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          website: true,
          placeId: true,
          address: true,
          city: true,
          postalCode: true,
        },
      });

      if (!lead) {
        return NextResponse.json(
          { error: 'Lead not found' },
          { status: 404 }
        );
      }

      const duplicates = await DuplicateDetector.findDuplicates(lead);
      return NextResponse.json({
        success: true,
        leadId,
        duplicates,
      });
    } else {
      // Get all marked duplicates
      const duplicates = await db.lead.findMany({
        where: { isDuplicate: true },
        include: {
          _count: {
            select: {
              reviews: true,
              contacts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        success: true,
        duplicates,
        count: duplicates.length,
      });
    }
  } catch (error) {
    console.error('Error fetching duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch duplicates' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leads/duplicates
 * Delete all duplicate leads
 */
export async function DELETE(request: NextRequest) {
  try {
    const result = await db.lead.deleteMany({
      where: { isDuplicate: true },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} duplicate leads`,
    });
  } catch (error) {
    console.error('Error deleting duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to delete duplicates' },
      { status: 500 }
    );
  }
}
