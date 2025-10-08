import React from "react";
import { footballFetch } from "../../lib/api";

export default async function RankingsPage() {
  let standings: any[] = [];
  try {
    // Example: lấy standings cho Premier League (league id 39) season 2024
    const res = await footballFetch("/standings", { league: "39", season: "2024" });
    standings = res.response?.[0]?.league?.standings?.[0] || [];
  } catch (err) {
    console.error("Failed to fetch standings", err);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Football Rankings</h1>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left">
            <th className="p-3">#</th>
            <th className="p-3">Team</th>
            <th className="p-3">Pts</th>
            <th className="p-3">W</th>
            <th className="p-3">D</th>
            <th className="p-3">L</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s: any, i: number) => (
            <tr key={s.team.id} className="border-t">
              <td className="p-3">{i + 1}</td>
              <td className="p-3 flex items-center gap-3">
                <img src={s.team.logo} alt={s.team.name} className="w-6 h-6" />
                {s.team.name}
              </td>
              <td className="p-3">{s.points}</td>
              <td className="p-3">{s.all.win}</td>
              <td className="p-3">{s.all.draw}</td>
              <td className="p-3">{s.all.lose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}