import React from "react";
import { footballFetch } from "../../lib/api";
import MatchCard from "../../components/MatchCard";

export default async function LiveScorePage() {
  let liveMatches: any[] = [];
  try {
    const res = await footballFetch("/fixtures", { live: "all" });
    liveMatches = res.response || [];
  } catch (err) {
    console.error("Failed to fetch live matches", err);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Livescore</h1>
      {liveMatches.length === 0 ? (
        <div className="p-6 bg-white rounded shadow">No live matches right now.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {liveMatches.map((m: any) => (
            <MatchCard key={m.fixture.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}