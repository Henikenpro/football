// app/api/livescore/route.ts
import { NextResponse } from 'next/server';
import footballFetch from '../../../lib/footballClient'; // điều chỉnh tương đối nếu lib ở vị trí khác

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const league = url.searchParams.get('league') ?? undefined;
    const date = url.searchParams.get('date') ?? undefined;

    const params: Record<string, any> = { live: 'all' };
    if (league) params.league = league;
    if (date) params.date = date;

    const data = await footballFetch('/fixtures', params);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=5, stale-while-revalidate=10',
      },
    });
  } catch (err: any) {
    console.error('/api/livescore error', err?.body ?? err?.message ?? err);
    return NextResponse.json(
      { error: err?.message ?? 'Unknown error', body: err?.body ?? null },
      { status: err?.status ?? 500 }
    );
  }
}