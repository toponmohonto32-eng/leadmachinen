/**
 * Z AI SDK Service for Data Enrichment and Contact Finding
 * 
 * This service leverages the z-ai-web-dev-sdk to:
 * - Find top management contacts from business information
 * - Extract emails and social media from websites
 * - Analyze business data for insights
 * - Process and enrich scraped data
 * 
 * Documentation: https://docs.z.ai/guides/overview/quick-start
 */

import ZAI from 'z-ai-web-dev-sdk';

interface ContactInfo {
  name: string;
  role: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  facebook?: string;
  twitter?: string;
  confidence: number;
  source: string;
}

interface BusinessEnrichment {
  industry?: string;
  companySize?: string;
  yearFounded?: number;
  keyContacts?: ContactInfo[];
  description?: string;
  insights?: string[];
}

class ZAIService {
  private apiKey: string;
  private client: ZAI | null = null;

  constructor(apiKey?: string) {
    // Use provided API key or environment variable
    this.apiKey = apiKey || process.env.ZAI_API_KEY || '9e3628e5a5b14316b0ae105d58882571.pnKBN1sp8vkTXuEt';
  }

  /**
   * Initialize Z AI client
   */
  async initialize(): Promise<void> {
    if (this.client) return;

    try {
      this.client = await ZAI.create();
      console.log('Z AI SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Z AI SDK:', error);
      throw error;
    }
  }

  /**
   * Find top management contacts for a business
   * Uses AI to analyze business information and find potential contacts
   */
  async findTopManagement(businessName: string, location: string, website?: string): Promise<ContactInfo[]> {
    await this.initialize();

    if (!this.client) {
      throw new Error('Z AI client not initialized');
    }

    try {
      // Use AI to generate potential contact information
      const prompt = `For the business "${businessName}" located in ${location}${website ? ` with website ${website}` : ''}, identify potential top management contacts including:
- Owner
- CEO
- Managing Director
- General Manager

For each contact, provide:
1. Full name (make reasonable estimates based on common naming patterns)
2. Role/title
3. Potential email format (e.g., firstname.lastname@domain)
4. LinkedIn profile URL if possible

Format the response as a JSON array with this structure:
[
  {
    "name": "Full Name",
    "role": "Role",
    "email": "email@domain.com" or null,
    "linkedIn": "https://linkedin.com/in/..." or null,
    "confidence": 0.8,
    "source": "AI estimation"
  }
]

If you cannot confidently determine information, use null and set confidence below 0.5.`;

      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert business intelligence assistant. You help identify and estimate contact information for business management. Always provide realistic estimates when actual data is unavailable.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        thinking: { type: 'disabled' },
      });

      const responseText = completion.choices[0]?.message?.content || '[]';
      
