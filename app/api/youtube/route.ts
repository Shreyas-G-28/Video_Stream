import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_BASE_URL = 'https://youtube.googleapis.com/youtube/v3';

export async function GET(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'YouTube API key is not configured on server' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint'); // 'videos', 'search', or 'commentThreads'

  if (!endpoint || !['videos', 'search', 'commentThreads'].includes(endpoint)) {
    return NextResponse.json({ error: 'Invalid or missing endpoint parameter' }, { status: 400 });
  }

  // Forward query params to YouTube API, appending server-side key
  const forwardParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== 'endpoint') {
      forwardParams.append(key, value);
    }
  });
  forwardParams.set('key', apiKey);

  try {
    const targetUrl = `${YOUTUBE_BASE_URL}/${endpoint}?${forwardParams.toString()}`;
    const response = await fetch(targetUrl, {
      next: { revalidate: 60 }, // Cache responses for 60 seconds
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Upstream YouTube API error', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Server proxy YouTube request failed:', err);
    return NextResponse.json({ error: 'Internal server proxy error' }, { status: 500 });
  }
}
