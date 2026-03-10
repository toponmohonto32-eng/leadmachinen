import { db } from '@/lib/db';
import { EmailValidator } from './email-validator';

interface LeadInfo {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  placeId: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
}

interface DuplicateMatch {
  leadId: string;
  duplicateLeadId: string;
  matchType: 'exact' | 'strong' | 'moderate' | 'weak';
  matchReason: string;
  confidence: number; // 0-1
}

export class DuplicateDetector {
  /**
   * Find duplicate leads based on multiple criteria
   */
  static async findDuplicates(lead: LeadInfo): Promise<DuplicateMatch[]> {
    const duplicates: DuplicateMatch[] = [];

    // 1. Check by placeId (Google Maps unique identifier) - EXACT MATCH
    if (lead.placeId) {
      const placeIdMatches = await db.lead.findMany({
        where: {
          placeId: lead.placeId,
          id: { not: lead.id },
        },
      });

      for (const match of placeIdMatches) {
        duplicates.push({
          leadId: lead.id,
          duplicateLeadId: match.id,
          matchType: 'exact',
          matchReason: 'Same Google Maps Place ID',
          confidence: 1.0,
        });
      }
    }

    // 2. Check by normalized email - STRONG MATCH
    if (lead.email && EmailValidator.isValidFormat(lead.email)) {
      const normalizedEmail = EmailValidator.normalize(lead.email);
      const emailMatches = await db.lead.findMany({
        where: {
          id: { not: lead.id },
        },
      });

      for (const match of emailMatches) {
        if (match.email && EmailValidator.normalize(match.email) === normalizedEmail) {
          duplicates.push({
            leadId: lead.id,
            duplicateLeadId: match.id,
            matchType: 'strong',
            matchReason: 'Same email address',
            confidence: 0.95,
          });
        }
      }
    }

    // 3. Check by phone number - STRONG MATCH
    if (lead.phone) {
      const normalizedPhone = this.normalizePhone(lead.phone);
      const phoneMatches = await db.lead.findMany({
        where: {
          id: { not: lead.id },
          phone: { not: null },
        },
      });

      for (const match of phoneMatches) {
        if (match.phone && this.normalizePhone(match.phone) === normalizedPhone) {
          duplicates.push({
            leadId: lead.id,
            duplicateLeadId: match.id,
            matchType: 'strong',
            matchReason: 'Same phone number',
            confidence: 0.9,
          });
        }
      }
    }

    // 4. Check by website URL - STRONG MATCH
    if (lead.website) {
      const normalizedWebsite = this.normalizeUrl(lead.website);
      const websiteMatches = await db.lead.findMany({
        where: {
          id: { not: lead.id },
          website: { not: null },
        },
      });

      for (const match of websiteMatches) {
        if (match.website && this.normalizeUrl(match.website) === normalizedWebsite) {
          duplicates.push({
            leadId: lead.id,
            duplicateLeadId: match.id,
            matchType: 'strong',
            matchReason: 'Same website',
            confidence: 0.85,
          });
        }
      }
    }

    // 5. Check by name + location - MODERATE MATCH
    if (lead.name && (lead.city || lead.postalCode)) {
      const nameMatches = await db.lead.findMany({
        where: {
          id: { not: lead.id },
          name: { contains: this.normalizeName(lead.name), mode: 'insensitive' },
        },
      });

      for (const match of nameMatches) {
        let locationMatch = false;
        if (lead.city && match.city && this.normalizeLocation(lead.city) === this.normalizeLocation(match.city)) {
          locationMatch = true;
        }
        if (lead.postalCode && match.postalCode && lead.postalCode === match.postalCode) {
          locationMatch = true;
        }

        if (locationMatch) {
          // Check if already added as duplicate
          const alreadyAdded = duplicates.find(d => d.duplicateLeadId === match.id);
          if (!alreadyAdded) {
            duplicates.push({
              leadId: lead.id,
              duplicateLeadId: match.id,
              matchType: 'moderate',
              matchReason: 'Same business name and location',
              confidence: 0.7,
            });
          }
        }
      }
    }

    // 6. Check by name + phone - MODERATE MATCH
    if (lead.name && lead.phone) {
      const namePhoneMatches = await db.lead.findMany({
        where: {
          id: { not: lead.id },
          name: { contains: this.normalizeName(lead.name), mode: 'insensitive' },
          phone: { not: null },
        },
      });

      for (const match of namePhoneMatches) {
        if (match.phone && this.normalizePhone(match.phone) === this.normalizePhone(lead.phone)) {
          const alreadyAdded = duplicates.find(d => d.duplicateLeadId === match.id);
          if (!alreadyAdded) {
            duplicates.push({
              leadId: lead.id,
              duplicateLeadId: match.id,
              matchType: 'moderate',
              matchReason: 'Same business name and phone',
              confidence: 0.75,
            });
          }
        }
      }
    }

    // Return duplicates sorted by confidence (highest first)
    return duplicates.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Mark a lead as duplicate
   */
  static async markAsDuplicate(leadId: string, duplicateOfId: string): Promise<void> {
    await db.lead.update({
      where: { id: leadId },
      data: {
        isDuplicate: true,
        duplicateOf: duplicateOfId,
      },
    });
  }

  /**
   * Merge duplicate leads
   */
  static async mergeDuplicates(primaryId: string, duplicateIds: string[]): Promise<void> {
    const primary = await db.lead.findUnique({
      where: { id: primaryId },
      include: { reviews: true, contacts: true },
    });

    if (!primary) {
      throw new Error('Primary lead not found');
    }

    for (const duplicateId of duplicateIds) {
      const duplicate = await db.lead.findUnique({
        where: { id: duplicateId },
        include: { reviews: true, contacts: true },
      });

      if (!duplicate) continue;

      // Merge data - keep most complete information
      const updateData: any = {};

      // Keep non-null values from duplicate if primary doesn't have them
      if (!primary.email && duplicate.email) updateData.email = duplicate.email;
      if (!primary.phone && duplicate.phone) updateData.phone = duplicate.phone;
      if (!primary.website && duplicate.website) updateData.website = duplicate.website;
      if (!primary.address && duplicate.address) updateData.address = duplicate.address;
      if (!primary.description && duplicate.description) updateData.description = duplicate.description;
      if (!primary.socialFacebook && duplicate.socialFacebook) updateData.socialFacebook = duplicate.socialFacebook;
      if (!primary.socialTwitter && duplicate.socialTwitter) updateData.socialTwitter = duplicate.socialTwitter;
      if (!primary.socialLinkedIn && duplicate.socialLinkedIn) updateData.socialLinkedIn = duplicate.socialLinkedIn;
      if (!primary.socialInstagram && duplicate.socialInstagram) updateData.socialInstagram = duplicate.socialInstagram;
      if (!primary.socialYoutube && duplicate.socialYoutube) updateData.socialYoutube = duplicate.socialYoutube;

      // Update rating if duplicate has better one
      if (duplicate.rating && (!primary.rating || duplicate.rating > primary.rating)) {
        updateData.rating = duplicate.rating;
      }

      // Update review count
      if (duplicate.reviewCount > primary.reviewCount) {
        updateData.reviewCount = duplicate.reviewCount;
      }

      // Update primary lead
      if (Object.keys(updateData).length > 0) {
        await db.lead.update({
          where: { id: primaryId },
          data: updateData,
        });
      }

      // Move reviews from duplicate to primary
      for (const review of duplicate.reviews) {
        // Check if review already exists
        const existingReview = await db.review.findFirst({
          where: {
            leadId: primaryId,
            reviewId: review.reviewId,
          },
        });

        if (!existingReview) {
          await db.review.update({
            where: { id: review.id },
            data: { leadId: primaryId },
          });
        }
      }

      // Move contacts from duplicate to primary
      for (const contact of duplicate.contacts) {
        const existingContact = await db.contact.findFirst({
          where: {
            leadId: primaryId,
            email: contact.email || undefined,
            name: contact.name,
          },
        });

        if (!existingContact) {
          await db.contact.update({
            where: { id: contact.id },
            data: { leadId: primaryId },
          });
        }
      }

      // Mark duplicate as merged
      await db.lead.update({
        where: { id: duplicateId },
        data: {
          isDuplicate: true,
          duplicateOf: primaryId,
        },
      });
    }
  }

  /**
   * Scan all leads for duplicates
   */
  static async scanAllLeads(): Promise<DuplicateMatch[]> {
    const allLeads = await db.lead.findMany({
      where: { isDuplicate: false },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        website: true,
        placeId: true,
        address: true,
        city: true,
        postalCode: true,
      },
    });

    const allDuplicates: DuplicateMatch[] = [];

    for (const lead of allLeads) {
      const duplicates = await this.findDuplicates(lead);
      allDuplicates.push(...duplicates);
    }

    return allDuplicates;
  }

  /**
   * Normalize phone number (remove all non-digits)
   */
  private static normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  /**
   * Normalize URL (remove protocol, www, trailing slash)
   */
  private static normalizeUrl(url: string): string {
    let normalized = url.toLowerCase();

    // Remove protocol
    normalized = normalized.replace(/^https?:\/\//, '');
    normalized = normalized.replace(/^www\./, '');

    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');

    return normalized;
  }

  /**
   * Normalize business name (remove common prefixes/suffixes, special chars)
   */
  private static normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/^(the |a |an )/i, '')
      .replace(/^(inc\.|llc|ltd\.|corp\.|co\.|company) /i, '')
      .replace(/ (inc\.|llc|ltd\.|corp\.|co\.|company)$/i, '')
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Normalize location (city name)
   */
  private static normalizeLocation(location: string): string {
    return location.toLowerCase().replace(/\s+/g, ' ').trim();
  }
}

export default DuplicateDetector;
