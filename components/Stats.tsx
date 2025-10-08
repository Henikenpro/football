import React from "react";

export default function Stats() {
  // static example stats; you can replace by API-driven values
  const stats = [
    { label: "Live Matches", value: 12 },
    { label: "Today's Matches", value: 48 },
    { label: "Leagues Covered", value: "150+" },
    { label: "Predictions Made", value: "1,200+" }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded shadow -mt-8">
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <div className="text-3xl font-bold text-primary">{s.value}</div>
          <div className="text-sm text-slate-500">{s.label}</div>
        </div>
      ))}
    </div>
  );
}