// components/StandingsTable.tsx
import React from 'react';

type Row = {
  rank: number;
  team: { id: number; name: string; logo?: string };
  points: number;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
};

export default function StandingsTable({ standings }: { standings: Row[] }) {
  if (!standings || standings.length === 0) {
    return <div className="p-6 text-gray-500">Không có bảng xếp hạng để hiển thị.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-12 px-4 py-3 text-left">VT</th>
            <th className="px-4 py-3 text-left">Đội</th>
            <th className="w-16 px-4 py-3">Trận</th>
            <th className="w-16 px-4 py-3">Thắng</th>
            <th className="w-16 px-4 py-3">Hòa</th>
            <th className="w-16 px-4 py-3">Thua</th>
            <th className="w-20 px-4 py-3">BT</th>
            <th className="w-20 px-4 py-3">BB</th>
            <th className="w-20 px-4 py-3">Điểm</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row: any, idx: number) => (
            <tr key={row.team.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-3">{row.rank}</td>
              <td className="px-4 py-3 flex items-center gap-3">
                {row.team.logo && <img src={row.team.logo} alt={row.team.name} className="w-6 h-6 object-contain" />}
                <div className="truncate">{row.team.name}</div>
              </td>
              <td className="px-4 py-3 text-center">{row.all.played}</td>
              <td className="px-4 py-3 text-center">{row.all.win}</td>
              <td className="px-4 py-3 text-center">{row.all.draw}</td>
              <td className="px-4 py-3 text-center">{row.all.lose}</td>
              <td className="px-4 py-3 text-center">{row.all.goals.for}</td>
              <td className="px-4 py-3 text-center">{row.all.goals.against}</td>
              <td className="px-4 py-3 text-center font-semibold">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}