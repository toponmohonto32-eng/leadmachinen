import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scraperHub } from '@/lib/scraper-hub';

/**
 * POST /api/scraping/search
 * Start a new Google Maps scraping search
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      postalCode,
      city,
      county,
      niche,
      limit = 20,
      extractReviews = true,
      extractEmails = true,
      extractSocialLinks = true,
    } = body;

    // Validate required fields
    if (!query && !postalCode && !city) {
      return NextResponse.json(
        { error: 'At least one of query, postalCode, or city is required' },
        { status: 400 }
      );
    }

    // Create search record
    const search = await db.search.create({
      data: {
        query: query || '',
        postalCode: postalCode || null,
        city: city || null,
        county: county || null,
        niche: niche || null,
        status: 'running',
        resultsCount: 0,
      },
    });

    // Start scraping in background
    (async () => {
      try {
        // Use Scraper Hub with automatic fallback
        const result = await scraperHub.searchBusinesses({
          query,
          postalCode,
          city,
          county,
          niche,
          limit,
          extractReviews,
          extractEmails,
          extractSocialLinks,
        });

        console.log(`Scraping completed using ${result.source}. Cost: $${result.cost || 0}`);

        // Save businesses to database
        let savedCount = 0;
        for (const business of result.businesses) {
          try {
            const lead = await db.lead.create({
              data: business,
            });

            // Save reviews if available
            if (business.reviews_data && business.reviews_data.length > 0) {
              for (const review of business.reviews_data) {
                const normalizedReview = scraperHub.normalizeReviewData(review, lead.id);
                await db.review.create({
                  data: normalizedReview,
                });
              }
            }

            savedCount++;
          } catch (error) {
            // Handle duplicate placeId errors
            if (
              error instanceof Error &&
              error.message.includes('unique constraint')
            ) {
              console.log(`Business already exists: ${business.name}`);
            } else {
              console.error('Error saving lead:', error);
            }
          }
        }

        // Update search status
        await db.search.update({
          where: { id: search.id },
          data: {
            status: 'completed',
            resultsCount: savedCount,
          },
        });
      } catch (error) {
        console.error('Error in scraping job:', error);
        
        // Update search status to failed
        await db.search.update({
          where: { id: search.id },
          data: {
            status: 'failed',
          },
        });
      }
    })();

    return NextResponse.json({
      success: true,
      searchId: search.id,
      message: 'Scraping job started',
    });
  } catch (error) {
    console.error('Error starting search:', error);
    return NextResponse.json(
      { error: 'Failed to start search', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scraping/search
 * Get all searches
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const searches = await db.search.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.search.count();

    return NextResponse.json({
      success: true,
      searches,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching searches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch searches' },
      { status: 500 }
    );
  }
}
