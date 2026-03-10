/**
 * Scraper Hub - Unified Scraping Service
 * 
 * Integrates multiple scraping sources with automatic fallback:
 * 1. Custom Puppeteer Scraper (Free, preferred)
 * 2. Outscraper API (Paid, fallback)
 * 3. Mock Data (Testing)
 * 
 * This eliminates dependency on paid services while maintaining reliability
 */

import { googleMapsScraper, BusinessData } from './gmaps-scraper';
import { outscraperService } from './outscraper';

export interface ScraperSource {
  name: string;
  type: 'free' | 'paid';
  priority: number;
  enabled: boolean;
}

export interface ScraperOptions {
  query: string;
  postalCode?: string;
  city?: string;
  county?: string;
  niche?: string;
  limit?: number;
  extractReviews?: boolean;
  extractEmails?: boolean;
  extractSocialLinks?: boolean;
}

export interface ScraperResult {
  businesses: any[];
  source: string;
  cost?: number;
}

class ScraperHub {
  private sources: Map<string, ScraperSource>;
  private usageStats: Map<string, { count: number; lastUsed: Date }>;

  constructor() {
    this.sources = new Map();
    this.usageStats = new Map();
    this.initializeSources();
  }

  /**
   * Initialize scraping sources
   */
  private initializeSources() {
    // Custom Puppeteer Scraper (Primary - Free)
    this.sources.set('puppeteer', {
      name: 'Puppeteer (Custom)',
      type: 'free',
      priority: 1,
      enabled: true, // Always available
    });

    // Outscraper API (Fallback - Paid)
    this.sources.set('outscraper', {
      name: 'Outscraper API',
      type: 'paid',
      priority: 2,
      enabled: !!process.env.OUTSCRAPER_API_KEY,
    });

    // Mock Data (Fallback for testing)
    this.sources.set('mock', {
      name: 'Mock Data',
      type: 'free',
      priority: 3,
      enabled: true,
    });
  }

  /**
   * Get all available sources
   */
  getSources(): ScraperSource[] {
    return Array.from(this.sources.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get enabled sources sorted by priority
   */
  private getEnabledSources(): ScraperSource[] {
    return this.getSources().filter(s => s.enabled);
  }

  /**
   * Search businesses using available sources with automatic fallback
   */
  async searchBusinesses(options: ScraperOptions): Promise<ScraperResult> {
    const sources = this.getEnabledSources();

    if (sources.length === 0) {
      throw new Error('No scraping sources enabled');
    }

    console.log(`Starting search with ${sources.length} sources available`);

    // Try each source in priority order
    for (const source of sources) {
      try {
        console.log(`Attempting ${source.name}...`);
        const result = await this.searchWithSource(options, source);
        
        // Update usage stats
        this.updateStats(source.name);
        
        console.log(`Success using ${source.name}! Found ${result.businesses.length} businesses`);
        return result;
      } catch (error) {
        console.error(`${source.name} failed:`, error);
        continue;
      }
    }

    throw new Error('All scraping sources failed');
  }

  /**
   * Search with specific source
   */
  private async searchWithSource(
    options: ScraperOptions,
    source: ScraperSource
  ): Promise<ScraperResult> {
    switch (source.name) {
      case 'Puppeteer (Custom)':
        return await this.searchWithPuppeteer(options);
      
      case 'Outscraper API':
        return await this.searchWithOutscraper(options);
      
      case 'Mock Data':
        return await this.searchWithMock(options);
      
      default:
        throw new Error(`Unknown source: ${source.name}`);
    }
  }

  /**
   * Search with Puppeteer (Custom scraper)
   */
  private async searchWithPuppeteer(options: ScraperOptions): Promise<ScraperResult> {
    const { query, location, limit, extractReviews } = this.buildSearchParams(options);

    const businesses = await googleMapsScraper.scrapeBusinesses({
      query,
      location,
      limit: limit || 20,
      extractReviews: extractReviews || false,
      headless: true,
    });

    return {
      businesses: businesses.map(b => googleMapsScraper.normalizeToLead(b)),
      source: 'Puppeteer (Custom)',
      cost: 0, // Free!
    };
  }

  /**
   * Search with Outscraper API
   */
  private async searchWithOutscraper(options: ScraperOptions): Promise<ScraperResult> {
    const businesses = await outscraperService.searchBusinesses(options);

    return {
      businesses: businesses.map(b => outscraperService.normalizeBusinessData(b)),
      source: 'Outscraper API',
      cost: businesses.length * 0.006, // $0.006 per result
    };
  }

  /**
   * Search with Mock Data
   */
  private async searchWithMock(options: ScraperOptions): Promise<ScraperResult> {
    const { query, limit } = this.buildSearchParams(options);

    const businesses = googleMapsScraper['getMockData'](query, limit || 20);

    return {
      businesses: businesses.map(b => googleMapsScraper.normalizeToLead(b)),
      source: 'Mock Data',
      cost: 0,
    };
  }

  /**
   * Build search parameters
   */
  private buildSearchParams(options: ScraperOptions) {
    const { query, postalCode, city, county, niche, limit, extractReviews } = options;

    // Build location string
    const locationParts = [];
    if (postalCode) locationParts.push(postalCode);
    if (city) locationParts.push(city);
    if (county) locationParts.push(county);

    const location = locationParts.join(', ');

    return {
      query: query || niche || 'business',
      location,
      limit: limit || 20,
      extractReviews,
    };
  }

  /**
   * Update usage statistics
   */
  private updateStats(sourceName: string) {
    const stats = this.usageStats.get(sourceName) || { count: 0, lastUsed: new Date() };
    stats.count++;
    stats.lastUsed = new Date();
    this.usageStats.set(sourceName, stats);
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): Record<string, { count: number; lastUsed: string }> {
    const result: Record<string, { count: number; lastUsed: string }> = {};
    
    this.usageStats.forEach((stats, source) => {
      result[source] = {
        count: stats.count,
        lastUsed: stats.lastUsed.toISOString(),
      };
    });

    return result;
  }

  /**
   * Normalize business data to lead format
   */
  normalizeToLead(business: any, searchId?: string) {
    // Use Puppeteer normalization by default
    return googleMapsScraper.normalizeToLead(business, searchId);
  }

  /**
   * Normalize review data
   */
  normalizeReviewData(review: any, leadId: string) {
    return outscraperService.normalizeReviewData(review, leadId);
  }

  /**
   * Check if any source is available
   */
  hasAvailableSource(): boolean {
    return this.getEnabledSources().length > 0;
  }
}

// Export singleton instance
export const scraperHub = new ScraperHub();
export default ScraperHub;
