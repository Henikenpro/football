// components/TeamCard.tsx
'use client';
import Link from 'next/link';
import React from 'react';

export type TeamUI = {
  id: number;
  name: string;
  logo?: string | null;
  venue?: string | null;
  founded?: number | null;
  country?: string | null;
};

export default function TeamCard({ team }: { team: TeamUI }) {
  return (
    <Link href={`/doi-bong/${team.id}`} className="block bg-white dark:bg-slate-800 rounded-lg p-4 shadow hover:shadow-md transition">
      <div className="flex items-center gap-4">
        <img src={team.logo || '/favicon.ico'} alt={team.name} className="w-16 h-16 object-contain" />
        <div className="flex-1">
          <div className="font-semibold">{team.name}</div>
          <div className="text-sm text-slate-500">{team.country ?? ''}</div>
          {team.venue && <div className="text-xs text-slate-400 mt-1">Sân: {team.venue}</div>}
        </div>
        <div className="text-sm text-slate-400">{team.founded ? `Thành lập ${team.founded}` : ''}</div>
      </div>
    </Link>
  );
}