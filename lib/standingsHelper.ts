// lib/standingsHelper.ts
import footballFetch from './footballClient';

export async function fetchStandingsForLeagueWithSeasons(leagueId: number, seasons: number[] = []) {
  for (const s of seasons) {
    try {
      const data = await footballFetch('/standings', { league: leagueId, season: s });
      // nếu API trả response non-empty -> return
      if (data?.response && data.response.length > 0) {
        return { data, season: s };
      }
      // else continue
    } catch (err: any) {
      // nếu lỗi 403/401/... thì dừng và trả lỗi
      // trả về object chứa lỗi để caller biết
      return { error: err };
    }
  }
  return { data: null };
}

/**
 * Tìm league theo tên/slug (fallback nếu id không đúng)
 * Trả về mảng các league matches
 */
export async function findLeagueByName(name: string) {
  try {
    // Gọi endpoint /leagues?name=...
    const data = await footballFetch('/leagues', { name });
    // trả về mảng matches (mỗi item có league, country, seasons...)
    return data?.response ?? [];
  } catch (err) {
    return [];
  }
}