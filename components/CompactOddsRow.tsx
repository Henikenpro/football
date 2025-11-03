'use client';
import React from 'react';
import { parseISO, isValid, format } from 'date-fns';
import type { Bookmaker } from '../types/football';

type Team = { name: string; logo?: string | null };

type Props = {
  fixtureId: number;
  dateISO: string;
  home: Team;
  away: Team;
  bookmakers: Bookmaker[];
  predictionText?: string;
  leagueName?: string;
  onClick?: (id?: number) => void;
};

function timePartsFromISO(iso: string) {
  try {
    const d = parseISO(iso);
    if (isValid(d)) {
      return { date: format(d, 'dd/MM'), time: format(d, 'HH:mm') };
    }
  } catch {}
  if (typeof iso === 'string' && iso.length >= 16) {
    const date = iso.slice(8, 10) && iso.slice(5, 7) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '';
    const time = iso.slice(11, 16);
    return { date, time };
  }
  return { date: '', time: iso };
}

function initials(name: string) {
  return name
    .split(' ')
    .map((s) => s[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Get handicap number for home team.
 * This function ensures the returned line is the number representing home team (with sign).
 * Some bookmakers label values as 'Home'/'Away' and have label containing the numeric; we parse label/value/name.
 */
// Thay thế toàn bộ hàm getHomeHandicap hiện tại bằng hàm này
function parseNumericHandicapToken(token: string) {
  if (!token) return null;
  // chuẩn hoá dấu phẩy -> chấm
  token = token.replace(',', '.').trim();

  // Nếu dạng split "a/b" => convert sang trung bình (ví dụ 0/0.5 -> 0.25)
  if (token.includes('/')) {
    const parts = token.split('/').map((s) => s.replace(',', '.').trim()).filter(Boolean);
    const nums = parts.map((p) => Number(p)).filter((n) => !isNaN(n));
    if (nums.length === 2) {
      return (nums[0] + nums[1]) / 2;
    }
    // nếu không parse được thành 2 số thì bỏ qua
  }

  // Nếu token chứa dấu ± hoặc là số thẳng
  const m = token.match(/([+-]?\d+(?:\.\d+)?)/);
  if (m) return Number(m[0]);
  return null;
}

function formatHandicapForDisplay(num: number | null) {
  if (num === null || isNaN(num)) return '';
  // giữ 2 chữ số thập phân tối đa, nhưng nếu là .25/.75/.5 thì hiển thị không thừa số 0
  const rounded = Math.round(num * 100) / 100;
  // show .25 .5 .75 etc without trailing zeros
  let s = String(rounded);
  // convert -0 to 0
  if (Object.is(rounded, -0)) s = '0';
  // ensure + sign for positive to match previous style
  if (!s.startsWith('-')) s = `+${s}`;
  return s;
}

/**
 * Get handicap number for home team (returns formatted string like "+0.25", "-1.25" or empty)
 * - tries to find explicit home value
 * - if only away found, will invert sign to present home-perspective
 * - supports "0/0.5", "0,25" etc
 */
function getHomeHandicap(bookmakers: Bookmaker[], homeName: string, awayName: string) {
  if (!Array.isArray(bookmakers)) return '';

  // helper to try extract numeric from value/label/name
  const tryExtractFromValue = (v: any) => {
    if (!v) return null;
    // value could be object or string
    const raw = String(v.value ?? v.label ?? v).trim();
    const n = parseNumericHandicapToken(raw);
    if (!isNaN(Number(n))) return n;
    return null;
  };

  // first pass: try explicit home-matching values
  for (const bm of bookmakers) {
    for (const bet of bm.bets || []) {
      const lname = (bet.name || '').toLowerCase();
      if (!lname.includes('handicap') && !lname.includes('asian')) continue;

      if (Array.isArray(bet.values) && bet.values.length > 0) {
        // try find home by value/label mentioning 'home' or homeName
        for (const v of bet.values) {
          const vv = String(v?.value ?? '').toLowerCase();
          const label = String(v?.label ?? '').toLowerCase();
          if (
            vv.includes('home') ||
            vv === '1' ||
            (homeName && vv.includes(homeName.toLowerCase())) ||
            (label && label.includes(homeName.toLowerCase()))
          ) {
            const num = tryExtractFromValue(v);
            if (num !== null) return formatHandicapForDisplay(num);
          }
        }

        // if not found, try values matching homeName approximately
        for (const v of bet.values) {
          const label = String(v?.label ?? '').toLowerCase();
          if (homeName && label.includes(homeName.toLowerCase())) {
            const num = tryExtractFromValue(v);
            if (num !== null) return formatHandicapForDisplay(num);
          }
        }

        // fallback: try parse numeric from first value label or value
        const first = bet.values[0];
        const numFirst = tryExtractFromValue(first);
        if (numFirst !== null) return formatHandicapForDisplay(numFirst);
      }

      // else try parse from bet.name (e.g., "Asian Handicap -0.5")
      const fromName = parseNumericHandicapToken(bet.name ?? '');
      if (fromName !== null) return formatHandicapForDisplay(fromName);
    }
  }

  // second pass: maybe bookmakers only include Away values; detect and invert sign
  for (const bm of bookmakers) {
    for (const bet of bm.bets || []) {
      const lname = (bet.name || '').toLowerCase();
      if (!lname.includes('handicap') && !lname.includes('asian')) continue;
      if (Array.isArray(bet.values) && bet.values.length > 0) {
        // try find away value
        for (const v of bet.values) {
          const vv = String(v?.value ?? '').toLowerCase();
          const label = String(v?.label ?? '').toLowerCase();
          if (
            vv.includes('away') ||
            vv === '2' ||
            (awayName && vv.includes(awayName.toLowerCase())) ||
            (label && label.includes(awayName.toLowerCase()))
          ) {
            const num = tryExtractFromValue(v);
            if (num !== null) {
              // invert sign for home-perspective
              const inv = -num;
              return formatHandicapForDisplay(inv);
            }
          }
        }
      }
    }
  }

  return '';
}
/** Format handicap display relative to home team:
 * - If result is positive (e.g., "+2"), show "HomeName +2"
 * - If negative "-1", show "HomeName -1"
 * - If empty, show "HomeName —"
 */
export default function CompactOddsRow({
  fixtureId,
  dateISO,
  home,
  away,
  bookmakers,
  predictionText,
  leagueName,
  onClick,
}: Props) {
  const parts = timePartsFromISO(dateISO);
  const hc = getHomeHandicap(bookmakers, home?.name ?? '', away?.name ?? '');
  const handicapDisplay = hc ? `${home?.name ?? 'Đội chủ'} ${hc}` : `${home?.name ?? 'Đội chủ'} —`;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 border-b last:border-b-0 hover:bg-gray-50"
      role="listitem"
      onClick={() => onClick && onClick(fixtureId)}
    >
      {/* Time */}
      <div className="w-24 flex-shrink-0 text-xs text-sky-600 font-medium">
        <div className="text-[11px] text-gray-400">{parts.date}</div>
        <div className="text-sm font-semibold">{parts.time}</div>
      </div>

      {/* Match */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {home?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={home.logo} alt={home.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs font-semibold text-gray-600">{initials(home?.name ?? '')}</span>
              )}
            </div>
            <div className="text-sm font-semibold truncate">{home?.name}</div>
          </div>

          <div className="text-xs text-gray-400 px-2">-</div>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {away?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={away.logo} alt={away.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs font-semibold text-gray-600">{initials(away?.name ?? '')}</span>
              )}
            </div>
            <div className="text-sm truncate">{away?.name}</div>
          </div>
        </div>

        {leagueName && <div className="text-[11px] text-gray-400 mt-1">{leagueName}</div>}
      </div>

      {/* Handicap */}
      <div className="w-56 hidden sm:flex flex-col items-start text-xs">
        <div className="text-[11px] text-gray-400 mb-0.5">Kèo chấp</div>
        <div className="text-sm font-semibold">{handicapDisplay}</div>
      </div>

      {/* Prediction */}
      <div className="w-64 flex-shrink-0 text-xs">
        <div className="text-[11px] text-gray-400 mb-0.5">Dự đoán</div>
        <div className="text-sm font-semibold text-rose-600">
          {predictionText ?? <span className="text-gray-400">Chưa có dự đoán</span>}
        </div>
      </div>

      <div className="w-8 flex-shrink-0 text-right">
        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
        </svg>
      </div>
    </div>
  );
}