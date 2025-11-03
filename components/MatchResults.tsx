// app/components/MatchResults.tsx
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import DateFilter, { DayItem } from "./DateFilter";
import PRIORITY_LEAGUES from "@/lib/leagues";
 

type Fixture = any;

function formatLocalYYYYMMDD(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function MatchResults() {
  // Build 7 days: today, yesterday, and previous 5 days
  const days: DayItem[] = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const date = formatLocalYYYYMMDD(d);
      let label = "";
      if (i === 0) label = "Hôm nay";
      else if (i === 1) label = "Hôm qua";
      else label = d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
      return { label, date };
    });
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(days[0].date);

  // Build league options from PRIORITY_LEAGUES to ensure only desired leagues are prioritized
  const leagueOptions = useMemo(() => {
    return [
      { id: 0, name: "Tất cả các giải đấu", slug: "" },
      ...PRIORITY_LEAGUES.map((l) => ({ id: l.id, name: l.name, slug: l.slug ?? "" })),
    ];
  }, []);

  const [selectedLeagueId, setSelectedLeagueId] = useState<number>(0); // 0 = all

  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);

  // reset when filters change
  useEffect(() => {
    setFixtures([]);
    setPage(1);
    setHasMore(false);
    setError(null);
    setDebug(null);
  }, [selectedDate, selectedLeagueId]);

  // helper: set of allowed league ids (priority)
  const allowedLeagueIds = useMemo(() => new Set(PRIORITY_LEAGUES.map((l) => l.id)), []);

  async function loadPage(p: number) {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(p));
      qs.set("limit", String(limit));
      qs.set("date", selectedDate);

      // Send league id only if specific priority league selected (not "Tất cả")
      if (selectedLeagueId && selectedLeagueId !== 0) {
        qs.set("league", String(selectedLeagueId));
      }

      const res = await fetch(`/api/fixtures?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json?.error ?? `HTTP ${res.status}`);
        setDebug(json);
      } else {
        // incoming fixtures
        const incoming: Fixture[] = json.fixtures ?? [];

        // Filter incoming fixtures to include only those whose league is in PRIORITY_LEAGUES.
        // If user explicitly selected a priority league (selectedLeagueId != 0) the API already filtered,
        // but we maintain extra client-side filter to be safe.
        const filteredIncoming = incoming.filter((f) => {
          const lid = f?.league?.id;
          if (!lid && selectedLeagueId === 0) return false; // discard fixtures without league id when showing "all"
          // If user selected a specific league, ensure it matches
          if (selectedLeagueId && selectedLeagueId !== 0) {
            return lid === selectedLeagueId;
          }
          // For "all" view, only keep fixtures that belong to allowed priority leagues
          return allowedLeagueIds.has(lid);
        });

        // append new fixtures, avoiding duplicates
        setFixtures((prev) => {
          const ids = new Set(prev.map((x) => x.fixture?.id));
          const toAdd = filteredIncoming.filter((f) => !ids.has(f.fixture?.id));
          return [...prev, ...toAdd];
        });
        setHasMore(Boolean(json.hasMore));
        setDebug(json.debug ?? null);
        setPage(p);
      }
    } catch (err: any) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  // initial load on filter change
  useEffect(() => {
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedLeagueId]);

  // intersection observer for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPage(page + 1);
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, hasMore, loading, page]);

  function scoreText(f: Fixture) {
    const gh = f?.goals?.home;
    const ga = f?.goals?.away;
    if (typeof gh === "number" && typeof ga === "number") return `${gh} - ${ga}`;
    const ft = f?.score?.fulltime;
    if (ft && (ft.home !== undefined || ft.away !== undefined)) return `${ft.home ?? "-"} - ${ft.away ?? "-"}`;
    return "-";
  }

  return (
    <div className="bg-white shadow-sm rounded-2xl p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <DateFilter days={days} selectedDate={selectedDate} onSelect={(d) => setSelectedDate(d)} />
        <div className="w-full md:w-auto">
          <select
            value={selectedLeagueId}
            onChange={(e) => setSelectedLeagueId(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full md:w-64 focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            {leagueOptions.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h2 className="font-semibold text-lg mb-4">
        {selectedLeagueId === 0
          ? `Kết quả ${days.find((d) => d.date === selectedDate)?.label ?? selectedDate}`
          : `Kết quả — ${leagueOptions.find((l) => l.id === selectedLeagueId)?.name ?? "Giải đấu"}`}{" "}
        ({fixtures.length})
      </h2>

      {error && <div className="text-red-500 p-3 rounded border mb-4">{error}</div>}

      <div className="space-y-4">
        {fixtures.map((f: any, idx) => (
          <div key={f.fixture?.id ?? idx} className="border border-gray-200 rounded-xl p-4 hover:shadow-md bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm font-medium text-gray-500">{f?.league?.name ?? ""}</div>
              <span className="text-xs text-gray-400">{f?.fixture?.status?.short ?? ""}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-left">
                <div className="font-medium">{f?.teams?.home?.name ?? "?"}</div>
                <div className="text-sm text-gray-600">{f?.teams?.away?.name ?? "?"}</div>
              </div>
              <div className="text-lg font-semibold text-gray-800">{scoreText(f)}</div>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              {f?.league?.round ? `Vòng: ${f.league.round}` : ""}
              {f?.fixture?.date ? ` • ${new Date(f.fixture.date).toLocaleString()}` : ""}
            </div>
          </div>
        ))}

        {loading && <div className="text-center text-gray-500 py-6">Đang tải...</div>}

        {!loading && fixtures.length === 0 && !error && (
          <div className="text-center text-gray-500 py-10 border rounded-xl">Không có trận đấu</div>
        )}

        <div ref={sentinelRef} />

        {!loading && hasMore && (
          <div className="text-center mt-4">
            <button onClick={() => loadPage(page + 1)} className="px-4 py-2 rounded-lg bg-green-600 text-white">
              Xem thêm
            </button>
          </div>
        )}
      </div>

      {debug && (
        <details className="mt-4 text-xs text-gray-600">
          <summary className="cursor-pointer">Debug</summary>
          <pre className="whitespace-pre-wrap">{JSON.stringify(debug, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}