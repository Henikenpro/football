// app/api/fixtures/route.ts
import { NextResponse } from "next/server";

const HOST = process.env.API_FOOTBALL_HOST ?? "v3.football.api-sports.io";
const KEY = process.env.FOOTBALL_API_KEY ?? "";
const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

// Return HeadersInit safely
function buildHeaders(): Headers {
  const headers = new Headers();
  if (KEY && KEY.trim() !== "") {
    headers.set("x-apisports-key", KEY.trim());
  }
  return headers;
}

async function fetchJson(path: string) {
  const url = `https://${HOST}${path}`;
  const res = await fetch(url, { headers: buildHeaders(), cache: "no-store" });
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, json: JSON.parse(text) };
  } catch {
    return { ok: res.ok, status: res.status, json: { raw: text } };
  }
}

export async function GET(req: Request) {
  try {
    if (!KEY) {
      return NextResponse.json({ ok: false, error: "FOOTBALL_API_KEY not set" }, { status: 500 });
    }

    const url = new URL(req.url);
    const params = url.searchParams;
    const date = params.get("date"); // YYYY-MM-DD preferred for single-day
    const leagueLabel = (params.get("league") ?? "").trim();
    const page = Math.max(1, Number(params.get("page") ?? "1"));
    const limit = Math.max(1, Math.min(100, Number(params.get("limit") ?? "50")));
    const timezone = params.get("timezone") ?? DEFAULT_TIMEZONE;

    // Known league ids for common leagues (api-football standard)
    const knownIds: Record<string, number> = {
      "Giải Ngoại hạng Anh": 39,
      "Premier League": 39,
      LaLiga: 140,
      Bundesliga: 78,
      "Ligue 1": 61,
      "Serie A": 135,
      "Vô địch các CLB châu Âu": 2,
      "Champions League": 2,
      // add V-League id here if you know it
    };

    // Helper: get season for league id
    async function resolveSeason(leagueId: number): Promise<number> {
      try {
        const info = await fetchJson(`/leagues?id=${leagueId}`);
        if (!info.ok) return new Date().getFullYear();
        const arr = Array.isArray(info.json?.response) ? info.json.response : [];
        if (!arr.length) return new Date().getFullYear();
        const seasons = arr[0]?.seasons ?? [];
        const current = seasons.find((s: any) => s?.current === true);
        if (current?.season) return current.season;
        const maxSeason = seasons.reduce((acc: number, cur: any) => Math.max(acc, cur?.season ?? acc), new Date().getFullYear());
        return maxSeason || new Date().getFullYear();
      } catch {
        return new Date().getFullYear();
      }
    }

    // 1) Single day (no league) -> use date param (safe)
    if ((!leagueLabel || leagueLabel === "Tất cả các giải đấu") && date) {
      const path = `/fixtures?date=${encodeURIComponent(date)}&timezone=${encodeURIComponent(timezone)}`;
      const resp = await fetchJson(path);
      if (!resp.ok) {
        return NextResponse.json({ ok: false, error: "API error", status: resp.status, body: resp.json }, { status: 500 });
      }
      const items = Array.isArray(resp.json?.response) ? resp.json.response : [];
      const start = (page - 1) * limit;
      return NextResponse.json({
        ok: true,
        mode: "byDate",
        date,
        total: items.length,
        page,
        limit,
        fixtures: items.slice(start, start + limit),
        debug: { path, host: HOST },
      });
    }

    // 2) League specified
    if (leagueLabel) {
      // Attempt to find id by known map (try label directly or english variants)
      const leagueId = knownIds[leagueLabel] ?? knownIds[leagueLabel.replace("Giải ", "")];
      if (!leagueId) {
        // If unknown, return suggestion list for mapping (consumer can add id to knownIds)
        const year = new Date().getFullYear();
        const candidate = await fetchJson(`/leagues?season=${year}`);
        if (!candidate.ok) {
          return NextResponse.json({ ok: false, error: "Cannot fetch leagues", debug: candidate }, { status: 500 });
        }
        const list = Array.isArray(candidate.json?.response) ? candidate.json.response : [];
        const suggestions = list.slice(0, 200).map((l: any) => ({
          id: l.league?.id,
          name: l.league?.name,
          country: l.country?.name,
        }));
        return NextResponse.json({
          ok: true,
          fixtures: [],
          total: 0,
          message: "League id not known. Use suggestion list to map label->id and add to knownIds.",
          suggestions,
        });
      }

      const season = await resolveSeason(leagueId);

      // If date + league -> request fixtures for that league on that date
      if (date) {
        const path = `/fixtures?league=${leagueId}&season=${season}&date=${encodeURIComponent(date)}&timezone=${encodeURIComponent(timezone)}`;
        const resp = await fetchJson(path);
        if (!resp.ok) {
          return NextResponse.json({ ok: false, error: "API error", status: resp.status, body: resp.json }, { status: 500 });
        }
        const items = Array.isArray(resp.json?.response) ? resp.json.response : [];
        const start = (page - 1) * limit;
        return NextResponse.json({
          ok: true,
          mode: "leagueByDate",
          leagueId,
          leagueName: resp.json?.response?.[0]?.league?.name ?? leagueLabel,
          season,
          date,
          total: items.length,
          page,
          limit,
          fixtures: items.slice(start, start + limit),
          debug: { path, host: HOST },
        });
      }

      // No date: fetch whole season fixtures for league, return latest round first and support simple pagination
      const respAll = await fetchJson(`/fixtures?league=${leagueId}&season=${season}&timezone=${encodeURIComponent(timezone)}`);
      if (!respAll.ok) {
        return NextResponse.json({ ok: false, error: "API error", status: respAll.status, body: respAll.json }, { status: 500 });
      }
      const all = Array.isArray(respAll.json?.response) ? respAll.json.response : [];
      if (all.length === 0) {
        return NextResponse.json({ ok: true, fixtures: [], total: 0, message: "No fixtures for this league/season" });
      }

      // Group by round to find latest round
      const byRound = new Map<string, any[]>();
      for (const f of all) {
        const rnd = f?.league?.round ?? "Unknown";
        const arr = byRound.get(rnd) ?? [];
        arr.push(f);
        byRound.set(rnd, arr);
      }
      let latestRound = "";
      let latestRoundDate = new Date(0);
      for (const [rnd, arr] of byRound.entries()) {
        const maxd = arr.reduce((acc: Date, cur: any) => {
          const d = new Date(cur.fixture?.date ?? 0);
          return d > acc ? d : acc;
        }, new Date(0));
        if (maxd > latestRoundDate) {
          latestRoundDate = maxd;
          latestRound = rnd;
        }
      }
      const latestFixtures = byRound.get(latestRound) ?? [];

      // prepare remaining fixtures sorted desc by date excluding latest fixtures
      const latestIds = new Set(latestFixtures.map((f: any) => f.fixture?.id));
      const remaining = all
        .slice()
        .sort((a: any, b: any) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
        .filter((f: any) => !latestIds.has(f.fixture?.id));

      // pagination:
      if (page === 1) {
        const fill = Math.max(0, limit - latestFixtures.length);
        const extra = fill > 0 ? remaining.slice(0, fill) : [];
        return NextResponse.json({
          ok: true,
          mode: "league",
          leagueId,
          leagueName: respAll.json?.response?.[0]?.league?.name ?? leagueLabel,
          season,
          round: latestRound,
          total: all.length,
          page,
          limit,
          fixtures: [...latestFixtures, ...extra],
          hasMore: remaining.length > (fill > 0 ? fill : 0),
        });
      } else {
        const start = (page - 2) * limit + Math.max(0, limit - latestFixtures.length);
        const pageData = remaining.slice(start, start + limit);
        return NextResponse.json({
          ok: true,
          mode: "league",
          leagueId,
          leagueName: respAll.json?.response?.[0]?.league?.name ?? leagueLabel,
          season,
          round: latestRound,
          total: all.length,
          page,
          limit,
          fixtures: pageData,
          hasMore: start + limit < remaining.length,
        });
      }
    }

    return NextResponse.json({ ok: false, error: "Missing required parameters (date or league)" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}