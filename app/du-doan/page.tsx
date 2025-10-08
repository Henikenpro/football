import React from "react";
import { footballFetch } from "../../lib/api";
import MatchCard from "../../components/MatchCard";

export default async function PredictionPage() {
  // Đây là ví dụ: lấy matches và hiển thị placeholder "prediction"
  let matches: any[] = [];
  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await footballFetch("/fixtures", { date: today });
    matches = res.response || [];
  } catch (err) {
    console.error("Failed to fetch for predictions", err);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Predictions</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {matches.slice(0, 10).map((m: any) => (
          <div key={m.fixture.id} className="p-4 bg-white rounded shadow">
            <MatchCard match={m} />
            <div className="mt-3">
              <div className="text-sm text-slate-600">Prediction (simple heuristic):</div>
              <div className="font-semibold mt-1">
                {Math.random() < 0.5 ? m.teams.home.name + " win" : m.teams.away.name + " win"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}