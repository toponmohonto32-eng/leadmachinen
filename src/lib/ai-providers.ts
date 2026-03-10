/**
 * Multi-Provider AI Service
 * 
 * Integrates multiple open-source and commercial LLM providers:
 * 1. Z AI SDK (Primary - already configured)
 * 2. Together AI (Free tier - Llama 3.3 70B)
 * 3. Hugging Face (Free tier - 200+ models)
 * 4. Ollama (Local - 100% free)
 * 5. LocalAI (Local - OpenAI compatible)
 * 
 * Features:
 * - Automatic failover between providers
 * - Load balancing for cost optimization
 * - Provider-specific model selection
 * - Cost tracking per provider
 */

import ZAI from 'z-ai-web-dev-sdk';

export interface AIProvider {
  name: string;
  type: 'cloud' | 'local';
  enabled: boolean;
  priority: number; // Lower = higher priority
  costPer1KTokens: number;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed?: number;
  cost?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class MultiProviderAIService {
  private providers: Map<string, AIProvider>;
  private zaiClient: ZAI | null = null;
  private usageStats: Map<string, { requests: number; tokens: number; cost: number }>;

  constructor() {
    this.providers = new Map();
    this.usageStats = new Map();
    this.initializeProviders();
  }

  /**
   * Initialize all AI providers
   */
  private initializeProviders() {
    // Z AI SDK (Primary)
    this.providers.set('zai', {
      name: 'Z AI',
      type: 'cloud',
      enabled: true,
      priority: 1,
      costPer1KTokens: 0.001, // Example cost
      apiKey: process.env.ZAI_API_KEY || '9e3628e5a5b14316b0ae105d58882571.pnKBN1sp8vkTXuEt',
    });

    // Together AI (Free tier - Llama 3.3 70B)
    this.providers.set('together', {
      name: 'Together AI',
      type: 'cloud',
      enabled: !!process.env.TOGETHER_API_KEY,
      priority: 2,
      costPer1KTokens: 0.0004, // Very competitive
      apiKey: process.env.TOGETHER_API_KEY,
      baseUrl: 'https://api.together.xyz/v1',
      model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
    });

    // Hugging Face (Free tier)
    this.providers.set('huggingface', {
      name: 'Hugging Face',
      type: 'cloud',
      enabled: !!process.env.HUGGINGFACE_API_KEY,
      priority: 3,
      costPer1KTokens: 0.0001, // Very cheap
      apiKey: process.env.HUGGINGFACE_API_KEY,
      baseUrl: 'https://api-inference.huggingface.co/models',
      model: 'meta-llama/Llama-3.3-70B-Instruct',
    });

    // Ollama (Local - 100% free)
    this.providers.set('ollama', {
      name: 'Ollama',
      type: 'local',
      enabled: process.env.OLLAMA_ENABLED === 'true',
      priority: 4,
      costPer1KTokens: 0,
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3.3',
    });

    // LocalAI (Local - OpenAI compatible)
    this.providers.set('localai', {
      name: 'LocalAI',
      type: 'local',
      enabled: process.env.LOCALAI_ENABLED === 'true',
      priority: 5,
      costPer1KTokens: 0,
      baseUrl: process.env.LOCALAI_BASE_URL || 'http://localhost:8080',
      model: process.env.LOCALAI_MODEL || 'llama3',
    });
  }

  /**
   * Get enabled providers sorted by priority
   */
  private getEnabledProviders(): AIProvider[] {
    return Array.from(this.providers.values())
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get a specific provider
   */
  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all providers
   */
  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): Record<string, { requests: number; tokens: number; cost: number }> {
    return Object.fromEntries(this.usageStats);
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats() {
    this.usageStats.clear();
  }

  /**
   * Initialize Z AI client
   */
  private async initializeZAI(): Promise<void> {
    if (!this.zaiClient) {
      this.zaiClient = await ZAI.create();
    }
  }

  /**
   * Generate chat completion with automatic failover
   */
  async chatCompletion(
    messages: ChatMessage[],
    preferredProvider?: string
  ): Promise<AIResponse> {
    const providers = this.getEnabledProviders();

    if (providers.length === 0) {
      throw new Error('No AI providers enabled');
    }

    // Try preferred provider first if specified
    if (preferredProvider && this.providers.get(preferredProvider)?.enabled) {
      const provider = this.providers.get(preferredProvider)!;
      try {
        return await this.completeWithProvider(messages, provider);
      } catch (error) {
        console.error(`${provider.name} failed:`, error);
      }
    }

    // Try all providers in priority order
    for (const provider of providers) {
      try {
        return await this.completeWithProvider(messages, provider);
      } catch (error) {
        console.error(`${provider.name} failed:`, error);
        continue;
      }
    }

    throw new Error('All AI providers failed');
  }

  /**
   * Complete with specific provider
   */
  private async completeWithProvider(
    messages: ChatMessage[],
    provider: AIProvider
  ): Promise<AIResponse> {
    const startTime = Date.now();

    switch (provider.name) {
      case 'Z AI':
        return await this.completeWithZAI(messages, provider);
      case 'Together AI':
        return await this.completeWithTogetherAI(messages, provider);
      case 'Hugging Face':
        return await this.completeWithHuggingFace(messages, provider);
      case 'Ollama':
        return await this.completeWithOllama(messages, provider);
      case 'LocalAI':
        return await this.completeWithLocalAI(messages, provider);
      default:
        throw new Error(`Unknown provider: ${provider.name}`);
    }
  }

  /**
   * Complete with Z AI SDK
   */
  private async completeWithZAI(
    messages: ChatMessage[],
    provider: AIProvider
  ): Promise<AIResponse> {
    await this.initializeZAI();

    if (!this.zaiClient) {
      throw new Error('Z AI client not initialized');
    }

    const completion = await this.zaiClient.chat.completions.create({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      thinking: { type: 'disabled' },
    });

    const content = completion.choices[0]?.message?.content || '';
    const tokens = this.estimateTokens(content);
    const cost = tokens * (provider.costPer1KTokens / 1000);

    this.updateStats(provider.name, 1, tokens, cost);

    return {
      content,
      provider: provider.name,
      model: 'zai-default',
      tokensUsed: tokens,
      cost,
    };
  }

  /**
   * Complete with Together AI
   */
  private async completeWithTogetherAI(
    messages: ChatMessage[],
    provider: AIProvider
  ): Promise<AIResponse> {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model || 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
        messages,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Together AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    const tokens = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);
    const cost = tokens * (provider.costPer1KTokens / 1000);

    this.updateStats(provider.name, 1, tokens, cost);

    return {
      content,
      provider: provider.name,
      model: data.model,
      tokensUsed: tokens,
      cost,
    };
  }

  /**
   * Complete with Hugging Face
   */
  private async completeWithHuggingFace(
    messages: ChatMessage[],
    provider: AIProvider
  ): Promise<AIResponse> {
    const model = provider.model || 'meta-llama/Llama-3.3-70B-Instruct';
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const response = await fetch(`${provider.baseUrl}/${model}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    const tokens = this.estimateTokens(content);
    const cost = tokens * (provider.costPer1KTokens / 1000);

    this.updateStats(provider.name, 1, tokens, cost);

    return {
      content,
      provider: provider.name,
      model: model,
      tokensUsed: tokens,
      cost,
    };
  }

  /**
   * Complete with Ollama (Local)
   */
  private async completeWithOllama(
    messages: ChatMessage[],
    provider: AIProvider
  ): Promise<AIResponse> {
    const response = await fetch(`${provider.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: provider.model || 'llama3.3',
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.message?.content || '';
    const tokens = this.estimateTokens(content);

    this.updateStats(provider.name, 1, tokens, 0); // Local is free

    return {
      content,
      provider: provider.name,
      model: data.model,
      tokensUsed: tokens,
      cost: 0,
    };
  }

  /**
   * Complete with LocalAI (OpenAI compatible)
   */
  private async completeWithLocalAI(
    messages: ChatMessage[],
    provider: AIProvider
  ): Promise<AIResponse> {
    const response = await fetch(`${provider.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: provider.model || 'llama3',
        messages,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`LocalAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    const tokens = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);

    this.updateStats(provider.name, 1, tokens, 0); // Local is free

    return {
      content,
      provider: provider.name,
      model: data.model,
      tokensUsed: tokens,
      cost: 0,
    };
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Update usage statistics
   */
  private updateStats(provider: string, requests: number, tokens: number, cost: number) {
    const stats = this.usageStats.get(provider) || { requests: 0, tokens: 0, cost: 0 };
    stats.requests += requests;
    stats.tokens += tokens;
    stats.cost += cost;
    this.usageStats.set(provider, stats);
  }

  /**
   * Helper: Find top management contacts (uses AI)
   */
  async findTopManagement(
    businessName: string,
    location: string,
    website?: string
  ): Promise<any[]> {
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

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an expert business intelligence assistant. You help identify and estimate contact information for business management. Always provide realistic estimates when actual data is unavailable.',
      },
      { role: 'user', content: prompt },
    ];

    const response = await this.chatCompletion(messages);

    try {
      const contacts = JSON.parse(response.content);
      return Array.isArray(contacts) ? contacts : [];
    } catch (error) {
      console.error('Failed to parse AI response:', response.content);
      return [];
    }
  }

  /**
   * Helper: Enrich business data with AI insights
   */
  async enrichBusinessData(
    businessName: string,
    description: string,
    category: string,
    location: string
  ): Promise<any> {
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

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a business intelligence expert. Analyze business information and provide accurate insights.',
      },
      { role: 'user', content: prompt },
    ];

    const response = await this.chatCompletion(messages);

    try {
      return JSON.parse(response.content);
    } catch (error) {
      console.error('Failed to parse AI enrichment response:', response.content);
      return {};
    }
  }