      // Try to parse JSON response
      try {
        const contacts = JSON.parse(responseText);
        return Array.isArray(contacts) ? contacts : [];
      } catch (parseError) {
        console.error('Failed to parse AI response:', responseText);
        return [];
      }
    } catch (error) {
      console.error('Error finding top management:', error);
      return [];
    }
  }

  /**
   * Enrich business data with AI insights
   */
  async enrichBusinessData(
    businessName: string,
    description: string,
    category: string,
    location: string
  ): Promise<BusinessEnrichment> {
    await this.initialize();

    if (!this.client) {
      throw new Error('Z AI client not initialized');
    }

    try {
      const prompt = `Analyze the following business and provide enriched information:

Business: ${businessName}
Category: ${category}
Location: ${location}
Description: ${description}

Provide:
1. Industry classification (more specific than category)
2. Estimated company size (Small: 1-10, Medium: 11-50, Large: 50+)
3. Likely year founded (estimate based on industry and business type)
4. 3-5 key insights about this business based on available information

Format as JSON:
{
  "industry": "string",
  "companySize": "Small|Medium|Large",
  "yearFounded": number,
  "insights": ["insight1", "insight2", ...]
}`;

      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a business intelligence expert. Analyze business information and provide accurate insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        thinking: { type: 'disabled' },
      });

      const responseText = completion.choices[0]?.message?.content || '{}';

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse AI enrichment response:', responseText);
        return {};
      }
    } catch (error) {
      console.error('Error enriching business data:', error);
      return {};
    }
  }

  /**
   * Extract emails and social media from website content
   */
  async extractContactInfoFromWebsite(url: string): Promise<{
    emails: string[];
    socialLinks: {
      facebook?: string;
      twitter?: string;
      linkedin?: string;
      instagram?: string;
      youtube?: string;
    };
  }> {
    await this.initialize();

    if (!this.client) {
      throw new Error('Z AI client not initialized');
    }

    try {
      // First, use web search to find the website
      const searchResults = await this.client.functions.invoke('web_search', {
        query: `site:${url} contact email about team`,
        num: 5,
      });

      if (!searchResults || searchResults.length === 0) {
        return { emails: [], socialLinks: {} };
      }

      // Use AI to extract emails and social links from search results
      const context = searchResults
        .slice(0, 3)
        .map(r => `${r.name}\n${r.snippet}`)
        .join('\n\n');

      const prompt = `Extract email addresses and social media links from the following search results about ${url}:

${context}

Format as JSON:
{
  "emails": ["email1@domain.com", "email2@domain.com"],
  "socialLinks": {
    "facebook": "URL or null",
    "twitter": "URL or null",
    "linkedin": "URL or null",
    "instagram": "URL or null",
    "youtube": "URL or null"
  }
}

Only include actual email addresses and URLs found. Use null for missing values.`;

      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting contact information from web content. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        thinking: { type: 'disabled' },
      });

      const responseText = completion.choices[0]?.message?.content || '{"emails": [], "socialLinks": {}}';

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse contact extraction response:', responseText);
        return { emails: [], socialLinks: {} };
      }
    } catch (error) {
      console.error('Error extracting contact info:', error);
      return { emails: [], socialLinks: {} };
    }
  }

  /**
   * Analyze reviews for sentiment and key themes
   */
  async analyzeReviews(reviews: Array<{ text: string; rating: number }>): Promise<{
    overallSentiment: 'positive' | 'neutral' | 'negative';
    keyThemes: string[];
    commonPraise: string[];
    commonComplaints: string[];
  }> {
    await this.initialize();

    if (!this.client) {
      throw new Error('Z AI client not initialized');
    }

    if (reviews.length === 0) {
      return {
        overallSentiment: 'neutral',
        keyThemes: [],
        commonPraise: [],
        commonComplaints: [],
      };
    }

    try {
      const reviewsText = reviews
        .slice(0, 10)
        .map((r, i) => `${i + 1}. (${r.rating}/5): ${r.text}`)
        .join('\n');

      const prompt = `Analyze these customer reviews and provide insights:

${reviewsText}

Format as JSON:
{
  "overallSentiment": "positive|neutral|negative",
  "keyThemes": ["theme1", "theme2", ...],
  "commonPraise": ["praise1", "praise2", ...],
  "commonComplaints": ["complaint1", "complaint2", ...]
}`;

      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing customer feedback and sentiment.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        thinking: { type: 'disabled' },
      });

      const responseText = completion.choices[0]?.message?.content || '{}';

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse review analysis:', responseText);
        return {
          overallSentiment: 'neutral',
          keyThemes: [],
          commonPraise: [],
          commonComplaints: [],
        };
      }
    } catch (error) {
      console.error('Error analyzing reviews:', error);
      return {
        overallSentiment: 'neutral',
        keyThemes: [],
        commonPraise: [],
        commonComplaints: [],
      };
    }
  }

  /**
   * Generate personalized outreach message based on business data
   */
  async generateOutreachMessage(
    businessName: string,
    contactName: string,
    contactRole: string,
    businessInfo: string,
    yourOffering: string
  ): Promise<string> {
    await this.initialize();

    if (!this.client) {
      throw new Error('Z AI client not initialized');
    }

    try {
      const prompt = `Write a personalized, professional outreach email for ${contactName}, ${contactRole} at ${businessName}.

About their business: ${businessInfo}

Your offering: ${yourOffering}

Requirements:
- Keep it under 200 words
- Make it personalized and not spammy
- Focus on value for their business
- Include a clear call-to-action
- Professional but conversational tone

Return only the email body text.`;

      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing professional, high-conversion outreach emails.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        thinking: { type: 'disabled' },
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating outreach message:', error);
      return '';
    }
  }
}

// Export singleton instance
export const zaiService = new ZAIService();
export default ZAIService;
