import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/leads
 * Get all leads with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Filters
    const hasWebsite = searchParams.get('hasWebsite');
    const city = searchParams.get('city');
    const postalCode = searchParams.get('postalCode');
    const county = searchParams.get('county');
    const niche = searchParams.get('niche');
    const minRating = searchParams.get('minRating');
    const searchId = searchParams.get('searchId');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const isDuplicate = searchParams.get('isDuplicate');
    const minQualityScore = searchParams.get('minQualityScore');
    const category = searchParams.get('category');

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Search
    const search = searchParams.get('search');

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

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (minRating) {
      where.rating = { gte: parseFloat(minRating) };
    }

    if (searchId) {
      where.searchId = searchId;
    }

    if (priority) {
      where.priority = priority;
    }

    if (status) {
      where.status = status;
    }

    if (isDuplicate !== null && isDuplicate !== undefined) {
      where.isDuplicate = isDuplicate === 'true';
    }

    if (minQualityScore) {
      where.qualityScore = { gte: parseFloat(minQualityScore) };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { city: { contains: search, mode: 'insensitive' } },
        { niche: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Fetch leads with pagination
    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          reviews: {
            take: 3,
            orderBy: { date: 'desc' },
          },
          contacts: true,
        },
      }),
      db.lead.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      leads,
      total,
      limit,
      offset,
      filters: {
        hasWebsite,
        city,
        postalCode,
        county,
        niche,
        category,
        minRating,
        searchId,
        priority,
        status,
        isDuplicate,
        minQualityScore,
        search,
      },
      sort: {
        by: sortBy,
        order: sortOrder,
      },
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads
 * Create a new lead (for manual entry)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const lead = await db.lead.create({
      data: {
        name: body.name,
        website: body.website,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        county: body.county,
        niche: body.niche,
        category: body.category,
        hasWebsite: body.hasWebsite || false,
        rating: body.rating,
        reviewCount: body.reviewCount || 0,
        socialFacebook: body.socialFacebook,
        socialTwitter: body.socialTwitter,
        socialLinkedIn: body.socialLinkedIn,
        socialInstagram: body.socialInstagram,
        description: body.description,
        notes: body.notes,
        priority: body.priority || 'medium',
        status: body.status || 'new',
      },
    });

    return NextResponse.json({
      success: true,
      lead,
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leads
 * Delete all leads (or filtered leads)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchId = searchParams.get('searchId');
    const hasWebsite = searchParams.get('hasWebsite');

    const where: any = {};
    if (searchId) {
      where.searchId = searchId;
    }

    if (hasWebsite !== null && hasWebsite !== undefined) {
      where.hasWebsite = hasWebsite === 'true';
    }

    const result = await db.lead.deleteMany({ where });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} leads`,
    });
  } catch (error) {
    console.error('Error deleting leads:', error);
    return NextResponse.json(
      { error: 'Failed to delete leads' },
      { status: 500 }
    );
  }
}

