// app/giai-dau/[slug]/page.tsx
import React from "react";
import type { Metadata } from "next";
import footballFetch from "@/lib/footballClient";
import { resolveLeagueBySlug } from "@/lib/slugMap";
import ScheduleAndStandings from "@/components/ScheduleAndStandings";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = (await params) as { slug: string };
  const league = resolveLeagueBySlug(slug);
  return { title: league ? `${league.name} - Giải đấu` : "Giải đấu" };
}

export default async function LeaguePage({ params }: Props) {
  const { slug } = (await params) as { slug: string };

  const resolved = resolveLeagueBySlug(slug);
  if (!resolved) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Giải đấu không tìm thấy</h1>
          <p className="text-gray-500">Không có mapping cho slug: {slug}</p>
        </div>
      </div>
    );
  }

  const leagueId = resolved.id;
  // season default: query param or current year. Here we use current year by default.
  const season = new Date().getFullYear();

  // containers
  let standings: any[] = [];
  let initialFixtures: any[] = []; // snapshot (e.g., latest round)
  let allFixturesForSeason: any[] = []; // full season fixtures
  let latestRound: string | null = null;
  let currentRoundText: string | null = null;
  let seasonsList: number[] = [];
  let currentSeasonToUse: number = season;

  // fetch standings
  try {
    const s = await footballFetch("/standings", { league: leagueId, season });
    if (Array.isArray(s?.response)) {
      const resp0 = s.response[0];
      standings = resp0?.league?.standings?.[0] ?? [];
    }
  } catch (e: any) {
    console.error("standings fetch error", e?.status ?? e?.message ?? e);
  }

  // fetch all fixtures for season
  try {
    const f = await footballFetch("/fixtures", {
      league: leagueId,
      season,
      timezone: "Asia/Ho_Chi_Minh",
    });
    if (Array.isArray(f?.response)) {
      const all = f.response as any[];
      allFixturesForSeason = all;

      // build by round to choose an initial snapshot (latestRound)
      const byRound = new Map<string, any[]>();
      for (const item of all) {
        const rnd = item?.league?.round ?? item?.round ?? "Unknown";
        const arr = byRound.get(rnd) ?? [];
        arr.push(item);
        byRound.set(rnd, arr);
      }

      // choose latest round by latest fixture date inside that round
      let latestDate = new Date(0);
      for (const [rnd, arr] of byRound.entries()) {
        const maxd = arr.reduce((acc: Date, cur: any) => {
          const d = new Date(cur.fixture?.date ?? 0);
          return d > acc ? d : acc;
        }, new Date(0));
        if (maxd > latestDate) {
          latestDate = maxd;
          latestRound = rnd;
        }
      }

      if (latestRound) initialFixtures = byRound.get(latestRound) ?? [];
      else initialFixtures = all.slice(0, 50);
    }
  } catch (e: any) {
    console.error("fixtures fetch error", e?.status ?? e?.message ?? e);
  }

  // fetch current round using /fixtures/rounds?current=true
  try {
    const roundsResp = await footballFetch("/fixtures/rounds", {
      league: leagueId,
      season,
      current: true,
    });
    if (Array.isArray(roundsResp?.response)) {
      const r0 = roundsResp.response[0];
      if (typeof r0 === "string") {
        currentRoundText = r0;
      } else if (r0 && typeof r0 === "object") {
        currentRoundText = r0?.round ?? (Object.values(r0)[0] as string) ?? null;
      }
    }
  } catch (e: any) {
    console.error("rounds fetch error", e?.status ?? e?.message ?? e);
  }

  // fetch league info to get seasons list (if API provides seasons)
  try {
    const leagueResp = await footballFetch("/leagues", { id: leagueId });
    if (Array.isArray(leagueResp?.response) && leagueResp.response[0]) {
      const item = leagueResp.response[0];
      // API may return seasons array in different places; try several keys
      const seasonsRaw =
        item?.seasons ?? item?.league?.seasons ?? item?.seasonsAvailable ?? null;
      if (Array.isArray(seasonsRaw)) {
        // seasonsRaw could be array of numbers or objects with year property
        const parsed: number[] = [];
        for (const s of seasonsRaw) {
          if (typeof s === "number") parsed.push(s);
          else if (s && typeof s === "object") {
            if (typeof s.season === "number") parsed.push(s.season);
            else if (typeof s.year === "number") parsed.push(s.year);
            else if (typeof s === "string" && !Number.isNaN(Number(s))) parsed.push(Number(s));
          }
        }
        // dedupe and sort desc for convenience (most recent first)
        seasonsList = Array.from(new Set(parsed)).sort((a, b) => b - a);
        if (seasonsList.length > 0) currentSeasonToUse = seasonsList[0];
      } else {
        // fallback: infer seasons from fixtures years
        const yearSet = new Set<number>();
        for (const fx of allFixturesForSeason) {
          const d = fx.fixture?.date ? new Date(fx.fixture.date) : null;
          if (d) yearSet.add(d.getFullYear());
        }
        if (yearSet.size > 0) {
          seasonsList = Array.from(yearSet).sort((a, b) => b - a);
          currentSeasonToUse = seasonsList[0];
        }
      }
    }
  } catch (e: any) {
    console.error("league seasons fetch error", e?.status ?? e?.message ?? e);
  }

  const leagueInfo = { id: leagueId, slug, name: resolved.name, season: currentSeasonToUse };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{resolved.name}</h1>
            <div className="text-sm text-gray-500">
              Mùa: {currentSeasonToUse}{" "}
              {currentRoundText ? `• ${currentRoundText}` : latestRound ? `• ${latestRound}` : ""}
            </div>
          </div>
        </header>

        <ScheduleAndStandings
          initialFixtures={initialFixtures}
          initialStandings={standings}
          initialAllFixtures={allFixturesForSeason}
          seasons={seasonsList}
          currentSeason={currentSeasonToUse}
          league={leagueInfo}
          currentRound={currentRoundText ?? latestRound ?? ""}
        />
      </div>
    </div>
  );
}