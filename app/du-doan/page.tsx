'use client';
import React, { useMemo } from 'react';
import useSWR from 'swr';
import CompactOddsRow from '../../components/CompactOddsRow';
import { format } from 'date-fns';
import { fetcher } from '../../lib/api';
import type { OddsEntry, Bookmaker } from '../../types/football';

function formatDateISO(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

const PRIORITY_LEAGUES = [39, 140, 135, 78, 61, 2];

type PredictionApiResponse = { response?: any[] };

/** safe team name (same as before) */
function safeTeamName(entry: any, side: 'home' | 'away') {
  const direct =
    entry?.teams?.[side]?.name ||
    (entry?.teams?.[side] && typeof entry.teams[side] === 'string' ? entry.teams[side] : undefined) ||
    entry?.[side]?.name ||
    entry?.[side] ||
    '';
  if (direct && String(direct).trim() !== '') return String(direct);
  // try from bookmaker values (non-generic)
  const generic = /^(home|away|draw|over|under|1|2|x)$/i;
  const candidates: string[] = [];
  for (const bm of entry?.bookmakers ?? []) {
    for (const bet of bm?.bets ?? []) {
      if (!Array.isArray(bet.values)) continue;
      for (const v of bet.values) {
        const val = String(v?.value ?? v?.label ?? '').trim();
        if (!val) continue;
        if (generic.test(val)) continue;
        if (!candidates.includes(val)) candidates.push(val);
        if (candidates.length >= 2) break;
      }
      if (candidates.length >= 2) break;
    }
    if (candidates.length >= 2) break;
  }
  if (candidates.length >= 2) {
    return side === 'home' ? candidates[0] : candidates[1];
  }
  return '';
}

/** extract home handicap number from bookmakers (home perspective) */
function extractHandicapLineFromBookmakers(bms: Bookmaker[] | undefined, homeName: string, awayName: string) {
  if (!bms) return '';
  const homeNL = homeName.toLowerCase();
  for (const bm of bms) {
    for (const bet of bm.bets || []) {
      const lname = (bet.name || '').toLowerCase();
      if (lname.includes('handicap') || lname.includes('asian')) {
        if (bet.values && bet.values.length > 0) {
          // choose the value that corresponds to the home team if possible
          const homeVal =
            bet.values.find((v: any) => {
              const vv = String(v?.value ?? '').toLowerCase();
              const label = String(v?.label ?? '').toLowerCase();
              return vv.includes('home') || vv === '1' || vv.includes(homeNL) || label.includes(homeNL);
            }) ?? bet.values[0];

          // prefer numeric in label then value then bet.name
          if (homeVal?.label) {
            const m = String(homeVal.label).match(/([+-]?\d+(?:\.\d+)?)/);
            if (m) return m[0];
          }
          if (homeVal?.value) {
            const m2 = String(homeVal.value).match(/([+-]?\d+(?:\.\d+)?)/);
            if (m2) return m2[0];
          }
        }
        const m = String(bet.name).match(/([+-]?\d+(?:\.\d+)?)/);
        if (m) return m[0];
      }
    }
  }
  return '';
}

/**
 * Parse prediction response into structured object:
 * { team: 'home'|'away'|'named'|'draw', teamName?: string, hc?: string (number with sign), ou?: { side: 'tài'|'xỉu', value: '2.5' } }
 */
// utils nhỏ cho handicap — chèn vào đầu file nơi bạn dùng chúng

function parseNumericHandicapToken(token: string | null | undefined): number | null {
  if (!token) return null;
  token = String(token).replace(',', '.').trim();

  // Nếu dạng split "a/b" => convert sang trung bình (ví dụ 0/0.5 -> 0.25)
  if (token.includes('/')) {
    const parts = token.split('/').map((s) => s.replace(',', '.').trim()).filter(Boolean);
    const nums = parts.map((p) => Number(p)).filter((n) => !isNaN(n));
    if (nums.length === 2) {
      return (nums[0] + nums[1]) / 2;
    }
  }

  // match số thập phân hoặc integer có dấu +/- 
  const m = token.match(/([+-]?\d+(?:\.\d+)?)/);
  if (m) return Number(m[0]);
  return null;
}

function formatHandicapForDisplay(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '';
  // làm tròn tới 2 chữ số thập phân, giữ .25 .5 .75 đẹp
  const rounded = Math.round(num * 100) / 100;
  // convert -0 -> 0
  const val = Object.is(rounded, -0) ? 0 : rounded;
  // loại bỏ trailing zeros: 0.50 -> 0.5 ; 1.00 -> 1
  let s = val.toString();
  // nếu không âm thì thêm dấu +
  if (!s.startsWith('-')) s = `+${s}`;
  return s;
}

function parsePredictionStructured(predResp: any, homeName: string, awayName: string) {
  if (!predResp) return null;
  const first = predResp.response?.[0] ?? predResp;
  if (!first) return null;

  const pred = first.predictions ?? first;
  const winner = pred?.winner?.name ?? first?.winner?.name ?? null;
  const advice = pred?.advice ?? first?.advice ?? null;

  // Try to find handicap in various fields
  const textCandidates = [advice, winner, pred?.advice_text ?? pred?.text ?? pred?.winning ?? null].filter(Boolean).map(String);

  let hcNum: number | null = null;
  let teamRef: 'home' | 'away' | 'named' | null = null;
  let namedTeam = '';

  // helper parse token like above (reuse logic)
  const parseToken = (token: string | null) => {
    if (!token) return null;
    const t = token.replace(',', '.');
    // try find -?number with decimal or fraction a/b
    const fracMatch = t.match(/([+-]?\d+(?:\.\d+)?\s*\/\s*[+-]?\d+(?:\.\d+)?)/);
    if (fracMatch) {
      const avg = parseNumericHandicapToken(fracMatch[0]);
      if (avg !== null) return avg;
    }
    const m = t.match(/([+-]?\d+(?:\.\d+)?)/);
    if (m) return Number(m[0]);
    return null;
  };

  for (const t of textCandidates) {
    const n = parseToken(t);
    if (n !== null && hcNum === null) hcNum = n;
    if (/home/i.test(t)) { teamRef = 'home'; break; }
    if (/away/i.test(t)) { teamRef = 'away'; break; }
    if (homeName && t.toLowerCase().includes(homeName.toLowerCase())) { teamRef = 'named'; namedTeam = homeName; break; }
    if (awayName && t.toLowerCase().includes(awayName.toLowerCase())) { teamRef = 'named'; namedTeam = awayName; break; }
  }

  // Try find OU (over/under) from predictions.goals or first.goals
  let ou: { side: 'tài' | 'xỉu'; value: string } | null = null;
  const goals = pred?.goals ?? first?.goals ?? null;
  if (goals) {
    // many shapes: goals.under_over, goals.underOver, goals.value, or goals.line
    const val = goals.under_over ?? goals.underOver ?? goals.value ?? goals.line ?? null;
    if (val) {
      // side detection via keys or percentages
      const underPct = Number(goals.under ?? goals.Under ?? 0);
      const overPct = Number(goals.over ?? goals.Over ?? 0);
      let side: 'tài' | 'xỉu' | null = null;
      if (!isNaN(underPct) && !isNaN(overPct) && (underPct || overPct)) {
        side = underPct > overPct ? 'xỉu' : 'tài';
      } else if (String(val).toLowerCase().includes('under')) side = 'xỉu';
      else if (String(val).toLowerCase().includes('over')) side = 'tài';

      // extract numeric part (e.g., "2.5")
      const m = String(val).match(/([+-]?\d+(?:\.\d+)?)/);
      const v = m ? m[0] : String(val);
      if (side) ou = { side, value: v };
      else if (v) ou = { side: 'tài', value: v }; // fallback show value
    }
  } else {
    // sometimes under_over sits at pred.over or pred.total
    const overUnder = pred?.over_under ?? pred?.overUnder ?? pred?.total ?? null;
    if (overUnder) {
      const m = String(overUnder).match(/([+-]?\d+(?:\.\d+)?)/);
      const v = m ? m[0] : String(overUnder);
      const side = String(overUnder).toLowerCase().includes('under') ? 'xỉu' : (String(overUnder).toLowerCase().includes('over') ? 'tài' : null);
      if (side) ou = { side, value: v };
      else ou = { side: 'tài', value: v };
    }
  }

  // If no teamRef determined but winner string matches home/away names
  if (!teamRef && winner) {
    if (homeName && String(winner).toLowerCase().includes(homeName.toLowerCase())) { teamRef = 'named'; namedTeam = homeName; }
    else if (awayName && String(winner).toLowerCase().includes(awayName.toLowerCase())) { teamRef = 'named'; namedTeam = awayName; }
    else if (/home/i.test(String(winner))) teamRef = 'home';
    else if (/away/i.test(String(winner))) teamRef = 'away';
  }

  return { hc: hcNum, teamRef, namedTeam, ou };
}

function formatPredictionText(parsed: any, homeName: string, awayName: string) {
  if (!parsed) return null;
  const { hc, teamRef, namedTeam, ou } = parsed;
  let chosenTeamName = '';
  if (teamRef === 'home') chosenTeamName = homeName;
  else if (teamRef === 'away') chosenTeamName = awayName;
  else if (teamRef === 'named') chosenTeamName = namedTeam || '';
  // format handicap: use formatHandicapForDisplay to get sign and decimals
  const hcStr = hc !== undefined && hc !== null ? formatHandicapForDisplay(Number(hc)) : '';
  const parts: string[] = [];
  if (chosenTeamName) {
    if (hcStr) parts.push(`${chosenTeamName} ${hcStr}`);
    else parts.push(chosenTeamName);
  } else if (hcStr) {
    parts.push(`${hcStr}`);
  }
  if (ou) {
    parts.push(`${ou.side} ${ou.value}`);
  }
  if (parts.length === 0) return null;
  return parts.join(' và ');
}

export default function DuDoanPage() {
  const today = formatDateISO(new Date());
  const tomorrow = formatDateISO(new Date(Date.now() + 24 * 3600 * 1000));

  const { data: dataToday, error: errToday } = useSWR<{ odds: OddsEntry[] }>(`/api/odds?date=${today}`, fetcher, { revalidateOnFocus: false });
  const { data: dataTomorrow, error: errTomorrow } = useSWR<{ odds: OddsEntry[] }>(`/api/odds?date=${tomorrow}`, fetcher, { revalidateOnFocus: false });

  const loading = (!dataToday && !errToday) || (!dataTomorrow && !errTomorrow);

  // Merge raw odds from today & tomorrow (keep everything but only NS)
  const merged = useMemo(() => {
    const arr: OddsEntry[] = [];
    const pushEntries = (src?: { odds: OddsEntry[] }) => {
      if (!src?.odds) return;
      for (const e of src.odds) {
        const status = e?.fixture?.status?.short ?? 'NS';
        if (status && status !== 'NS') continue; // skip started/finished
        if (!e.bookmakers || e.bookmakers.length === 0) continue; // no odds -> skip
        arr.push(e);
      }
    };
    pushEntries(dataToday);
    pushEntries(dataTomorrow);

    arr.sort((a, b) => {
      const aIdx = PRIORITY_LEAGUES.indexOf(a.league?.id ?? -1);
      const bIdx = PRIORITY_LEAGUES.indexOf(b.league?.id ?? -1);
      const aScore = (aIdx === -1 ? 99 : aIdx) * 1000 - (a.bookmakers?.length ?? 0);
      const bScore = (bIdx === -1 ? 99 : bIdx) * 1000 - (b.bookmakers?.length ?? 0);
      return aScore - bScore;
    });

    return arr;
  }, [dataToday, dataTomorrow]);

  // Enrich list
  const enriched = useMemo(() => {
    return merged.map((e) => {
      const fixtureId = e.fixture?.id ?? 0;
      const timeISO = e.fixture?.date ?? new Date().toISOString();
      const homeName = safeTeamName(e, 'home') || e.teams?.home?.name || 'Đội chủ';
      const awayName = safeTeamName(e, 'away') || e.teams?.away?.name || 'Đội khách';
      const bookmakers = e.bookmakers ?? [];
      const hcLine = extractHandicapLineFromBookmakers(bookmakers, homeName, awayName);
      // Build unique league key: name + country (if exists) + id to avoid collisions
      const leagueKey = `${e.league?.name ?? 'Khác'}${e.league?.country ? ` (${e.league.country})` : ''}#${e.league?.id ?? ''}`;
      const leagueLabel = `${e.league?.name ?? 'Khác'}${e.league?.country ? ` - ${e.league.country}` : ''}`;
      return { entry: e, fixtureId, timeISO, homeName, awayName, bookmakers, hcLine, leagueKey, leagueLabel };
    });
  }, [merged]);

  // Batch fetch predictions for fixtures (same as before)
  const fixtureIds = useMemo(() => enriched.map((x) => x.fixtureId).filter(Boolean), [enriched]);

  const { data: predsMap, isValidating: predsLoading } = useSWR(
    fixtureIds.length ? ['predictionsBatch', fixtureIds.join(',')] : null,
    async () => {
      const results = await Promise.all(
        fixtureIds.map(async (fid) => {
          try {
            const r = await fetch(`/api/predictions?fixture=${fid}`);
            if (!r.ok) return { ok: false, data: null };
            const json = await r.json();
            return { ok: true, data: json };
          } catch {
            return { ok: false, data: null };
          }
        })
      );
      const map: Record<number, any> = {};
      results.forEach((r, idx) => {
        map[fixtureIds[idx]] = r.ok ? r.data : null;
      });
      return map;
    },
    { revalidateOnFocus: false }
  );

  // Compose final list: show ALL enriched entries, attach predictionText if exist
  const finalList = useMemo(() => {
    return enriched.map((it) => {
      const predResp = predsMap?.[it.fixtureId] ?? null;
      const parsed = parsePredictionStructured(predResp, it.homeName, it.awayName);
      const predictionText = parsed ? formatPredictionText(parsed, it.homeName, it.awayName) : null;
      return { ...it, predictionText };
    });
  }, [enriched, predsMap]);

  return (
    <main className="max-w-6xl mx-auto p-4 text-sm">
      <h1 className="text-2xl font-bold mb-4 text-center">Dự đoán & Kèo hôm nay</h1>

      <div className="border border-gray-300 rounded overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[96px_1fr_320px_320px] bg-green-800 text-white font-semibold text-center py-2 text-xs">
          <div className="flex items-center justify-center">Thời gian</div>
          <div className="flex items-center justify-center">Trận đấu</div>
          <div className="flex items-center justify-center">Kèo chấp</div>
          <div className="flex items-center justify-center">Dự đoán</div>
        </div>

        {(loading || predsLoading) && (
          <div className="p-4">
            <div className="animate-pulse space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        )}

        {(errToday || errTomorrow) && (
          <div className="p-4 text-red-600">Lỗi khi tải dữ liệu. Vui lòng thử tải lại trang.</div>
        )}

        {!loading && !predsLoading && finalList.length === 0 && (
          <div className="p-4 text-gray-600">Không tìm thấy kèo hôm nay hoặc ngày mai.</div>
        )}

        {/* Grouped by unique leagueKey (name + country + id) */}
        {finalList.length > 0 &&
          Array.from(
            finalList.reduce((acc, it) => {
              const key = it.leagueKey || 'Khác#';
              if (!acc.has(key)) acc.set(key, { label: it.leagueLabel, items: [] as typeof finalList });
              acc.get(key)!.items.push(it);
              return acc;
            }, new Map<string, { label: string; items: typeof finalList }>())
          ).map(([key, group]) => (
            <div key={key}>
              <div className="bg-green-700 text-white font-medium px-3 py-1 text-sm">{group.label}</div>
              <div role="list">
                {group.items.map((it) => {
                  const home = { name: it.homeName, logo: it.entry.teams?.home?.logo ?? null };
                  const away = { name: it.awayName, logo: it.entry.teams?.away?.logo ?? null };
                  return (
                    <CompactOddsRow
                      key={it.fixtureId}
                      fixtureId={it.fixtureId}
                      dateISO={it.timeISO}
                      home={home}
                      away={away}
                      bookmakers={it.bookmakers}
                      predictionText={it.predictionText ?? undefined}
                      leagueName={group.label}
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </main>
  );
}