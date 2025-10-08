// components/FixtureCard.tsx
import Link from 'next/link';
import React from 'react';
import { FixtureUI } from '@/types/ui';
import { formatDateISO } from '@/utils/formatters/date';

type Props = {
  fixture: FixtureUI;
};

export default function FixtureCard({ fixture }: Props) {
  const isFinished = fixture.status.short === 'FT' || fixture.status.short === 'HT' || fixture.status.short === 'AET';
  const scoreAvailable = fixture.score?.fulltime?.home !== null && fixture.score?.fulltime?.away !== null;

  return (
    <Link href={`/tran/${fixture.id}`} className="block bg-white dark:bg-slate-800 shadow-sm rounded-lg p-3 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500">{fixture.league.name}</div>
        </div>
        <div className="text-xs text-slate-400">{formatDateISO(fixture.date, 'HH:mm dd/MM')}</div>
      </div>

      <div className="mt-3 grid grid-cols-3 items-center">
        <div className="text-center">
          <div className="text-sm font-medium">{fixture.home.name}</div>
        </div>

        <div className="text-center">
          {scoreAvailable ? (
            <div className="text-lg font-bold">
              {fixture.score.fulltime.home} - {fixture.score.fulltime.away}
            </div>
          ) : (
            <div className="text-sm text-slate-500">{fixture.status.short === 'NS' ? 'Sắp diễn ra' : fixture.status.short}</div>
          )}
        </div>

        <div className="text-center">
          <div className="text-sm font-medium">{fixture.away.name}</div>
        </div>
      </div>
    </Link>
  );
}