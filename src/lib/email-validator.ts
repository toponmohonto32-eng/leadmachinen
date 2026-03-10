/**
 * Email Validation Service
 * Provides email format validation and deliverability checking
 */

export class EmailValidator {
  /**
   * Validate email format
   */
  static isValidFormat(email: string): boolean {
    if (!email || typeof email !== 'string') return false;

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    // Additional checks
    const parts = email.split('@');
    if (parts.length !== 2) return false;

    const [local, domain] = parts;

    // Local part validation
    if (local.length === 0 || local.length > 64) return false;
    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return false;

    // Domain validation
    if (domain.length === 0 || domain.length > 255) return false;
    if (!/^[a-zA-Z0-9.-]+$/.test(domain)) return false;

    // Check for valid TLD
    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2 || tld.length > 63) return false;

    return true;
  }

  /**
   * Check if email is from a free provider
   */
  static isFreeProvider(email: string): boolean {
    const freeProviders = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'aol.com',
      'icloud.com',
      'protonmail.com',
      'mail.com',
      'zoho.com',
      'yandex.com',
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    return freeProviders.includes(domain || '');
  }

  /**
   * Check if email is from a business domain
   */
  static isBusinessEmail(email: string): boolean {
    return !this.isFreeProvider(email);
  }

  /**
   * Extract domain from email
   */
  static extractDomain(email: string): string {
    return email.split('@')[1]?.toLowerCase() || '';
  }

  /**
   * Normalize email (lowercase, trim)
   */
  static normalize(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Check for common invalid patterns
   */
  static hasInvalidPatterns(email: string): boolean {
    const invalidPatterns = [
      'test@',
      'example@',
      'noreply@',
      'no-reply@',
      'donotreply@',
      'do-not-reply@',
      'admin@',
      'support@',
      'info@',
      'webmaster@',
      'postmaster@',
      'abuse@',
      'privacy@',
    ];

    const normalized = this.normalize(email);
    return invalidPatterns.some(pattern => normalized.startsWith(pattern));
  }

  /**
   * Validate email and return detailed information
   */
  static validate(email: string): {
    valid: boolean;
    formatted: boolean;
    freeProvider: boolean;
    businessEmail: boolean;
    domain: string;
    normalized: string;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!email) {
      return {
        valid: false,
        formatted: false,
        freeProvider: false,
        businessEmail: false,
        domain: '',
        normalized: '',
        issues: ['Email is required'],
        suggestions: [],
      };
    }

    const normalized = this.normalize(email);
    const formatted = this.isValidFormat(email);
    const domain = this.extractDomain(email);
    const freeProvider = this.isFreeProvider(email);
    const businessEmail = !freeProvider;

    if (!formatted) {
      issues.push('Invalid email format');
      suggestions.push('Check for typos in email address');
    }

    if (this.hasInvalidPatterns(email)) {
      issues.push('Email appears to be a generic address');
      suggestions.push('This might be a generic email, consider finding a more specific contact');
    }

    return {
      valid: formatted,
      formatted,
      freeProvider,
      businessEmail,
      domain,
      normalized,
      issues,
      suggestions,
    };
  }

  /**
   * Check for potential duplicates (normalized comparison)
   */
  static areDuplicates(email1: string, email2: string): boolean {
    return this.normalize(email1) === this.normalize(email2);
  }

  /**
   * Batch validate emails
   */
  static batchValidate(emails: string[]): Map<string, ReturnType<typeof EmailValidator.validate>> {
    const results = new Map();

    for (const email of emails) {
      if (email) {
        results.set(email, this.validate(email));
      }
    }

    return results;
  }
}

export default EmailValidator;
