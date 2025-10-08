// components/ResultsFilters.tsx
'use client';
import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import LeagueSelector from './LeagueSelector';
import DatePicker from './DatePicker';

export default function ResultsFilters({ date, league }: { date?: string; league?: number | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setQuery = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(Array.from(searchParams?.entries() ?? []));
    Object.entries(params).forEach(([k, v]) => {
      if (v == null || v === '') sp.delete(k);
      else sp.set(k, v);
    });
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const onQuick = (type: 'today' | 'yesterday' | 'thisweek' | 'lastweek') => {
    const now = new Date();
    let d = new Date();
    if (type === 'today') d = now;
    else if (type === 'yesterday') d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    else if (type === 'thisweek') {
      // set to monday
      const diff = now.getDate() - now.getDay() + 1;
      d = new Date(now.setDate(diff));
    } else if (type === 'lastweek') {
      const diff = now.getDate() - now.getDay() - 6;
      d = new Date(now.setDate(diff));
    }
    const dateStr = d.toISOString().slice(0, 10);
    setQuery({ date: dateStr });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-slate-500 mr-2">Khoảng thời gian</span>
          <div className="flex gap-2">
            <button onClick={() => onQuick('today')} className="px-3 py-1 rounded bg-green-100 text-sm text-green-700">Hôm nay</button>
            <button onClick={() => onQuick('yesterday')} className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-700 text-sm">Hôm qua</button>
            <button onClick={() => onQuick('thisweek')} className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-700 text-sm">Tuần này</button>
            <button onClick={() => onQuick('lastweek')} className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-700 text-sm">Tuần trước</button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DatePicker
            value={date}
            onChange={(d) => setQuery({ date: d })}
          />
          <LeagueSelector value={league} includeAll />
        </div>
      </div>
    </div>
  );
}