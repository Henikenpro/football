// app/prediction/page.tsx
import React from 'react';
import footballFetch from '../../lib/footballClient';

export default async function PredictionPage() {
  // example: get upcoming fixture then fetch predictions
  const data = await footballFetch('/fixtures', { next: 1 });
  const fixtures: any[] = data.response || [];
  const fixture = fixtures[0];

  let predData: any = { response: [] };
  if (fixture) {
    try {
      predData = await footballFetch('/predictions', { fixture: fixture.fixture.id });
    } catch (err) {
      console.error('Predictions error', err);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Prediction</h1>
      {!fixture && <div>Không có trận để dự đoán</div>}
      {fixture && (
        <div className="bg-white p-4 rounded shadow">
          <div className="mb-2 font-medium">{fixture.teams.home.name} vs {fixture.teams.away.name}</div>
          {predData.response.length === 0 && <div>Không có dữ liệu dự đoán</div>}
          {predData.response.map((p: any, i: number) => (
            <div key={i} className="border-t py-2">
              <div><strong>Advice:</strong> {p.predictions?.advice}</div>
              <div><strong>Win Probability:</strong> {p.predictions?.percent || 'N/A'}</div>
              <div><strong>Comparison:</strong> {JSON.stringify(p.comparison || {})}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}