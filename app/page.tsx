import React from "react";
import FeaturedMatches from "../components/FeaturedMatches";
import { footballFetch } from "../lib/api";
import { getStats } from '@/lib/apiFootball';
import Stats from "@/components/Stats";
import Hero from "@/components/Hero";

export default async function Home() {
  // Lấy vài trận làm ví dụ - endpoint fixtures with date=today (API-Football)
   const stats = await getStats();
  let featured: any[] = [];
  try {
    const today = new Date().toISOString().slice(0, 10);
    const data = await footballFetch("/fixtures", { date: today, timezone: "UTC" });
    featured = data.response || [];
  } catch (err) {
    console.error("Failed to fetch featured matches", err);
  }

  return (
    <div>
      <Hero />
      <div className="max-w-6xl mx-auto px-4 -mt-10">
        <section className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
          <div className="bg-white shadow rounded p-6">
            <div className="text-2xl font-bold text-green-600">{stats.liveCount}</div>
            <div className="mt-2 text-sm text-gray-500">Live Matches</div>
          </div>

          <div className="bg-white shadow rounded p-6">
            <div className="text-2xl font-bold text-green-600">{stats.todayCount}</div>
            <div className="mt-2 text-sm text-gray-500">Today's Matches</div>
          </div>

          <div className="bg-white shadow rounded p-6">
            <div className="text-2xl font-bold text-green-600">{stats.leaguesCount}</div>
            <div className="mt-2 text-sm text-gray-500">Leagues Covered (from fixtures)</div>
          </div>

          <div className="bg-white shadow rounded p-6">
            <div className="text-2xl font-bold text-green-600">{stats.predictionsCount > 0 ? stats.predictionsCount : '—'}</div>
            <div className="mt-2 text-sm text-gray-500">Predictions (today)</div>
          </div>
        </div>
      </section>
        <FeaturedMatches matches={featured.slice(0, 6)} />
      </div>
    </div>
  );
}