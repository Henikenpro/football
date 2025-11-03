"use client";
import React, { useEffect, useMemo, useState } from "react";

type FixtureItem = any;
type StandingRow = any;

function parseRoundNumber(roundText?: string | null): number | null {
  if (!roundText) return null;
  const clean = roundText.toString().trim();
  const match = clean.match(/(\d{1,3})(?!.*\d)/);
  if (match) return Number(match[1]);
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}

function normalizeRoundText(txt?: string | null) {
  if (!txt) return "";
  return txt.toString().trim();
}

function fixtureIsFinished(f: any) {
  const st = (f?.fixture?.status?.short ?? "").toString().toUpperCase();
  if (["FT", "AET", "P", "FT_PEN", "AWD", "AWY"].includes(st)) return true;
  const gh = f?.goals?.home;
  const ga = f?.goals?.away;
  if (typeof gh === "number" && typeof ga === "number") return true;
  return false;
}

// Fetch helper returns structured result without throwing on 4xx/5xx
async function fetchJSONWithStatus(url: string) {
  const res = await fetch(url);
  const status = res.status;
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { ok: res.ok, status, json };
}

// Robust parse for standings responses
function parseStandingsFromJson(json: any): any[] {
  if (!json) return [];
  if (Array.isArray(json.response) && json.response.length > 0) {
    for (const r of json.response) {
      const st = r?.league?.standings;
      if (Array.isArray(st) && st.length > 0) return Array.isArray(st[0]) ? st[0] : st;
    }
  }
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data)) return json.data;
  const findArray = (obj: any): any[] | null => {
    if (!obj || typeof obj !== "object") return null;
    if (Array.isArray(obj)) {
      if (obj.length > 0 && typeof obj[0] === "object" && ("team" in obj[0] || "points" in obj[0] || "name" in obj[0])) {
        return obj;
      }
      for (const el of obj) {
        const res = findArray(el);
        if (res) return res;
      }
      return null;
    }
    for (const k of Object.keys(obj)) {
      const res = findArray(obj[k]);
      if (res) return res;
    }
    return null;
  };
  const found = findArray(json);
  return found ?? [];
}

/* ---------- Vietnamese round translation + ordering ---------- */

// Map groups of keywords to VN labels with an order score
const ROUND_LABEL_VN_MAP: Array<{ keys: string[]; label: string; order: number }> = [
  { keys: ["group stage", "group a", "group b", "group c", "group d", "group e", "group f", "group g", "group h", "group"], label: "Vòng bảng", order: 10 },
  { keys: ["round of 32"], label: "Vòng 1/16", order: 20 },
  { keys: ["round of 24"], label: "Vòng loại", order: 25 },
  { keys: ["round of 16", "round 16"], label: "Vòng 1/16", order: 30 },
  { keys: ["round of 12"], label: "Vòng 1/12", order: 35 },
  { keys: ["round of 8", "round 8"], label: "Vòng 1/8", order: 40 },
  { keys: ["quarter", "quarter-finals", "quarterfinals", "quarter final"], label: "Tứ kết", order: 50 },
  { keys: ["semi", "semi-finals", "semifinals", "semi final"], label: "Bán kết", order: 60 },
  { keys: ["final"], label: "Chung kết", order: 70 },
  { keys: ["play-offs", "play offs", "playoff", "play-off"], label: "Vòng play-off / Vòng tranh vé", order: 80 },
];

// Translate round text to Vietnamese label
function translateRoundToVN(roundText?: string | null): string {
  if (!roundText) return "";
  const t = roundText.toString().trim().toLowerCase();

  for (const entry of ROUND_LABEL_VN_MAP) {
    for (const k of entry.keys) {
      if (t.includes(k)) return entry.label;
    }
  }

  const onlyNumber = t.match(/^\d+$/);
  if (onlyNumber) return `Vòng ${onlyNumber[0]}`;

  const numMatch = t.match(/(\d{1,3})(?!.*\d)/);
  if (numMatch) return `Vòng ${numMatch[1]}`;

  // Fallback: return original with first letter uppercase
  return roundText.toString();
}

// Get ordering score for cup rounds (lower = earlier)
function getCupOrderScore(roundText?: string | null): number {
  if (!roundText) return Infinity;
  const t = roundText.toString().trim().toLowerCase();
  for (const entry of ROUND_LABEL_VN_MAP) {
    for (const k of entry.keys) {
      if (t.includes(k)) return entry.order;
    }
  }
  const numMatch = t.match(/(\d{1,3})(?!.*\d)/);
  if (numMatch) return 1000 + Number(numMatch[1]);
  return Infinity;
}

