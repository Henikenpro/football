// app/rankings/page.tsx
import React from 'react';
import PRIORITY_LEAGUES from '../../lib/leagues';
import { fetchStandingsForLeagueWithSeasons, findLeagueByName } from '../../lib/standingsHelper';

export const metadata = {
  title: 'Bảng xếp hạng - Rankings',
};

export default async function RankingsPage() {
  const currentYear = new Date().getFullYear();
  const seasonsToTry = [currentYear, currentYear - 1, currentYear - 2];

  const leaguesWithStandings = [];

  for (const lg of PRIORITY_LEAGUES) {
    // 1) thử bằng id đã có
    const result = await fetchStandingsForLeagueWithSeasons(lg.id, seasonsToTry);

    if (result.error) {
      // Nếu có lỗi nghiêm trọng (ví dụ 403) lưu lỗi để hiển thị
      leaguesWithStandings.push({ league: lg, standings: [], error: result.error });
      continue;
    }

    if (result.data) {
      const resp0 = result.data.response?.[0];
      const standings = resp0?.league?.standings?.[0] ?? [];
      leaguesWithStandings.push({ league: lg, standings, season: result.season });
      continue;
    }

    // 2) Nếu không có data mặc dù id được cung cấp, thử tìm league theo tên (fallback)
    const found = await findLeagueByName(lg.name);
    if (found && found.length > 0) {
      // pick first match that has seasons and try its id
      let used = null;
      for (const f of found) {
        const fLeagueId = f.league?.id;
        if (!fLeagueId) continue;
        const tryRes = await fetchStandingsForLeagueWithSeasons(fLeagueId, seasonsToTry);
        if (tryRes.data) {
          const resp0 = tryRes.data.response?.[0];
          const standings = resp0?.league?.standings?.[0] ?? [];
          leaguesWithStandings.push({ league: { id: fLeagueId, name: f.league?.name || lg.name, country: f.country?.name }, standings, season: tryRes.season });
          used = true;
          break;
        }
      }
      if (used) continue;
    }

    // 3) Nếu không có gì cả -> đẩy rỗng (client sẽ hiển thị "Không có bảng xếp hạng")
    leaguesWithStandings.push({ league: lg, standings: [] });
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Bảng xếp hạng</h1>
            <p className="text-sm text-gray-500">Nếu không có dữ liệu cho giải, thử thay season hoặc kiểm tra lại league id.</p>
          </div>
          <div className="text-sm text-gray-500">Dữ liệu từ API-Football</div>
        </div>

        {/* gửi data vào client component hiện có (RankingsClient) */}
        {/* RankingsClient sẽ hiển thị message, bảng hoặc lỗi tùy object */}
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="p-4">
            {/* Import component client ở đây */}
            {/* Ví dụ: <RankingsClient initialLeagues={leaguesWithStandings} season={currentYear} /> */}
          </div>
        </div>
      </div>
    </div>
  );
}