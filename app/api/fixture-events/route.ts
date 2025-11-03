// app/api/fixture-events/route.ts
import { NextResponse } from 'next/server';

const API_KEY = process.env.API_FOOTBALL_KEY;
const API_HOST = process.env.API_FOOTBALL_HOST || 'v3.football.api-sports.io';
const BASE_URL = `https://${API_HOST}`;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const fixtureId = url.searchParams.get('fixtureId');
    if (!fixtureId) {
      return NextResponse.json({ error: 'fixtureId required' }, { status: 400 });
    }
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const apiRes = await fetch(`${BASE_URL}/fixtures/events?fixture=${encodeURIComponent(fixtureId)}`, {
      headers: {
        'x-apisports-key': API_KEY,
        Accept: 'application/json',
      },
      // short caching on server
      next: { revalidate: 15 },
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      return NextResponse.json({ error: 'Upstream error', details: text }, { status: apiRes.status });
    }

    const json = await apiRes.json();
    return NextResponse.json(json);
  } catch (err: any) {
    console.error('fixture-events error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}