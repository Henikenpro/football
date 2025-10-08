// types/apiResponses.ts
export interface ApiFixture {
  fixture: {
    id: number;
    referee?: string | null;
    timezone?: string;
    date: string;
    timestamp?: number;
    venue?: { id?: number | null; name?: string | null; city?: string | null };
    status: { long: string; short: string; elapsed?: number | null };
  };
  league: { id: number; name: string; country?: string; logo?: string; season?: number };
  teams: {
    home: { id: number; name: string; logo?: string; winner?: boolean | null };
    away: { id: number; name: string; logo?: string; winner?: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime?: { home: number | null; away: number | null };
    fulltime?: { home: number | null; away: number | null };
  };
}

export interface ApiFixturesResponse {
  get?: any;
  errors?: any;
  results?: number;
  response: ApiFixture[];
}