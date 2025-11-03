// app/api/fixture-stats/route.ts
import { NextResponse } from 'next/server';
import { mapStatistics } from '../../../lib/stats';

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

    const apiRes = await fetch(`${BASE_URL}/fixtures/statistics?fixture=${encodeURIComponent(fixtureId)}`, {
      headers: {
        'x-apisports-key': API_KEY,
        Accept: 'application/json',
      },
      next: { revalidate: 30 },
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      return NextResponse.json({ error: 'Upstream error', details: text }, { status: apiRes.status });
    }

    const json = await apiRes.json();
    // Map statistics to simple structure
    const mapped = mapStatistics(json.response ?? json);
    return NextResponse.json({ raw: json, mapped });
  } catch (err: any) {
    console.error('fixture-stats error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}