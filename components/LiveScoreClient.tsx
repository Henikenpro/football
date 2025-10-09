// components/LiveScoreClient.tsx
'use client';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { formatDateTime, translateStatus } from '../lib/i18n';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function LiveScoreClient({ initialData, initialUpdated }: { initialData: any; initialUpdated: string }) {
  const { data, error } = useSWR('/api/livescore', fetcher, { refreshInterval: 15000, fallbackData: initialData });

  const [updatedAt, setUpdatedAt] = useState(initialUpdated);

  useEffect(() => {
    const tick = () => setUpdatedAt(formatDateTime(new Date(), { timeOnly: true, shortTime: true }));
    const iv = setInterval(tick, 1000);
    tick();
    return () => clearInterval(iv);
  }, []);

  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded">Lỗi khi tải livescore.</div>;
  if (!data) return <div className="p-4">Đang tải...</div>;

  const fixtures: any[] = data.response ?? [];
  if (fixtures.length === 0) {
    return <div className="p-4 bg-white rounded shadow">Không có trận trực tiếp.</div>;
  }

  // Group by league
  const grouped = fixtures.reduce((acc: Record<string, any[]>, f: any) => {
    const key = `${f.league?.id}_${f.league?.name}`;
    (acc[key] ||= []).push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([k, items]) => {
        const first = items[0];
        return (
          <div key={k} className="bg-white rounded shadow overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                {first.league?.logo && <img src={first.league.logo} alt={first.league.name} className="w-6 h-6 object-contain" />}
                <div>
                  <div className="text-sm font-medium">{first.league?.name}</div>
                  <div className="text-xs text-gray-500">{first.league?.country}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Cập nhật: {updatedAt}</div>
            </div>

            <div className="divide-y">
              {items.map((f: any) => {
                const home = f.teams.home;
                const away = f.teams.away;
                const goals = f.goals;
                const status = f.fixture.status;
                const badge = translateStatus(status?.long, status?.short);
                const liveShort = (status?.short || '').toLowerCase();
                const live = liveShort === 'live' || liveShort === '1h' || liveShort === '2h' || liveShort === 'ht';
                const formattedDate = formatDateTime(f.fixture.date, { shortTime: true });
                return (
                  <div key={f.fixture.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {home.logo && <img src={home.logo} alt={home.name} className="w-8 h-8 object-contain" />}
                          <div className="text-sm font-medium truncate">{home.name}</div>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="text-lg font-semibold">
                            {goals.home ?? '-'} <span className="text-gray-400">:</span> {goals.away ?? '-'}
                          </div>
                          <div className="text-xs text-gray-500">{live ? `${status.elapsed ?? ''}' • ${badge}` : formattedDate}</div>
                        </div>

                        <div className="flex items-center gap-3 min-w-0">
                          {away.logo && <img src={away.logo} alt={away.name} className="w-8 h-8 object-contain" />}
                          <div className="text-sm font-medium truncate">{away.name}</div>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-[120px] text-right">
                      <div className={`inline-block px-2 py-1 text-xs rounded ${live ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {live ? 'Trực tiếp' : badge || 'Chưa bắt đầu'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{f.league?.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}