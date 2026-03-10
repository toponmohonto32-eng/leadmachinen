import { NextResponse } from 'next/server';
import { multiProviderAI } from '@/lib/ai-providers';
import { scraperHub } from '@/lib/scraper-hub';

/**
 * GET /api/system/status
 * Get system status including AI providers and scraping sources
 */
export async function GET() {
  try {
    // Get AI providers status
    const aiProviders = multiProviderAI.getAllProviders().map(p => ({
      name: p.name,
      type: p.type,
      enabled: p.enabled,
      priority: p.priority,
      costPer1KTokens: p.costPer1KTokens,
    }));

    const aiUsageStats = multiProviderAI.getUsageStats();

    // Get scraping sources status
    const scrapingSources = scraperHub.getSources().map(s => ({
      name: s.name,
      type: s.type,
      enabled: s.enabled,
      priority: s.priority,
    }));

    const scraperUsageStats = scraperHub.getUsageStats();

    // Calculate totals
    const totalAIRequests = Object.values(aiUsageStats).reduce((sum, stats) => sum + stats.requests, 0);
    const totalAITokens = Object.values(aiUsageStats).reduce((sum, stats) => sum + stats.tokens, 0);
    const totalAICost = Object.values(aiUsageStats).reduce((sum, stats) => sum + stats.cost, 0);

    const totalScraperRequests = Object.values(scraperUsageStats).reduce((sum, stats) => sum + stats.count, 0);

    return NextResponse.json({
      success: true,
      system: {
        aiProviders,
        aiUsageStats,
        scrapingSources,
        scraperUsageStats,
        totals: {
          aiRequests: totalAIRequests,
          aiTokens: totalAITokens,
          aiCost: totalAICost,
          scraperRequests: totalScraperRequests,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    return NextResponse.json(
      { error: 'Failed to get system status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/system/status/reset
 * Reset usage statistics
 */
export async function POST() {
  try {
    multiProviderAI.resetUsageStats();
    
    return NextResponse.json({
      success: true,
      message: 'Usage statistics reset successfully',
    });
  } catch (error) {
    console.error('Error resetting stats:', error);
    return NextResponse.json(
      { error: 'Failed to reset statistics' },
      { status: 500 }
    );
  }
}
