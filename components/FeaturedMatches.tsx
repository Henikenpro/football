import React from "react";
import MatchCard from "./MatchCard";

export default function FeaturedMatches({ matches }: { matches: any[] }) {
  return (
    <section className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Featured Matches</h2>
        <a href="/livescore" className="text-sm text-primary">View All Matches →</a>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {matches.length === 0 ? (
          <div className="p-6 bg-white rounded shadow">No featured matches available.</div>
        ) : (
          matches.map((m) => <MatchCard key={m.fixture.id} match={m} />)
        )}
      </div>
    </section>
  );
}