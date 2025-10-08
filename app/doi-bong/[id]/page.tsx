// app/doi-bong/[id]/page.tsx
import React from 'react';
import { getTeamById, getPlayersByTeam, getFixtures } from '@/lib/apiFootball.server';
import TeamCard from '@/components/TeamCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';

export const revalidate = 60;

type Props = { params: { id: string } };

export default async function TeamPage({ params }: Props) {
  const id = Number(params.id);
  let teamData: any = null;
  let playersData: any = null;
  let recentFixtures: any[] = [];

  try {
    teamData = await getTeamById(id);
  } catch (err) {
    console.error('getTeamById error', err);
    teamData = null;
  }

  try {
    playersData = await getPlayersByTeam(id, new Date().getFullYear());
  } catch (err) {
    console.error('getPlayersByTeam error', err);
    playersData = null;
  }

  try {
    const res: any = await getFixtures({ team: id, season: new Date().getFullYear() });
    recentFixtures = (res.response || []).slice(0, 10);
  } catch (err) {
    console.error('getFixtures for team error', err);
    recentFixtures = [];
  }

  if (!teamData || !teamData.response || teamData.response.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Đội bóng</h1>
        <p className="text-sm text-slate-500">Không tìm thấy đội này.</p>
      </div>
    );
  }

  const team = teamData.response[0].team;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{team.name}</h1>
        <div className="text-sm text-slate-500">{team.country?.name ?? ''}</div>
      </div>

      <TeamCard team={{
        id: team.id,
        name: team.name,
        logo: team.logo,
        venue: team.venue?.name ?? null,
        founded: team.founded ?? null,
        country: team.country?.name ?? null,
      }} />

      <section>
        <h2 className="text-lg font-medium mb-2">Đội hình</h2>
        {playersData?.response && playersData.response.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {playersData.response.map((seasonObj: any, sIdx: number) => (
              <div key={sIdx} className="bg-white dark:bg-slate-800 rounded p-3">
                {(seasonObj.players || []).map((p: any) => (
                  <div key={p.player_id || p.id} className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded flex items-center justify-center">{p.name?.charAt(0)}</div>
                    <div>
                      <div className="font-medium">{p.player?.name ?? p.name}</div>
                      <div className="text-xs text-slate-500">{p.position ?? ''} • #{p.number ?? ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <LoadingSkeleton type="list" count={2} />
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Trận gần đây</h2>
        {recentFixtures.length === 0 ? (
          <div className="text-sm text-slate-500">Không có dữ liệu trận gần đây</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentFixtures.map((r: any) => (
              <div key={r.fixture?.id ?? Math.random()} className="bg-white dark:bg-slate-800 rounded p-3">
                <div className="text-sm text-slate-400">{r.league?.name}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="font-medium">{r.teams?.home?.name}</div>
                  <div className="font-bold">{r.goals?.home ?? '-'} - {r.goals?.away ?? '-'}</div>
                  <div className="font-medium">{r.teams?.away?.name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}