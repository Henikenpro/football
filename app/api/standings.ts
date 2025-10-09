// pages/api/standings.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import footballFetch from '../../lib/footballClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { league, season } = req.query;
    const params: Record<string, any> = {};
    if (league) params.league = league;
    if (season) params.season = season;
    const data = await footballFetch('/standings', params);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).json(data);
  } catch (err: any) {
    console.error('API /api/standings error', err?.body ?? err?.message ?? err);
    res.status(err?.status || 500).json({ error: err?.message ?? 'Unknown error', body: err?.body ?? null });
  }
}