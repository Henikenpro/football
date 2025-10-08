// app/api/predictions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { calculate } from '@/lib/predictionEngine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { homeId, awayId, leagueId, nMatches } = body || {};

    if (!homeId || !awayId) {
      return NextResponse.json({ error: 'Thiếu homeId hoặc awayId' }, { status: 400 });
    }

    const n = Number(nMatches || 10);

    const result = await calculate({ homeId: Number(homeId), awayId: Number(awayId), leagueId: leagueId ? Number(leagueId) : undefined, nMatches: n });

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Prediction API error', err);
    return NextResponse.json({ error: 'Lỗi server khi tính dự đoán' }, { status: 500 });
  }
}