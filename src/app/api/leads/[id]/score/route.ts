import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { multiProviderAI } from '@/lib/ai-providers';

/**
 * POST /api/leads/[id]/score
 * Score a lead using AI-powered lead quality assessment
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;

    // Fetch the lead
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        reviews: true,
        contacts: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Calculate lead quality score using AI
    const scoreResult = await multiProviderAI.calculateLeadQualityScore(lead);

    // Validate email if present
    let emailValidation: { isValid: boolean; isDeliverable: boolean; confidence: number; details: string } | null = null;
    if (lead.email) {
      emailValidation = await multiProviderAI.validateEmail(lead.email);
    }

    // Update lead with scoring results
    const updatedLead = await db.lead.update({
      where: { id: leadId },
      data: {
        qualityScore: scoreResult.score,
        qualityFactors: JSON.stringify(scoreResult.factors),
        tags: JSON.stringify(scoreResult.tags),
        status: scoreResult.qualification, // hot/warm/cold
        priority: scoreResult.priority,
        emailValid: emailValidation?.isValid || null,
        emailDeliverable: emailValidation?.isDeliverable || null,
        isEnriched: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      score: scoreResult,
      emailValidation,
    });
  } catch (error) {
    console.error('Error scoring lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to score lead' },
      { status: 500 }
    );
  }
}
