'use client';
import React from 'react';
import { format, parseISO, isValid } from 'date-fns';

type TeamLike = string | { name: string; logo?: string };

function teamName(t: TeamLike) {
  return typeof t === 'string' ? t : t.name;
}
function teamLogo(t: TeamLike) {
  return typeof t === 'string' ? undefined : t.logo;
}

export default function MatchCard({
  league,
  home,
  away,
  time, // can be ISO datetime or simple 'HH:mm' string
  onToggleOdds,
  fixtureId,
  isOddsOpen,
}: {
  league: string;
  home: TeamLike;
  away: TeamLike;
  time: string;
  onToggleOdds?: (id: number) => void;
  fixtureId?: number;
  isOddsOpen?: boolean;
}) {
  // if time looks like ISO, format to HH:mm
  let timeLabel = time;
  try {
    const parsed = parseISO(time);
    if (isValid(parsed) && time.includes('T')) {
      timeLabel = format(parsed, 'HH:mm');
    }
  } catch {
    // keep time as-is
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
      <div className="text-sm text-gray-500 mb-2">{league}</div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
              {teamLogo(home) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={teamLogo(home)} alt={teamName(home)} className="w-full h-full object-contain" />
              ) : (
                <span className="text-sm font-medium text-gray-600">{teamName(home).slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="font-semibold text-sm">{teamName(home)}</div>
          </div>

          <div className="mx-2 text-xs text-gray-400">vs</div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
              {teamLogo(away) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={teamLogo(away)} alt={teamName(away)} className="w-full h-full object-contain" />
              ) : (
                <span className="text-sm font-medium text-gray-600">{teamName(away).slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="text-sm">{teamName(away)}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-blue-600 font-medium">{timeLabel}</div>
          {onToggleOdds && fixtureId !== undefined && (
            <button
              onClick={() => onToggleOdds(fixtureId)}
              className={`mt-2 inline-flex items-center gap-2 px-3 py-1 text-sm rounded-md ${
                isOddsOpen ? 'bg-gray-100 text-gray-800' : 'bg-green-600 text-white'
              }`}
              aria-expanded={isOddsOpen}
              aria-controls={fixtureId ? `odds-${fixtureId}` : undefined}
            >
              {isOddsOpen ? 'Thu gọn' : 'Xem kèo'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}