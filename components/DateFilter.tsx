// app/components/DateFilter.tsx
"use client";
import React from "react";

export interface DayItem {
  label: string;
  date: string; // YYYY-MM-DD
}

interface DateFilterProps {
  days: DayItem[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

export default function DateFilter({ days, selectedDate, onSelect }: DateFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {days.map((d) => (
        <button
          key={d.date}
          onClick={() => onSelect(d.date)}
          className={`px-4 py-2 rounded-full text-sm border transition ${
            selectedDate === d.date
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}