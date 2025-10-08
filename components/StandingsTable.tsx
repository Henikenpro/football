// components/StandingsTable.tsx
'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export type StandingRowUI = {
  position: number;
  team: { id: number; name: string; logo?: string | null };
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form?: string;
};

export default function StandingsTable({ rows }: { rows: StandingRowUI[] }) {
  const [sortKey, setSortKey] = useState<'position' | 'points' | 'goalDiff'>('position');
  const [asc, setAsc] = useState(true);

  const sorted = [...rows].sort((a, b) => {
    const aVal = sortKey === 'position' ? a.position : sortKey === 'points' ? a.points : a.goalDiff;
    const bVal = sortKey === 'position' ? b.position : sortKey === 'points' ? b.points : b.goalDiff;
    return asc ? aVal - bVal : bVal - aVal;
  });

  const toggle = (key: typeof sortKey) => {
    if (key === sortKey) setAsc(!asc);
    else {
      setSortKey(key);
      setAsc(true);
    }
  };

  return (
    <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded shadow">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Đội</th>
            <th className="px-3 py-2 cursor-pointer" onClick={() => toggle('points')}>Điểm {sortKey === 'points' ? (asc ? '▲' : '▼') : ''}</th>
            <th className="px-3 py-2">Th</th>
            <th className="px-3 py-2">H</th>
            <th className="px-3 py-2">B</th>
            <th className="px-3 py-2 cursor-pointer" onClick={() => toggle('goalDiff')}>HS {sortKey === 'goalDiff' ? (asc ? '▲' : '▼') : ''}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.team.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
              <td className="px-3 py-2">{r.position}</td>
              <td className="px-3 py-2">
                <Link href={`/doi-bong/${r.team.id}`} className="flex items-center gap-2">
                  <img src={r.team.logo || '/favicon.ico'} alt={r.team.name} className="w-6 h-6 object-contain" />
                  <span>{r.team.name}</span>
                </Link>
              </td>
              <td className="px-3 py-2 font-semibold">{r.points}</td>
              <td className="px-3 py-2">{r.wins}</td>
              <td className="px-3 py-2">{r.draws}</td>
              <td className="px-3 py-2">{r.losses}</td>
              <td className="px-3 py-2">{r.goalDiff}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-4 text-center text-slate-500">Chưa có dữ liệu</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}