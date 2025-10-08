// lib/apiFootball.ts
import type { NextFetchEvent } from 'next/server';

const BASE = process.env.API_FOOTBALL_BASE || 'https://v3.football.api-sports.io';
const KEY = process.env.API_FOOTBALL_KEY;

if (!KEY) {
  // Trong dev, in ra cảnh báo; production thì throw để biết sai config.
  console.warn('Warning: API_FOOTBALL_KEY is not set in environment variables.');
}

async function fetchFromApiFootball(path: string, params?: Record<string, string>) {
  const url = new URL(BASE + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      'x-apisports-key': KEY || '',
      'Accept': 'application/json',
    },
    // tuỳ chọn cache của Next: revalidate để tránh gọi liên tục
    next: { revalidate: 30 }, // tái tạo sau 30s; điều chỉnh theo rate limit
  });

  if (!res.ok) {
    // Thông báo chi tiết để dễ debug
    const text = await res.text();
    throw new Error(`API-Football error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getStats() {
  // 1) Live matches: /fixtures?live=all
  const liveJson = await fetchFromApiFootball('/fixtures', { live: 'all'});
  const liveCount = Array.isArray(liveJson.response) ? liveJson.response.length : 0;

  // 2) Today's matches: /fixtures?date=YYYY-MM-DD
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const todayJson = await fetchFromApiFootball('/fixtures', { date: today });
  const todayCount = Array.isArray(todayJson.response) ? todayJson.response.length : 0;

  // 3) Leagues covered: có thể:
  //  - gọi /leagues để lấy tổng số giải (nặng, có phân trang)
  //  - hoặc đếm unique league IDs từ fixtures (fast và phù hợp để hiển thị "covered")
  const leaguesSet = new Set<number>();
  const addLeaguesFromResponse = (arr: any[]) => {
    arr?.forEach((f) => {
      if (f?.league?.id) leaguesSet.add(f.league.id);
    });
  };
  addLeaguesFromResponse(liveJson.response || []);
  addLeaguesFromResponse(todayJson.response || []);

  const leaguesCount = leaguesSet.size;

  // 4) Predictions made:
  // API-Football có endpoint /predictions nhưng thường trả dự đoán cho từng fixture.
  // Nếu bạn muốn số "Predictions Made" global, thường bạn phải đếm trong DB nội bộ (nếu hệ thống của bạn tạo predictions).
  // Ở đây minh hoạ: nếu bạn muốn lấy predictions cho date hôm nay, có thể gọi /predictions?date=YYYY-MM-DD
  // Dưới đây là ví dụ gọi predictions cho today, nhưng lưu ý endpoint này có thể trả rỗng nếu API không hỗ trợ tổng hợp.
 let predictionsCount = 0;
try {
  const firstFixtures = todayJson.response?.slice(0, 5) || [];
  const predPromises = firstFixtures.map((f: any) =>
    fetchFromApiFootball("/predictions", { fixture: f.fixture.id })
  );
  const predResults = await Promise.allSettled(predPromises);
  predictionsCount = predResults.filter(
    (r: any) => r.status === "fulfilled" && r.value?.response?.length > 0
  ).length;
} catch (e) {
  console.warn("Predictions not available:", (e as Error).message);
  predictionsCount = 0;
}

  return {
    liveCount,
    todayCount,
    leaguesCount,
    predictionsCount,
  };
}