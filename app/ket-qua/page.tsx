// app/ket-qua/page.tsx
import React from 'react';
import { getFixtures } from '@/lib/apiFootball.server';
import { mapFixture } from '@/utils/convertApiFootball';
import ResultsFilters from '@/components/ResultsFilters';
import ResultsList from '@/components/ResultsList';
import SidebarStats from '@/components/SidebarStats';

export const revalidate = 60; // cache 60s

type Props = { searchParams?: any };

function getParamFromSearch(searchObj: any, key: string): string | undefined {
  if (!searchObj) return undefined;
  // If it's a URLSearchParams-like (has .get), use it
  if (typeof searchObj.get === 'function') {
    return searchObj.get(key) ?? undefined;
  }
  // Otherwise treat as plain object with string | string[] values
  const v = searchObj[key];
  if (Array.isArray(v)) return v[0];
  return v ?? undefined;
}

export default async function ResultsPage({ searchParams }: Props) {
  // default date: yesterday
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const defaultDate = yesterday.toISOString().slice(0, 10);

  // Await searchParams to satisfy Next.js dynamic API requirement.
  // If searchParams is undefined, await returns undefined and helpers handle that.
  const sp = await searchParams;

  const date = getParamFromSearch(sp, 'date') ?? defaultDate;
  const leagueStr = getParamFromSearch(sp, 'league');
  const league = leagueStr ? Number(leagueStr) : undefined;

  let fixturesRaw: any[] = [];
  try {
    const res: any = await getFixtures({ date, league });
    fixturesRaw = Array.isArray(res?.response) ? res.response : [];
  } catch (err) {
    console.error('Lỗi khi lấy fixtures:', err);
    fixturesRaw = [];
  }

  const fixtures = fixturesRaw.map((r) => mapFixture(r));

  // group by league id
  const grouped = fixtures.reduce<Record<number, { leagueName: string; fixtures: typeof fixtures }>>((acc, f) => {
    const lid = f.league.id;
    if (!acc[lid]) acc[lid] = { leagueName: f.league.name, fixtures: [] as any };
    acc[lid].fixtures.push(f);
    return acc;
  }, {});

  // compute summary stats for sidebar
  const totalMatches = fixtures.length;
  let totalGoals = 0;
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;

  for (const f of fixtures) {
    const h = f.score?.fulltime?.home;
    const a = f.score?.fulltime?.away;
    if (typeof h === 'number' && typeof a === 'number') {
      totalGoals += h + a;
      if (h > a) homeWins++;
      else if (a > h) awayWins++;
      else draws++;
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-2">Kết quả trận đấu</h1>
      <p className="text-sm text-slate-500 mb-6">Kết quả bóng đá mới nhất và kết quả trận đấu từ các giải đấu lớn</p>

      <ResultsFilters date={date} league={league} />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {totalMatches === 0 ? (
            <div className="text-slate-500">Không có kết quả cho ngày này.</div>
          ) : (
            Object.values(grouped).map((g) => (
              <section key={g.leagueName} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-medium">Kết quả {g.leagueName}</h2>
                  <div className="text-sm text-slate-400">{g.fixtures.length} trận</div>
                </div>

                <ResultsList fixtures={g.fixtures} />
              </section>
            ))
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <SidebarStats
            date={date}
            summary={{
              totalMatches,
              totalGoals,
              homeWins,
              awayWins,
              draws,
            }}
          />
        </aside>
      </div>
    </div>
  );
}