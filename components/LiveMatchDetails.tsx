// components/LiveMatchDetails.tsx
'use client';
import React, { useEffect, useState } from 'react';

type Props = {
  fixtureId: number;
  initialFixture?: any;
};

function smallTimeFormat(minute: number | null) {
  if (minute === null || minute === undefined) return '';
  const m = Number(minute);
  if (isNaN(m)) return '';
  if (m <= 90) return `${m}'`;
  if (m > 90 && m <= 120) return `90+${m - 90}'`;
  if (m > 120) return `120+${m - 120}'`;
  return `${m}'`;
}

/* Simple inline SVG icons */
const IconGoal = ({ className = 'w-5 h-5 text-green-600' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
  </svg>
);

const IconYellowCard = ({ className = 'w-5 h-5 text-yellow-500' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="3" width="10" height="18" rx="1" />
  </svg>
);

const IconRedCard = ({ className = 'w-5 h-5 text-red-600' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="3" width="10" height="18" rx="1" />
  </svg>
);

const IconSub = ({ className = 'w-5 h-5 text-sky-500' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 8h12M14 4l4 4-4 4" />
    <path d="M20 16H8M10 12l-4 4 4 4" />
  </svg>
);

export default function LiveMatchDetails({ fixtureId, initialFixture }: Props) {
  const [events, setEvents] = useState<any[] | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchEvents() {
      setLoadingEvents(true);
      try {
        const res = await fetch(`/api/fixture-events?fixtureId=${fixtureId}`);
        if (!res.ok) throw new Error('Không thể lấy sự kiện');
        const json = await res.json();
        if (!mounted) return;
        setEvents(json.response || []);
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(e.message || 'Lỗi tải sự kiện');
      } finally {
        if (mounted) setLoadingEvents(false);
      }
    }

    fetchEvents();

    return () => { mounted = false; };
  }, [fixtureId]);

  if (error) {
    return <div className="p-4 text-red-700 bg-red-50 rounded">Lỗi: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Score & basic - responsive grid so small screens don't break */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <div className="flex items-center gap-3 min-w-0 justify-start">
          {initialFixture?.teams?.home?.logo && (
            <img
              src={initialFixture.teams.home.logo}
              alt=""
              className="w-6 h-6 sm:w-8 sm:h-8 object-contain flex-shrink-0"
            />
          )}
          <div className="text-sm sm:text-lg font-semibold truncate min-w-0">
            {initialFixture?.teams?.home?.name}
          </div>
        </div>

        <div className="flex items-center justify-center text-center">
          <div className="text-xl sm:text-2xl font-teko font-bold">
            <span className="inline-block mr-1">{initialFixture?.goals?.home ?? '-'}</span>
            <span className="text-gray-400">:</span>
            <span className="inline-block ml-1">{initialFixture?.goals?.away ?? '-'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 min-w-0 justify-end">
          <div className="text-sm sm:text-lg font-semibold text-right truncate min-w-0">
            {initialFixture?.teams?.away?.name}
          </div>
          {initialFixture?.teams?.away?.logo && (
            <img
              src={initialFixture.teams.away.logo}
              alt=""
              className="w-6 h-6 sm:w-8 sm:h-8 object-contain flex-shrink-0"
            />
          )}
        </div>
      </div>

      {/* Timeline + events */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Timeline sự kiện</h3>
        <div className="bg-slate-50 dark:bg-gray-800 rounded p-3 space-y-2 max-h-[60vh] sm:max-h-72 overflow-auto">
          {loadingEvents && <div className="text-sm text-gray-500">Đang tải sự kiện...</div>}
          {!loadingEvents && (!events || events.length === 0) && (
            <div className="text-sm text-gray-500">Chưa có sự kiện.</div>
          )}
          {!loadingEvents && events && events.length > 0 && (
            <ul className="space-y-2">
              {events.map((ev: any, idx: number) => {
                const minute = ev.time?.elapsed ?? ev.time?.extra ?? null;
                const displayMinute = smallTimeFormat(minute);

                const rawType = (ev.detail || ev.type || '').toString().toLowerCase();
                let label = ev.detail || ev.type || '';
                let Icon: React.FC<any> | null = null;

                // Determine type and icon & Vietnamese labels
                if (rawType.includes('goal') || (ev.type && ev.type.toLowerCase() === 'goal')) {
                  Icon = IconGoal;
                  label = `Bàn thắng${ev.player?.name ? ` • ${ev.player.name}` : ''}`;
                  if (ev.assist?.name) label += ` (Kiến tạo: ${ev.assist.name})`;
                } else if (rawType.includes('yellow')) {
                  Icon = IconYellowCard;
                  label = `Thẻ vàng${ev.player?.name ? ` • ${ev.player.name}` : ''}`;
                } else if (rawType.includes('red')) {
                  Icon = IconRedCard;
                  label = `Thẻ đỏ${ev.player?.name ? ` • ${ev.player.name}` : ''}`;
                } else if (rawType.includes('sub') || rawType.includes('thay')) {
                  Icon = IconSub;
                  label = `Thay người`;
                  // show người vào / người ra nếu có
                  const playerOut = ev.player?.name ?? null;
                  const playerIn = ev.assist?.name ?? null;
                  if (playerIn || playerOut) {
                    const parts: string[] = [];
                    if (playerIn) parts.push(`Người vào: ${playerIn}`);
                    if (playerOut) parts.push(`Người ra: ${playerOut}`);
                    label += ` • ${parts.join(' • ')}`;
                  }
                } else {
                  Icon = null;
                  label = ev.detail || ev.type || '';
                }

                const teamName =
                  ev.team?.name ??
                  (ev.team?.id === initialFixture?.teams?.home?.id ? initialFixture.teams.home.name : initialFixture.teams.away.name);

                return (
                  <li key={idx} className="grid grid-cols-12 gap-3 items-start">
                    <div className="col-span-2 text-xs text-slate-500 min-w-0 break-words">{displayMinute}</div>

                    {/* Icon - hidden on very small screens to save space */}
                    {Icon ? (
                      <div className="col-span-1 hidden sm:flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <Icon />
                        </div>
                      </div>
                    ) : (
                      <div className="col-span-1 hidden sm:block" />
                    )}

                    <div className="col-span-9 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{teamName}</div>
                          <div className="text-sm text-slate-700 dark:text-slate-200 break-words whitespace-normal">{label}</div>
                        </div>
                        {/* Assist or extra info - moves under on small screens due to grid */}
                        <div className="text-xs text-slate-400 hidden sm:block min-w-0">
                          {ev.assist && ev.assist?.name && ev.type?.toLowerCase().includes('goal') ? `Assist: ${ev.assist.name}` : ''}
                        </div>
                      </div>

                    
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}