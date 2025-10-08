// types/ui.ts
export type FixtureUI = {
  id: number;
  date: string; // ISO
  league: { id: number; name: string; logo?: string; season?: number };
  home: { id: number; name: string; logo?: string };
  away: { id: number; name: string; logo?: string };
  status: { short: string; long?: string; elapsed?: number | null };
  score: { fulltime: { home: number | null; away: number | null } };
};