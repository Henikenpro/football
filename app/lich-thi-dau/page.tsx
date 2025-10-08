import React from 'react';
import { getFixtures } from '@/lib/apiFootball.server';
import { mapFixture } from '@/utils/convertApiFootball';
import FixtureCard from '@/components/FixtureCard';
import DatePicker from '@/components/DatePicker';
import LeagueSelector from '@/components/LeagueSelector';
import LoadingSkeleton from '@/components/LoadingSkeleton';

type Props = { searchParams?: { date?: string; league?: string } };

export const revalidate = 30;

export default async function FixturesPage({ searchParams }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const date = searchParams?.date ?? today;
  const league = searchParams?.league ? Number(searchParams.league) : undefined;

  let fixtures = [];
  try {
    const res: any = await getFixtures({ date, league });
    fixtures = (res.response || []).map((r: any) => mapFixture(r));
  } catch (e) {
    console.error('Fixtures fetch error', e);
    fixtures = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Lịch thi đấu</h1>
          <p className="text-sm text-slate-500">Chọn ngày và giải để xem lịch</p>
        </div>

        <div className="flex items-center gap-3">
          {/* DatePicker and LeagueSelector are client components that update URL query */}
          {/* They rely on next/navigation router to push query params */}
          {/* Provide initial defaults via searchParams */}
          {/* DatePicker */}
          {/* We wrap in a client-only block by direct import (both components are "use client") */}
          <DatePicker value={date} onChange={(d) => {
            // client navigation handled inside DatePicker? we need to navigate, but DatePicker is generic
            // We'll use a small script tag to navigate via URL since this is server component
            // Instead: render DatePicker client will handle using next/navigation via window.location
            if (typeof window !== 'undefined') {
              const sp = new URLSearchParams(location.search);
              sp.set('date', d);
              location.search = sp.toString();
            }
          }} />
          <LeagueSelector value={league} includeAll />
        </div>
      </div>

      <section>
        {fixtures.length === 0 ? (
          <div>
            <div className="text-sm text-slate-500 mb-3">Không tìm thấy trận cho ngày này.</div>
            <LoadingSkeleton type="list" count={3} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fixtures.map((f: any) => (
              <FixtureCard key={f.id} fixture={f} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}