export const runtime = "nodejs";

import { NextResponse } from "next/server";

const API_HOST = "https://v3.football.api-sports.io";
const API_KEY = process.env.FOOTBALL_API_KEY || "";
const CACHE_TTL = 1000 * 60 * 5; // 5 phút
const CONCURRENCY = 3;
const RETRY_LIMIT = 3;
const TIMEOUT_MS = 10000;
const PAGE_SIZE_EXPECTED = 10;
const MAX_PAGE_LIMIT = 200;
const MAX_FIXTURES_TO_DISPLAY = 150; // chỉ hiển thị tối đa 150 trận
const FALLBACK_PER_FIXTURE_LIMIT = 150; // tối đa gọi per-fixture khi cần

// Ưu tiên 6 giải (tên giống API trả về trong f.league.name)
const PRIORITY_LEAGUES = [
  "Premier League",
  "La Liga",
  "Ligue 1",
  "Serie A",
  "V-League",
  "Bundesliga",
];

// --- In-memory cache ---
const inMemoryCache = new Map<string, { data: any; expires: number }>();
function getCached(key: string) {
  const it = inMemoryCache.get(key);
  if (it && Date.now() < it.expires) return it.data;
  inMemoryCache.delete(key);
  return null;
}
function setCached(key: string, data: any) {
  inMemoryCache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

// --- Utility ---
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Fetch helper with retry, timeout, rate-limit (429) handling ---
async function fetchWithRetryRaw(url: string, retries = RETRY_LIMIT) {
  let lastErr: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(url, {
        headers: { "x-apisports-key": API_KEY },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(id);

      if (res.status === 429) {
        const retryAfterHeader = res.headers.get("retry-after");
        const resetHeader = res.headers.get("x-ratelimit-reset");
        const waitSeconds =
          (retryAfterHeader ? Number(retryAfterHeader) : NaN) ||
          (resetHeader ? Number(resetHeader) - Math.floor(Date.now() / 1000) : NaN) ||
          (2 + attempt * 2);
        const waitMs = (isNaN(waitSeconds) ? 2 : waitSeconds) * 1000 + 200;
        console.warn(`[fetchWithRetryRaw] 429 for ${url}, waiting ${waitMs}ms then retry.`);
        await sleep(waitMs);
        throw new Error("429");
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt}`);
      }

      const json = await res.json();
      return { json, headers: res.headers };
    } catch (err: any) {
      lastErr = err;
      if (attempt < retries) {
        const backoff = 300 * Math.pow(2, attempt);
        await sleep(backoff);
        continue;
      }
      throw lastErr;
    }
  }
  throw lastErr;
}

// --- Batch runner with concurrency ---
async function batchFetch<T>(
  items: T[],
  handler: (item: T, index: number) => Promise<void>,
  concurrency = CONCURRENCY
) {
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      try {
        await handler(items[i], i);
      } catch (e) {
        console.error("batchFetch handler error", e);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
}

// --- Fetch fixtures for a date (with optional league param) ---
async function fetchFixturesByDate(date: string, timezone?: string, leagueId?: string) {
  const q = new URLSearchParams();
  q.set("date", date);
  if (timezone) q.set("timezone", timezone);
  if (leagueId) q.set("league", leagueId);
  const url = `${API_HOST}/fixtures?${q.toString()}`;
  const { json } = await fetchWithRetryRaw(url);
  return Array.isArray(json?.response) ? json.response : [];
}

// --- Bulk paginated fetch of odds UNTIL we've covered all needed fixtureIds or ran out of pages ---
async function fetchAllOddsByDate_untilCovered(date: string, neededFixtureIds: Set<number>, maxPages = 100) {
  const all: any[] = [];
  let page = 1;
  let totalPages: number | null = null;
  const covered = new Set<number>();
  while (true) {
    if (page > Math.min(maxPages, MAX_PAGE_LIMIT)) {
      console.warn(`[fetchAllOddsByDate_untilCovered] reached page limit ${page - 1}`);
      break;
    }
    const url = `${API_HOST}/odds?date=${encodeURIComponent(date)}&page=${page}`;
    let jsonWrap: any;
    try {
      const resp = await fetchWithRetryRaw(url);
      jsonWrap = resp.json;
    } catch (err) {
      console.warn(`[fetchAllOddsByDate_untilCovered] fetch page ${page} failed:`, err?.message ?? err);
      break;
    }

    const respArr = Array.isArray(jsonWrap?.response) ? jsonWrap.response : [];
    all.push(...respArr);

    for (const entry of respArr) {
      const fid = entry.fixture?.id ?? entry?.fixture_id ?? null;
      if (fid && neededFixtureIds.has(fid)) covered.add(fid);
    }

    // stop early if we've covered enough fixtures (or all needed)
    if (covered.size >= neededFixtureIds.size) {
      console.log(`[fetchAllOddsByDate_untilCovered] covered all needed fixtures at page ${page}`);
      break;
    }
    if (covered.size >= Math.min(neededFixtureIds.size, MAX_FIXTURES_TO_DISPLAY)) {
      console.log(`[fetchAllOddsByDate_untilCovered] covered target display count ${covered.size} at page ${page}`);
      break;
    }

    // Use paging info if available
    const paging = jsonWrap?.paging ?? null;
    if (paging) {
      if (typeof paging.total === "number" && typeof paging.limit === "number") {
        totalPages = Math.ceil(paging.total / (paging.limit || respArr.length || 1));
      } else if (typeof paging.pages === "number") {
        totalPages = paging.pages;
      }
      const current = paging.current ?? page;
      if (totalPages != null && current >= totalPages) break;
    }

    if (respArr.length === 0 || respArr.length < PAGE_SIZE_EXPECTED) {
      break;
    }
    page++;
  }

  return { all, coveredSet: covered, pagesFetched: page };
}

// --- Fallback per-fixture fetch (limited) ---
async function fetchOddsPerFixtures(fixtureIds: number[], limit = FALLBACK_PER_FIXTURE_LIMIT) {
  const results: any[] = [];
  const ids = fixtureIds.slice(0, limit);
  await batchFetch<number>(
    ids,
    async (fid) => {
      try {
        const url = `${API_HOST}/odds?fixture=${fid}`;
        const { json } = await fetchWithRetryRaw(url);
        if (Array.isArray(json?.response) && json.response.length) {
          results.push(...json.response);
        }
      } catch (err) {
        console.warn(`[fetchOddsPerFixtures] fixture ${fid} fetch failed:`, err?.message ?? err);
      }
    },
    Math.max(1, Math.min(6, CONCURRENCY))
  );
  return results;
}

// --- Normalize odds responses into map fixtureId -> array of bookmakers ---
function buildOddsMapFromResponses(oddsResponses: any[]) {
  const oddsMap = new Map<number, any[]>();
  for (const item of oddsResponses) {
    const fid = item.fixture?.id ?? item?.fixture_id ?? null;
    if (!fid) continue;

    let bookmakers: any[] = [];
    if (Array.isArray(item.bookmakers)) bookmakers = item.bookmakers;
    else if (Array.isArray(item.odds)) bookmakers = item.odds;
    else if (item.bookmaker && (item.bets || item.markets)) {
      bookmakers = [{ ...(item.bookmaker || {}), bets: item.bets ?? item.markets ?? [] }];
    } else if (item.provider && Array.isArray(item.provider.markets)) {
      bookmakers = [{ name: item.provider.name ?? item.provider.id, bets: item.provider.markets }];
    } else if (item.name && (item.bets || item.markets || item.values || item.options)) {
      bookmakers = [item];
    }

    const normalized = bookmakers
      .map((bm: any) => {
        const bets = Array.isArray(bm.bets) ? bm.bets : Array.isArray(bm.markets) ? bm.markets : Array.isArray(bm.options) ? bm.options : [];
        return {
          id: bm.id ?? bm.bookmaker_id ?? null,
          name: bm.name ?? bm.bookmaker ?? bm.title ?? "Unknown",
          bets,
          raw: bm,
        };
      })
      .filter((bm: any) => Array.isArray(bm.bets) && bm.bets.length > 0)
      .map((bm: any) => ({
        ...bm,
        bets: bm.bets.map((b: any) => ({
          ...b,
          values: b.values ?? b.options ?? b.outcomes ?? [],
          name: (b.name ?? b.label ?? b.market ?? "").toLowerCase(),
        })),
      }));

    const existing = oddsMap.get(fid) ?? [];
    oddsMap.set(fid, existing.concat(normalized));
  }
  return oddsMap;
}

// --- Helper to select top N fixtures prioritizing big leagues ---
function pickFixturesToProcess(allFixtures: any[], maxCount = MAX_FIXTURES_TO_DISPLAY) {
  // Group by priority leagues first
  const prioritized: any[] = [];
  const others: any[] = [];
  for (const f of allFixtures) {
    const lname = f.league?.name ?? "";
    if (PRIORITY_LEAGUES.includes(lname)) prioritized.push(f);
    else others.push(f);
  }
  // Keep order: prioritized first (keep original order), then others
  const selected = [...prioritized, ...others].slice(0, maxCount);
  return selected;
}

// --- Route handler ---
export async function GET(req: Request) {
  try {
    if (!API_KEY) {
      return NextResponse.json({ ok: false, error: "FOOTBALL_API_KEY not set" }, { status: 500 });
    }

    const url = new URL(req.url);
    const date = url.searchParams.get("date") ?? "";
    const timezone = url.searchParams.get("timezone") ?? undefined;
    const leagueParam = url.searchParams.get("league") ?? undefined; // optional: if front-end passes league id, use it to limit fixtures

    if (!date) {
      return NextResponse.json({ ok: false, error: "Missing required 'date' query parameter" }, { status: 400 });
    }

    const cacheKey = `odds-merged:${date}:${timezone ?? "default"}:${leagueParam ?? "all"}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { "x-cache-status": "HIT" } });
    }

    // 1) Fetch fixtures for date (optionally limited by league param)
    let fixtures: any[] = [];
    try {
      fixtures = await fetchFixturesByDate(date, timezone, leagueParam);
    } catch (err) {
      console.error("[odds-merged] fetch fixtures failed", err);
      return NextResponse.json({ ok: false, error: "Failed to fetch fixtures" }, { status: 500 });
    }

    if (!Array.isArray(fixtures) || fixtures.length === 0) {
      const empty = { ok: true, fixtures: [], merged: [], count: 0, debug: { note: "no fixtures for date" } };
      setCached(cacheKey, empty);
      return NextResponse.json(empty);
    }

    // 2) Pick up to MAX_FIXTURES_TO_DISPLAY fixtures, prioritizing big leagues
    const selectedFixtures = pickFixturesToProcess(fixtures, MAX_FIXTURES_TO_DISPLAY);
    const selectedFixtureIds = selectedFixtures.map((f: any) => f.fixture?.id ?? f.id).filter(Boolean) as number[];
    const neededFixtureSet = new Set<number>(selectedFixtureIds);

    // 3) Bulk paginated fetch odds UNTIL we've covered selected fixtures (or hit page limit)
    let oddsResponses: any[] = [];
    let pagesFetched = 0;
    try {
      const { all, coveredSet, pagesFetched: pf } = await fetchAllOddsByDate_untilCovered(date, neededFixtureSet, 100);
      oddsResponses = all;
      pagesFetched = pf;
      // If we've covered all or a large portion, great. Otherwise fallback below.
    } catch (err) {
      console.warn("[odds-merged] bulk odds fetch had errors, will run fallback", err);
      oddsResponses = [];
    }

    // 4) Determine missing fixture IDs (those selected but not present in oddsResponses)
    const presentSet = new Set<number>();
    for (const o of oddsResponses) {
      const fid = o.fixture?.id ?? o?.fixture_id ?? null;
      if (fid) presentSet.add(fid);
    }
    const missingIds = selectedFixtureIds.filter((id) => !presentSet.has(id));
    // if many missing, do fallback per-fixture with limit
    if (missingIds.length > 0) {
      const limit = Math.min(FALLBACK_PER_FIXTURE_LIMIT, missingIds.length);
      console.log(`[odds-merged] ${missingIds.length} selected fixtures missing odds -> fallback per-fixture for up to ${limit}`);
      const fallbackResponses = await fetchOddsPerFixtures(missingIds.slice(0, limit), limit);
      if (fallbackResponses.length > 0) oddsResponses.push(...fallbackResponses);
    }

    // 5) Normalize and map odds responses
    const oddsMap = buildOddsMapFromResponses(oddsResponses);

    // 6) Attach odds/bookmakers to selected fixtures; for fixtures not selected (beyond 150) we omit odds to save bandwidth
    const merged = selectedFixtures.map((fx: any) => {
      const fid = fx.fixture?.id ?? fx.id;
      const attached = oddsMap.get(fid) ?? [];
      return { ...fx, odds: attached, bookmakers: attached };
    });

    // 7) Build debug samples
    const debugSamples = merged.slice(0, 6).map((m: any) => ({
      id: m.fixture?.id,
      league: m.league?.name,
      oddsCount: Array.isArray(m.odds) ? m.odds.length : 0,
      sample: (m.odds || []).slice(0, 2).map((b: any) => ({
        name: b.name,
        betsSample: (b.bets || []).slice(0, 2).map((t: any) => ({ name: t.name, values: (t.values || []).slice(0, 4).map((v: any) => v.odd ?? v.price ?? v.value) })),
      })),
    }));

    const resp = {
      ok: true,
      fixtures: merged,
      merged,
      count: merged.length,
      debug: {
        pagesFetched,
        fetchedOddsTotal: oddsResponses.length,
        fixturesTotal: fixtures.length,
        selectedFixtures: merged.length,
        missingAfterBulk: missingIds.length,
        samples: debugSamples,
      },
    };

    setCached(cacheKey, resp);

    return NextResponse.json(resp, { headers: { "x-cache-status": "MISS" } });
  } catch (err: any) {
    console.error("[odds-merged] unexpected error", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "unknown" }, { status: 500 });
  }
}