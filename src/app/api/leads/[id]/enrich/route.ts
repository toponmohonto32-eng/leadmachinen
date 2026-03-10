import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { multiProviderAI } from '@/lib/ai-providers';

/**
 * POST /api/leads/[id]/enrich
 * Enrich a lead with AI-powered insights and contact finding
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;

    const lead = await db.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Find top management contacts using multi-provider AI
    const location = [lead.city, lead.state, lead.country].filter(Boolean).join(', ');
    const contacts = await multiProviderAI.findTopManagement(
      lead.name,
      location,
      lead.website || undefined
    );

    // Save contacts to database
    for (const contact of contacts) {
      try {
        await db.contact.create({
          data: {
            leadId: lead.id,
            name: contact.name,
            role: contact.role,
            email: contact.email || null,
            linkedIn: contact.linkedIn || null,
            facebook: contact.facebook || null,
            twitter: contact.twitter || null,
            confidence: contact.confidence,
            source: contact.source,
            rawContactData: JSON.stringify(contact),
          },
        });
      } catch (error) {
        console.error('Error saving contact:', error);
      }
    }

    // Enrich business data if description and category available
    if (lead.description && lead.category) {
      const enrichment = await multiProviderAI.enrichBusinessData(
        lead.name,
        lead.description,
        lead.category,
        location
      );

      // Update lead with enriched data (we'll store insights in description for now)
      if (enrichment.insights && enrichment.insights.length > 0) {
        const updatedDescription = `${lead.description}\n\nAI Insights:\n${enrichment.insights.join('\n- ')}`;
        
        await db.lead.update({
          where: { id: lead.id },
          data: {
            description: updatedDescription,
            isEnriched: true,
          },
        });
      }
    }

    // Update lead as enriched
    const updatedLead = await db.lead.update({
      where: { id: lead.id },
      data: { isEnriched: true },
      include: {
        contacts: true,
        reviews: true,
      },
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      message: 'Lead enriched successfully',
      contactsFound: contacts.length,
    });
  } catch (error) {
    console.error('Error enriching lead:', error);
    return NextResponse.json(
      { error: 'Failed to enrich lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
