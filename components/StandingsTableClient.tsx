// components/StandingsTableClient.tsx
'use client';
import React from 'react';
import type { LeagueDef } from '../lib/leagues';

function parseFormString(form: string | null | undefined): string[] {
  if (!form) return [];
  // form might be "W,D,L" or "WDLWW" or "W,W,D"
  const trimmed = form.trim();
  if (trimmed.includes(',')) {
    return trimmed.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);
  }
  // else take last characters (most APIs give recent first or last? We'll take rightmost as most recent)
  // Some API gives most recent first (left to right). We'll prefer left-to-right and take first 3.
  return trimmed.split('').map(c => c.trim()).filter(Boolean).slice(0, 3);
}

function resultToVietnameseChar(r: string) {
  const c = (r || '').toLowerCase();
  if (c === 'w' || c === 'win' ) return 'T'; // Thắng
  if (c === 'd' || c === 'draw' || c === 'h') return 'H'; // Hòa
  if (c === 'l' || c === 'loss' || c === 'b') return 'B'; // Bại (B)
  return '?';
}

function badgeClassForResult(r: string) {
  const char = resultToVietnameseChar(r);
  if (char === 'T') return 'bg-green-100 text-green-800';
  if (char === 'H') return 'bg-gray-100 text-gray-700';
  if (char === 'B') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-700';
}

export default function StandingsTableClient({ standings, league }: { standings: any[]; league: LeagueDef }) {
  // standings is array of rows from API-Football
  if (!standings || standings.length === 0) {
    return <div className="p-6 text-gray-500">Không có dữ liệu.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-12 px-4 py-2 text-left">VT</th>
            <th className="px-4 py-2 text-left">Đội</th>
            <th className="w-16 px-4 py-2 text-center">Trận</th>
            <th className="w-12 px-4 py-2 text-center">T</th>
            <th className="w-12 px-4 py-2 text-center">H</th>
            <th className="w-12 px-4 py-2 text-center">B</th>
            <th className="w-36 px-4 py-2 text-center">3 trận gần nhất</th>
            <th className="w-20 px-4 py-2 text-center">Điểm</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row: any, idx: number) => {
            const formArr = parseFormString(row.form);
            // Count wins/draws/losses from overall (row.all) or from form snippet
            const played = row.all?.played ?? row.played ?? '-';
            const win = row.all?.win ?? row.win ?? '-';
            const draw = row.all?.draw ?? row.draw ?? '-';
            const lose = row.all?.lose ?? row.lose ?? '-';
            const points = row.points ?? row.points ?? '-';

            return (
              <tr key={row.team?.id ?? idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3">{row.rank}</td>
                <td className="px-4 py-3 flex items-center gap-3">
                  {row.team?.logo && <img src={row.team.logo} alt={row.team?.name} className="w-6 h-6 object-contain" />}
                  <div className="truncate">{row.team?.name}</div>
                </td>
                <td className="px-4 py-3 text-center">{played}</td>
                <td className="px-4 py-3 text-center">{win}</td>
                <td className="px-4 py-3 text-center">{draw}</td>
                <td className="px-4 py-3 text-center">{lose}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {formArr.length === 0 && <div className="text-xs text-gray-400">—</div>}
                    {formArr.map((r, i) => {
                      const ch = resultToVietnameseChar(r);
                      const cls = badgeClassForResult(r);
                      return (
                        <div key={i} className={`${cls} px-2 py-1 rounded text-xs font-semibold`} title={r}>
                          {ch}
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-semibold">{points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}