// app/api/football/route.ts
import { NextResponse } from 'next/server';

const API_BASE = 'https://v3.football.api-sports.io/fixtures';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // required yyyy-MM-dd
    const league = searchParams.get('league'); // optional

    if (!date) {
      return NextResponse.json({ error: 'Missing "date" query parameter' }, { status: 400 });
    }

    const key = process.env.API_FOOTBALL_KEY;
    if (!key) {
      return NextResponse.json({ error: 'API key not configured on server' }, { status: 500 });
    }

    const url = new URL(API_BASE);
    url.searchParams.set('date', date);
    if (league && league !== 'all') {
      url.searchParams.set('league', league);
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-apisports-key': key,
        'Accept': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    // Return the array of fixtures (data.response) directly to client
    return NextResponse.json({ fixtures: data.response });
  } catch (err) {
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}