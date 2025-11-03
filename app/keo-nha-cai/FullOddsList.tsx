// app/keo-nha-cai/FullOddsList.tsx
"use client";
import React from "react";
import type { Bookmaker, Bet, BetValue } from "../../types/football";

type Props = {
  merged: Array<any>;
};

function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(11, 16);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderBetValues(values: any[]) {
  if (!Array.isArray(values) || values.length === 0) return <div className="text-xs text-gray-400">No values</div>;
  return (
    <div className="space-y-1">
      {values.map((v, i) => {
        const label = (v.label ?? v.value ?? v.name ?? "").toString();
        const odd = v.odd ?? v.price ?? null;
        return (
          <div key={i} className="flex justify-between items-center text-sm">
            <div className="truncate pr-2 text-left">{label || "-"}</div>
            <div className="font-semibold ml-4">{odd !== undefined && odd !== null ? Number(odd).toFixed(2) : "-"}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function FullOddsList({ merged }: Props) {
  return (
    <div className="space-y-8">
      {merged.map((m) => {
        const fixtureId = m.fixture?.id ?? Math.floor(Math.random() * 1e6);
        const dt = m.fixture?.date;
        const home = m.teams?.home?.name ?? "Home";
        const away = m.teams?.away?.name ?? "Away";
        const bookmakers: Bookmaker[] = Array.isArray(m.odds) ? m.odds : Array.isArray(m.bookmakers) ? m.bookmakers : [];

        return (
          <div key={fixtureId} className="bg-white rounded-lg shadow-sm overflow-hidden border">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold">{home} vs {away}</div>
                <div className="text-xs text-gray-500">{m.league?.name ?? ""} {m.league?.country ? `• ${m.league.country}` : ""}</div>
              </div>
              <div className="text-sm text-sky-600 text-right">
                <div>{formatTime(dt)}</div>
                <div className="text-xs text-gray-400">{dt ? new Date(dt).toLocaleDateString() : ""}</div>
              </div>
            </div>

            <div className="px-4 py-3">
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-12 gap-2 text-xs text-gray-600 font-medium bg-gray-50 px-3 py-2 rounded-t">
                    <div className="col-span-3">Bookmaker</div>
                    <div className="col-span-3">Market</div>
                    <div className="col-span-6">Values / Odds</div>
                  </div>

                  {bookmakers.length === 0 && <div className="px-3 py-4 text-sm text-gray-500">Không có odds từ nhà cái nào</div>}

                  {bookmakers.map((bm, bi) => (
                    <div key={bi} className="grid grid-cols-12 gap-2 px-3 py-3 border-t items-start">
                      <div className="col-span-3">
                        <div className="font-semibold">{bm.name}</div>
                        {bm.logo && <img src={bm.logo} alt={bm.name} className="w-16 mt-2" />}
                      </div>

                      <div className="col-span-3 space-y-2 text-sm">
                        {Array.isArray(bm.bets) && bm.bets.length > 0 ? (
                          bm.bets.map((bet: Bet, i: number) => (
                            <div key={i} className="py-1">
                             {/*  <div className="font-medium">{bet.name ?? bet.label ?? "Market"}</div> */}
                              <div className="text-xs text-gray-400">{(bet as any).id ? `id: ${(bet as any).id}` : ""}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-400">No markets</div>
                        )}
                      </div>

                      <div className="col-span-6 text-sm space-y-3">
                        {Array.isArray(bm.bets) && bm.bets.length > 0 ? (
                          bm.bets.map((bet: Bet, i: number) => (
                            <div key={i} className="border rounded px-3 py-2 bg-gray-50">
                              <div className="flex items-center justify-between">
                                {/* <div className="text-sm font-medium">{bet.name ?? bet.label ?? "Market"}</div>
                                 */}<div className="text-xs text-gray-400">
                                  {/(handicap|asian)/i.test(bet.name ?? "") && <span>Handicap</span>}
                                  {/(over|under|total|o\/u|goals)/i.test(bet.name ?? "") && <span>O/U</span>}
                                  {/(match winner|1x2|winner|three way|match odds)/i.test(bet.name ?? "") && <span>1X2</span>}
                                </div>
                              </div>

                              <div className="mt-2">
                                {renderBetValues(Array.isArray(bet.values) ? bet.values : (Array.isArray((bet as any).options) ? (bet as any).options : []))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-400">No market values</div>
                        )}
                      </div>
                    </div>
                  ))}

                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}