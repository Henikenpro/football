import useSWR from 'swr';
import React from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function LiveCount() {
  const { data, error } = useSWR('/api/live', fetcher, { refreshInterval: 30000 });

  if (error) return <div className="text-red-500">Không thể lấy dữ liệu</div>;
  const count = typeof data?.count === 'number' ? data.count : 0;

  return (
    <div className="flex items-center space-x-3">
      <div className="text-3xl font-bold text-green-600">{count}</div>
      <div className="text-sm text-gray-600">Live Matches</div>
    </div>
  );
}