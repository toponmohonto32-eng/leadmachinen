import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { multiProviderAI } from '@/lib/ai-providers';

/**
 * POST /api/leads/bulk/enrich
 * Enrich multiple leads with AI-powered scoring and qualification
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leadIds, enrichAll = false } = body;

    // Fetch leads to enrich
    let leads;
    if (enrichAll) {
      // Enrich all leads that haven't been enriched yet
      leads = await db.lead.findMany({
        where: { isEnriched: false },
        include: {
          reviews: true,
          contacts: true,
        },
        take: 50, // Limit to 50 at a time to avoid overwhelming
      });
    } else if (Array.isArray(leadIds) && leadIds.length > 0) {
      // Enrich specific leads
      leads = await db.lead.findMany({
        where: { id: { in: leadIds } },
        include: {
          reviews: true,
          contacts: true,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'No leads specified for enrichment' },
        { status: 400 }
      );
    }

    if (leads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No leads to enrich',
        results: { enriched: [], failed: [], skipped: [] },
      });
    }

    // Batch enrich leads using AI
    const { enriched, failed } = await multiProviderAI.batchEnrichLeads(leads);

    // Update enriched leads in database
    const updates = enriched.map(async (lead) => {
      // Validate email if present
      let emailValidation: { isValid: boolean; isDeliverable: boolean; confidence: number; details: string } | null = null;
      if (lead.email) {
        emailValidation = await multiProviderAI.validateEmail(lead.email);
      }

      return db.lead.update({
        where: { id: lead.id },
        data: {
          qualityScore: lead.qualityScore,
          qualityFactors: lead.qualityFactors,
          tags: lead.tags,
          status: lead.status,
          priority: lead.priority,
          emailValid: emailValidation?.isValid || null,
          emailDeliverable: emailValidation?.isDeliverable || null,
          isEnriched: true,
          updatedAt: new Date(),
        },
      });
    });

    const updatedLeads = await Promise.all(updates);

    // Count skipped leads (already enriched)
    const skipped = leads.length - enriched.length - failed.length;

    return NextResponse.json({
      success: true,
      message: `Enriched ${enriched.length} leads, ${failed.length} failed, ${skipped} skipped`,
      results: {
        enriched: updatedLeads,
        failed: failed.map(l => ({ id: l.id, name: l.name })),
        skipped: skipped,
      },
    });
  } catch (error) {
    console.error('Error bulk enriching leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to bulk enrich leads' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads/bulk/enrich
 * Get statistics about lead enrichment status
 */
export async function GET() {
  try {
    const total = await db.lead.count();
    const enriched = await db.lead.count({ where: { isEnriched: true } });
    const notEnriched = total - enriched;

    // Get average quality score
    const avgScoreResult = await db.lead.aggregate({
      where: { isEnriched: true, qualityScore: { not: null } },
      _avg: { qualityScore: true },
    });

    // Count by qualification
    const hotCount = await db.lead.count({ where: { status: 'hot', isEnriched: true } });
    const warmCount = await db.lead.count({ where: { status: 'warm', isEnriched: true } });
    const coldCount = await db.lead.count({ where: { status: 'cold', isEnriched: true } });

    // Count by priority
    const urgentCount = await db.lead.count({ where: { priority: 'urgent', isEnriched: true } });
    const highCount = await db.lead.count({ where: { priority: 'high', isEnriched: true } });
    const mediumCount = await db.lead.count({ where: { priority: 'medium', isEnriched: true } });
    const lowCount = await db.lead.count({ where: { priority: 'low', isEnriched: true } });

    return NextResponse.json({
      success: true,
      stats: {
        total,
        enriched,
        notEnriched,
        enrichmentRate: total > 0 ? ((enriched / total) * 100).toFixed(1) : 0,
        averageQualityScore: avgScoreResult._avg.qualityScore?.toFixed(1) || 0,
        qualification: {
          hot: hotCount,
          warm: warmCount,
          cold: coldCount,
        },
        priority: {
          urgent: urgentCount,
          high: highCount,
          medium: mediumCount,
          low: lowCount,
        },
      },
    });
  } catch (error) {
    console.error('Error getting enrichment stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get enrichment statistics' },
      { status: 500 }
    );
  }
}
