// lib/api.ts
const BASE_URL = "https://v3.football.api-sports.io";
const API_KEY = process.env.API_FOOTBALL_KEY;
const HEADER_NAME = process.env.API_FOOTBALL_HEADER_NAME || "x-apisports-key";

if (!API_KEY) {
  console.warn("⚠️ Missing API_FOOTBALL_KEY in .env.local");
}

export async function footballFetch(path: string, params?: Record<string, string | number>) {
  const url = new URL(BASE_URL + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }

  const res = await fetch(url.toString(), {
    headers: {
      [HEADER_NAME]: API_KEY || "",
      Accept: "application/json",
    },
    next: { revalidate: 60 }, // cache 1 phút để giảm số lần gọi
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json();
}
