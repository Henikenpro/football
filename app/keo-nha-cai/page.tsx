// app/odds/page.tsx
import React from 'react';
import footballFetch from '../../lib/footballClient';

export default async function OddsPage() {
  // Need fixture id to query odds. Here we show odds for upcoming fixtures in next 3 days, pick first fixture id example.
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + 3);

  const data = await footballFetch('/fixtures', { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] });
  const fixtures: any[] = data.response || [];
  const fixture = fixtures[0];

  let oddsData: any = { response: [] };
  if (fixture) {
    try {
      oddsData = await footballFetch('/odds', { fixture: fixture.fixture.id });
    } catch (err) {
      console.error('Odds error', err);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Football Odds</h1>
      {!fixture && <div>Không có trận sắp tới để hiển thị odds</div>}
      {fixture && (
        <div className="bg-white p-4 rounded shadow">
          <div className="font-medium mb-2">{fixture.teams.home.name} vs {fixture.teams.away.name}</div>
          {oddsData.response.length === 0 && <div>Không có nhà cái/odds</div>}
          {oddsData.response.map((o: any) => (
            <div key={o.bookmaker?.id} className="border-t py-2">
              <div className="text-sm font-semibold">{o.bookmaker?.name}</div>
              <div className="flex gap-4 text-sm">
                {o.bookmaker?.bets?.[0]?.values?.map((v: any) => (
                  <div key={v.value} className="px-2">{v.value}: {v.odds}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}