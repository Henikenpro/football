// app/tran/[id]/page.tsx
import React from 'react';
import MatchCard from '@/components/MatchCard';
import { getFixtureById, getOdds } from '@/lib/apiFootball.server';
import { formatDateISO } from '@/utils/formatters/date';

export const revalidate = 10; // live-ish

type Props = { params: { id: string } };

function mapToMatchDetail(apiResponse: any) {
  // apiResponse expected structure: response: [ { ...fixture object... } ]
  const raw = apiResponse?.response?.[0];
  if (!raw) return null;

  const fixture = raw.fixture || raw;
  const teams = raw.teams || {};
  const score = raw.goals ? { fulltime: { home: raw.goals.home, away: raw.goals.away } } : raw.score;

  const detail = {
    fixture: {
      id: fixture.id,
      date: fixture.date,
      status: fixture.status || { short: 'NS' },
      venue: fixture.venue,
    },
    league: raw.league,
    teams: {
      home: teams.home,
      away: teams.away,
    },
    score,
    statistics: (raw.statistics || []).map((s: any) => {
      // map some stat items
      return {
        type: s.type,
        home: s.statistics?.find((x: any) => x.team === 'home')?.value ?? null,
        away: s.statistics?.find((x: any) => x.team === 'away')?.value ?? null,
      };
    }),
    lineups: raw.lineups || [],
    commentary: raw.events ? raw.events.map((e: any) => `${e.time.elapsed}' ${e.team?.name || ''} - ${e.player?.name || ''} (${e.type})`) : [],
  };

  return detail;
}

export default async function MatchPage({ params }: Props) {
  const id = Number(params.id);
  let apiData = null;
  try {
    apiData = await getFixtureById(id);
  } catch (err) {
    console.error('getFixtureById error', err);
    apiData = null;
  }

  const match = mapToMatchDetail(apiData);

  if (!match) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Chi tiết trận</h1>
        <p className="text-sm text-slate-500">Không tìm thấy dữ liệu cho trận này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Trận đấu</h1>
        <div className="text-sm text-slate-500">Cập nhật: {formatDateISO(new Date().toISOString(), 'HH:mm dd/MM/yyyy')}</div>
      </div>

      <MatchCard match={match} />

      {/* Thêm các phần khác: odds, commentary, chi tiết thống kê */}
      <section>
        <h2 className="text-lg font-medium mb-2">Bình luận</h2>
        {match.commentary && match.commentary.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {match.commentary.map((c: string, idx: number) => (
              <li key={idx} className="p-2 bg-white dark:bg-slate-800 rounded">{c}</li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-slate-500">Chưa có bình luận</div>
        )}
      </section>
    </div>
  );
}