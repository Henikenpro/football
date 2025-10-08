import useSWR from 'swr';
import { mapFixture } from '@/utils/convertApiFootball';
import { FixtureUI } from '@/types/ui';

const fetcher = (url: string) => fetch(url).then(async (r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
});

export default function useFixtures(params: { date?: string; league?: number | string; page?: number }, options?: { refreshInterval?: number }) {
  const qs = new URLSearchParams();
  if (params.date) qs.set('date', params.date);
  if (params.league) qs.set('league', String(params.league));
  if (params.page) qs.set('page', String(params.page));
  const path = `/api/football/fixtures?${qs.toString()}`;

  const { data, error, mutate } = useSWR(path, fetcher, { refreshInterval: options?.refreshInterval ?? 0 });

  const fixtures: FixtureUI[] = (data?.response || []).map((r: any) => mapFixture(r));

  return {
    fixtures,
    isLoading: !error && !data,
    error,
    mutate,
  };
}