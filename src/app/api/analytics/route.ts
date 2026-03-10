import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/analytics
 * Get comprehensive lead analytics and insights
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // all, week, month, year

    let dateFilter: any = {};
    
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { gte: weekAgo };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { gte: monthAgo };
    } else if (period === 'year') {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      dateFilter = { gte: yearAgo };
    }

    // Fetch all leads
    const leads = await db.lead.findMany({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      include: {
        reviews: true,
        contacts: true,
      },
    });

    // Calculate comprehensive analytics
    const analytics = {
      overview: calculateOverview(leads),
      quality: calculateQualityMetrics(leads),
      sources: calculateSourceMetrics(leads),
      location: calculateLocationMetrics(leads),
      categories: calculateCategoryMetrics(leads),
      trends: calculateTrends(leads),
      insights: generateInsights(leads),
    };

    return NextResponse.json({
      success: true,
      analytics,
      period,
      totalLeads: leads.length,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

/**
 * Calculate overview metrics
 */
function calculateOverview(leads: any[]) {
  const total = leads.length;
  const enriched = leads.filter(l => l.isEnriched).length;
  const withWebsite = leads.filter(l => l.hasWebsite).length;
  const withoutWebsite = total - withWebsite;
  const withEmail = leads.filter(l => l.email).length;
  const withPhone = leads.filter(l => l.phone).length;
  const withReviews = leads.filter(l => l.reviewCount > 0).length;
  const duplicates = leads.filter(l => l.isDuplicate).length;

  return {
    totalLeads: total,
    enrichedLeads: enriched,
    enrichmentRate: total > 0 ? ((enriched / total) * 100).toFixed(1) : 0,
    withWebsite: withWebsite,
    withoutWebsite: withoutWebsite,
    websiteRate: total > 0 ? ((withWebsite / total) * 100).toFixed(1) : 0,
    withEmail: withEmail,
    emailRate: total > 0 ? ((withEmail / total) * 100).toFixed(1) : 0,
    withPhone: withPhone,
    phoneRate: total > 0 ? ((withPhone / total) * 100).toFixed(1) : 0,
    withReviews: withReviews,
    reviewRate: total > 0 ? ((withReviews / total) * 100).toFixed(1) : 0,
    duplicates: duplicates,
    duplicateRate: total > 0 ? ((duplicates / total) * 100).toFixed(1) : 0,
  };
}

/**
 * Calculate quality metrics
 */
function calculateQualityMetrics(leads: any[]) {
  const scoredLeads = leads.filter(l => l.qualityScore !== null);
  
  if (scoredLeads.length === 0) {
    return {
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      distribution: { hot: 0, warm: 0, cold: 0, notScored: leads.length },
      priorityDistribution: { urgent: 0, high: 0, medium: 0, low: 0 },
    };
  }

  const scores = scoredLeads.map(l => l.qualityScore || 0);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  return {
    averageScore: avgScore.toFixed(1),
    highestScore: maxScore,
    lowestScore: minScore,
    distribution: {
      hot: leads.filter(l => l.status === 'hot').length,
      warm: leads.filter(l => l.status === 'warm').length,
      cold: leads.filter(l => l.status === 'cold').length,
      notScored: leads.filter(l => !l.isEnriched).length,
    },
    priorityDistribution: {
      urgent: leads.filter(l => l.priority === 'urgent').length,
      high: leads.filter(l => l.priority === 'high').length,
      medium: leads.filter(l => l.priority === 'medium').length,
      low: leads.filter(l => l.priority === 'low').length,
    },
  };
}

/**
 * Calculate source/contact metrics
 */
function calculateSourceMetrics(leads: any[]) {
  const total = leads.length;
  const withFacebook = leads.filter(l => l.socialFacebook).length;
  const withTwitter = leads.filter(l => l.socialTwitter).length;
  const withLinkedIn = leads.filter(l => l.socialLinkedIn).length;
  const withInstagram = leads.filter(l => l.socialInstagram).length;
  const totalContacts = leads.reduce((sum, l) => sum + (l.contacts?.length || 0), 0);
  const totalReviews = leads.reduce((sum, l) => sum + (l.reviews?.length || 0), 0);
  const avgRating = leads.length > 0
    ? leads.reduce((sum, l) => sum + (l.rating || 0), 0) / leads.filter(l => l.rating !== null).length
    : 0;

  return {
    socialMedia: {
      facebook: withFacebook,
      twitter: withTwitter,
      linkedin: withLinkedIn,
      instagram: withInstagram,
      anySocialMedia: leads.filter(l => 
        l.socialFacebook || l.socialTwitter || l.socialLinkedIn || l.socialInstagram
      ).length,
    },
    contacts: {
      totalContactsFound: totalContacts,
      avgContactsPerLead: total > 0 ? (totalContacts / total).toFixed(1) : 0,
    },
    reviews: {
      totalReviews: totalReviews,
      avgRating: avgRating.toFixed(1),
      leadsWithReviews: leads.filter(l => l.reviewCount > 0).length,
    },
  };
}

/**
 * Calculate location metrics
 */
function calculateLocationMetrics(leads: any[]) {
  const cities = leads.filter(l => l.city).map(l => l.city);
  const topCities = getTopItems(cities);

  const counties = leads.filter(l => l.county).map(l => l.county);
  const topCounties = getTopItems(counties);

  return {
    topCities: topCities.slice(0, 10),
    topCounties: topCounties.slice(0, 10),
    uniqueCities: new Set(cities).size,
    uniqueCounties: new Set(counties).size,
  };
}

/**
 * Calculate category metrics
 */
function calculateCategoryMetrics(leads: any[]) {
  const niches = leads.filter(l => l.niche).map(l => l.niche);
  const topNiches = getTopItems(niches);

  const categories = leads.filter(l => l.category).map(l => l.category);
  const topCategories = getTopItems(categories);

  return {
    topNiches: topNiches.slice(0, 10),
    topCategories: topCategories.slice(0, 10),
    uniqueNiches: new Set(niches).size,
    uniqueCategories: new Set(categories).size,
  };
}

/**
 * Calculate trends over time
 */
function calculateTrends(leads: any[]) {
  // Group leads by day
  const dailyLeads: Record<string, any[]> = {};
  
  leads.forEach(lead => {
    const date = new Date(lead.createdAt).toISOString().split('T')[0];
    if (!dailyLeads[date]) {
      dailyLeads[date] = [];
    }
    dailyLeads[date].push(lead);
  });

  const trends = Object.keys(dailyLeads)
    .sort()
    .map(date => ({
      date,
      total: dailyLeads[date].length,
      enriched: dailyLeads[date].filter(l => l.isEnriched).length,
      withWebsite: dailyLeads[date].filter(l => l.hasWebsite).length,
      hot: dailyLeads[date].filter(l => l.status === 'hot').length,
    }));

  return {
    daily: trends.slice(-30), // Last 30 days
    summary: {
      totalDays: trends.length,
      avgDailyLeads: (leads.length / trends.length).toFixed(1),
      peakDay: trends.reduce((max, day) => day.total > max.total ? day : max, { date: '', total: 0 }),
    },
  };
}

/**
 * Generate insights
 */
function generateInsights(leads: any[]) {
  const insights: string[] = [];

  // Insight 1: Enrichment rate
  const enriched = leads.filter(l => l.isEnriched).length;
  const enrichmentRate = (enriched / leads.length) * 100;
  if (enrichmentRate < 50) {
    insights.push(`⚠️ Only ${enrichmentRate.toFixed(1)}% of leads are enriched. Run "Bulk Enrich" to improve data quality.`);
  } else if (enrichmentRate >= 90) {
    insights.push(`✅ Excellent! ${enrichmentRate.toFixed(1)}% of leads are enriched.`);
  }

  // Insight 2: No website opportunities
  const noWebsite = leads.filter(l => !l.hasWebsite).length;
  if (noWebsite > leads.length * 0.3) {
    insights.push(`🌐 ${noWebsite} leads (${((noWebsite / leads.length) * 100).toFixed(1)}%) don't have websites - great for web services.`);
  }

  // Insight 3: Hot leads
  const hotLeads = leads.filter(l => l.status === 'hot').length;
  if (hotLeads > 0) {
    insights.push(`🔥 You have ${hotLeads} hot leads ready for immediate outreach!`);
  }

  // Insight 4: Email coverage
  const withEmail = leads.filter(l => l.email).length;
  const emailRate = (withEmail / leads.length) * 100;
  if (emailRate < 30) {
    insights.push(`📧 Only ${emailRate.toFixed(1)}% of leads have emails. Consider finding contacts for more leads.`);
  }

  // Insight 5: Review quality
  const avgRating = leads.reduce((sum, l) => sum + (l.rating || 0), 0) / leads.filter(l => l.rating !== null).length;
  if (avgRating >= 4.0) {
    insights.push(`⭐ Great quality leads! Average rating is ${avgRating.toFixed(1)} stars.`);
  }

  // Insight 6: Social media presence
  const withSocial = leads.filter(l => 
    l.socialFacebook || l.socialTwitter || l.socialLinkedIn || l.socialInstagram
  ).length;
  if (withSocial > leads.length * 0.5) {
    insights.push(`📱 ${withSocial} leads have social media profiles (${((withSocial / leads.length) * 100).toFixed(1)}%).`);
  }

  return insights;
}

/**
 * Get top items by frequency
 */
function getTopItems(items: string[]) {
  const counts: Record<string, number> = {};
  
  items.forEach(item => {
    if (item) {
      counts[item] = (counts[item] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}
