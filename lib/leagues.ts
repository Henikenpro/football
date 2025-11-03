// lib/leagues.ts
export type LeagueDef = {
  id: number;
  slug?: string;
  name: string;
  country?: string;
};

// Chỉ giữ 7 league ưu tiên
const PRIORITY_LEAGUES: LeagueDef[] = [
  { id: 39, name: "England - Premier League", country: "England", slug: "premier-league" }, // Premier League
  { id: 2, name: "UEFA Champions League", country: "Europe", slug: "champions-league" }, // C1
  { id: 140, name: "Spain - LaLiga", country: "Spain", slug: "laliga" }, // LaLiga
  { id: 61, name: "France - Ligue 1", country: "France", slug: "ligue-1" }, // Ligue 1
  { id: 135, name: "Italy - Serie A", country: "Italy", slug: "serie-a" }, // Serie A
  { id: 78, name: "Germany - Bundesliga", country: "Germany", slug: "bundesliga" }, // Bundesliga
  { id: 340, name: "Vietnam - V-League", country: "Vietnam", slug: "v-league" }, // V-League (điều chỉnh id nếu khác)
];

export default PRIORITY_LEAGUES;