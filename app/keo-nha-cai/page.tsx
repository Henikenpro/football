import React from "react";
import { footballFetch } from "../../lib/api";

export default async function OddsPage() {
  let odds: any[] = [];
  try {
    // Example: lấy odds cho ngày hôm nay (API-Football odds endpoint may be different or require params)
    const today = new Date().toISOString().slice(0, 10);
    const res = await footballFetch("/odds", { date: today });
    odds = res.response || [];
  } catch (err) {
    console.error("Failed to fetch odds", err);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Football Odds</h1>
      {odds.length === 0 ? (
        <div className="p-6 bg-white rounded shadow">No odds available.</div>
      ) : (
        <div className="grid gap-4">
          {odds.map((o: any) => (
            <div key={o.fixture.id} className="p-4 bg-white rounded shadow">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-slate-500">{o.league?.name}</div>
                  <div className="font-semibold">
                    {o.teams.home.name} vs {o.teams.away.name}
                  </div>
                </div>
                <div className="text-sm">
                  {o.bookmakers?.[0]?.bets?.[0]?.values?.slice(0,3).map((v: any) => (
                    <div key={v.value} className="text-right">{v.value}: {v.odd}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}