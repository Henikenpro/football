// app/components/LeagueSelect.tsx
"use client";
import React from "react";

interface LeagueSelectProps {
  value: string;
  onChange: (val: string) => void;
}

const leagues = [
  "Tất cả các giải đấu",
  "Giải Ngoại hạng Anh",
  "LaLiga",
  "Bundesliga",
  "Ligue 1",
  "Serie A",
  "Vô địch các CLB châu Âu",
  "V-League",
];

export default function LeagueSelect({ value, onChange }: LeagueSelectProps) {
  return (
    <div className="w-full md:w-auto">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full md:w-64 focus:ring-2 focus:ring-green-500 focus:outline-none"
      >
        {leagues.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}