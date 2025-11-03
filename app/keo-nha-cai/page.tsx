// app/keo-nha-cai/page.tsx
"use client";
import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { formatDateISO, fetcher } from "../../lib/api";
import DateTabs from "../../components/DateTabs";
import LeagueSelect from "../../components/LeagueSelect";
import FullOddsList from "./FullOddsList";
import type { Bookmaker } from "../../types/football";

const TARGET_ODD = 1.92;
const PRIORITY_LEAGUES = [
  "Premier League", "La Liga", "Ligue 1", "UEFA Champions League", "Champions League", "Bundesliga", "Serie A",
];

type ApiResp = { fixtures?: any[]; merged?: any[]; debug?: any };

function parseNumber(s: any): number | null {
  if (s == null) return null;
  if (typeof s === "number") return Number.isFinite(s) ? s : null;
  const str = String(s).replace(",", ".").trim();
  const m = str.match(/([+-]?\d+(\.\d+)?)/);
  return m ? Number(m[1]) : null;
}
function valueToOdd(v: any): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const candidates = [v.odd, v.price, v.value, v.rate];
  for (const c of candidates) {
    const n = parseNumber(c);
    if (n !== null) return n;
  }
  if (typeof v === "object") {
    for (const k of Object.keys(v)) {
      const n = parseNumber((v as any)[k]);
      if (n !== null) return n;
    }
  }
  return null;
}
function getBookmakerBets(bm: any) {
  if (!bm) return [];
  if (Array.isArray(bm.bets)) return bm.bets;
  if (Array.isArray(bm.markets)) return bm.markets;
  return [];
}
function getBetValues(bet: any) {
  if (!bet) return [];
  if (Array.isArray(bet.values)) return bet.values;
  if (Array.isArray(bet.options)) return bet.options;
  if (Array.isArray(bet.outcomes)) return bet.outcomes;
  return [];
}
function pickPreferredBookmakers(bookmakers?: Bookmaker[] | null): Bookmaker[] {
  if (!Array.isArray(bookmakers) || bookmakers.length === 0) return [];
  const lower = (s?: string) => (s ?? "").toLowerCase();
  const idx = bookmakers.findIndex((b) => {
    const n = lower((b as any).name);
    return n.includes("1xbet") || n.startsWith("1x");
  });
  if (idx !== -1) {
    const bm = bookmakers[idx];
    const rest = bookmakers.filter((_, i) => i !== idx);
    return [bm, ...rest];
  }
  return bookmakers;
}
function extractPairsFromBet(bet: any) {
  const vals = getBetValues(bet).map((v: any) => {
    const odd = valueToOdd(v);
    const text = String(v.label ?? v.value ?? v.name ?? "").toLowerCase();
    const tokenMatch = String(v.label ?? v.value ?? v.name ?? "").replace(",", ".").match(/([+-]?\d+(\.\d+)?)/);
    const token = tokenMatch ? Number(tokenMatch[1]) : null;
    return { odd, text, token };
  });
  const pairs: Array<{ lineNum: number | null; oddA: number | null; oddB: number | null }> = [];
  for (let i = 0; i < vals.length; i++) {
    for (let j = i + 1; j < vals.length; j++) {
      const a = vals[i], b = vals[j];
      const aIsO = /(^|[^a-z])(over|o\b)/.test(a.text);
      const bIsU = /(^|[^a-z])(under|u\b)/.test(b.text);
      const aIsU = /(^|[^a-z])(under|u\b)/.test(a.text);
      const bIsO = /(^|[^a-z])(over|o\b)/.test(b.text);
      if ((aIsO && bIsU) || (aIsU && bIsO)) {
        pairs.push({ lineNum: a.token ?? b.token ?? null, oddA: aIsO ? a.odd : b.odd, oddB: aIsU ? a.odd : b.odd });
      } else if (a.token !== null && b.token !== null) {
        pairs.push({ lineNum: a.token ?? b.token, oddA: a.odd, oddB: b.odd });
      }
    }
  }
  for (let i = 0; i + 1 < vals.length; i += 2) {
    pairs.push({ lineNum: vals[i].token ?? vals[i + 1].token ?? null, oddA: vals[i].odd, oddB: vals[i + 1].odd });
  }
  return pairs;
}
function chooseBestPair(pairs: any[]) {
  if (!pairs || pairs.length === 0) return null;
  const scored = pairs.map((p) => {
    const a = p.oddA ?? 0, b = p.oddB ?? 0;
    const avg = (a + b) / 2;
    const penalty = (p.oddA ? 0 : 5) + (p.oddB ? 0 : 5);
    return { p, score: Math.abs(avg - TARGET_ODD) + penalty };
  }).sort((x, y) => x.score - y.score);
  return scored[0]?.p ?? null;
}
function findBestHandicap(bookmakers?: Bookmaker[] | null) {
  const bms = pickPreferredBookmakers(bookmakers);
  for (const bm of bms) {
    for (const bet of getBookmakerBets(bm)) {
      const name = (bet.name ?? bet.label ?? bet.market ?? "").toLowerCase();
      if (!/handicap|asian|ah/.test(name)) continue;
      const pairs = extractPairsFromBet(bet);
      const best = chooseBestPair(pairs);
      if (best) {
        best.bookmakerName = bm.name;
        return best;
      }
    }
  }
  return null;
}
function findBestOverUnder(bookmakers?: Bookmaker[] | null) {
  const bms = pickPreferredBookmakers(bookmakers);
  for (const bm of bms) {
    for (const bet of getBookmakerBets(bm)) {
      const name = (bet.name ?? bet.label ?? bet.market ?? "").toLowerCase();
      if (!/over|under|total|goals|o\/u/.test(name)) continue;
      const pairs = extractPairsFromBet(bet);
      const best = chooseBestPair(pairs);
      if (best) {
        best.bookmakerName = bm.name;
        return best;
      }
    }
  }
  return null;
}
function findMatchWinner(bookmakers?: Bookmaker[] | null) {
  const bms = pickPreferredBookmakers(bookmakers);
  for (const bm of bms) {
    for (const bet of getBookmakerBets(bm)) {
      const name = (bet.name ?? bet.label ?? bet.market ?? "").toLowerCase();
      if (!/1x2|match winner|winner|three way|match odds/.test(name)) continue;
      const vals = getBetValues(bet);
      const homeVal = vals.find((v: any) => String(v.value ?? v.label ?? "").toLowerCase() === "home" || String(v.value ?? v.label ?? "").toLowerCase() === "1") ?? vals[0];
      const drawVal = vals.find((v: any) => String(v.value ?? v.label ?? "").toLowerCase() === "draw" || String(v.value ?? v.label ?? "").toLowerCase() === "x") ?? vals[1];
      const awayVal = vals.find((v: any) => String(v.value ?? v.label ?? "").toLowerCase() === "away" || String(v.value ?? v.label ?? "").toLowerCase() === "2") ?? vals[2];
      return { home: valueToOdd(homeVal) ?? null, draw: valueToOdd(drawVal) ?? null, away: valueToOdd(awayVal) ?? null, bookmakerName: bm.name };
    }
  }
  return null;
}

