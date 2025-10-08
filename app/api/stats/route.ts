// app/api/stats/route.ts
import { NextResponse } from 'next/server';
import { getStats } from '@/lib/apiFootball';

export async function GET() {
  try {
    const stats = await getStats();

    // Cache side: trả header cache-control nếu muốn CDN cache
    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}