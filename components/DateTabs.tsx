'use client';
import React from 'react';
import { addDays, format, parseISO, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function DateTabs({
  selectedDate,
  onSelect,
  days = 6,
}: {
  selectedDate: Date | string;
  onSelect: (d: Date | string) => void;
  days?: number;
}) {
  const base = new Date();
  const arr = Array.from({ length: days }).map((_, i) => addDays(base, i));

  // detect whether caller uses string (ISO yyyy-MM-dd) or Date
  const callerUsesString = typeof selectedDate === 'string';

  // helper to format Date -> ISO yyyy-MM-dd (uses date-fns format)
  const toISO = (d: Date) => format(d, 'yyyy-MM-dd');

  // helper to normalize selectedDate to ISO string for comparison
  const selectedISO = (() => {
    if (callerUsesString) return selectedDate as string;
    const sd = selectedDate as Date;
    return isValid(sd) ? toISO(sd) : toISO(new Date());
  })();

  return (
    <div className="flex flex-wrap gap-3">
      {arr.map((d, i) => {
        const iso = toISO(d);
        const isActive = iso === selectedISO;
        const label =
          i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : format(d, 'EEEE', { locale: vi });

        return (
          <button
            key={iso}
            onClick={() => {
              if (callerUsesString) onSelect(iso);
              else onSelect(new Date(iso));
            }}
            aria-pressed={isActive}
            className={`flex flex-col items-center px-4 py-2 rounded-xl border text-sm transition-all ${
              isActive
                ? 'bg-green-500 text-white font-medium border-green-500'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
            }`}
          >
            <span>{label}</span>
            <span className="text-xs opacity-80">{format(d, "d 'tháng' M", { locale: vi })}</span>
          </button>
        );
      })}
    </div>
  );
}