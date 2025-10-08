// hooks/useTeams.ts
import useSWR from 'swr';

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

export type TeamUI = {
  id: number;
  name: string;
  logo?: string | null;
  country?: string;
};

export default function useTeams(params?: { search?: string; league?: number | string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', String(params.search));
  if (params?.league) qs.set('league', String(params.league));
  if (params?.page) qs.set('page', String(params.page));
  const path = `/api/football/teams?${qs.toString()}`;

  const { data, error } = useSWR(path, fetcher);

  const teams: TeamUI[] = (data?.response || []).map((r: any) => {
    const t = r.team || r;
    return {
      id: t.id,
      name: t.name,
      logo: t.logo,
      country: t.country?.name,
    } as TeamUI;
  });

  return {
    teams,
    isLoading: !error && !data,
    error,
  };
}