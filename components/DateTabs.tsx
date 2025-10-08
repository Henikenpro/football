"use client";

import React from "react";

interface DateTabsProps {
  selectedDate: string;
  onSelect: (date: string) => void;
}

export default function DateTabs({ selectedDate, onSelect }: DateTabsProps) {
  const today = new Date();
  const days = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const label =
      i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : d.toLocaleDateString("vi-VN", { weekday: "short" });
    const date = d.toISOString().split("T")[0];
    return { label, date };
  });

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {days.map((d) => (
        <button
          key={d.date}
          onClick={() => onSelect(d.date)}
          className={`px-4 py-2 rounded-xl border transition-all ${
            d.date === selectedDate ? "bg-green-600 text-white" : "bg-white hover:bg-gray-100"
          }`}
        >
          {d.label}
          <div className="text-xs opacity-80">
            {new Date(d.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
          </div>
        </button>
      ))}
    </div>
  );
}
