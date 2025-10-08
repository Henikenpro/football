// components/ResultsList.tsx
import React from 'react';
import Link from 'next/link';
import { FixtureUI } from '@/types/ui';
import { formatDateISO } from '@/utils/formatters/date';

export default function ResultsList({ fixtures }: { fixtures: FixtureUI[] }) {
  if (!fixtures || fixtures.length === 0) {
    return <div className="text-sm text-slate-500">Không có trận nào.</div>;
  }

  return (
    <div className="space-y-2">
      {fixtures.map((f) => {
        const scoreAvailable = f.score?.fulltime?.home !== null && f.score?.fulltime?.away !== null;
        return (
          <div key={f.id} className="border-t border-slate-100 dark:border-slate-700 py-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">{f.league.name}</div>
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium">{f.home.name}</div>
                <div className="text-sm text-slate-500">vs</div>
                <div className="text-sm font-medium">{f.away.name}</div>
              </div>
              <div className="text-xs text-slate-400 mt-1">{formatDateISO(f.date, 'HH:mm dd/MM/yyyy')}</div>
            </div>

            <div className="text-right">
              {scoreAvailable ? (
                <Link href={`/tran/${f.id}`} className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-900 rounded">
                  <span className="font-bold">{f.score.fulltime.home} - {f.score.fulltime.away}</span>
                  <span className="text-xs text-slate-400">{f.status.short}</span>
                </Link>
              ) : (
                <div className="text-sm text-slate-500">{f.status.short}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}