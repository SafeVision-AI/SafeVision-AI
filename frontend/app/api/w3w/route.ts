import { NextRequest, NextResponse } from 'next/server';
import { W3W_LOOKUP_TIMEOUT_MS } from '@/lib/safety-constants';

const W3W_API_URL = 'https://api.what3words.com/v3/convert-to-3wa';

function isValidCoordinate(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.W3W_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ words: null });
  }

  const lat = Number(request.nextUrl.searchParams.get('lat'));
  const lon = Number(request.nextUrl.searchParams.get('lon'));
  if (!isValidCoordinate(lat, -90, 90) || !isValidCoordinate(lon, -180, 180)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const url = new URL(W3W_API_URL);
  url.searchParams.set('coordinates', `${lat},${lon}`);
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  url.searchParams.set('key', apiKey);

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(W3W_LOOKUP_TIMEOUT_MS) });
    if (!res.ok) {
      return NextResponse.json({ words: null }, { status: 200 });
    }
    const data = await res.json();
    return NextResponse.json({ words: typeof data?.words === 'string' ? data.words : null });
  } catch {
    return NextResponse.json({ words: null }, { status: 200 });
  }
}
