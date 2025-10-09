// app/components/StatsSection.tsx
import React from "react";

type Stats = {
  label: string;
  value: string;
};

async function fetchCount(url: string, headers: Record<string, string>) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      // revalidate every 30s on the server (Next.js caching)
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    // API-FOOTBALL (v3) returns fixtures in `response` array
    return Array.isArray(data?.response) ? data.response.length : 0;
  } catch (error) {
    // Log on server; return 0 as fallback
    console.error("fetchCount error:", error);
    return 0;
  }
}

/**
 * Server Component to show stats.
 *
 * Environment variables (set in .env.local):
 * - API_FOOTBALL_KEY = your API key
 * - API_FOOTBALL_HOST = optional host (defaults to v3.football.api-sports.io)
 *
 * Notes:
 * - This implementation uses the API-Football v3 endpoints:
 *   - Live fixtures:  GET /fixtures?live=all
 *   - Today's fixtures: GET /fixtures?date=YYYY-MM-DD
 * - If you're using the RapidAPI wrapped provider, you may need to change the headers:
 *   e.g. 'x-rapidapi-key' and 'x-rapidapi-host'. Adjust the headers below accordingly.
 */
export default async function StatsSection() {
  // Prepare API info and headers
  const key = process.env.FOOTBALL_API_KEY;
  const host = process.env.API_FOOTBALL_HOST ?? "v3.football.api-sports.io";

  const headers: Record<string, string> = {};
  if (!key) {
    // No key available: use local fallback values in UI
    console.warn("FOOTBALL_API_KEY not set. Stats will use fallback numbers.");
  } else {
    // Most common header for api-sports / api-football v3:
    headers["x-apisports-key"] = key;
    // If you use RapidAPI wrapper, uncomment/replace with:
    // headers["x-rapidapi-key"] = key;
    // headers["x-rapidapi-host"] = host;
  }

  // Build URLs
  const base = `https://${host}`;
  const liveUrl = `${base}/fixtures?live=all`;

  // Use server local date (YYYY-MM-DD). Be mindful of timezone differences vs API expectations.
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const todayUrl = `${base}/fixtures?date=${todayStr}`;

  // If no API key, skip network calls and use fallbacks
  let liveCount = 0;
  let todayCount = 0;

  if (key) {
    // perform both fetches in parallel
    const [liveResult, todayResult] = await Promise.all([
      fetchCount(liveUrl, headers),
      fetchCount(todayUrl, headers),
    ]);
    liveCount = liveResult;
    todayCount = todayResult;
  } else {
    // sensible default/fallback values when no key provided
    liveCount = 0;
    todayCount = 0;
  }

  const stats: Stats[] = [
    { label: "Trận đấu trực tiếp", value: String(liveCount) },
    { label: "Trận đấu hôm nay", value: String(todayCount) },
    { label: "Giải đấu", value: "150+" },
    { label: "Dự đoán AI", value: "Hơn 1,200" },
  ];

  return (
    <section className="bg-white py-10 grid grid-cols-2 md:grid-cols-4 text-center gap-6">
      {stats.map((s) => (
        <div key={s.label}>
          <div className="text-green-600 text-2xl font-semibold mb-1">{s.value}</div>
          <div className="text-gray-500 text-sm">{s.label}</div>
        </div>
      ))}
    </section>
  );
}