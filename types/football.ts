// types/football.ts
export type OddsApiResponse = {
  odds: OddsEntry[];
};

export type OddsEntry = {
  fixture: {
    id: number;
    date: string; // ISO
    timezone?: string;
    status?: { short: string; long?: string };
  };
  league: { id: number; name: string; country?: string; logo?: string };
  teams: {
    home: { id?: number; name: string; logo?: string };
    away: { id?: number; name: string; logo?: string };
  };
  bookmakers: Bookmaker[]; // array of bookmakers with markets
};

export type Bookmaker = {
  id?: number;
  name: string;
  bets: Bet[];
  logo?: string;
};

export type Bet = {
  id?: number;
  name: string; // e.g., "Match Winner", "Over/Under 2.5"
  values: BetValue[];
  // sometimes API uses "options" or "market" - client code is defensive
};

export type BetValue = {
  value?: string; // e.g., "1", "X", "2" or "Over" / "Under"
  odd?: number;
  label?: string; // sometimes label contains outcome text
  // other vendor-specific fields allowed
};