import { MultiProviderAIService } from './ai-providers';

interface LeadData {
  name: string;
  email?: string | null;
  phone?: string | null;
  hasWebsite: boolean;
  rating?: number | null;
  reviewCount: number;
  socialFacebook?: string | null;
  socialTwitter?: string | null;
  socialLinkedIn?: string | null;
  socialInstagram?: string | null;
  category?: string | null;
  description?: string | null;
}

interface QualityScoreResult {
  score: number; // 0-100
  factors: {
    emailContact: { score: number; reason: string };
    phoneContact: { score: number; reason: string };
    reviewQuality: { score: number; reason: string };
    socialPresence: { score: number; reason: string };
    websiteStatus: { score: number; reason: string };
    completeness: { score: number; reason: string };
  };
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reason: string;
}

export class LeadScoringService {
  private aiService: MultiProviderAIService;

  constructor() {
    this.aiService = new MultiProviderAIService();
  }

  /**
   * Calculate lead quality score (rule-based)
   */
  calculateQualityScore(lead: LeadData): QualityScoreResult {
    const factors: any = {};
    let totalScore = 0;

    // 1. Email Contact (20 points)
    if (lead.email && this.isValidEmail(lead.email)) {
      factors.emailContact = {
        score: 20,
        reason: 'Valid email address available',
      };
      totalScore += 20;
    } else {
      factors.emailContact = {
        score: 0,
        reason: 'No valid email address',
      };
    }

    // 2. Phone Contact (15 points)
    if (lead.phone && lead.phone.length > 6) {
      factors.phoneContact = {
        score: 15,
        reason: 'Phone number available',
      };
      totalScore += 15;
    } else {
      factors.phoneContact = {
        score: 0,
        reason: 'No phone number',
      };
    }

    // 3. Review Quality (25 points)
    if (lead.reviewCount > 0 && lead.rating) {
      const reviewScore = Math.min((lead.rating / 5) * 15 + Math.min(lead.reviewCount / 20) * 10, 25);
      factors.reviewQuality = {
        score: Math.round(reviewScore),
        reason: `${lead.reviewCount} reviews with ${lead.rating.toFixed(1)} rating`,
      };
      totalScore += reviewScore;
    } else {
      factors.reviewQuality = {
        score: 0,
        reason: 'No reviews',
      };
    }

    // 4. Social Presence (15 points)
    const socialCount = [
      lead.socialFacebook,
      lead.socialTwitter,
      lead.socialLinkedIn,
      lead.socialInstagram,
    ].filter(Boolean).length;

    factors.socialPresence = {
      score: socialCount * 4,
      reason: `${socialCount} social media platforms`,
    };
    totalScore += socialCount * 4;

    // 5. Website Status (15 points)
    if (!lead.hasWebsite) {
      // Businesses without websites are HIGH PRIORITY leads for web services
      factors.websiteStatus = {
        score: 15,
        reason: 'No website - high opportunity',
      };
      totalScore += 15;
    } else {
      factors.websiteStatus = {
        score: 5,
        reason: 'Has website',
      };
      totalScore += 5;
    }

    // 6. Completeness (10 points)
    const fields = [
      lead.email,
      lead.phone,
      lead.category,
      lead.description,
    ].filter(Boolean).length;
    factors.completeness = {
      score: fields * 2.5,
      reason: `${fields}/4 key fields complete`,
    };
    totalScore += fields * 2.5;

    // Generate tags based on analysis
    const tags: string[] = [];
    if (!lead.hasWebsite) tags.push('no-website', 'high-priority');
    if (lead.email) tags.push('email-available');
    if (lead.phone) tags.push('phone-available');
    if (lead.rating && lead.rating >= 4.5) tags.push('highly-rated');
    if (lead.reviewCount >= 50) tags.push('well-reviewed');
    if (socialCount >= 2) tags.push('socially-active');
    if (lead.category) tags.push(`category:${lead.category.toLowerCase().replace(/\s+/g, '-')}`);

    // Determine priority
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    if (!lead.hasWebsite && lead.reviewCount >= 20 && lead.rating && lead.rating >= 4.0) {
      priority = 'urgent';
    } else if (!lead.hasWebsite) {
      priority = 'high';
    } else if (totalScore >= 70) {
      priority = 'high';
    } else if (totalScore >= 50) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    return {
      score: Math.round(totalScore),
      factors,
      tags,
      priority,
      reason: this.generateReason(totalScore, priority, lead),
    };
  }

  /**
   * Calculate quality score with AI enhancement
   */
  async calculateQualityScoreWithAI(lead: LeadData): Promise<QualityScoreResult> {
    // First get rule-based score
    const ruleBasedScore = this.calculateQualityScore(lead);

    try {
      // Use AI to enhance the scoring
      const prompt = `Analyze this business lead and provide quality assessment:

Business Name: ${lead.name}
Email: ${lead.email || 'N/A'}
Phone: ${lead.phone || 'N/A'}
Has Website: ${lead.hasWebsite ? 'Yes' : 'No'}
Rating: ${lead.rating || 'N/A'} (${lead.reviewCount} reviews)
Social Media: ${[lead.socialFacebook, lead.socialTwitter, lead.socialLinkedIn, lead.socialInstagram].filter(Boolean).join(', ') || 'None'}
Category: ${lead.category || 'N/A'}
Description: ${lead.description || 'N/A'}

Current Score: ${ruleBasedScore.score}/100

Provide:
1. A brief assessment of lead quality
2. Suggested priority (low/medium/high/urgent)
3. 2-3 specific tags for this lead
4. Any red flags or opportunities

Respond in JSON format:
{
  "assessment": "brief assessment",
  "priority": "low/medium/high/urgent",
  "tags": ["tag1", "tag2", "tag3"],
  "redFlags": ["flag1"] or [],
  "opportunities": ["opportunity1"] or []
}`;

      const response = await this.aiService.chatCompletion([
        { role: 'system', content: 'You are a lead qualification expert. Analyze business leads and provide JSON-formatted assessments.' },
        { role: 'user', content: prompt },
      ]);

      const aiAnalysis = JSON.parse(response.content || '{}');

      // Merge AI insights with rule-based score
      return {
        ...ruleBasedScore,
        priority: aiAnalysis.priority || ruleBasedScore.priority,
        tags: [...new Set([...ruleBasedScore.tags, ...(aiAnalysis.tags || [])])],
        reason: aiAnalysis.assessment || ruleBasedScore.reason,
      };
    } catch (error) {
      console.error('AI scoring failed, using rule-based:', error);
      return ruleBasedScore;
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate reason for score
   */
  private generateReason(score: number, priority: string, lead: LeadData): string {
    if (priority === 'urgent' && !lead.hasWebsite) {
      return 'Excellent opportunity: No website with strong reviews and ratings';
    } else if (priority === 'high') {
      return 'High-quality lead with good contact information and presence';
    } else if (priority === 'medium') {
      return 'Decent lead with some contact information';
    } else {
      return 'Basic lead with limited information';
    }
  }

  /**
   * Batch score multiple leads
   */
  async batchScoreLeads(leads: LeadData[]): Promise<QualityScoreResult[]> {
    const results: QualityScoreResult[] = [];

    for (const lead of leads) {
      const result = await this.calculateQualityScoreWithAI(lead);
      results.push(result);
    }

    return results;
  }
}

// Singleton instance
export const leadScoringService = new LeadScoringService();
