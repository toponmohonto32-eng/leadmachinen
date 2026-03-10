import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/leads/[id]/notes
 * Get lead notes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      select: { notes: true },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notes: lead.notes || '',
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/leads/[id]/notes
 * Update lead notes
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const body = await request.json();
    const { notes } = body;

    const lead = await db.lead.update({
      where: { id: leadId },
      data: {
        notes: notes || '',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      lead,
    });
  } catch (error) {
    console.error('Error updating notes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notes' },
      { status: 500 }
    );
  }
}
