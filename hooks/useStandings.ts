// hooks/useStandings.ts
import useSWR from 'swr';

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

export type StandingRowUI = {
  position: number;
  team: { id: number; name: string; logo?: string | null };
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form?: string;
};

export default function useStandings(leagueId?: number | string, season?: number | string) {
  if (!leagueId) {
    return { standings: [] as StandingRowUI[], isLoading: false, error: null };
  }
  const qs = new URLSearchParams();
  qs.set('league', String(leagueId));
  if (season) qs.set('season', String(season));
  const path = `/api/football/standings?${qs.toString()}`;

  const { data, error } = useSWR(path, fetcher);

  const standings: StandingRowUI[] =
    (data?.response?.[0]?.league?.standings?.[0] || []).map((row: any) => ({
      position: row.rank,
      team: { id: row.team.id, name: row.team.name, logo: row.team.logo },
      played: row.all.played,
      wins: row.all.win,
      draws: row.all.draw,
      losses: row.all.lose,
      goalsFor: row.all.goals.for,
      goalsAgainst: row.all.goals.against,
      goalDiff: row.goalsDiff ?? row.all.goals.for - row.all.goals.against,
      points: row.points,
      form: row.form,
    })) || [];

  return {
    standings,
    isLoading: !error && !data,
    error,
  };
}