import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/leads/compare
 * Compare multiple leads side by side
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadIds } = body;

    if (!Array.isArray(leadIds) || leadIds.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 lead IDs required for comparison' },
        { status: 400 }
      );
    }

    if (leadIds.length > 5) {
      return NextResponse.json(
        { success: false, error: 'Maximum 5 leads can be compared at once' },
        { status: 400 }
      );
    }

    // Fetch all leads
    const leads = await db.lead.findMany({
      where: { id: { in: leadIds } },
      include: {
        reviews: true,
        contacts: true,
      },
    });

    if (leads.length !== leadIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more leads not found' },
        { status: 404 }
      );
    }

    // Generate comparison data
    const comparison = {
      leads: leads.map(lead => ({
        id: lead.id,
        name: lead.name,
        qualityScore: lead.qualityScore,
        status: lead.status,
        priority: lead.priority,
        hasWebsite: lead.hasWebsite,
        website: lead.website,
        email: lead.email,
        phone: lead.phone,
        rating: lead.rating,
        reviewCount: lead.reviewCount,
        city: lead.city,
        category: lead.category,
        tags: lead.tags ? JSON.parse(lead.tags) : [],
        isEnriched: lead.isEnriched,
      })),
      analysis: {
        highestScore: Math.max(...leads.map(l => l.qualityScore || 0)),
        lowestScore: Math.min(...leads.map(l => l.qualityScore || 100)),
        averageScore: leads.reduce((sum, l) => sum + (l.qualityScore || 0), 0) / leads.length,
        hotLeads: leads.filter(l => l.status === 'hot').length,
        warmLeads: leads.filter(l => l.status === 'warm').length,
        coldLeads: leads.filter(l => l.status === 'cold').length,
        withWebsite: leads.filter(l => l.hasWebsite).length,
        withoutWebsite: leads.filter(l => !l.hasWebsite).length,
        withEmail: leads.filter(l => l.email).length,
        withPhone: leads.filter(l => l.phone).length,
        withReviews: leads.filter(l => l.reviewCount > 0).length,
      },
      recommendations: generateRecommendations(leads),
    };

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (error) {
    console.error('Error comparing leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to compare leads' },
      { status: 500 }
    );
  }
}

/**
 * Generate recommendations based on lead comparison
 */
function generateRecommendations(leads: any[]): string[] {
  const recommendations: string[] = [];

  // Find highest quality lead
  const highestQualityLead = leads
    .filter(l => l.qualityScore !== null)
    .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))[0];

  if (highestQualityLead) {
    recommendations.push(
      `🎯 Priority: "${highestQualityLead.name}" has the highest quality score (${highestQualityLead.qualityScore}) - outreach first`
    );
  }

  // Check for leads without websites
  const noWebsiteLeads = leads.filter(l => !l.hasWebsite);
  if (noWebsiteLeads.length > 0) {
    recommendations.push(
      `🌐 ${noWebsiteLeads.length} lead(s) don't have websites - great opportunities for web services`
    );
  }

  // Check for hot leads
  const hotLeads = leads.filter(l => l.status === 'hot');
  if (hotLeads.length > 0) {
    recommendations.push(
      `🔥 ${hotLeads.length} hot lead(s) ready for immediate outreach`
    );
  }

  // Check for leads with high ratings but no website
  const highRatedNoWebsite = leads.filter(l => l.rating && l.rating >= 4.5 && !l.hasWebsite);
  if (highRatedNoWebsite.length > 0) {
    recommendations.push(
      `⭐ ${highRatedNoWebsite.length} high-rated lead(s) without websites - high-value targets`
    );
  }

  // Check for leads with email
  const leadsWithEmail = leads.filter(l => l.email);
  if (leadsWithEmail.length > 0) {
    recommendations.push(
      `📧 ${leadsWithEmail.length} lead(s) have emails - can start email outreach`
    );
  }

  return recommendations;
}
