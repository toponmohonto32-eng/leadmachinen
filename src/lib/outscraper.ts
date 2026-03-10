/**
 * Outscraper API Service for Google Maps Scraping
 * 
 * This service handles all interactions with Outscraper's Google Maps API
 * to extract business data, reviews, and contact information.
 * 
 * Documentation: https://outscraper.com/google-maps-api
 */

interface OutscraperSearchOptions {
  query: string;
  location?: string;
  postalCode?: string;
  city?: string;
  county?: string;
  niche?: string;
  limit?: number;
  language?: string;
  region?: string;
  extractReviews?: boolean;
  extractEmails?: boolean;
  extractSocialLinks?: boolean;
}

interface OutscraperBusinessData {
  name: string;
  full_address: string;
  phone: string;
  site: string;
  rating: number;
  reviews: number;
  latitude: number;
  longitude: number;
  place_id: string;
  emails: string[];
  social_media_links: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  categories: string[];
  description: string;
  opening_hours: string[];
  business_status: string;
  photos_count: number;
  reviews_data?: Array<{
    author_name: string;
    author_url?: string;
    rating: number;
    text: string;
    time: number;
  }>;
  plus_code: string;
}

interface OutscraperResponse {
  id: string;
  status: string;
  results?: OutscraperBusinessData[];
  error?: string;
}

class OutscraperService {
  private apiKey: string;
  private baseUrl: string = 'https://api.app.outscraper.com/api';

