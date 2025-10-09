// app/livescore/page.tsx
import React from 'react';
import footballFetch from '../../lib/footballClient';
import LiveScoreClient from './LiveScoreClient';
import { formatDateTime } from '../../lib/i18n';

export const metadata = {
  title: 'Trực tiếp - Livescore',
};

export default async function LiveScorePage() {
  let initialData: any = { response: [] };
  try {
    initialData = await footballFetch('/fixtures', { live: 'all' });
  } catch (err) {
    console.error('Initial livescore fetch failed', err);
  }

  // tạo chuỗi thời gian đã format bằng tiếng Việt (để tránh hydration mismatch)
  const initialUpdated = formatDateTime(new Date(), { timeOnly: true, shortTime: true });

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Trực tiếp</h1>
        <p className="text-sm text-gray-500 mb-4">Cập nhật trực tiếp từ API-Football</p>
        <LiveScoreClient initialData={initialData} initialUpdated={initialUpdated} />
      </div>
    </div>
  );
}