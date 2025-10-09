// components/FixtureCard.tsx
'use client';
import React from 'react';
import { translateStatus, translateBadgeText, formatDateTime } from '../lib/i18n';

export default function FixtureCard({ fixture }: { fixture: any }) {
  const { teams, goals } = fixture;
  const status = fixture.fixture.status;
  const dateIso = fixture.fixture.date;
  const formattedDate = formatDateTime(dateIso, { shortTime: true, fullDate: false });

  const statusLabel = translateStatus(status?.long, status?.short);
  const badge = translateBadgeText(status?.short, status?.long);

  const elapsed = status?.elapsed ?? null;
  const liveShort = (status?.short || '').toLowerCase();
  const live = liveShort === 'live' || liveShort === '1h' || liveShort === '2h' || liveShort === 'ht';

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {teams.home?.logo && <img src={teams.home.logo} alt={teams.home.name} className="w-8 h-8 object-contain" />}
            <div className="text-sm font-medium truncate">{teams.home?.name}</div>
          </div>

          <div className="flex flex-col items-center mx-4">
            <div className="text-lg font-semibold">
              {goals.home ?? '-'} <span className="text-gray-400">:</span> {goals.away ?? '-'}
            </div>
            <div className="text-xs text-gray-500">
              {live ? `${elapsed ?? ''}' • ${statusLabel}` : formattedDate}
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            {teams.away?.logo && <img src={teams.away.logo} alt={teams.away.name} className="w-8 h-8 object-contain" />}
            <div className="text-sm font-medium truncate">{teams.away?.name}</div>
          </div>
        </div>
      </div>

      <div className="min-w-[120px] text-right">
        <div
          className={`inline-block px-2 py-1 text-xs rounded ${
            live ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {badge}
        </div>
        <div className="text-xs text-gray-400 mt-1">{fixture.league?.name}</div>
      </div>
    </div>
  );
}