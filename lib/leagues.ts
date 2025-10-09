// lib/leagues.ts
export type LeagueDef = {
  id: number;
  slug?: string;
  name: string;
  country?: string;
};

// Các league id phổ biến (API-Football): nếu V-League id khác, hãy sửa lại
// Bạn có thể thêm/xóa hoặc thay đổi thứ tự ưu tiên ở đây.
const PRIORITY_LEAGUES: LeagueDef[] = [
  { id: 39, name: "Ngoại hạng Anh", country: "England", slug: "premier-league" }, // Premier League
  { id: 140, name: "LaLiga", country: "Spain", slug: "laliga" }, // LaLiga
  { id: 135, name: "Serie A", country: "Italy", slug: "serie-a" }, // Serie A
  { id: 61, name: "Ligue 1", country: "France", slug: "ligue-1" }, // Ligue 1
  { id: 78, name: "Bundesliga", country: "Germany", slug: "bundesliga" }, // Bundesliga
  { id: 2, name: "UEFA Champions League", country: "Europe", slug: "champions-league" }, // C1
  // V-League: nếu id không chính xác, vui lòng thay bằng id đúng của V.League 1 trên API-Football
  { id: 2718, name: "V-League", country: "Vietnam", slug: "v-league" },
];

export default PRIORITY_LEAGUES;