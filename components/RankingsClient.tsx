// components/RankingsClient.tsx
'use client';
import React, { useState } from 'react';
import type { LeagueDef } from '../lib/leagues';
import StandingsTableClient from './StandingsTableClient';

type StandingRow = any;
type LeagueWithStandings = { league: LeagueDef; standings: StandingRow[]; error?: any };

export default function RankingsClient({ initialLeagues, season }: { initialLeagues: LeagueWithStandings[]; season: number }) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Guard: if no leagues data, show message
  if (!initialLeagues || initialLeagues.length === 0) {
    return <div className="p-6 bg-white rounded shadow">Không có dữ liệu bảng xếp hạng.</div>;
  }

  const active = initialLeagues[activeIndex];

  return (
    <div className="bg-white rounded shadow overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto">
          {initialLeagues.map((l, idx) => (
            <button
              key={l.league.id}
              onClick={() => setActiveIndex(idx)}
              className={`text-sm px-3 py-1 rounded-full whitespace-nowrap ${
                idx === activeIndex ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {l.league.name}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500">Mùa: {season}</div>
      </div>

      <div className="p-4">
        {active.error && (
          <div className="p-3 bg-red-50 text-red-700 rounded">Lỗi tải dữ liệu cho {active.league.name}.</div>
        )}

        {!active.error && active.standings && active.standings.length === 0 && (
          <div className="p-4 text-gray-500">Không có bảng xếp hạng hiển thị cho {active.league.name}.</div>
        )}

        {!active.error && active.standings && active.standings.length > 0 && (
          <StandingsTableClient standings={active.standings} league={active.league} />
        )}
      </div>
    </div>
  );
}