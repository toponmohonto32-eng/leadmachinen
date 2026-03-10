import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/leads/export
 * Export leads to CSV, JSON, or Excel format
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hasWebsite = searchParams.get('hasWebsite');
    const city = searchParams.get('city');
    const postalCode = searchParams.get('postalCode');
    const county = searchParams.get('county');
    const niche = searchParams.get('niche');
    const searchId = searchParams.get('searchId');
    const format = searchParams.get('format') || 'csv'; // csv, json

    // Build where clause
    const where: any = {};

    if (hasWebsite !== null && hasWebsite !== undefined) {
      where.hasWebsite = hasWebsite === 'true';
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (postalCode) {
      where.postalCode = { contains: postalCode };
    }

    if (county) {
      where.county = { contains: county, mode: 'insensitive' };
    }

    if (niche) {
      where.niche = { contains: niche, mode: 'insensitive' };
    }

    if (searchId) {
      where.searchId = searchId;
    }

    // Fetch leads
    const leads = await db.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        contacts: true,
        reviews: true,
      },
    });

    // Export based on format
    if (format === 'json') {
      return exportJSON(leads);
    } else if (format === 'excel') {
      return exportExcel(leads);
    } else {
      return exportCSV(leads);
    }
  } catch (error) {
    console.error('Error exporting leads:', error);
    return NextResponse.json(
      { error: 'Failed to export leads' },
      { status: 500 }
    );
  }
}

/**
 * Export leads to CSV format
 */
function exportCSV(leads: any[]) {
  const headers = [
    'Business Name',
    'Website',
    'Email',
    'Phone',
    'Address',
    'City',
    'State',
    'Postal Code',
    'County',
    'Niche',
    'Has Website',
    'Rating',
    'Review Count',
    'Facebook',
    'Twitter',
    'LinkedIn',
    'Instagram',
    'Category',
    'Quality Score',
    'Priority',
    'Status',
    'Tags',
    'Contact Names',
    'Contact Emails',
    'Contact Roles',
    'Review Count (Average Rating)',
    'Created At',
  ];

  const rows = leads.map((lead) => {
    const contactNames = lead.contacts.map((c: any) => c.name).join('; ');
    const contactEmails = lead.contacts.map((c: any) => c.email).filter(Boolean).join('; ');
    const contactRoles = lead.contacts.map((c: any) => c.role).join('; ');

    const avgRating = lead.reviews.length > 0
      ? (lead.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / lead.reviews.length).toFixed(1)
      : '';

    return [
      lead.name,
      lead.website || '',
      lead.email || '',
      lead.phone || '',
      lead.address || '',
      lead.city || '',
      lead.state || '',
      lead.postalCode || '',
      lead.county || '',
      lead.niche || '',
      lead.hasWebsite ? 'Yes' : 'No',
      lead.rating || '',
      lead.reviewCount,
      lead.socialFacebook || '',
      lead.socialTwitter || '',
      lead.socialLinkedIn || '',
      lead.socialInstagram || '',
      lead.category || '',
      lead.qualityScore || '',
      lead.priority || '',
      lead.status || '',
      lead.tags || '',
      contactNames,
      contactEmails,
      contactRoles,
      avgRating,
      lead.createdAt.toISOString(),
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-export-${Date.now()}.csv"`,
    },
  });
}

/**
 * Export leads to JSON format
 */
function exportJSON(leads: any[]) {
  const jsonData = leads.map((lead) => ({
    id: lead.id,
    businessName: lead.name,
    website: lead.website,
    email: lead.email,
    phone: lead.phone,
    address: lead.address,
    city: lead.city,
    state: lead.state,
    postalCode: lead.postalCode,
    county: lead.county,
    niche: lead.niche,
    category: lead.category,
    hasWebsite: lead.hasWebsite,
    rating: lead.rating,
    reviewCount: lead.reviewCount,
    socialMedia: {
      facebook: lead.socialFacebook,
      twitter: lead.socialTwitter,
      linkedin: lead.socialLinkedIn,
      instagram: lead.socialInstagram,
      youtube: lead.socialYoutube,
    },
    quality: {
      score: lead.qualityScore,
      priority: lead.priority,
      status: lead.status,
      tags: lead.tags ? JSON.parse(lead.tags) : [],
    },
    contacts: lead.contacts.map((c: any) => ({
      name: c.name,
      role: c.role,
      email: c.email,
      phone: c.phone,
      linkedin: c.linkedIn,
      confidence: c.confidence,
    })),
    reviews: lead.reviews.map((r: any) => ({
      reviewerName: r.reviewerName,
      rating: r.rating,
      text: r.text,
      date: r.date,
    })),
    location: {
      latitude: lead.latitude,
      longitude: lead.longitude,
    },
    businessStatus: lead.businessStatus,
    enriched: lead.isEnriched,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  }));

  return new NextResponse(JSON.stringify(jsonData, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-export-${Date.now()}.json"`,
    },
  });
}

/**
 * Export leads to Excel-compatible CSV format (with BOM for proper encoding)
 */
function exportExcel(leads: any[]) {
  const headers = [
    'Business Name',
    'Website',
    'Email',
    'Phone',
    'Address',
    'City',
    'State',
    'Postal Code',
    'County',
    'Niche',
    'Has Website',
    'Rating',
    'Review Count',
    'Facebook',
    'Twitter',
    'LinkedIn',
    'Instagram',
    'Category',
    'Quality Score',
    'Priority',
    'Status',
    'Tags',
    'Contact Names',
    'Contact Emails',
    'Contact Roles',
    'Created At',
  ];

  const rows = leads.map((lead) => {
    const contactNames = lead.contacts.map((c: any) => c.name).join('; ');
    const contactEmails = lead.contacts.map((c: any) => c.email).filter(Boolean).join('; ');
    const contactRoles = lead.contacts.map((c: any) => c.role).join('; ');

    return [
      lead.name,
      lead.website || '',
      lead.email || '',
      lead.phone || '',
      lead.address || '',
      lead.city || '',
      lead.state || '',
      lead.postalCode || '',
      lead.county || '',
      lead.niche || '',
      lead.hasWebsite ? 'Yes' : 'No',
      lead.rating || '',
      lead.reviewCount,
      lead.socialFacebook || '',
      lead.socialTwitter || '',
      lead.socialLinkedIn || '',
      lead.socialInstagram || '',
      lead.category || '',
      lead.qualityScore || '',
      lead.priority || '',
      lead.status || '',
      lead.tags || '',
      contactNames,
      contactEmails,
      contactRoles,
      lead.createdAt.toISOString(),
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  // Add BOM for Excel to recognize UTF-8
  const bom = '\uFEFF';

  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-export-${Date.now()}.csv"`,
    },
  });
}
