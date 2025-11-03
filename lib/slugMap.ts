// lib/slugMap.ts
const SLUG_MAP: Record<string, { id: number; name: string }> = {
  'ngoai-hang-anh': { id: 39, name: 'Premier League' },
  'la-liga': { id: 140, name: 'LaLiga' },
  'serie-a': { id: 135, name: 'Serie A' },
  'bundesliga': { id: 78, name: 'Bundesliga' },
  'ligue-1': { id: 61, name: 'Ligue 1' },
  'v-league': { id: 340, name: 'V-League' }, // sửa id nếu có id chính xác
  'champions-league': { id: 2, name: 'Champions League' },
  'europa-league': { id: 3, name: 'Europa League' },
  'europa-conference': { id: 848, name: 'Europa Conference' },
  // Thêm mapping khác ở đây...
};

export function resolveLeagueBySlug(slug: string) {
  return SLUG_MAP[slug] ?? null;
}