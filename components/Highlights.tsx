"use client";

import React from "react";

interface Highlight {
  title: string;
  description: string;
  time: string;
}

interface HighlightsProps {
  highlights: Highlight[];
}

export default function Highlights({ highlights }: HighlightsProps) {
  if (!highlights?.length) return null;

  const colors = ["bg-green-50", "bg-blue-50", "bg-purple-50"];

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-3">Những điểm nổi bật trong tuần này</h2>
      <div className="grid md:grid-cols-3 gap-3">
        {highlights.map((h, i) => (
          <div key={i} className={`p-4 rounded-2xl shadow ${colors[i % 3]}`}>
            <h3 className="font-semibold text-gray-700">{h.title}</h3>
            <p className="text-sm text-gray-600">{h.description}</p>
            <p className="text-xs text-gray-500 mt-1">{h.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
