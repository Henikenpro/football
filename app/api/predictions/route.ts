// app/api/predictions/route.ts
import { NextResponse } from 'next/server';

const API_BASE = 'https://v3.football.api-sports.io/predictions';
const API_KEY = process.env.API_FOOTBALL_KEY; // đặt vào .env.local: API_FOOTBALL_KEY=your_key_here

export async function GET(request: Request) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'Missing API key (set API_FOOTBALL_KEY in env)' }, { status: 500 });
  }

  try {
    // Build upstream URL with the incoming query params (fixture, league, season, etc.)
    const incoming = new URL(request.url);
    const upstream = new URL(API_BASE);

    // copy all search params from incoming request
    for (const [k, v] of incoming.searchParams) {
      upstream.searchParams.append(k, v);
    }

    const res = await fetch(upstream.toString(), {
      method: 'GET',
      headers: {
        'x-apisports-key': API_KEY,
        Accept: 'application/json',
      },
      // don't forward credentials by default
    });

    // forward status and body
    const body = await res.text(); // text first to safely forward raw JSON or errors

    // propagate upstream status
    const status = res.status ?? 200;

    // Basic caching: set s-maxage so Next.js can cache in edge (optional)
    const headers = {
      'content-type': res.headers.get('content-type') ?? 'application/json',
      // s-maxage for CDN/edge caches, stale-while-revalidate if you want
      'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
    };

    return new NextResponse(body, { status, headers });
  } catch (err) {
    console.error('Proxy /api/predictions error', err);
    return NextResponse.json({ error: 'Internal proxy error' }, { status: 500 });
  }
}