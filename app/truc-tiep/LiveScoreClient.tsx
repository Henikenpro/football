// app/livescore/LiveScoreClient.tsx
'use client';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import FixtureCard from '../../components/FixtureCard';
import { formatDateTime } from '../../lib/i18n';

type Props = { initialData: any; initialUpdated: string };

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function LiveScoreClient({ initialData, initialUpdated }: Props) {
  const { data, error } = useSWR('/api/livescore', fetcher, {
    refreshInterval: 15000,
    fallbackData: initialData,
  });

  const [updatedAt, setUpdatedAt] = useState(initialUpdated);

  useEffect(() => {
    const tick = () => {
      setUpdatedAt(formatDateTime(new Date(), { timeOnly: true, shortTime: true }));
    };

    const iv = setInterval(tick, 1000);
    tick();
    return () => clearInterval(iv);
  }, []);

  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded">Lỗi khi tải livescore.</div>;
  if (!data) return <div className="p-4">Đang tải...</div>;

  const fixtures: any[] = data.response || [];

  if (!fixtures.length) {
    return <div className="p-6 bg-white rounded shadow">Không có trận đấu trực tiếp.</div>;
  }

  const grouped = fixtures.reduce((acc: Record<string, any[]>, f: any) => {
    const lid = `${f.league?.id}_${f.league?.name}`;
    acc[lid] = acc[lid] || [];
    acc[lid].push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([leagueKey, items]) => {
        const first = items[0];
        return (
          <div key={leagueKey} className="bg-white rounded shadow overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                {first.league?.logo && (
                  <img src={first.league.logo} alt={first.league?.name} className="w-6 h-6 object-contain" />
                )}
                <div>
                  <div className="text-sm font-medium">{first.league?.name}</div>
                  <div className="text-xs text-gray-500">{first.league?.country}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Cập nhật: {updatedAt}</div>
            </div>

            <div className="divide-y">
              {items.map((f: any) => (
                <FixtureCard key={f.fixture.id} fixture={f} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}