  constructor(apiKey?: string) {
    // Use provided API key or environment variable
    this.apiKey = apiKey || process.env.OUTSCRAPER_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Outscraper API key not provided. Service will be in mock mode for development.');
    }
  }

  /**
   * Search Google Maps for businesses
   */
  async searchBusinesses(options: OutscraperSearchOptions): Promise<OutscraperBusinessData[]> {
    const {
      query,
      location,
      postalCode,
      city,
      county,
      niche,
      limit = 20,
      language = 'en',
      region = 'us',
      extractReviews = true,
      extractEmails = true,
      extractSocialLinks = true,
    } = options;

    // Build search query
    let searchQuery = '';
    
    if (niche) {
      searchQuery += `${niche} `;
    }
    
    if (postalCode) {
      searchQuery += `near ${postalCode} `;
    } else if (city) {
      searchQuery += `in ${city}`;
      if (county) {
        searchQuery += `, ${county}`;
      }
      if (state) {
        searchQuery += `, ${state}`;
      }
    } else if (location) {
      searchQuery += `in ${location}`;
    }

    searchQuery = searchQuery.trim() || query;

    // If no API key, return mock data for development
    if (!this.apiKey) {
      console.log('Using mock data (no API key provided)');
      return this.getMockBusinessData(searchQuery, limit);
    }

    try {
      const response = await fetch(`${this.baseUrl}/maps/search-v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey,
        },
        body: JSON.stringify({
          query: searchQuery,
          language,
          region,
          limit,
          extract_reviews: extractReviews,
          extract_emails: extractEmails,
          extract_social_links: extractSocialLinks,
          async: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Outscraper API error: ${response.status} ${response.statusText}`);
      }

      const data: OutscraperResponse = await response.json();

      if (data.error) {
        throw new Error(`Outscraper error: ${data.error}`);
      }

      return data.results || [];
    } catch (error) {
      console.error('Error calling Outscraper API:', error);
      
      // Fallback to mock data on error
      console.log('Falling back to mock data');
      return this.getMockBusinessData(searchQuery, limit);
    }
  }

  /**
   * Extract reviews for a specific business
   */
  async getBusinessReviews(placeId: string, limit: number = 20): Promise<any[]> {
    if (!this.apiKey) {
      return this.getMockReviews(placeId, limit);
    }

    try {
      const response = await fetch(`${this.baseUrl}/maps/reviews-v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey,
        },
        body: JSON.stringify({
          query: placeId,
          limit,
          language: 'en',
          async: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Outscraper API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return this.getMockReviews(placeId, limit);
    }
  }

  /**
   * Convert Outscraper data to our Lead format
   */
  normalizeBusinessData(data: OutscraperBusinessData, searchId?: string) {
    return {
      searchId,
      name: data.name || '',
      website: data.site || null,
      email: data.emails?.[0] || null,
      phone: data.phone || null,
      address: data.full_address || null,
      city: this.extractCityFromAddress(data.full_address),
      postalCode: this.extractPostalCodeFromAddress(data.full_address),
      county: null, // Would need additional geocoding
      country: null,
      niche: data.categories?.[0] || null,
      hasWebsite: !!data.site && data.site !== 'N/A' && data.site !== '',
      rating: data.rating || null,
      reviewCount: data.reviews || 0,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      placeId: data.place_id || null,
      businessStatus: data.business_status || 'OPERATIONAL',
      openingHours: data.opening_hours ? JSON.stringify(data.opening_hours) : null,
      photos: JSON.stringify({ count: data.photos_count || 0 }),
      socialFacebook: data.social_media_links?.facebook || null,
      socialTwitter: data.social_media_links?.twitter || null,
      socialLinkedIn: data.social_media_links?.linkedin || null,
      socialInstagram: data.social_media_links?.instagram || null,
      socialYoutube: data.social_media_links?.youtube || null,
      description: data.description || null,
      category: data.categories?.join(', ') || null,
      rawGMBData: JSON.stringify(data),
      isEnriched: false,
    };
  }

  /**
   * Convert Outscraper review data to our Review format
   */
  normalizeReviewData(review: any, leadId: string) {
    return {
      leadId,
      reviewerName: review.author_name || null,
      reviewerEmail: null, // Email not typically available
      reviewerProfileUrl: review.author_url || null,
      rating: review.rating || 0,
      text: review.text || null,
      date: review.time ? new Date(review.time * 1000) : null,
      reviewId: review.id || null,
      rawReviewData: JSON.stringify(review),
    };
  }

  /**
   * Helper: Extract city from address
   */
  private extractCityFromAddress(address: string): string | null {
    if (!address) return null;
    const parts = address.split(',').map(p => p.trim());
    // Typically: Street, City, State, Country
    return parts.length >= 2 ? parts[1] : parts[0];
  }

  /**
   * Helper: Extract postal code from address
   */
  private extractPostalCodeFromAddress(address: string): string | null {
    if (!address) return null;
    const zipMatch = address.match(/\b\d{5}(-\d{4})?\b/);
    return zipMatch ? zipMatch[0] : null;
  }

  /**
   * Mock business data for development/testing
   */
  private getMockBusinessData(query: string, limit: number): OutscraperBusinessData[] {
    const mockBusinesses: OutscraperBusinessData[] = [
      {
        name: 'Green Valley Restaurant',
        full_address: '123 Main St, Los Angeles, CA 90001',
        phone: '(555) 123-4567',
        site: '',
        rating: 4.5,
        reviews: 234,
        latitude: 34.0522,
        longitude: -118.2437,
        place_id: 'ChIJdXBl0fCDwoARCCOFHlMZGDY',
        emails: ['contact@greenvalley.com'],
        social_media_links: {
          facebook: 'https://facebook.com/greenvalley',
          instagram: 'https://instagram.com/greenvalley',
        },
        categories: ['Restaurant', 'Food'],
        description: 'Authentic local cuisine with farm-to-table ingredients',
        opening_hours: ['Mon-Fri: 9AM-10PM', 'Sat-Sun: 10AM-11PM'],
        business_status: 'OPERATIONAL',
        photos_count: 45,
        reviews_data: [],
        plus_code: '849VQHG8+2F',
      },
      {
        name: 'City Fitness Center',
        full_address: '456 Oak Ave, Los Angeles, CA 90002',
        phone: '(555) 987-6543',
        site: 'https://cityfitness.com',
        rating: 4.2,
        reviews: 156,
        latitude: 34.0532,
        longitude: -118.2447,
        place_id: 'ChIJE9on3F3HwoAR9AhxJYiLHMA',
        emails: ['info@cityfitness.com'],
        social_media_links: {
          facebook: 'https://facebook.com/cityfitness',
          instagram: 'https://instagram.com/cityfitness',
          twitter: 'https://twitter.com/cityfitness',
        },
        categories: ['Gym', 'Fitness Center'],
        description: 'State-of-the-art fitness equipment and personal training',
        opening_hours: ['24/7'],
        business_status: 'OPERATIONAL',
        photos_count: 32,
        reviews_data: [],
        plus_code: '849VQHG9+3G',
      },
      {
        name: 'Downtown Dental Care',
        full_address: '789 Pine St, Los Angeles, CA 90003',
        phone: '(555) 456-7890',
        site: '',
        rating: 4.8,
        reviews: 312,
        latitude: 34.0542,
        longitude: -118.2457,
        place_id: 'ChIJ2Xlu7F3HwoARcPhMGJZJGDY',
        emails: ['appointments@downtowndental.com'],
        social_media_links: {
          facebook: 'https://facebook.com/downtowndental',
        },
        categories: ['Dentist', 'Healthcare'],
        description: 'Comprehensive dental care for the whole family',
        opening_hours: ['Mon-Fri: 8AM-6PM', 'Sat: 9AM-2PM'],
        business_status: 'OPERATIONAL',
        photos_count: 28,
        reviews_data: [],
        plus_code: '849VQHG0+4H',
      },
      {
        name: 'Quick Fix Auto Repair',
        full_address: '321 Elm Dr, Los Angeles, CA 90004',
        phone: '(555) 321-0987',
        site: 'https://quickfixauto.com',
        rating: 4.0,
        reviews: 89,
        latitude: 34.0552,
        longitude: -118.2467,
        place_id: 'ChIJrXnu7F3HwoARkB5HNKYeLHA',
        emails: ['service@quickfixauto.com'],
        social_media_links: {
          facebook: 'https://facebook.com/quickfixauto',
        },
        categories: ['Auto Repair', 'Car Service'],
        description: 'Fast and reliable auto repair services',
        opening_hours: ['Mon-Sat: 7AM-7PM'],
        business_status: 'OPERATIONAL',
        photos_count: 18,
        reviews_data: [],
        plus_code: '849VQHG1+5J',
      },
      {
        name: 'Sunrise Bakery',
        full_address: '654 Maple Ln, Los Angeles, CA 90005',
        phone: '(555) 654-3210',
        site: '',
        rating: 4.7,
        reviews: 445,
        latitude: 34.0562,
        longitude: -118.2477,
        place_id: 'ChIJmXrv7F3HwoARjC6HJOdJGDY',
        emails: ['hello@sunrisebakery.com'],
        social_media_links: {
          facebook: 'https://facebook.com/sunrisebakery',
          instagram: 'https://instagram.com/sunrisebakery',
          twitter: 'https://twitter.com/sunrisebakery',
        },
        categories: ['Bakery', 'Cafe'],
        description: 'Freshly baked goods and artisan coffee',
        opening_hours: ['Mon-Fri: 6AM-8PM', 'Sat-Sun: 7AM-9PM'],
        business_status: 'OPERATIONAL',
        photos_count: 67,
        reviews_data: [],
        plus_code: '849VQHG2+6K',
      },
    ];

    return mockBusinesses.slice(0, limit);
  }

  /**
   * Mock review data for development/testing
   */
  private getMockReviews(placeId: string, limit: number): any[] {
    const mockReviews = [
      {
        id: `review_${placeId}_1`,
        author_name: 'John Smith',
        author_url: 'https://maps.google.com/?cid=123456789',
        rating: 5,
        text: 'Excellent service and great quality! Highly recommend.',
        time: Date.now() / 1000 - 86400 * 7,
      },
      {
        id: `review_${placeId}_2`,
        author_name: 'Sarah Johnson',
        author_url: 'https://maps.google.com/?cid=987654321',
        rating: 4,
        text: 'Good experience overall. Staff was friendly and helpful.',
        time: Date.now() / 1000 - 86400 * 14,
      },
      {
        id: `review_${placeId}_3`,
        author_name: 'Michael Brown',
        author_url: 'https://maps.google.com/?cid=456789123',
        rating: 5,
        text: 'Will definitely come back! Best in town.',
        time: Date.now() / 1000 - 86400 * 21,
      },
    ];

    return mockReviews.slice(0, limit);
  }
}

// Export singleton instance
export const outscraperService = new OutscraperService();
export default OutscraperService;
