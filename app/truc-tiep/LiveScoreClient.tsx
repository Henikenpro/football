// app/livescore/LiveScoreClient.tsx
'use client';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import FixtureCard from '../../components/FixtureCard';
import { formatDateTime } from '../../lib/i18n';
import { motion } from 'framer-motion';

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

  if (error)
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-xl text-center shadow">
        ❌ Lỗi khi tải livescore.
      </div>
    );

  if (!data)
    return <div className="p-4 text-center text-gray-500 dark:text-gray-400">⏳ Đang tải dữ liệu...</div>;

  const fixtures: any[] = data.response || [];

  if (!fixtures.length) {
    return (
      <div className="p-6 text-center bg-white dark:bg-gray-900 rounded-xl shadow-sm text-gray-500 dark:text-gray-400">
        ⚽ Không có trận đấu trực tiếp.
      </div>
    );
  }

  const grouped = fixtures.reduce((acc: Record<string, any[]>, f: any) => {
    const lid = `${f.league?.id}_${f.league?.name}`;
    acc[lid] = acc[lid] || [];
    acc[lid].push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-6 sm:space-y-8">
      {Object.entries(grouped).map(([leagueKey, items]) => {
        const first = items[0];
        return (
          <motion.div
            key={leagueKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            {/* Header */}
            <div className="px-3 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                {first.league?.logo && (
                  <img
                    src={first.league.logo}
                    alt={first.league?.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                  />
                )}
                <div>
                  <div className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100">
                    {first.league?.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{first.league?.country}</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 sm:text-right">
                🕒 Cập nhật: <span className="text-green-600 dark:text-green-400">{updatedAt}</span>
              </div>
            </div>

            {/* Danh sách trận */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((f: any) => (
                <FixtureCard key={f.fixture.id} fixture={f} />
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
