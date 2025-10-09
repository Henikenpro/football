// app/schedule/page.tsx
import React from 'react';
import footballFetch from '../../lib/footballClient';

export default async function SchedulePage() {
  // Example: schedule for next 7 days
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + 7);

  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];

  let data = { response: [] };
  try {
    data = await footballFetch('/fixtures', { from: fromStr, to: toStr });
  } catch (err) {
    console.error('Schedule fetch error', err);
  }

  const fixtures: any[] = data.response || [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Match Schedule</h1>
      <div className="space-y-3">
        {fixtures.map(f => (
          <div key={f.fixture.id} className="p-3 border rounded bg-white">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{f.teams.home.name} vs {f.teams.away.name}</div>
                <div className="text-sm text-gray-500">{new Date(f.fixture.date).toLocaleString()}</div>
              </div>
              <div className="text-sm text-gray-600">{f.league?.name}</div>
            </div>
          </div>
        ))}
        {fixtures.length === 0 && <div>Không có lịch trong khoảng này</div>}
      </div>
    </div>
  );
}