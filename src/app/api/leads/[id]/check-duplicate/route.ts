import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { multiProviderAI } from '@/lib/ai-providers';

/**
 * POST /api/leads/[id]/check-duplicate
 * Check if a lead is a duplicate of existing leads using AI
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;

    // Fetch the lead to check
    const lead = await db.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Fetch other leads for comparison
    const existingLeads = await db.lead.findMany({
      where: {
        id: { not: leadId },
        isDuplicate: false, // Only compare against non-duplicates
      },
      take: 50,
    });

    // Check for duplicates using AI
    const duplicateCheck = await multiProviderAI.detectDuplicates(lead, existingLeads);

    // If duplicate found, update the lead
    if (duplicateCheck.isDuplicate && duplicateCheck.duplicateOf) {
      await db.lead.update({
        where: { id: leadId },
        data: {
          isDuplicate: true,
          duplicateOf: duplicateCheck.duplicateOf,
          notes: `Marked as duplicate: ${duplicateCheck.reason}`,
          updatedAt: new Date(),
        },
      });
    }

    // If duplicate found, also get the original lead details
    let originalLead = null;
    if (duplicateCheck.duplicateOf) {
      originalLead = await db.lead.findUnique({
        where: { id: duplicateCheck.duplicateOf },
      });
    }

    return NextResponse.json({
      success: true,
      leadId,
      duplicateCheck,
      originalLead,
    });
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check for duplicates' },
      { status: 500 }
    );
  }
}
