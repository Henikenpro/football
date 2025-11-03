// components/FixtureCard.tsx
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { translateStatus, translateBadgeText, formatDateTime } from '../lib/i18n';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import LiveMatchDetails from './LiveMatchDetails';
 

export default function FixtureCard({ fixture }: { fixture: any }) {
  const { teams, goals } = fixture;
  const status = fixture.fixture.status;
  const dateIso = fixture.fixture.date;
  const formattedDate = formatDateTime(dateIso, { shortTime: true, fullDate: false });

  const statusLabel = translateStatus(status?.long, status?.short);
  const badge = translateBadgeText(status?.short, status?.long);

  const elapsedRaw = status?.elapsed ?? null;
  const elapsedNum = typeof elapsedRaw === 'number' ? elapsedRaw : (elapsedRaw ? Number(elapsedRaw) : null);
  const liveShort = (status?.short || '').toLowerCase();
  const live = ['live', '1h', '2h', 'ht'].includes(liveShort);

  // flash on goal
  const prevGoals = useRef({ home: goals.home, away: goals.away });
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (goals.home !== prevGoals.current.home || goals.away !== prevGoals.current.away) {
      setFlash(true);
      setTimeout(() => setFlash(false), 1000);
      prevGoals.current = { home: goals.home, away: goals.away };
    }
  }, [goals]);

  // Modal
  const [open, setOpen] = useState(false);

  function formatElapsedForDisplay(elapsed?: number | null, statusShort?: string) {
    if (!elapsed && elapsed !== 0) {
      if (statusShort === 'ht') return 'HT';
      if (statusShort === 'ft') return 'FT';
      return '';
    }
    const e = Number(elapsed);
    if (isNaN(e)) return '';
    // Regular time up to 90
    if (e <= 90) return `${e}'`;
    // Stoppage + extra time (90+X)
    if (e > 90 && e <= 120) return `90+${e - 90}'`;
    // If extra time beyond 120 (rare), show 120+Y
    if (e > 120) return `120+${e - 120}'`;
    return `${e}'`;
  }

  const displayMinute = live ? `${formatElapsedForDisplay(elapsedNum, status?.short)} • ${statusLabel}` : formattedDate;

  return (
    <>
      <motion.div
        layout
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(true); }}
        className={clsx(
          'px-3 py-3 sm:px-4 sm:py-4 transition-all duration-300 flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 cursor-pointer',
          'bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800',
          'hover:bg-gray-50 dark:hover:bg-gray-800',
          flash && 'animate-pulse bg-green-50 dark:bg-green-900/40'
        )}
      >
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          {/* Home */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {teams.home?.logo && (
              <img
                src={teams.home.logo}
                alt={teams.home.name}
                className="hidden sm:block w-7 h-7 sm:w-8 sm:h-8 object-contain"
              />
            )}
            <div className="text-[13px] sm:text-base font-medium truncate text-gray-800 dark:text-gray-100 max-w-[120px] sm:max-w-none">
              {teams.home?.name}
            </div>
          </div>

          {/* Score + minute */}
          <div className="flex flex-col items-center text-center flex-shrink-0 mx-1 sm:mx-2 w-[60px] sm:w-auto">
            <div
              className={clsx(
                'font-teko text-lg sm:text-xl font-semibold leading-none',
                flash ? 'text-green-600' : 'text-gray-900 dark:text-white'
              )}
            >
              {goals.home ?? '-'} <span className="text-gray-400">:</span> {goals.away ?? '-'}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              {displayMinute}
            </div>
          </div>

          {/* Away */}
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-end sm:justify-start">
            <div className="text-[13px] sm:text-base font-medium truncate text-gray-800 dark:text-gray-100 text-right max-w-[120px] sm:max-w-none">
              {teams.away?.name}
            </div>
            {teams.away?.logo && (
              <img
                src={teams.away.logo}
                alt={teams.away.name}
                className="hidden sm:block w-7 h-7 sm:w-8 sm:h-8 object-contain"
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Modal / Panel details */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Trận đấu</div>
                <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {teams.home?.name} vs {teams.away?.name}
                </div>
                <div className="text-xs text-gray-500">{formatDateTime(dateIso, { shortTime: true, fullDate: true })}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="text-sm py-1 px-3 rounded bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-200"
                >
                  Đóng
                </button>
              </div>
            </div>

            <LiveMatchDetails fixtureId={fixture.fixture.id} initialFixture={fixture} />
          </div>
        </div>
      )}
    </>
  );
}