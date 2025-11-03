/* app/lich-thi-dau/page.tsx */
'use client';

import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import DateTabs from '@/components/DateTabs';

type APIFixture = {
  fixture: {
    id: number;
    date: string;
    status?: {
      short?: string; // e.g. "FT", "NS", "LIVE", "1H"
      long?: string;
    };
  };
  league: {
    id: number;
    name: string;
    country?: string;
    flag?: string;
  };
  teams: {
    home: { name: string };
    away: { name: string };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
};

export default function Page() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [matches, setMatches] = useState<APIFixture[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Thứ tự ưu tiên hiển thị (ưu tiên bên trái lên trước)
  const PRIORITY_ORDER = [
    // đặt Premier League của England lên đầu bằng cách kiểm tra country === 'England'
    'Premier League',
    'Champions League',
    'La Liga',
    'Ligue 1',
    'Serie A',
    'Bundesliga',
    'V-League',
  ];

  const fetchFixtures = async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await fetch(`/api/football?date=${dateStr}`);
      if (!res.ok) throw new Error('Không thể tải dữ liệu');
      const json = await res.json();
      // Giữ nguyên dữ liệu gốc, nếu API trả khác key hãy điều chỉnh
      setMatches(json.fixtures ?? []);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixtures(selectedDate);
  }, [selectedDate]);

  // helper status
  const isLiveStatus = (s?: string) => {
    if (!s) return false;
    const up = s.toUpperCase();
    return up === 'LIVE' || up === '1H' || up === '2H' || up === 'HT' || up === 'ET' || up === 'LIVE';
  };

  const isFinishedStatus = (s?: string) => {
    if (!s) return false;
    const up = s.toUpperCase();
    return up === 'FT' || up === 'AET' || up === 'PEN' || up === 'AW' || up === 'AP';
  };

  const isUpcomingStatus = (s?: string) => {
    if (!s) return true; // nếu không có status giả định là sắp đá
    const up = s.toUpperCase();
    // NS = Not Started, TBA, TBD cũng được coi là upcoming
    return up === 'NS' || up === 'TBD' || up === 'TBA' || up === 'SUSP' || (!isLiveStatus(up) && !isFinishedStatus(up));
  };

  // Lọc: loại bỏ các trận Live
  const filteredMatches = matches.filter((m) => {
    const s = m.fixture?.status?.short;
    return !isLiveStatus(s); // chỉ giữ upcoming hoặc finished
  });

  // Gom nhóm theo "country - leagueName" (nếu không có country thì dùng 'Unknown')
  const grouped = filteredMatches.reduce((acc, m) => {
    const leagueName = (m.league?.name ?? 'Unknown').trim();
    const country = (m.league?.country ?? 'Unknown').trim();
    const key = `${country} - ${leagueName}`;
    if (!acc[key]) acc[key] = { meta: { leagueName, country, flag: m.league?.flag }, items: [] as APIFixture[] };
    acc[key].items.push(m);
    return acc;
  }, {} as Record<string, { meta: { leagueName: string; country: string; flag?: string }; items: APIFixture[] }>);

  // Convert to array and sort groups by priority and name
  const groupsArray = Object.entries(grouped).map(([key, val]) => ({ key, ...val }));

  // comparator: first put England Premier League at top, then follow PRIORITY_ORDER (by leagueName substring), then alphabetic by country+league
  const getPriorityIndex = (leagueName: string, country: string) => {
  const ln = leagueName.toLowerCase();
  const c = country.toLowerCase();

  // Ưu tiên cao nhất: Ngoại hạng Anh (England Premier League)
  if (c === 'england' && /premier\s*league/i.test(ln)) return -999;

  // Cúp C1 (Champions League)
  if (/champions\s*league/i.test(ln)) return -998;

  // La Liga
  if (c === 'spain' && /liga/i.test(ln)) return -997;

  // Ligue 1
  if (c === 'france' && /ligue\s*1/i.test(ln)) return -996;

  // Serie A
  if (c === 'italy' && /serie\s*a/i.test(ln)) return -995;

  // Bundesliga
  if (c === 'germany' && /bundesliga/i.test(ln)) return -994;

  // V-League
  if (c === 'vietnam' && /league/i.test(ln)) return -993;

  // Mặc định: xếp sau
  return 9999;
};


  groupsArray.sort((a, b) => {
    const ai = getPriorityIndex(a.meta.leagueName, a.meta.country);
    const bi = getPriorityIndex(b.meta.leagueName, b.meta.country);
    if (ai !== bi) return ai - bi;
    // tie-breaker: prefer country 'England' generally
    if (a.meta.country === 'England' && b.meta.country !== 'England') return -1;
    if (b.meta.country === 'England' && a.meta.country !== 'England') return 1;
    // else alphabetic by "country - league"
    return a.key.localeCompare(b.key);
  });

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Tabs chọn ngày */}
      <div className="flex justify-center mb-6">
        <DateTabs selectedDate={selectedDate} onSelect={(d) => setSelectedDate(d)} />
      </div>

      {/* Trạng thái */}
      {loading && <div className="text-center text-gray-500">Đang tải dữ liệu...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}
      {!loading && !error && filteredMatches.length === 0 && (
        <div className="text-center text-gray-500 py-8">Không có trận đấu nào cho ngày này.</div>
      )}

      {/* Nhóm giải (country + league) */}
      <div className="space-y-8">
        {groupsArray.map((group) => {
          const leagueName = group.meta.leagueName;
          const country = group.meta.country;
          const flag = group.meta.flag;
          // Sort matches inside group by date ascending (sắp đá trước), but show finished maybe first? giữ sắp đá -> finished or finished -> sắp đá?
          // Ở đây ta sắp theo thời gian ascending (sớm nhất trước)
          const itemsSorted = group.items.slice().sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());

          return (
            <div key={group.key} className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
              {/* Header giải */}
              <div className="flex items-center justify-between bg-green-700 text-white px-4 py-2">
                <div className="flex items-center gap-2">
                  {flag && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={flag} alt={country || ''} className="w-5 h-3 object-cover rounded-sm" />
                  )}
                  <span className="font-semibold text-sm">
                    Lịch bóng đá {country} {leagueName}
                  </span>
                </div>
                <div className="text-xs opacity-90 flex gap-4">
                  <span className="cursor-pointer hover:underline">Lịch</span>
                  <span className="cursor-pointer hover:underline">KQ</span>
                  <span className="cursor-pointer hover:underline">BXH</span>
                </div>
              </div>

              {/* Danh sách trận */}
              <div>
                {itemsSorted.map((m, idx) => {
                  const time = format(parseISO(m.fixture.date), 'HH:mm');
                  const isEven = idx % 2 === 0;
                  const statusShort = m.fixture?.status?.short ?? '';
                  const finished = isFinishedStatus(statusShort);
                  const upcoming = isUpcomingStatus(statusShort);
                  const scoreText = finished
                    ? `${m.goals?.home ?? '-'} - ${m.goals?.away ?? '-'}`
                    : '?-?';

                  return (
                    <div
                      key={m.fixture.id}
                      className={`flex items-center justify-between px-4 py-2 text-sm ${
                        isEven ? 'bg-gray-50' : 'bg-white'
                      } hover:bg-green-50 transition`}
                    >
                      <div className="w-14 font-medium text-gray-800">{time}</div>

                      <div className="flex-1 text-right pr-4 font-medium text-gray-800 truncate">
                        {m.teams.home.name}
                      </div>

                      <div
                        className={`text-xs font-semibold px-2 py-1 rounded-md min-w-[48px] text-center mx-1 ${
                          finished ? 'bg-gray-200 text-gray-800' : 'bg-green-600 text-white'
                        }`}
                        title={finished ? 'Kết thúc' : upcoming ? 'Sắp đá' : statusShort}
                      >
                        {scoreText}
                      </div>

                      <div className="flex-1 text-left pl-4 font-medium text-gray-800 truncate">
                        {m.teams.away.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}