import { NextResponse } from 'next/server';

const LIVE_STATUS = new Set(['1H', '2H', 'ET', 'HT', 'LIVE', 'PEN']);

export async function GET() {
  const API_KEY = process.env.API_FOOTBALL_KEY;
  if (!API_KEY) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
  }

  const url = 'https://v3.football.api-sports.io/fixtures?live=all&timezone=UTC';
  try {
    const res = await fetch(url, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      // ensure no caching so count luôn tươi
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Upstream API error', status: res.status, body: text }, { status: 502 });
    }

    const data = await res.json();
    const fixtures = Array.isArray(data.response) ? data.response : [];

    // Lọc an toàn: ưu tiên status.short, fallback dựa trên elapsed
    const liveFixtures = fixtures.filter((f: any) => {
      const short = f?.fixture?.status?.short ?? '';
      const elapsed = f?.fixture?.status?.elapsed;
      if (LIVE_STATUS.has(short)) return true;
      if (typeof elapsed === 'number' && elapsed > 0 && short !== 'FT' && short !== 'NS') return true;
      // đôi khi status.short rỗng => kiểm tra status.long
      const long = (f?.fixture?.status?.long ?? '').toString().toLowerCase();
      if (long.includes('live') || long.includes('in progress')) return true;
      return false;
    });

    // hữu ích để debug: tắt logging ở production
    // console.log('Live fixtures count:', liveFixtures.length);

    return NextResponse.json({ count: liveFixtures.length, fixtures: liveFixtures });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error', message: err.message }, { status: 500 });
  }
}