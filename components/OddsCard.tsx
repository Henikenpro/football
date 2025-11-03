// components/OddsCard.tsx
'use client';
import React, { useMemo, useState } from 'react';
import { Bookmaker, Bet, BetValue } from '../types/football';

function getLabel(v: BetValue) {
  return v.label ?? v.value;
}

export default function OddsCard({
  bookmakers,
  containerId,
}: {
  bookmakers: Bookmaker[];
  containerId: string;
}) {
  const [expanded, setExpanded] = useState(false);

  // Collect markets across bookmakers
  const markets = useMemo(() => {
    const map = new Map<string, Bet[]>(); // marketName -> list of Bet (from bookmakers)
    bookmakers.forEach((bm) => {
      bm.bets.forEach((bet) => {
        const key = bet.name;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(bet);
      });
    });
    // return array of [marketName, combined bets]
    return Array.from(map.keys());
  }, [bookmakers]);

  // Compute best odds per market/outcome
  const bestByMarket = useMemo(() => {
    const out: Record<
      string,
      {
        [outcome: string]: {
          odd: number;
          bookmaker?: string;
        };
      }
    > = {};

    bookmakers.forEach((bm) => {
      bm.bets.forEach((bet) => {
        const market = bet.name;
        if (!out[market]) out[market] = {};
        bet.values.forEach((v) => {
          const outcome = getLabel(v);
          const odd = Number(v.odd);
          if (!out[market][outcome] || odd > out[market][outcome].odd) {
            out[market][outcome] = { odd, bookmaker: bm.name };
          }
        });
      });
    });

    return out;
  }, [bookmakers]);

  // Pick markets to show by default
  const topMarkets = markets.slice(0, 3);

  return (
    <div
      id={containerId}
      className="mt-3 bg-white rounded-lg border border-gray-100 p-3 shadow-sm text-sm overflow-auto"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-gray-500">Bookmakers ({bookmakers.length})</div>
        <button
          onClick={() => setExpanded((s) => !s)}
          className="text-xs text-blue-600 underline"
          aria-expanded={expanded}
        >
          {expanded ? 'Thu gọn thị trường' : 'Xem thêm thị trường'}
        </button>
      </div>

      <div className="space-y-3">
        {(expanded ? markets : topMarkets).map((market) => {
          const headerOutcomes = Array.from(
            new Set(
              bookmakers.flatMap((bm) =>
                bm.bets
                  .filter((b) => b.name === market)
                  .flatMap((b) => b.values.map((v) => getLabel(v)))
              )
            )
          );
          return (
            <div key={market} className="border rounded-md p-2">
              <div className="font-medium text-sm mb-2">{market}</div>

              <div className="grid grid-cols-3 gap-2 items-center">
                {/* First column: outcome labels */}
                <div className="col-span-3 grid grid-cols-[1fr_1fr_1fr] gap-2">
                  {/* header row: bookmaker names */}
                  <div></div>
                  {bookmakers.map((bm) => (
                    <div key={bm.id} className="text-xs text-gray-500 text-center">
                      {bm.name}
                    </div>
                  ))}
                </div>

                  {headerOutcomes.map((outcome) => (
                    <div key={outcome} className="col-span-3 grid grid-cols-[1fr_1fr_1fr] gap-2 items-center">
                      <div className="text-xs text-gray-600">{outcome}</div>
                      {bookmakers.map((bm) => {
                        // find odd for this market/outcome in this bookmaker
                        const bet = bm.bets.find((b) => b.name === market);
                        const val = bet?.values.find((v) => getLabel(v) === outcome);
                        const odd = val ? Number(val.odd) : null;
                        const best = bestByMarket[market]?.[outcome];
                        const isBest = best && odd === best.odd;
                        return (
                          <div
                            key={bm.id}
                            className={`text-center text-sm py-1 rounded ${
                              isBest ? 'ring-1 ring-amber-300 bg-amber-50 font-semibold' : ''
                            }`}
                          >
                            {odd ? odd.toFixed(2) : '-'}
                          </div>
                        );
                      })}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}