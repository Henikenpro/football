// lib/apiFootball.server.ts
import { retry } from '@/utils/errorRetry';

// simple wrapper to call api-football via server-side fetch
const BASE = 'https://v3.football.api-sports.io';

async function apiFetch(path: string) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error('Missing API_FOOTBALL_KEY env var');
  const url = `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    headers: {
      'x-apisports-key': key,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    const err: any = new Error(`API Football error ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

export async function getFixtures(params: { date?: string; league?: number; team?: number; season?: number; page?: number }) {
  const qs: string[] = [];
  if (params.date) qs.push(`date=${encodeURIComponent(params.date)}`);
  if (params.league) qs.push(`league=${params.league}`);
  if (params.team) qs.push(`team=${params.team}`);
  if (params.season) qs.push(`season=${params.season}`);
  if (params.page) qs.push(`page=${params.page}`);
  const path = `/fixtures?${qs.join('&')}`;
  // retry on transient errors
  return retry(() => apiFetch(path), 2, 300);
}

export async function getFixtureById(id: number) {
  return retry(() => apiFetch(`/fixtures?id=${id}`), 2, 300);
}

export async function getStandings(leagueId: number, season: number) {
  return retry(() => apiFetch(`/standings?league=${leagueId}&season=${season}`), 2, 300);
}

export async function getTeams(params: { league?: number; search?: string; page?: number }) {
  const qs: string[] = [];
  if (params.league) qs.push(`league=${params.league}`);
  if (params.search) qs.push(`search=${encodeURIComponent(params.search)}`);
  if (params.page) qs.push(`page=${params.page}`);
  const path = `/teams?${qs.join('&')}`;
  return retry(() => apiFetch(path), 2, 300);
}

export async function getTeamById(id: number) {
  return retry(() => apiFetch(`/teams?id=${id}`), 2, 300);
}

export async function getPlayersByTeam(teamId: number, season: number) {
  return retry(() => apiFetch(`/players?team=${teamId}&season=${season}`), 2, 300);
}

export async function getOdds(fixtureId: number) {
  return retry(() => apiFetch(`/odds?fixture=${fixtureId}`), 2, 300);
}