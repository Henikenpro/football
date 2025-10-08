// hooks/useLeagues.ts
'use client';
import useSWR from 'swr';

type ApiLeagueItem = {
  league: { id: number; name: string; type?: string; season?: number; logo?: string };
  country?: { name?: string; code?: string };
  seasons?: any[];
};

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

export default function useLeagues(season?: number) {
  const year = season ?? new Date().getFullYear();
  const path = `/api/football/leagues?season=${year}`;
  const { data, error } = useSWR(path, fetcher);

  const leagues: ApiLeagueItem[] = Array.isArray(data?.response) ? data.response : [];

  return {
    leagues,
    isLoading: !error && !data,
    error,
  };
}