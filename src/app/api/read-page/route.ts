import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

/**
 * POST /api/read-page
 * Read content from a web page
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const result = await zai.functions.invoke('page_reader', {
      url: url
    });

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error reading page:', error);
    return NextResponse.json(
      { error: 'Failed to read page', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
