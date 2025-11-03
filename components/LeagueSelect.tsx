'use client';
import React from 'react';

const leagues = [
  { id: 'all', name: 'Tất cả các giải đấu' },
  { id: 39, name: 'Ngoại hạng Anh' },
  { id: 140, name: 'La Liga' },
  { id: 78, name: 'Bundesliga' },
];

export default function LeagueSelector({
  value,
  onChange,
}: {
  value: number | string | 'all';
  onChange: (v: number | 'all') => void;
}) {
  return (
    <select
      value={String(value)}
      onChange={(e) =>
        onChange(e.target.value === 'all' ? 'all' : Number(e.target.value))
      }
      className="border border-gray-300 rounded-lg p-2 text-sm"
    >
      {leagues.map((l) => (
        <option key={String(l.id)} value={String(l.id)}>
          {l.name}
        </option>
      ))}
    </select>
  );
}