  /**
   * NEW: Calculate lead quality score (0-100)
   * Based on multiple factors: reviews, contact info, website, etc.
   */
  async calculateLeadQualityScore(leadData: any): Promise<{
    score: number;
    factors: any;
    qualification: 'hot' | 'warm' | 'cold';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    tags: string[];
  }> {
    const prompt = `Calculate a comprehensive lead quality score (0-100) for this business:

Business Name: ${leadData.name}
Has Website: ${leadData.hasWebsite}
Website: ${leadData.website || 'N/A'}
Rating: ${leadData.rating || 'N/A'} (${leadData.reviewCount || 0} reviews)
Email: ${leadData.email || 'N/A'}
Phone: ${leadData.phone || 'N/A'}
Social Media: ${leadData.socialFacebook || leadData.socialLinkedIn || leadData.socialTwitter ? 'Yes' : 'No'}
Description: ${leadData.description || 'N/A'}
Category: ${leadData.category || leadData.niche || 'N/A'}

Evaluate based on:
1. **Contact Information** (25 points): Email, phone available
2. **Online Presence** (25 points): Website, social media presence
3. **Review Quality** (25 points): Rating + review count
4. **Business Maturity** (15 points): Detailed description, category
5. **Engagement Potential** (10 points): Overall impression

Return JSON with this structure:
{
  "score": number (0-100),
  "factors": {
    "contactInfo": { score: number, details: string },
    "onlinePresence": { score: number, details: string },
    "reviewQuality": { score: number, details: string },
    "businessMaturity": { score: number, details: string },
    "engagementPotential": { score: number, details: string }
  },
  "qualification": "hot" | "warm" | "cold" (hot: 70+, warm: 50-69, cold: <50),
  "priority": "low" | "medium" | "high" | "urgent" (urgent: 85+, high: 70-84, medium: 50-69, low: <50),
  "tags": ["tag1", "tag2", ...] (relevant tags like "High Reviews", "No Website", "Good Contact Info")
}`;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an expert lead scoring specialist. Analyze business leads and provide accurate quality assessments.',
      },
      { role: 'user', content: prompt },
    ];

    const response = await this.chatCompletion(messages);

    try {
      const result = JSON.parse(response.content);
      return {
        score: result.score || 50,
        factors: result.factors || {},
        qualification: result.qualification || 'warm',
        priority: result.priority || 'medium',
        tags: Array.isArray(result.tags) ? result.tags : [],
      };
    } catch (error) {
      console.error('Failed to parse lead score response:', response.content);
      // Fallback to basic scoring
      return this.calculateBasicScore(leadData);
    }
  }

  /**
   * Basic lead scoring fallback (no AI)
   */
  private calculateBasicScore(leadData: any): {
    score: number;
    factors: any;
    qualification: 'hot' | 'warm' | 'cold';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    tags: string[];
  } {
    let score = 50;
    const tags: string[] = [];
    const factors: any = {
      contactInfo: { score: 0, details: '' },
      onlinePresence: { score: 0, details: '' },
      reviewQuality: { score: 0, details: '' },
      businessMaturity: { score: 0, details: '' },
      engagementPotential: { score: 0, details: '' },
    };

    // Contact info
    if (leadData.email) {
      score += 12;
      factors.contactInfo.score += 12;
      factors.contactInfo.details = 'Email available';
      tags.push('Has Email');
    }
    if (leadData.phone) {
      score += 13;
      factors.contactInfo.score += 13;
      factors.contactInfo.details += 'Phone available';
      tags.push('Has Phone');
    }

    // Online presence
    if (leadData.hasWebsite) {
      score += 15;
      factors.onlinePresence.score += 15;
      factors.onlinePresence.details = 'Has website';
    } else {
      tags.push('No Website');
      score -= 5; // Penalize for no website
    }

    if (leadData.socialFacebook || leadData.socialLinkedIn || leadData.socialTwitter) {
      score += 10;
      factors.onlinePresence.score += 10;
      factors.onlinePresence.details += ', Has social media';
      tags.push('Social Media');
    }

    // Review quality
    if (leadData.rating) {
      const reviewScore = Math.min(25, (leadData.rating / 5) * 25);
      score += reviewScore;
      factors.reviewQuality.score = reviewScore;
      factors.reviewQuality.details = `${leadData.rating.toFixed(1)} stars`;
      if (leadData.rating >= 4.5) tags.push('High Rating');
    }
    if (leadData.reviewCount >= 50) {
      score += 5;
      tags.push('Many Reviews');
    }

    // Business maturity
    if (leadData.description) {
      score += 8;
      factors.businessMaturity.score += 8;
      factors.businessMaturity.details = 'Has description';
    }
    if (leadData.category || leadData.niche) {
      score += 7;
      factors.businessMaturity.score += 7;
      factors.businessMaturity.details += ', Has category';
    }

    // Engagement potential
    if (leadData.reviewCount >= 20 && leadData.rating >= 4) {
      score += 10;
      factors.engagementPotential.score = 10;
      factors.engagementPotential.details = 'Active business with good reviews';
      tags.push('Engaged');
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine qualification
    const qualification = score >= 70 ? 'hot' : score >= 50 ? 'warm' : 'cold';

    // Determine priority
    const priority = score >= 85 ? 'urgent' : score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';

    return { score, factors, qualification, priority, tags };
  }

  /**
   * NEW: Detect duplicate leads using AI
   */
  async detectDuplicates(lead: any, existingLeads: any[]): Promise<{
    isDuplicate: boolean;
    duplicateOf: string | null;
    confidence: number;
    reason: string;
  }> {
    if (existingLeads.length === 0) {
      return { isDuplicate: false, duplicateOf: null, confidence: 0, reason: 'No existing leads to compare' };
    }

    // Get top 20 most similar leads by name/location to check
    const candidates = existingLeads
      .filter((existing: any) => existing.id !== lead.id)
      .slice(0, 20);

    const candidateInfo = candidates.map((c: any) => ({
      id: c.id,
      name: c.name,
      website: c.website,
      phone: c.phone,
      email: c.email,
      city: c.city,
      postalCode: c.postalCode,
      address: c.address,
    }));

    const prompt = `Check if this lead is a duplicate of any existing leads:

NEW LEAD:
Name: ${lead.name}
Website: ${lead.website || 'N/A'}
Phone: ${lead.phone || 'N/A'}
Email: ${lead.email || 'N/A'}
City: ${lead.city || 'N/A'}
Postal Code: ${lead.postalCode || 'N/A'}
Address: ${lead.address || 'N/A'}

EXISTING LEADS TO CHECK:
${JSON.stringify(candidateInfo, null, 2)}

A lead is a duplicate if:
- Same or very similar business name
- Same phone number
- Same email
- Same website
- Same address/location

Return JSON:
{
  "isDuplicate": boolean,
  "duplicateOf": "lead_id" or null,
  "confidence": number (0-1),
  "reason": "explanation"
}`;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an expert at detecting duplicate business records. Be conservative - only mark as duplicate if highly confident (confidence > 0.7).',
      },
      { role: 'user', content: prompt },
    ];

    try {
      const response = await this.chatCompletion(messages);
      const result = JSON.parse(response.content);

      return {
        isDuplicate: result.isDuplicate && result.confidence > 0.7,
        duplicateOf: result.duplicateOf || null,
        confidence: result.confidence || 0,
        reason: result.reason || '',
      };
    } catch (error) {
      console.error('Failed to parse duplicate detection response:', error);
      // Fallback to basic matching
      return this.basicDuplicateCheck(lead, candidates);
    }
  }

  /**
   * Basic duplicate check (no AI)
   */
  private basicDuplicateCheck(lead: any, existingLeads: any[]): {
    isDuplicate: boolean;
    duplicateOf: string | null;
    confidence: number;
    reason: string;
  } {
    for (const existing of existingLeads) {
      // Exact phone match
      if (lead.phone && existing.phone === lead.phone) {
        return {
          isDuplicate: true,
          duplicateOf: existing.id,
          confidence: 0.95,
          reason: 'Same phone number',
        };
      }

      // Exact email match
      if (lead.email && existing.email === lead.email) {
        return {
          isDuplicate: true,
          duplicateOf: existing.id,
          confidence: 0.95,
          reason: 'Same email address',
        };
      }

      // Same website
      if (lead.website && existing.website === lead.website) {
        return {
          isDuplicate: true,
          duplicateOf: existing.id,
          confidence: 0.9,
          reason: 'Same website',
        };
      }

      // Very similar name in same city
      const nameSimilarity = this.calculateNameSimilarity(lead.name, existing.name);
      if (nameSimilarity > 0.85 && lead.city === existing.city) {
        return {
          isDuplicate: true,
          duplicateOf: existing.id,
          confidence: 0.8,
          reason: 'Similar business name in same location',
        };
      }
    }

    return {
      isDuplicate: false,
      duplicateOf: null,
      confidence: 0,
      reason: 'No match found',
    };
  }

  /**
   * Calculate name similarity (simple)
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();

    if (n1 === n2) return 1;

    // Check if one contains the other
    if (n1.includes(n2) || n2.includes(n1)) {
      return Math.min(n1.length, n2.length) / Math.max(n1.length, n2.length);
    }

    // Simple word overlap
    const words1 = n1.split(' ');
    const words2 = n2.split(' ');
    const commonWords = words1.filter(w => words2.includes(w));
    const overlap = commonWords.length / Math.max(words1.length, words2.length);

    return overlap;
  }

  /**
   * NEW: Validate email format and deliverability estimate
   */
  async validateEmail(email: string): Promise<{
    isValid: boolean;
    isDeliverable: boolean;
    confidence: number;
    details: string;
  }> {
    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return {
        isValid: false,
        isDeliverable: false,
        confidence: 1,
        details: 'Invalid email format',
      };
    }

    // Check for common disposable email domains
    const disposableDomains = [
      'tempmail.com', 'guerrillamail.com', 'mailinator.com', '10minutemail.com',
      'yopmail.com', 'throwawaymail.com', 'getairmail.com', 'sharklasers.com'
    ];
    const domain = email.split('@')[1].toLowerCase();
    if (disposableDomains.includes(domain)) {
      return {
        isValid: true,
        isDeliverable: false,
        confidence: 0.9,
        details: 'Disposable email address',
      };
    }

    // Check for business vs personal email patterns
    const personalPatterns = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
      'icloud.com', 'protonmail.com', 'tutanota.com'
    ];
    const isPersonal = personalPatterns.includes(domain);

    return {
      isValid: true,
      isDeliverable: true,
      confidence: isPersonal ? 0.7 : 0.9,
      details: isPersonal
        ? 'Valid format (personal email)'
        : 'Valid format (business email)',
    };
  }

  /**
   * NEW: Enrich multiple leads in batch for efficiency
   */
  async batchEnrichLeads(leads: any[]): Promise<{
    enriched: any[];
    failed: any[];
  }> {
    const enriched: any[] = [];
    const failed: any[] = [];

    for (const lead of leads) {
      try {
        // Skip if already enriched
        if (lead.isEnriched) {
          enriched.push(lead);
          continue;
        }

        // Calculate lead score
        const scoreResult = await this.calculateLeadQualityScore(lead);

        enriched.push({
          ...lead,
          qualityScore: scoreResult.score,
          qualityFactors: JSON.stringify(scoreResult.factors),
          tags: JSON.stringify(scoreResult.tags),
          status: scoreResult.qualification, // hot/warm/cold
          priority: scoreResult.priority,
        });
      } catch (error) {
        console.error(`Failed to enrich lead ${lead.id}:`, error);
        failed.push(lead);
      }
    }

    return { enriched, failed };
  }
}

// Export singleton instance
export const multiProviderAI = new MultiProviderAIService();
export default MultiProviderAIService;
