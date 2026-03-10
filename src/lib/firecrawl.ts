/**
 * Firecrawl Integration
 * 
 * AI-powered web scraping for extracting contact information from websites
 * https://firecrawl.dev
 * 
 * Features:
 * - Smart content extraction
 * - Handles JavaScript-heavy sites
 * - Converts to LLM-ready markdown
 * - Extracts emails and contact info
 */

export interface FirecrawlOptions {
  apiKey?: string;
  baseUrl?: string;
}

export interface ScrapedContent {
  markdown: string;
  html?: string;
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
  };
  links?: string[];
}

export interface ExtractedContacts {
  emails: string[];
  phoneNumbers: string[];
  socialLinks: {
    linkedin?: string[];
    facebook?: string[];
    twitter?: string[];
    instagram?: string[];
    youtube?: string[];
  };
}

class FirecrawlService {
  private apiKey: string;
  private baseUrl: string;
  private enabled: boolean;

  constructor(options?: FirecrawlOptions) {
    this.apiKey = options?.apiKey || process.env.FIRECRAWL_API_KEY || '';
    this.baseUrl = options?.baseUrl || 'https://api.firecrawl.dev/v1';
    this.enabled = !!this.apiKey;
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Scrape a website and get content
   */
  async scrape(url: string, options?: {
    onlyMainContent?: boolean;
    formats?: ('markdown' | 'html')[];
  }): Promise<ScrapedContent | null> {
    if (!this.enabled) {
      console.warn('Firecrawl not enabled, skipping');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: options?.formats || ['markdown'],
          onlyMainContent: options?.onlyMainContent ?? true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success === false) {
        console.error('Firecrawl error:', data.error);
        return null;
      }

      return {
        markdown: data.data?.markdown || '',
        html: data.data?.html,
        metadata: data.data?.metadata,
        links: data.data?.links?.map((l: any) => l.url) || [],
      };
    } catch (error) {
      console.error('Error scraping with Firecrawl:', error);
      return null;
    }
  }

  /**
   * Extract contact information from a website
   */
  async extractContacts(url: string): Promise<ExtractedContacts> {
    const content = await this.scrape(url);
    
    if (!content) {
      return {
        emails: [],
        phoneNumbers: [],
        socialLinks: {},
      };
    }

    return this.parseContacts(content.markdown + ' ' + (content.metadata?.description || ''));
  }

  /**
   * Parse contact information from text
   */
  private parseContacts(text: string): ExtractedContacts {
    const contacts: ExtractedContacts = {
      emails: [],
      phoneNumbers: [],
      socialLinks: {},
    };

    // Extract emails
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const emails = text.match(emailRegex) || [];
    contacts.emails = [...new Set(emails)]; // Remove duplicates

    // Extract phone numbers (US format)
    const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = text.match(phoneRegex) || [];
    contacts.phoneNumbers = [...new Set(phones)];

    // Extract social media links
    const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/[\w/-]+/gi;
    const facebookRegex = /https?:\/\/(?:www\.)?facebook\.com\/[\w.-]+/gi;
    const twitterRegex = /https?:\/\/(?:www\.)?(twitter|x)\.com\/[\w.-]+/gi;
    const instagramRegex = /https?:\/\/(?:www\.)?instagram\.com\/[\w.-]+/gi;
    const youtubeRegex = /https?:\/\/(?:www\.)?youtube\.com\/[\w.-]+/gi;

    contacts.socialLinks.linkedin = [...new Set(text.match(linkedinRegex) || [])];
    contacts.socialLinks.facebook = [...new Set(text.match(facebookRegex) || [])];
    contacts.socialLinks.twitter = [...new Set(text.match(twitterRegex) || [])];
    contacts.socialLinks.instagram = [...new Set(text.match(instagramRegex) || [])];
    contacts.socialLinks.youtube = [...new Set(text.match(youtubeRegex) || [])];

    return contacts;
  }

  /**
   * Batch scrape multiple URLs
   */
  async batchScrape(urls: string[]): Promise<Map<string, ScrapedContent>> {
    const results = new Map<string, ScrapedContent>();

    // Process in parallel with concurrency limit
    const concurrency = 3;
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const promises = batch.map(async (url) => {
        const content = await this.scrape(url);
        if (content) {
          results.set(url, content);
        }
      });
      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Check if a URL is accessible
   */
  async checkURL(url: string): Promise<boolean> {
    try {
      const content = await this.scrape(url, { formats: ['markdown'] });
      return content !== null && content.markdown.length > 100;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const firecrawlService = new FirecrawlService();
export default FirecrawlService;