export default function KeoNhaCaiPage() {
  const todayISO = formatDateISO(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [league, setLeague] = useState<string>("all");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("date", selectedDate);
    if (league !== "all") p.set("league", String(league));
    return p.toString();
  }, [selectedDate, league]);

  const { data, error, isLoading, mutate } = useSWR<ApiResp>(`/api/odds-merged?${qs}`, fetcher, { revalidateOnFocus: true, dedupingInterval: 60_000 });

  const fixtures = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.fixtures)) return data.fixtures;
    if (Array.isArray((data as any).merged)) return (data as any).merged;
    return [];
  }, [data]);

  const groupedByLeague = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const f of fixtures) {
      const lname = f.league?.name ?? "Khác";
      if (!map.has(lname)) map.set(lname, []);
      map.get(lname)!.push(f);
    }
    const priority: string[] = [];
    for (const p of PRIORITY_LEAGUES) if (map.has(p)) priority.push(p);
    const rest = Array.from(map.keys()).filter(k => !priority.includes(k)).sort((a,b)=>a.localeCompare(b));
    const order = [...priority, ...rest];
    return order.map(l => [l, map.get(l)!] as [string, any[]]);
  }, [fixtures]);

  const formatLine = (n?: number | null) => {
    if (n == null) return "";
    return (n > 0 ? "+" : "") + (Math.abs(n) % 1 === 0 ? `${n}` : `${n}`);
  };

  return (
    <main className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Kèo nhà cái (ưu tiên 1xbet)</h1>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <DateTabs selectedDate={selectedDate} onSelect={(d) => (typeof d === "string" ? setSelectedDate(d) : setSelectedDate(formatDateISO(d)))} />
        <div className="flex items-center gap-4">
          <LeagueSelect value={league === "all" ? "all" : Number(league)} onChange={(v) => setLeague(v === "all" ? "all" : String(v))} />
          <button onClick={() => mutate()} className="px-3 py-1 rounded-md bg-gray-100 text-sm text-gray-700">Làm mới</button>
        </div>
      </div>

      {isLoading && <div className="grid grid-cols-1 gap-4">{Array.from({length:6}).map((_,i)=>(<div key={i} className="animate-pulse bg-white rounded-xl p-4 h-28" />))}</div>}
      {error && <div className="p-4 bg-red-50 text-red-700 rounded mb-4">Lỗi tải dữ liệu</div>}

      {!isLoading && fixtures.length === 0 && <div className="p-6 bg-white rounded-xl text-gray-500">Không có trận cho ngày này hoặc không có odds.</div>}

      <div className="space-y-8">
        {groupedByLeague.map(([leagueName, items]) => (
          <section key={leagueName}>
            <h2 className="text-lg font-semibold mb-3">{leagueName}</h2>
            <div className="w-full bg-white border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs text-gray-600 font-medium items-center">
                <div className="col-span-1">TG</div>
                <div className="col-span-4">Trận đấu</div>
                <div className="col-span-3">Kèo chấp</div>
                <div className="col-span-2">Tài / Xỉu</div>
                <div className="col-span-2">1X2</div>
              </div>

              <div>
                {items.map((m: any) => {
                  const fx = m.fixture ?? m;
                  const fixtureId = fx?.id ?? Math.floor(Math.random()*1e6);
                  const timeISO = fx?.date ?? new Date().toISOString();
                  const home = m.teams?.home?.name ?? fx?.teams?.home?.name ?? "Home";
                  const away = m.teams?.away?.name ?? fx?.teams?.away?.name ?? "Away";
                  const bookmakers: Bookmaker[] = Array.isArray(m.odds) ? m.odds : Array.isArray(m.bookmakers) ? m.bookmakers : [];

                  const bestHC = findBestHandicap(bookmakers);
                  const bestOU = findBestOverUnder(bookmakers);
                  const mwin = findMatchWinner(bookmakers);

                  const dt = new Date(timeISO);
                  const timeStr = isNaN(dt.getTime()) ? timeISO.slice(11,16) : dt.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
                  const dateStr = isNaN(dt.getTime()) ? "" : dt.toLocaleDateString();

                  const hcLine = bestHC?.lineNum ?? null;
                  const hcHomeOdd = bestHC?.oddA ? Number(bestHC.oddA).toFixed(2) : "-";
                  const hcAwayOdd = bestHC?.oddB ? Number(bestHC.oddB).toFixed(2) : "-";
                  const hcLineStr = hcLine !== null ? formatLine(hcLine) : "";

                  const ouLine = bestOU?.lineNum ?? null;
                  const ouOverOdd = bestOU?.oddA ? Number(bestOU.oddA).toFixed(2) : "-";
                  const ouUnderOdd = bestOU?.oddB ? Number(bestOU.oddB).toFixed(2) : "-";
                  const ouLineStr = ouLine !== null ? (Number.isInteger(ouLine) ? `${ouLine}.0` : `${ouLine}`) : "";

                  return (
                    <div key={fixtureId} className="border-t last:border-b-0">
                      <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm">
                        <div className="col-span-1 text-xs text-sky-600">
                          <div>{timeStr}</div>
                          <div className="text-[11px] text-gray-400">{dateStr}</div>
                        </div>

                        <div className="col-span-4">
                          <div className="font-semibold truncate">{home} vs {away}</div>
                          <div className="text-xs text-gray-400 mt-1">{m.league?.country ?? ""}</div>
                        </div>

                        <div className="col-span-3 text-xs">
                          <div className="flex justify-between">
                            <div>Home{bestHC?.bookmakerName ? ` (${bestHC.bookmakerName})` : ""}</div>
                            <div className="text-right">
                              <div className="font-semibold">{hcHomeOdd}</div>
                              <div className="text-[11px] text-gray-400">{hcLineStr}</div>
                            </div>
                          </div>
                          <div className="flex justify-between mt-1">
                            <div>Away</div>
                            <div className="text-right">
                              <div className="font-semibold">{hcAwayOdd}</div>
                              <div className="text-[11px] text-gray-400">{hcLineStr}</div>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2 text-xs">
                          <div className="flex justify-between">
                            <div>O {ouLineStr}{bestOU?.bookmakerName ? ` (${bestOU.bookmakerName})` : ""}</div>
                            <div className="font-semibold">{ouOverOdd}</div>
                          </div>
                          <div className="flex justify-between mt-1">
                            <div>U {ouLineStr}</div>
                            <div className="font-semibold">{ouUnderOdd}</div>
                          </div>
                        </div>

                        <div className="col-span-2 text-xs">
                          <div className="flex">
                            <div className="w-1/3 text-center">
                              <div className="text-[11px] text-gray-400">1</div>
                              <div className="font-semibold">{mwin?.home ? Number(mwin.home).toFixed(2) : "-"}</div>
                              {mwin?.bookmakerName && <div className="text-[10px] text-gray-400">{mwin.bookmakerName}</div>}
                            </div>
                            <div className="w-1/3 text-center">
                              <div className="text-[11px] text-gray-400">X</div>
                              <div className="font-semibold">{mwin?.draw ? Number(mwin.draw).toFixed(2) : "-"}</div>
                            </div>
                            <div className="w-1/3 text-center">
                              <div className="text-[11px] text-gray-400">2</div>
                              <div className="font-semibold">{mwin?.away ? Number(mwin.away).toFixed(2) : "-"}</div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}