/* ------------------------------------------------------------ */

export default function ScheduleAndStandings({
  initialFixtures = [],
  initialStandings = [],
  initialAllFixtures = [],
  seasons = [],
  currentSeason,
  league,
  currentRound = "",
}: {
  initialFixtures?: FixtureItem[];
  initialStandings?: StandingRow[];
  initialAllFixtures?: FixtureItem[];
  seasons?: number[]; // seasons available from server
  currentSeason?: number; // initial season
  league: { id: number; slug: string; name: string; season: number };
  currentRound?: string;
}) {
  const [allFixtures, setAllFixtures] = useState<FixtureItem[]>(
    initialAllFixtures && initialAllFixtures.length > 0
      ? initialAllFixtures
      : initialFixtures ?? []
  );
  const [standings, setStandings] = useState<StandingRow[]>(
    initialStandings ?? []
  );

  const defaultSeason =
    currentSeason ?? league?.season ?? new Date().getFullYear();
  const [selectedSeason, setSelectedSeason] = useState<number>(defaultSeason);
  const seasonsList = seasons && seasons.length > 0 ? seasons : [defaultSeason];

  const [loadingSeason, setLoadingSeason] = useState(false);
  const [seasonError, setSeasonError] = useState<string | null>(null);

  const leagueRounds = useMemo(
    () => Array.from({ length: 38 }, (_, i) => i + 1),
    []
  );

  const isEuropeanCup = useMemo(() => {
    const name = (league?.name ?? "").toString().toLowerCase();
    return /champions|europa|conference/i.test(name);
  }, [league]);

  const distinctRoundTexts = useMemo(() => {
    const set = new Set<string>();
    for (const f of allFixtures) {
      const r = normalizeRoundText(f?.league?.round ?? f?.round ?? "");
      if (r) set.add(r);
    }
    return Array.from(set);
  }, [allFixtures]);

  const availableRoundOptions = useMemo(() => {
    if (!isEuropeanCup) {
      return leagueRounds.map((n) => ({
        value: String(n),
        label: `Vòng ${n}`,
        numeric: n,
      }));
    }
    const items = distinctRoundTexts.slice();
    const scored = items
      .map((txt) => {
        const score = getCupOrderScore(txt);
        return { txt, score };
      })
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.txt.localeCompare(b.txt);
      });
    const opts = scored.map((s) => ({
      value: s.txt,
      label: translateRoundToVN(s.txt),
      numeric: parseRoundNumber(s.txt) ?? undefined,
    }));
    return opts.length > 0
      ? opts
      : leagueRounds.map((n) => ({
          value: String(n),
          label: `Vòng ${n}`,
          numeric: n,
        }));
  }, [isEuropeanCup, distinctRoundTexts, leagueRounds]);

  const highestFinishedRound = useMemo(() => {
    if (availableRoundOptions.length === 0) return null;
    const numericOptions = availableRoundOptions.filter(
      (o) => typeof o.numeric === "number"
    );
    if (numericOptions.length > 0) {
      let highest = 0;
      for (const f of allFixtures) {
        const rnd =
          parseRoundNumber(f?.league?.round) ??
          parseRoundNumber(f?.round) ??
          null;
        if (!rnd) continue;
        if (fixtureIsFinished(f) && rnd > highest) highest = rnd;
      }
      return highest > 0 ? highest : null;
    }
    let lastIndex = -1;
    for (let i = 0; i < availableRoundOptions.length; i++) {
      const opt = availableRoundOptions[i];
      const matches = allFixtures.filter(
        (f) =>
          normalizeRoundText(f?.league?.round ?? f?.round ?? "") === opt.value
      );
      if (matches.some((m) => fixtureIsFinished(m))) lastIndex = i;
    }
    return lastIndex >= 0 ? availableRoundOptions[lastIndex].value : null;
  }, [availableRoundOptions, allFixtures]);

  const parsedCurrentFromProp = useMemo(() => {
    if (!currentRound) return null;
    const n = parseRoundNumber(currentRound);
    if (n && !isEuropeanCup) return n;
    return normalizeRoundText(currentRound);
  }, [currentRound, isEuropeanCup]);

  const derivedCurrentRound = useMemo(() => {
    if (parsedCurrentFromProp) return parsedCurrentFromProp;
    if (highestFinishedRound) return highestFinishedRound;
    if (availableRoundOptions.length > 0) {
      const o = availableRoundOptions[0];
      return o.numeric ?? o.value;
    }
    return 1;
  }, [parsedCurrentFromProp, highestFinishedRound, availableRoundOptions]);

  const [selectedRound, setSelectedRound] = useState<string | number>(
    derivedCurrentRound as string | number
  );

  useEffect(() => {
    setSelectedRound(derivedCurrentRound as string | number);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedCurrentRound]);

  const fixturesForRound = useMemo(() => {
    if (!allFixtures || allFixtures.length === 0) return [];
    if (typeof selectedRound === "number") {
      return allFixtures.filter((f) => {
        const rndNum =
          parseRoundNumber(f?.league?.round) ??
          parseRoundNumber(f?.round) ??
          null;
        return rndNum === selectedRound;
      });
    }
    const sel = normalizeRoundText(String(selectedRound));
    return allFixtures.filter((f) => {
      const rtxt = normalizeRoundText(f?.league?.round ?? f?.round ?? "");
      return rtxt === sel;
    });
  }, [allFixtures, selectedRound]);

  const groupedByDay = useMemo(() => {
    if (!fixturesForRound || fixturesForRound.length === 0) return [];
    const map = new Map<string, FixtureItem[]>();
    for (const f of fixturesForRound) {
      const date = f.fixture?.date
        ? new Date(f.fixture.date).toLocaleDateString("vi-VN", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "Không rõ";
      const arr = map.get(date) ?? [];
      arr.push(f);
      map.set(date, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => {
        const da = new Date(a[1][0]?.fixture?.date ?? 0).getTime();
        const db = new Date(b[1][0]?.fixture?.date ?? 0).getTime();
        return da - db;
      })
      .map(([date, arr]) => ({ date, fixtures: arr }));
  }, [fixturesForRound]);

  function formatTime(iso?: string) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadSeason(season: number) {
      setLoadingSeason(true);
      setSeasonError(null);

      try {
        const fixturesResp = await fetchJSONWithStatus(
          `/api/football/fixtures?league=${league.id}&season=${season}`
        );
        const standingsResp = await fetchJSONWithStatus(
          `/api/football/standings?league=${league.id}&season=${season}`
        );

        if (!mounted) return;

        if (!fixturesResp.ok && fixturesResp.status === 404) {
          setSeasonError(
            `Không có dữ liệu fixtures cho mùa ${season} (HTTP 404).`
          );
          setLoadingSeason(false);
          const url = new URL(window.location.href);
          url.searchParams.set("season", String(season));
          window.history.replaceState({}, "", url.toString());
          return;
        }

        if (!fixturesResp.ok && fixturesResp.status === 403) {
          setSeasonError(
            `Truy cập bị từ chối (HTTP 403). Kiểm tra API key / quota.`
          );
          setLoadingSeason(false);
          return;
        }

        if (!fixturesResp.ok || !standingsResp.ok) {
          const code =
            (!fixturesResp.ok ? fixturesResp.status : standingsResp.status) ??
            500;
          setSeasonError(`Lỗi khi tải dữ liệu (HTTP ${code}).`);
          setLoadingSeason(false);
          return;
        }

        const fixturesArray: any[] = Array.isArray(fixturesResp.json?.response)
          ? fixturesResp.json.response
          : [];

        let standingsArray: any[] = parseStandingsFromJson(standingsResp.json);

        const hasNewFixtures = Array.isArray(fixturesArray) && fixturesArray.length > 0;
        if (hasNewFixtures) {
          setAllFixtures(fixturesArray);
        }

        if (standingsArray && standingsArray.length > 0) {
          setStandings(standingsArray);
          setSeasonError(null);
        } else {
          // fallback try previous season(s) (up to 2 seasons back)
          const maxFallbacks = 2;
          let found: any[] | null = null;
          for (let i = 1; i <= maxFallbacks; i++) {
            const trySeason = season - i;
            if (trySeason <= 0) break;
            try {
              const fbResp = await fetchJSONWithStatus(
                `/api/football/standings?league=${league.id}&season=${trySeason}`
              );
              if (fbResp.ok) {
                const parsed = parseStandingsFromJson(fbResp.json);
                if (parsed && parsed.length > 0) {
                  found = parsed;
                  setSeasonError(`Không có bảng xếp hạng cho mùa ${season}. Hiển thị bảng của mùa ${trySeason} tạm thời.`);
                  break;
                }
              }
            } catch {
              // ignore and continue
            }
          }
          if (found && found.length > 0) {
            setStandings(found);
          } else {
            // no standings found; set empty to avoid showing stale wrongly-labeled data
            setStandings([]);
            setSeasonError((prev) => prev ?? `Không có bảng xếp hạng cho mùa ${season}.`);
          }
        }

        if (!isEuropeanCup) {
          setSelectedRound(1);
        } else {
          const setTxt = new Set<string>();
          for (const f of fixturesArray) {
            const r = normalizeRoundText(f?.league?.round ?? f?.round ?? "");
            if (r) setTxt.add(r);
          }
          const items = Array.from(setTxt);
          if (items.length > 0) {
            const scored = items.map((txt) => {
              const t = txt.toString();
              const idx = getCupOrderScore(t);
              const score = idx === Infinity ? 9999 : idx;
              return { txt: t, score };
            });
            scored.sort((a, b) =>
              a.score !== b.score ? a.score - b.score : a.txt.localeCompare(b.txt)
            );
            setSelectedRound(scored[0].txt);
          } else {
            setSelectedRound("");
          }
        }

        const url = new URL(window.location.href);
        url.searchParams.set("season", String(season));
        window.history.replaceState({}, "", url.toString());
      } catch (err: any) {
        if (!mounted) return;
        setSeasonError(err?.message ?? "Lỗi mạng khi tải mùa.");
      } finally {
        if (mounted) setLoadingSeason(false);
      }
    }

    loadSeason(selectedSeason);

    return () => {
      mounted = false;
    };
  }, [selectedSeason, league.id, Boolean(isEuropeanCup)]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      {/* Fixtures */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div className="flex flex-wrap justify-between items-center bg-red-600 text-white text-lg font-semibold px-4 py-3">
          <div>
            <div className="font-semibold">LỊCH THI ĐẤU &amp; KẾT QUẢ — {league?.name}</div>
            <div className="text-xs text-white/80">Mùa: {selectedSeason}</div>
          </div>

          <div className="flex items-center gap-3">
            {/* season select */}
            <div className="text-sm text-white/90">Mùa</div>
            <select
              value={String(selectedSeason)}
              onChange={(e) => setSelectedSeason(Number(e.target.value))}
              className="bg-white text-gray-800 text-sm px-2 py-1 rounded-md border border-gray-300"
            >
              {(() => {
                const currentYear = new Date().getFullYear();
                const recentSeasons = [currentYear, currentYear - 1, currentYear - 2];
                return recentSeasons.map((s) => {
                  const next = s + 1;
                  return (
                    <option key={s} value={s}>
                      {`${s}/${next.toString().slice(-2)}`}
                    </option>
                  );
                });
              })()}
            </select>

            {/* round select */}
            <div className="text-sm text-white/90">Vòng</div>

            <select
              value={String(selectedRound)}
              onChange={(e) => {
                const v = e.target.value;
                const found = availableRoundOptions.find((o) => String(o.value) === v);
                if (found && typeof found.numeric === "number") setSelectedRound(found.numeric);
                else {
                  const n = parseRoundNumber(v);
                  if (n) setSelectedRound(n);
                  else setSelectedRound(v);
                }
              }}
              className="bg-white text-gray-800 text-sm font-medium px-2 py-1 rounded-md border border-gray-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              {availableRoundOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="text-sm text-white/80">
              (Hiện tại: {typeof derivedCurrentRound === "number" ? `Vòng ${derivedCurrentRound}` : String(derivedCurrentRound)})
            </div>
          </div>
        </div>

        {loadingSeason && (
          <div className="p-4 text-center text-gray-600">Đang tải dữ liệu mùa {selectedSeason}...</div>
        )}

        {seasonError && (
          <div className="p-4 text-center text-red-600">{seasonError}</div>
        )}

        {!loadingSeason && groupedByDay.length === 0 && !seasonError && (
          <div className="p-6 text-center text-gray-500">Không có lịch thi đấu cho vòng {String(selectedRound)}</div>
        )}

        {groupedByDay.map((day, i) => (
          <div key={i} className="border-t border-gray-100">
            <div className="bg-gray-100 text-center py-2 font-semibold text-sm uppercase">{day.date}</div>

            {day.fixtures.map((f: any, j: number) => {
              const home = f.teams?.home?.name ?? f.home ?? "?";
              const away = f.teams?.away?.name ?? f.away ?? "?";
              const gh = f.goals?.home;
              const ga = f.goals?.away;
              const finished = fixtureIsFinished(f);
              const score = finished
                ? typeof gh === "number" || typeof ga === "number"
                  ? `${gh ?? "-"} - ${ga ?? "-"}`
                  : f.score?.fulltime
                  ? `${f.score.fulltime.home ?? "-"} - ${f.score.fulltime.away ?? "-"}`
                  : "-"
                : "-";
              const stadium = f.fixture?.venue?.name ?? f.stadium ?? "";
              const time = formatTime(f.fixture?.date);
              const roundLabel = translateRoundToVN(f?.league?.round ?? f?.round ?? "");

              return (
                <div key={j} className="flex flex-col md:flex-row justify-between items-center border-b border-gray-200 px-3 py-3 hover:bg-gray-50 transition">
                  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
                    <span className="text-xs text-gray-500 hidden md:inline">{roundLabel}</span>
                    <span className="font-medium text-gray-800 text-sm md:text-base">{home}</span>
                    <span className="bg-gray-200 rounded-md px-3 py-1 font-bold text-sm md:text-base min-w-[80px] text-center">{score}</span>
                    <span className="font-medium text-gray-800 text-sm md:text-base">{away}</span>
                  </div>

                  <div className="text-xs text-gray-500 mt-2 md:mt-0 text-center md:text-right w-full md:w-auto">{stadium} {time && `• ${time}`}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Standings */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div className="bg-red-600 text-white text-lg font-semibold px-4 py-3">BẢNG XẾP HẠNG — {selectedSeason}</div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Đội bóng</th>
                <th className="px-3 py-2 text-center">Tr</th>
                <th className="px-3 py-2 text-center">T</th>
                <th className="px-3 py-2 text-center">H</th>
                <th className="px-3 py-2 text-center">B</th>
                <th className="px-3 py-2 text-center">BT</th>
                <th className="px-3 py-2 text-center">BB</th>
                <th className="px-3 py-2 text-center">±</th>
                <th className="px-3 py-2 text-center">Điểm</th>
                <th className="px-3 py-2 text-center">Phong độ</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((t: any, i: number) => {
                const teamName = t.team?.name ?? t.team ?? "—";
                const played = t.all?.played ?? t.played ?? 0;
                const win = t.all?.win ?? t.win ?? 0;
                const draw = t.all?.draw ?? t.draw ?? 0;
                const lose = t.all?.lose ?? t.lose ?? 0;
                const gf = t.all?.goals?.for ?? t.gf ?? 0;
                const ga = t.all?.goals?.against ?? t.ga ?? 0;
                const pts = t.points ?? t.pts ?? 0;
                const gd = gf - ga;
                const form = Array.isArray(t.form)
                  ? t.form
                  : t.form
                  ? typeof t.form === "string"
                    ? t.form.split("")
                    : []
                  : [];

                return (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-3 py-2 text-center font-medium text-gray-700">{i + 1}</td>
                    <td className="px-3 py-2 font-semibold text-gray-800">{teamName}</td>
                    <td className="text-center">{played}</td>
                    <td className="text-center">{win}</td>
                    <td className="text-center">{draw}</td>
                    <td className="text-center">{lose}</td>
                    <td className="text-center">{gf}</td>
                    <td className="text-center">{ga}</td>
                    <td className="text-center">{gd > 0 ? `+${gd}` : gd}</td>
                    <td className="text-center font-semibold">{pts}</td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        {form.map((f: string, idx: number) => {
                          const up = (f ?? "").toUpperCase();
                          const cls = up === "W" ? "bg-green-600 text-white" : up === "D" ? "bg-gray-400 text-white" : "bg-red-600 text-white";
                          return (
                            <span key={idx} className={`text-xs px-2 py-0.5 rounded-sm font-bold ${cls}`}>{up}</span>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 text-xs text-gray-500 border-t border-gray-100 text-center">Kéo ngang trên điện thoại để xem đầy đủ cột.</div>
      </div>

      <div className="hidden bg-green-600 bg-gray-400 bg-red-600" />
    </div>
  );
}