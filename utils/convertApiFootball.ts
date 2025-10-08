// utils/convertApiFootball.ts
import { ApiFixture } from '@/types/apiResponses';
import { FixtureUI } from '@/types/ui';

export function mapFixture(raw: ApiFixture): FixtureUI {
  const fixture = raw.fixture;
  return {
    id: fixture.id,
    date: fixture.date,
    league: {
      id: raw.league.id,
      name: raw.league.name,
      logo: raw.league.logo,
      season: raw.league.season,
    },
    home: {
      id: raw.teams.home.id,
      name: raw.teams.home.name,
      logo: raw.teams.home.logo,
    },
    away: {
      id: raw.teams.away.id,
      name: raw.teams.away.name,
      logo: raw.teams.away.logo,
    },
    status: {
      short: fixture.status.short,
      long: fixture.status.long,
      elapsed: fixture.status.elapsed ?? null,
    },
    score: {
      fulltime: {
        home: raw.goals.home ?? raw.score?.fulltime?.home ?? null,
        away: raw.goals.away ?? raw.score?.fulltime?.away ?? null,
      },
    },
  };
}